-- V21 : SIG / Geomatique
CREATE TABLE IF NOT EXISTS parcelles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    reference_cadastrale VARCHAR(100),
    denomination VARCHAR(255),
    superficie DECIMAL(15,4),
    geometrie GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    perimetre DECIMAL(15,4),
    commune VARCHAR(100),
    wilaya VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Maroc',
    proprietaire VARCHAR(255),
    statut_foncier VARCHAR(100),
    date_acquisition DATE,
    valeur_fonciere DECIMAL(15,2),
    notes TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS zones_chantier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id),
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'ZONE' CHECK (type IN ('ZONE','SECURITE','STOCKAGE','ACCES','INTERDITE','IMPLANTATION')),
    geometrie GEOMETRY(POLYGON, 4326) NOT NULL,
    surface DECIMAL(12,2),
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#635BFF',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS releves_topographiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    reference VARCHAR(100) NOT NULL,
    description TEXT,
    date_releve DATE NOT NULL,
    topographe VARCHAR(255),
    systeme_coordonnees VARCHAR(50) DEFAULT 'WGS84',
    precision_cm DECIMAL(6,3),
    zone GEOMETRY(POLYGON, 4326),
    statut VARCHAR(50) DEFAULT 'BROUILLON',
    fichier_id UUID REFERENCES documents(id),
    nombre_points INT DEFAULT 0,
    altitude_min DECIMAL(12,3),
    altitude_max DECIMAL(12,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS points_geodesiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    releve_id UUID NOT NULL REFERENCES releves_topographiques(id) ON DELETE CASCADE,
    numero_point VARCHAR(50),
    coordonnees GEOMETRY(POINTZ, 4326) NOT NULL,
    altitude DECIMAL(12,3),
    nature VARCHAR(100),
    code_signal VARCHAR(50),
    precision_h DECIMAL(6,3),
    precision_v DECIMAL(6,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (releve_id, numero_point)
);
CREATE TABLE IF NOT EXISTS courbes_niveau (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    releve_id UUID NOT NULL REFERENCES releves_topographiques(id) ON DELETE CASCADE,
    altitude DECIMAL(12,3) NOT NULL,
    geometrie GEOMETRY(LINESTRING, 4326) NOT NULL,
    intervalle DECIMAL(6,3) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nuages_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) DEFAULT 'LAS' CHECK (format IN ('LAS','LAZ','E57','PLY','XYZ')),
    url_fichier TEXT NOT NULL,
    taille_octets BIGINT,
    nombre_points BIGINT,
    zone_couverte GEOMETRY(POLYGON, 4326),
    precision_mm DECIMAL(6,2),
    date_acquisition DATE,
    capteur VARCHAR(255),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS implantations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id),
    element_id UUID REFERENCES elements_bim(id),
    reference VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'AXE' CHECK (type IN ('AXE','COIN','CENTRE','REPERE')),
    point GEOMETRY(POINTZ, 4326) NOT NULL,
    tolerance_mm DECIMAL(6,2),
    statut VARCHAR(50) DEFAULT 'PLANIFIE' CHECK (statut IN ('PLANIFIE','REALISE','CONFORME','HORS_TOLERANCE')),
    date_implantation DATE,
    implante_par VARCHAR(255),
    ecart_x_mm DECIMAL(8,3),
    ecart_y_mm DECIMAL(8,3),
    ecart_z_mm DECIMAL(8,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parcelles_geometrie ON parcelles USING GIST (geometrie);
CREATE INDEX IF NOT EXISTS idx_parcelles_org ON parcelles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_zones_chantier_geometrie ON zones_chantier USING GIST (geometrie);
CREATE INDEX IF NOT EXISTS idx_zones_chantier_chantier ON zones_chantier(chantier_id);
CREATE INDEX IF NOT EXISTS idx_releves_topo_org ON releves_topographiques(organisation_id);
CREATE INDEX IF NOT EXISTS idx_releves_topo_zone ON releves_topographiques USING GIST (zone);
CREATE INDEX IF NOT EXISTS idx_points_geo_coordonnees ON points_geodesiques USING GIST (coordonnees);
CREATE INDEX IF NOT EXISTS idx_courbes_niveau_geometrie ON courbes_niveau USING GIST (geometrie);
CREATE INDEX IF NOT EXISTS idx_nuages_points_zone ON nuages_points USING GIST (zone_couverte);
CREATE INDEX IF NOT EXISTS idx_implantations_point ON implantations USING GIST (point);
CREATE INDEX IF NOT EXISTS idx_implantations_chantier ON implantations(chantier_id);
