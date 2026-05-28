-- ══════════════════════════════════════════════════════════════════════════════
-- ENGIPILOT — Permissions PostgreSQL pour l'utilisateur applicatif
-- Exécuté une seule fois à la création du volume (docker-entrypoint-initdb.d)
-- Ordre d'exécution :
--   01_create_app_user.sh → crée engipilot_app avec le mot de passe du .env
--   02_init.sql (ce fichier) → accorde les permissions nécessaires
-- Les DDL (CREATE, DROP, ALTER) restent réservés à l'admin Flyway.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Accès au schéma public ─────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO engipilot_app;

-- ── 2. DML sur toutes les tables existantes au moment de l'init ───────────────
-- Note : Flyway n'a pas encore créé les tables à ce stade.
-- Les DEFAULT PRIVILEGES (section 4) couvrent les futures tables.
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA public
    TO engipilot_app;

-- ── 3. Accès aux séquences (auto-incréments, uuid-ossp) ──────────────────────
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO engipilot_app;

-- ── 4. Propager les droits aux futures tables créées par Flyway ───────────────
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO engipilot_app;

ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    GRANT USAGE ON SEQUENCES TO engipilot_app;
