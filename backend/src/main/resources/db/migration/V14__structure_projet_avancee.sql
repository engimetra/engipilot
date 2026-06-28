-- V14 : Structure projet avancee
CREATE TABLE IF NOT EXISTS chantiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    agence_id UUID REFERENCES agences(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Maroc',
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    statut VARCHAR(50) NOT NULL DEFAULT 'PLANIFIE' CHECK (statut IN ('PLANIFIE','EN_COURS','PAUSE','TERMINE','CLOS')),
    surface_m2 DECIMAL(12,2),
    date_debut DATE,
    date_fin_prevue DATE,
    date_fin_reelle DATE,
    chef_chantier_id UUID REFERENCES utilisateurs(id),
    budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    cout_reel DECIMAL(15,2) NOT NULL DEFAULT 0,
    avancement DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chantiers_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS phases_projet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    ordre INT NOT NULL DEFAULT 0,
    date_debut DATE,
    date_fin_prevue DATE,
    date_fin_reelle DATE,
    avancement DECIMAL(5,2) NOT NULL DEFAULT 0,
    statut VARCHAR(50) NOT NULL DEFAULT 'PLANIFIE',
    couleur VARCHAR(7) NOT NULL DEFAULT '#635BFF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sous_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    lot_id UUID NOT NULL REFERENCES lots(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    avancement DECIMAL(5,2) NOT NULL DEFAULT 0,
    budget DECIMAL(15,2),
    date_debut DATE,
    date_fin_prevue DATE,
    statut VARCHAR(50) NOT NULL DEFAULT 'PLANIFIE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS jalons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    phase_id UUID REFERENCES phases_projet(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'LIVRAISON' CHECK (type IN ('DEBUT','FIN','LIVRAISON','PAIEMENT','VALIDATION','AUTRE')),
    date_prevue DATE NOT NULL,
    date_reelle DATE,
    statut VARCHAR(50) NOT NULL DEFAULT 'PLANIFIE',
    valeur_contractuelle DECIMAL(15,2),
    responsable_id UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS membres_projet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID NOT NULL REFERENCES projets(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    role_projet VARCHAR(100),
    date_entree DATE,
    date_sortie DATE,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_membres_projet_projet_user UNIQUE (projet_id, utilisateur_id)
);
CREATE TABLE IF NOT EXISTS ressources_humaines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    agence_id UUID REFERENCES agences(id),
    matricule VARCHAR(50) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    cin VARCHAR(20),
    telephone VARCHAR(20),
    email VARCHAR(255),
    specialite VARCHAR(100),
    categorie VARCHAR(50) NOT NULL DEFAULT 'OUVRIER' CHECK (categorie IN ('OUVRIER','TECHNICIEN','INGENIEUR','CHEF_EQUIPE','SOUS_TRAITANT','STAGIAIRE')),
    taux_horaire DECIMAL(10,2),
    date_embauche DATE,
    date_fin_contrat DATE,
    statut VARCHAR(50) NOT NULL DEFAULT 'ACTIF',
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ressources_humaines_matricule_org UNIQUE (organisation_id, matricule)
);
CREATE TABLE IF NOT EXISTS affectations_projet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ressource_id UUID NOT NULL REFERENCES ressources_humaines(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    date_debut DATE NOT NULL,
    date_fin DATE,
    taux_affectation DECIMAL(5,2) NOT NULL DEFAULT 100,
    role_affectation VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chantiers_organisation_id ON chantiers(organisation_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_projet_id ON chantiers(projet_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);
CREATE INDEX IF NOT EXISTS idx_phases_projet_projet_id ON phases_projet(projet_id);
CREATE INDEX IF NOT EXISTS idx_jalons_projet_id ON jalons(projet_id);
CREATE INDEX IF NOT EXISTS idx_ressources_humaines_organisation_id ON ressources_humaines(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ressources_humaines_categorie ON ressources_humaines(categorie);
CREATE INDEX IF NOT EXISTS idx_affectations_projet_projet_id ON affectations_projet(projet_id);
