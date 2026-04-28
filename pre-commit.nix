{pkgs, ...}: {
  settings.hooks = {
    nil.enable = true;

    treefmt.enable = true;

    gitleaks = {
      enable = true;
      name = "gitleaks";
      entry = "${pkgs.gitleaks}/bin/gitleaks protect --verbose --redact --staged";
      pass_filenames = false;
    };

    vitest-frontend = {
      enable = true;
      name = "vitest-frontend";
      entry = "cd wwb/frontend && npm run test";
      pass_filenames = false;
      files = "\\\\.(js|vue)$";
    };

    vitest-backend = {
      enable = true;
      name = "vitest-backend";
      entry = "cd wwb/backend && npm run test";
      pass_filenames = false;
      files = "^wwb/backend/.*\\\\.js$";
    };
  };
}
