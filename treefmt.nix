_: {
  projectRootFile = "flake.nix";

  programs = {
    alejandra.enable = true;
    deadnix.enable = true;
    statix.enable = true;

    prettier.enable = true;

    yamlfmt.enable = true;

    mdformat.enable = true;
  };
}
