-- D4: Permissions minimales pour l'utilisateur applicatif engipilot_app
-- Cet utilisateur n'a que les droits DML (SELECT, INSERT, UPDATE, DELETE)
-- Les DDL (CREATE, DROP, ALTER) restent réservés à l'utilisateur admin Flyway.
-- Le script infra/postgres/01_create_app_user.sh crée l'utilisateur avant Flyway.

-- Accès au schéma public
GRANT USAGE ON SCHEMA public TO engipilot_app;

-- DML sur toutes les tables existantes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO engipilot_app;

-- Accès aux séquences (nécessaire pour uuid-ossp et les auto-incréments)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO engipilot_app;

-- Propager les droits aux futures tables créées par Flyway (admin exécute les DDL)
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO engipilot_app;

ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO engipilot_app;
