-- V2__create_users.sql
-- Pourquoi UUID : cohérent avec le reste du projet + pas d'énumération séquentielle
-- Pourquoi password_hash et pas password : rappel que c'est un hash, jamais le clair
-- Pourquoi NOT NULL sur organisation_id : multi-tenant obligatoire dès le début

CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'CHEF_PROJET',
    organisation_id UUID        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT now()
);

-- Index sur email : la recherche de login se fait par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Index sur org : toutes les requêtes multi-tenant filtrent par organisation
CREATE INDEX IF NOT EXISTS idx_users_org   ON users(organisation_id);

-- Commentaire pour documentation automatique
COMMENT ON TABLE  users                  IS 'Utilisateurs ENGIPILOT — un user appartient à une organisation';
COMMENT ON COLUMN users.password_hash    IS 'Hash BCrypt strength 12 — jamais le mot de passe en clair';
COMMENT ON COLUMN users.role            IS 'ADMIN | CHEF_PROJET | CONDUCTEUR | LECTEUR';
