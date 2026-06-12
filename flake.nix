{
  description = "Discord Addiction Assessor - voice channel time tracking bot";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }: let
    systems = [ "x86_64-linux" "aarch64-linux" ];
    forAllSystems = nixpkgs.lib.genAttrs systems;

    packageFor = pkgs: pkgs.stdenv.mkDerivation {
      pname = "addiction-assessor";
      version = "0.0.0";
      src = ./.;

      yarnOfflineCache = pkgs.fetchYarnDeps {
        yarnLock = ./yarn.lock;
        hash = "sha256-zx2U20fToIc8Xw2BQ4NXtKOUJXw5G8V2WjxO+doM1qQ=";
      };

      nativeBuildInputs = [
        pkgs.nodejs
        pkgs.yarnConfigHook
        pkgs.yarnInstallHook
        pkgs.makeWrapper
      ];

      dontYarnBuild = true;
    };
  in {
    packages = forAllSystems (system: {
      default = packageFor nixpkgs.legacyPackages.${system};
    });

    nixosModules.default = { config, lib, pkgs, ... }: let
      cfg = config.services.discordAddictionAssessor;
      pkg = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
    in {
      options.services.discordAddictionAssessor = {
        enable = lib.mkEnableOption "Discord Addiction Assessor bot";

        tokenFile = lib.mkOption {
          type = lib.types.path;
          description = ''
            Path to a file containing environment variables, loaded by systemd as an EnvironmentFile.
            Must contain at least: DISCORD_TOKEN=<your-bot-token>
            Typically an agenix secret: config.age.secrets.discord-token.path
          '';
        };

        dbName = lib.mkOption {
          type = lib.types.str;
          default = "discord-bot";
          description = "PostgreSQL database name";
        };

        dbUser = lib.mkOption {
          type = lib.types.str;
          default = "discord-bot";
          description = "PostgreSQL user and system service user";
        };
      };

      config = lib.mkIf cfg.enable {
        services.postgresql = {
          enable = true;
          ensureDatabases = [ cfg.dbName ];
          ensureUsers = [{
            name = cfg.dbUser;
            ensureDBOwnership = true;
          }];
        };

        systemd.services.discord-addiction-assessor = {
          description = "Discord Addiction Assessor bot";
          wantedBy = [ "multi-user.target" ];
          after = [ "network.target" "postgresql.service" ];
          requires = [ "postgresql.service" ];
          serviceConfig = {
            ExecStartPre = let
              initSql = pkgs.writeText "discord-bot-init.sql" ''
                CREATE TABLE IF NOT EXISTS time_spent (
                  id   INT GENERATED ALWAYS AS IDENTITY,
                  user_id   BIGINT,
                  server_id BIGINT,
                  hours     FLOAT,
                  PRIMARY KEY (id)
                );
              '';
            in "${pkgs.postgresql}/bin/psql -d ${cfg.dbName} -f ${initSql}";

            ExecStart = "${pkg}/bin/addiction-assessor";
            EnvironmentFile = cfg.tokenFile;
            Environment = [
              "DB_USER=${cfg.dbUser}"
              "DB_DATABASE=${cfg.dbName}"
              "DB_HOST=/run/postgresql"
              "DB_PORT=5432"
            ];
            User = cfg.dbUser;
            Group = cfg.dbUser;
            Restart = "always";
            RestartSec = "5s";
          };
        };

        users.users.${cfg.dbUser} = {
          isSystemUser = true;
          group = cfg.dbUser;
          description = "Discord Addiction Assessor service user";
        };
        users.groups.${cfg.dbUser} = {};
      };
    };
  };
}
