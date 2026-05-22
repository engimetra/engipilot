#!/bin/bash
# Crée l'utilisateur applicatif restreint avant que Flyway applique les migrations.
# Monté dans /docker-entrypoint-initdb.d/ — exécuté automatiquement par postgres:17-alpine.
# Variables attendues : APP_DB_USER, APP_DB_PASSWORD, POSTGRES_DB

set -e

APP_USER="${APP_DB_USER:-engipilot_app}"
APP_PASS="${APP_DB_PASSWORD:-engipilot_app_dev}"
DB="${POSTGRES_DB:-engipilot}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_USER}') THEN
            CREATE ROLE "${APP_USER}" WITH LOGIN PASSWORD '${APP_PASS}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
        END IF;
    END
    \$\$;
EOSQL
