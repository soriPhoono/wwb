_: {
  enable = true;

  workflows = {
    ci = {
      name = "Build and Push Containers";
      on = {
        push = {
          branches = ["main"];
        };
        pullRequest = {
          branches = ["main"];
        };
      };
      permissions = {
        contents = "read";
        packages = "write";
      };
      jobs = {
        build-and-push = {
          runsOn = "ubuntu-latest";
          steps = [
            {
              name = "Checkout code";
              uses = "actions/checkout@v4";
            }
            {
              name = "Log in to the Container registry";
              uses = "docker/login-action@v3";
              with_ = {
                registry = "ghcr.io";
                username = "\${{ github.actor }}";
                password = "\${{ secrets.GITHUB_TOKEN }}";
              };
            }
            # Backend
            {
              name = "Extract metadata for Backend";
              id = "meta-backend";
              uses = "docker/metadata-action@v5";
              with_ = {
                images = "ghcr.io/\${{ github.repository }}-backend";
                tags = ''
                  type=ref,event=branch
                  type=ref,event=pr
                  type=sha
                  type=raw,value=0.1.0
                  type=raw,value=latest,enable=''${{ github.ref == 'refs/heads/main' }}
                '';
              };
            }
            {
              name = "Build and push Backend image";
              uses = "docker/build-push-action@v5";
              with_ = {
                context = "./wwb/backend";
                push = "\${{ github.event_name != 'pull_request' }}";
                tags = "\${{ steps.meta-backend.outputs.tags }}";
                labels = "\${{ steps.meta-backend.outputs.labels }}";
              };
            }
            # Frontend
            {
              name = "Extract metadata for Frontend";
              id = "meta-frontend";
              uses = "docker/metadata-action@v5";
              with_ = {
                images = "ghcr.io/\${{ github.repository }}-frontend";
                tags = ''
                  type=ref,event=branch
                  type=ref,event=pr
                  type=sha
                  type=raw,value=0.1.5
                  type=raw,value=latest,enable=''${{ github.ref == 'refs/heads/main' }}
                '';
              };
            }
            {
              name = "Build and push Frontend image";
              uses = "docker/build-push-action@v5";
              with_ = {
                context = "./wwb/frontend";
                push = "\${{ github.event_name != 'pull_request' }}";
                tags = "\${{ steps.meta-frontend.outputs.tags }}";
                labels = "\${{ steps.meta-frontend.outputs.labels }}";
              };
            }
          ];
        };
      };
    };
  };
}
