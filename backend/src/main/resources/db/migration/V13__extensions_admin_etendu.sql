-- ============================================================
-- V13 : Extensions PostgreSQL + Administration etendue
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS agences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Maroc',
    telephone VARCHAR(20),
    email VARCHAR(255),
    responsable_id UUID REFERENCES utilisateurs(id),
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_agences_code_org UNIQUE (organisation_id, code)
);

CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    agence_id UUID REFERENCES agences(id),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    chef_equipe_id UUID REFERENCES utilisateurs(id),
    specialite VARCHAR(100),
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_equipes_code_org UNIQUE (organisation_id, code)
);

CREATE TABLE IF NOT EXISTS membres_equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipe_id UUID NOT NULL REFERENCES equipes(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    role_dans_equipe VARCHAR(100),
    date_entree DATE,
    date_sortie DATE,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_membres_equipes_equipe_user UNIQUE (equipe_id, utilisateur_id)
);

CREATE TABLE IF NOT EXISTS roles_systeme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    est_systeme BOOLEAN NOT NULL DEFAULT false,
    niveau_acces INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_systeme_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS permissions_systeme (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_permissions_systeme_code UNIQUE (code),
    CONSTRAINT uq_permissions_systeme_module_action UNIQUE (module, action)
);

CREATE TABLE IF NOT EXISTS roles_permissions (
    role_id UUID NOT NULL REFERENCES roles_systeme(id),
    permission_id UUID NOT NULL REFERENCES permissions_systeme(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS utilisateurs_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    role_id UUID NOT NULL REFERENCES roles_systeme(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    attribue_par UUID REFERENCES utilisateurs(id),
    attribue_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expire_le TIMESTAMPTZ,
    CONSTRAINT uq_utilisateurs_roles_user_role_org UNIQUE (utilisateur_id, role_id, organisation_id)
);

CREATE TABLE IF NOT EXISTS journal_activites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    entite_type VARCHAR(100),
    entite_id UUID,
    donnees_avant JSONB,
    donnees_apres JSONB,
    ip_adresse INET,
    user_agent TEXT,
    succes BOOLEAN NOT NULL DEFAULT true,
    message_erreur TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agences_organisation_id ON agences(organisation_id);
CREATE INDEX IF NOT EXISTS idx_equipes_organisation_id ON equipes(organisation_id);
CREATE INDEX IF NOT EXISTS idx_equipes_agence_id ON equipes(agence_id);
CREATE INDEX IF NOT EXISTS idx_membres_equipes_equipe_id ON membres_equipes(equipe_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_roles_utilisateur_id ON utilisateurs_roles(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_journal_activites_organisation_id ON journal_activites(organisation_id);
CREATE INDEX IF NOT EXISTS idx_journal_activites_module ON journal_activites(module);
CREATE INDEX IF NOT EXISTS idx_journal_activites_created_at ON journal_activites(created_at);

INSERT INTO roles_systeme (code, nom, est_systeme, niveau_acces) VALUES
    ('SUPER_ADMIN', 'Super Administrateur', true, 100),
    ('ADMIN_ENTREPRISE', 'Administrateur Entreprise', true, 80),
    ('CHEF_PROJET', 'Chef de Projet', true, 60),
    ('CHEF_CHANTIER', 'Chef de Chantier', true, 50),
    ('INGENIEUR', 'Ingenieur', true, 45),
    ('ECONOMISTE', 'Economiste', true, 45),
    ('CONDUCTEUR_TRAVAUX', 'Conducteur de Travaux', true, 45),
    ('CONSULTANT', 'Consultant', true, 30),
    ('LECTEUR', 'Lecteur', true, 10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions_systeme (code, module, action, description) VALUES
    ('PROJETS_VIEW','PROJETS','VIEW','Voir les projets'),
    ('PROJETS_CREATE','PROJETS','CREATE','Creer des projets'),
    ('PROJETS_EDIT','PROJETS','EDIT','Modifier des projets'),
    ('PROJETS_DELETE','PROJETS','DELETE','Supprimer des projets'),
    ('CHANTIERS_VIEW','CHANTIERS','VIEW','Voir les chantiers'),
    ('CHANTIERS_CREATE','CHANTIERS','CREATE','Creer des chantiers'),
    ('CHANTIERS_EDIT','CHANTIERS','EDIT','Modifier des chantiers'),
    ('METRES_VIEW','METRES','VIEW','Voir les metres'),
    ('METRES_CREATE','METRES','CREATE','Creer des metres'),
    ('METRES_EDIT','METRES','EDIT','Modifier des metres'),
    ('DEVIS_VIEW','DEVIS','VIEW','Voir les devis'),
    ('DEVIS_CREATE','DEVIS','CREATE','Creer des devis'),
    ('DEVIS_EDIT','DEVIS','EDIT','Modifier des devis'),
    ('PLANNING_VIEW','PLANNING','VIEW','Voir le planning'),
    ('PLANNING_CREATE','PLANNING','CREATE','Creer des plannings'),
    ('PLANNING_EDIT','PLANNING','EDIT','Modifier le planning'),
    ('HSE_VIEW','HSE','VIEW','Voir les donnees HSE'),
    ('HSE_CREATE','HSE','CREATE','Creer des enregistrements HSE'),
    ('HSE_EDIT','HSE','EDIT','Modifier des donnees HSE'),
    ('DOCUMENTS_VIEW','DOCUMENTS','VIEW','Voir les documents'),
    ('DOCUMENTS_CREATE','DOCUMENTS','CREATE','Creer des documents'),
    ('ADMIN_VIEW','ADMIN','VIEW','Voir la configuration admin'),
    ('ADMIN_EDIT','ADMIN','EDIT','Modifier la configuration')
ON CONFLICT (module, action) DO NOTHING;
