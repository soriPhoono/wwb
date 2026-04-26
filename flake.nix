{
  description = "Empty flake template";

  inputs = {
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    agenix-shell = {
      url = "github:aciceri/agenix-shell";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    git-hooks-nix = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    github-actions-nix = {
      url = "github:synapdeck/github-actions-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs @ {
    self,
    flake-parts,
    nixpkgs,
    ...
  }: let
    # --- System Support & Package Cache --- #
    systems = import inputs.systems;

    lib = nixpkgs.lib.extend (import ./nix/lib.nix);
  in
    flake-parts.lib.mkFlake {inherit inputs;} {
      imports = with inputs; [
        agenix-shell.flakeModules.default
        treefmt-nix.flakeModule
        git-hooks-nix.flakeModule
        github-actions-nix.flakeModule
      ];

      inherit systems;

      agenix-shell = {
        identityPaths = [
          "$HOME/.ssh/id_ed25519"
        ];
        secrets = {};
      };

      perSystem = {
        pkgs,
        config,
        system,
        ...
      }: {
        _module.args.pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        devShells.default = import ./shell.nix {
          inherit lib pkgs;
          config = {
            inherit (config) pre-commit agenix-shell githubActions;
          };
        };

        # --- Configuration Builders --- #
        treefmt = import ./treefmt.nix {inherit lib pkgs;};
        pre-commit = import ./pre-commit.nix {inherit lib pkgs;};
        githubActions = import ./actions.nix {inherit self lib;};

        # --- Deployment ---
        apps = rec {
          build-backend = {
            type = "app";
            program = lib.getExe (pkgs.writeShellApplication {
              name = "build-backend";
              runtimeInputs = [pkgs.docker];
              text = ''
                docker build \
                  --network=host \
                  --tag wwb-backend:latest \
                  "${./wwb/backend}"
              '';
            });
          };

          build-frontend = {
            type = "app";
            program = lib.getExe (pkgs.writeShellApplication {
              name = "build-frontend";
              runtimeInputs = [pkgs.docker];
              text = ''
                docker build \
                  --network=host \
                  --tag wwb-frontend:latest \
                  "${./wwb/frontend}"
              '';
            });
          };

          deploy-ecom = {
            type = "app";
            program = lib.getExe (pkgs.writeShellApplication {
              name = "deploy-ecom";
              runtimeInputs = with pkgs; [docker git];
              text = ''
                echo "==> Building wwb-backend image..."
                docker build \
                  --network=host \
                  --tag wwb-backend:latest \
                  "${./wwb/backend}"

                echo "==> Building wwb-frontend image..."
                docker build \
                  --network=host \
                  --tag wwb-frontend:latest \
                  "${./wwb/frontend}"

                echo "==> Deploying ecom stack..."
                ECOM_DIR="$(git rev-parse --show-toplevel)/docker/clusters/ecom"
                docker stack deploy \
                  --compose-file "$ECOM_DIR/docker-compose.yml" \
                  ecom
              '';
            });
          };

          default = deploy-ecom;
        };
      };
    };
}
