-- V3__fix_schema_alignment.sql
-- Aligne le schéma Flyway avec les entités JPA :
--   1. Renomme "users" → "utilisateurs" uniquement si utilisateurs n'existe pas encore
--   2. Ajoute last_login manquant dans utilisateurs
--   3. Ajoute trial_expires_at manquant dans organisations

-- 1. Renommer users → utilisateurs seulement si la cible n'existe pas déjà
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'utilisateurs'
    ) THEN
        ALTER TABLE users RENAME TO utilisateurs;
        ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_utilisateurs_email;
        ALTER INDEX IF EXISTS idx_users_org   RENAME TO idx_utilisateurs_org;
    END IF;
END $$;

-- 2. Ajouter last_login (absent du V2, présent dans User.java)
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 3. Ajouter trial_expires_at dans organisations (absent du V1_1, présent dans Organisation.java)
ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS trial_expires_at DATE;

-- 4. Ajouter gravite + statut dans incidents_hse (nouveaux champs requis par le frontend)
ALTER TABLE incidents_hse
    ADD COLUMN IF NOT EXISTS gravite VARCHAR(20) NOT NULL DEFAULT 'MINEUR',
    ADD COLUMN IF NOT EXISTS statut  VARCHAR(20) NOT NULL DEFAULT 'EN_COURS';
