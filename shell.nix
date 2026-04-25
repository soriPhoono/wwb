{
  pkgs,
  config,
  ...
}:
with pkgs;
  mkShell {
    packages = [
      nixd
      alejandra

      age
      agenix-cli
      ssh-to-age
      sops

      nodejs

      (python3.withPackages (ps:
        with ps; [
          ansible-core
          ansible
          ansible-lint
        ]))
    ];

    shellHook = ''
      source ${config.agenix-shell.installationScript}/bin/install-agenix-shell

      ${config.pre-commit.shellHook}
    '';
  }
