-- V15 : Bibliotheque prix etendue
CREATE TABLE IF NOT EXISTS devises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    symbole VARCHAR(5) NOT NULL,
    taux_vs_mad DECIMAL(15,6) NOT NULL DEFAULT 1.0,
    est_defaut BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_devises_code UNIQUE (code)
);
CREATE TABLE IF NOT EXISTS unites_mesure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('LONGUEUR','SURFACE','VOLUME','MASSE','NOMBRE','TEMPS','FORFAIT')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_unites_mesure_code UNIQUE (code)
);
CREATE TABLE IF NOT EXISTS fournisseurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(50) NOT NULL,
    raison_sociale VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'FOURNISSEUR' CHECK (type IN ('FOURNISSEUR','SOUS_TRAITANT','PRESTATAIRE','FABRICANT')),
    ice VARCHAR(20),
    rc VARCHAR(50),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) NOT NULL DEFAULT 'Maroc',
    telephone VARCHAR(20),
    email VARCHAR(255),
    site_web VARCHAR(255),
    delai_livraison_jours INT,
    conditions_paiement VARCHAR(255),
    note_evaluation DECIMAL(3,1) CHECK (note_evaluation >= 0 AND note_evaluation <= 5),
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fournisseurs_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS familles_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES familles_articles(id),
    niveau INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_familles_articles_code_org UNIQUE (organisation_id, code)
);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS famille_id UUID REFERENCES familles_articles(id);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS fournisseur_id UUID REFERENCES fournisseurs(id);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS unite_id UUID REFERENCES unites_mesure(id);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS devise_id UUID REFERENCES devises(id);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS cout_mo DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS cout_materiel DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS cout_transport DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS taux_tva DECIMAL(5,2) NOT NULL DEFAULT 20.00;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS pays VARCHAR(100) NOT NULL DEFAULT 'Maroc';
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS valable_du DATE;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS valable_jusqu DATE;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bibliotheque_prix ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS historique_prix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES bibliotheque_prix(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    fournisseur_id UUID REFERENCES fournisseurs(id),
    prix_unitaire DECIMAL(15,2) NOT NULL,
    devise_id UUID REFERENCES devises(id),
    date_prix DATE NOT NULL,
    source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS prix_regionaux (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES bibliotheque_prix(id),
    region VARCHAR(100) NOT NULL,
    pays VARCHAR(100) NOT NULL DEFAULT 'Maroc',
    prix_unitaire DECIMAL(15,2) NOT NULL,
    devise_id UUID REFERENCES devises(id),
    valide_du DATE,
    valide_jusqu DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_prix_regionaux_article_region_pays UNIQUE (article_id, region, pays)
);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_organisation_id ON fournisseurs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_familles_articles_organisation_id ON familles_articles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_historique_prix_article_id ON historique_prix(article_id);
CREATE INDEX IF NOT EXISTS idx_bibliotheque_prix_famille_id ON bibliotheque_prix(famille_id);
INSERT INTO devises (code, nom, symbole, taux_vs_mad, est_defaut) VALUES
    ('MAD','Dirham Marocain','DH',1.0,true),
    ('EUR','Euro','EUR',11.0,false),
    ('USD','Dollar Americain','USD',10.0,false),
    ('GBP','Livre Sterling','GBP',12.5,false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO unites_mesure (code, nom, type) VALUES
    ('M','Metre','LONGUEUR'),('M2','Metre carre','SURFACE'),('M3','Metre cube','VOLUME'),
    ('KG','Kilogramme','MASSE'),('T','Tonne','MASSE'),('U','Unite','NOMBRE'),
    ('ML','Metre lineaire','LONGUEUR'),('FF','Forfait','FORFAIT'),('H','Heure','TEMPS'),
    ('J','Jour','TEMPS'),('ENS','Ensemble','FORFAIT')
ON CONFLICT (code) DO NOTHING;
