-- V3__fix_schema_alignment.sql
-- Aligne le schéma Flyway avec les entités JPA :
--   1. Renomme "users" → "utilisateurs" (User.java est mappé sur "utilisateurs")
--   2. Ajoute last_login manquant dans utilisateurs
--   3. Ajoute trial_expires_at manquant dans organisations

-- 1. Renommer la table users → utilisateurs
ALTER TABLE IF EXISTS users RENAME TO utilisateurs;

-- Recréer les index avec les nouveaux noms
ALTER INDEX IF EXISTS idx_users_email RENAME TO idx_utilisateurs_email;
ALTER INDEX IF EXISTS idx_users_org   RENAME TO idx_utilisateurs_org;

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
