-- V20 : BIM / IFC
CREATE TABLE IF NOT EXISTS fichiers_ifc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    nom_fichier VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL,
    taille_octets BIGINT,
    version_ifc VARCHAR(20) DEFAULT 'IFC4',
    schema_ifc VARCHAR(50),
    nombre_elements INT DEFAULT 0,
    empreinte_sha256 VARCHAR(64) UNIQUE,
    statut_traitement VARCHAR(50) DEFAULT 'ATTENTE' CHECK (statut_traitement IN ('ATTENTE','EN_COURS','TRAITE','ERREUR')),
    date_traitement TIMESTAMPTZ,
    metadonnees JSONB,
    telecharge_par UUID REFERENCES utilisateurs(id),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS batiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    fichier_ifc_id UUID REFERENCES fichiers_ifc(id),
    guid_ifc VARCHAR(22) UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    adresse TEXT,
    ville VARCHAR(100),
    surface_plancher DECIMAL(12,2),
    surface_emprise DECIMAL(12,2),
    hauteur_totale DECIMAL(8,2),
    nombre_etages INT DEFAULT 0,
    annee_construction INT,
    usage_principal VARCHAR(100),
    geometrie GEOMETRY(POLYGON, 4326),
    emprise_sol GEOMETRY(POLYGON, 4326),
    actif BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS etages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    batiment_id UUID NOT NULL REFERENCES batiments(id),
    guid_ifc VARCHAR(22),
    nom VARCHAR(255) NOT NULL,
    elevation DECIMAL(10,3) DEFAULT 0,
    hauteur_libre DECIMAL(8,3),
    ordre INT DEFAULT 0,
    surface DECIMAL(12,2),
    est_sous_sol BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS espaces_bim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    etage_id UUID NOT NULL REFERENCES etages(id),
    guid_ifc VARCHAR(22),
    nom VARCHAR(255) NOT NULL,
    type_espace VARCHAR(100),
    surface DECIMAL(12,2),
    volume DECIMAL(12,3),
    perimetre DECIMAL(12,2),
    hauteur DECIMAL(8,3),
    usage VARCHAR(100),
    geometrie GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS elements_bim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    fichier_ifc_id UUID REFERENCES fichiers_ifc(id),
    espace_id UUID REFERENCES espaces_bim(id),
    etage_id UUID REFERENCES etages(id),
    guid_ifc VARCHAR(22) UNIQUE,
    nom VARCHAR(255) NOT NULL,
    type_ifc VARCHAR(100) NOT NULL,
    description TEXT,
    famille VARCHAR(255),
    type_famille VARCHAR(255),
    materiau VARCHAR(255),
    longueur DECIMAL(12,4),
    largeur DECIMAL(12,4),
    hauteur DECIMAL(12,4),
    surface DECIMAL(12,4),
    volume DECIMAL(12,4),
    masse DECIMAL(12,4),
    coordonnees_x DECIMAL(12,6),
    coordonnees_y DECIMAL(12,6),
    coordonnees_z DECIMAL(12,6),
    geometrie_json JSONB,
    proprietes_ifc JSONB,
    article_bibliotheque_id UUID REFERENCES bibliotheque_prix(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS proprietes_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    element_id UUID NOT NULL REFERENCES elements_bim(id) ON DELETE CASCADE,
    nom_propriete VARCHAR(255) NOT NULL,
    valeur_texte TEXT,
    valeur_numerique DECIMAL(15,6),
    valeur_booleenne BOOLEAN,
    unite VARCHAR(50),
    pset_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (element_id, nom_propriete, pset_name)
);
CREATE TABLE IF NOT EXISTS classifications_ifc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    parent_id UUID REFERENCES classifications_ifc(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (system_name, code)
);
CREATE TABLE IF NOT EXISTS elements_classifications (
    element_id UUID NOT NULL REFERENCES elements_bim(id) ON DELETE CASCADE,
    classification_id UUID NOT NULL REFERENCES classifications_ifc(id) ON DELETE CASCADE,
    PRIMARY KEY (element_id, classification_id)
);
CREATE TABLE IF NOT EXISTS maquettes_numeriques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'ARCHITECTURAL' CHECK (type IN ('ARCHITECTURAL','STRUCTUREL','MEP','COORDINATION','SYNTHESE')),
    fichier_id UUID REFERENCES fichiers_ifc(id),
    statut VARCHAR(50) DEFAULT 'EN_COURS',
    date_publication DATE,
    publie_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fichiers_ifc_org ON fichiers_ifc(organisation_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_ifc_projet ON fichiers_ifc(projet_id);
CREATE INDEX IF NOT EXISTS idx_batiments_org ON batiments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_batiments_projet ON batiments(projet_id);
CREATE INDEX IF NOT EXISTS idx_batiments_geometrie ON batiments USING GIST (geometrie);
CREATE INDEX IF NOT EXISTS idx_espaces_bim_etage ON espaces_bim(etage_id);
CREATE INDEX IF NOT EXISTS idx_espaces_bim_geometrie ON espaces_bim USING GIST (geometrie);
CREATE INDEX IF NOT EXISTS idx_elements_bim_org ON elements_bim(organisation_id);
CREATE INDEX IF NOT EXISTS idx_elements_bim_type_ifc ON elements_bim(type_ifc);
CREATE INDEX IF NOT EXISTS idx_maquettes_projet ON maquettes_numeriques(projet_id);
