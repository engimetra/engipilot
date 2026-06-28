-- V16 : Metres et ouvrages
CREATE TABLE IF NOT EXISTS familles_ouvrages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES familles_ouvrages(id),
    niveau INT NOT NULL DEFAULT 0,
    icone VARCHAR(100),
    couleur VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_familles_ouvrages_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS ouvrages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    famille_id UUID REFERENCES familles_ouvrages(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite_id UUID REFERENCES unites_mesure(id),
    prix_moyen DECIMAL(15,2),
    duree_unitaire DECIMAL(10,3) NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ouvrages_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS composants_ouvrage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ouvrage_id UUID NOT NULL REFERENCES ouvrages(id),
    article_id UUID REFERENCES bibliotheque_prix(id),
    libelle VARCHAR(255) NOT NULL,
    unite_id UUID REFERENCES unites_mesure(id),
    quantite_par_unite DECIMAL(15,4) NOT NULL,
    type_composant VARCHAR(50) NOT NULL DEFAULT 'MATERIEL' CHECK (type_composant IN ('MATERIEL','MAIN_OEUVRE','MATERIEL_CHANTIER','SOUS_TRAITANCE')),
    ordre INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dimensions_metres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ligne_id UUID NOT NULL REFERENCES lignes_metres(id),
    longueur DECIMAL(12,3),
    largeur DECIMAL(12,3),
    hauteur DECIMAL(12,3),
    surface DECIMAL(12,3),
    volume DECIMAL(12,3),
    poids DECIMAL(12,3),
    coefficient DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    description TEXT,
    ordre INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS formules_calcul (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    formule TEXT NOT NULL,
    variables JSONB,
    type VARCHAR(50) NOT NULL DEFAULT 'SURFACE',
    unite_id UUID REFERENCES unites_mesure(id),
    exemple TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_formules_calcul_code UNIQUE (code)
);
CREATE TABLE IF NOT EXISTS historique_metres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metre_id UUID NOT NULL REFERENCES metres(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    version INT NOT NULL DEFAULT 1,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATION','MODIFICATION','VALIDATION','ANNULATION')),
    donnees_avant JSONB,
    donnees_apres JSONB,
    commentaire TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS ouvrage_id UUID REFERENCES ouvrages(id);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS formule_id UUID REFERENCES formules_calcul(id);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS longueur DECIMAL(12,3);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS largeur DECIMAL(12,3);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS hauteur DECIMAL(12,3);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS coefficient DECIMAL(10,4) NOT NULL DEFAULT 1.0;
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(id);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id);
ALTER TABLE lignes_metres ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES phases_projet(id);
ALTER TABLE metres ADD COLUMN IF NOT EXISTS chantier_id UUID REFERENCES chantiers(id);
ALTER TABLE metres ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES phases_projet(id);
ALTER TABLE metres ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE metres ADD COLUMN IF NOT EXISTS valide_par UUID REFERENCES utilisateurs(id);
ALTER TABLE metres ADD COLUMN IF NOT EXISTS date_validation TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_familles_ouvrages_organisation_id ON familles_ouvrages(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ouvrages_organisation_id ON ouvrages(organisation_id);
CREATE INDEX IF NOT EXISTS idx_composants_ouvrage_ouvrage_id ON composants_ouvrage(ouvrage_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_metres_ligne_id ON dimensions_metres(ligne_id);
CREATE INDEX IF NOT EXISTS idx_historique_metres_metre_id ON historique_metres(metre_id);
CREATE INDEX IF NOT EXISTS idx_lignes_metres_ouvrage_id ON lignes_metres(ouvrage_id);
CREATE INDEX IF NOT EXISTS idx_lignes_metres_chantier_id ON lignes_metres(chantier_id);
CREATE INDEX IF NOT EXISTS idx_lignes_metres_libelle_trgm ON lignes_metres USING gin (designation gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_metres_chantier_id ON metres(chantier_id);
