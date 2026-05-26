-- V6__add_missing_columns.sql
-- Ajoute toutes les colonnes manquantes détectées par la validation Hibernate
-- (colonnes présentes dans les entités JPA mais absentes du schéma DB)

-- utilisateurs : l'entité User.java a été refactorisée (password_hash, full_name, is_active)
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS full_name     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true;

-- non_conformites : champ actions correctives manquant
ALTER TABLE non_conformites
    ADD COLUMN IF NOT EXISTS actions_correctivs TEXT;

-- rapports_journaliers : deux champs manquants
ALTER TABLE rapports_journaliers
    ADD COLUMN IF NOT EXISTS temperature_celsius INTEGER,
    ADD COLUMN IF NOT EXISTS redacteur_id        UUID;

-- incidents_hse : deux champs manquants
ALTER TABLE incidents_hse
    ADD COLUMN IF NOT EXISTS mesures_prises             TEXT,
    ADD COLUMN IF NOT EXISTS declare_inspection_travail BOOLEAN NOT NULL DEFAULT false;
