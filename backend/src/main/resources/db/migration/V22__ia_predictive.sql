-- V22 : IA predictive
CREATE TABLE IF NOT EXISTS modeles_ml (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id),
    code VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_modele VARCHAR(100) NOT NULL CHECK (type_modele IN ('REGRESSION','CLASSIFICATION','TIMESERIES','ANOMALIE','CLUSTERING')),
    domaine VARCHAR(100) NOT NULL CHECK (domaine IN ('COUT','DELAI','RISQUE','RESSOURCE','QUALITE','METEO','PRODUCTIVITE')),
    algorithme VARCHAR(100),
    version VARCHAR(50) DEFAULT '1.0.0',
    chemin_fichier TEXT,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    r2_score DECIMAL(5,4),
    mae DECIMAL(15,4),
    rmse DECIMAL(15,4),
    parametres JSONB,
    features JSONB,
    statut VARCHAR(50) DEFAULT 'ENTRAINEMENT' CHECK (statut IN ('ENTRAINEMENT','DEPLOYE','ARCHIVE','ERREUR')),
    date_entrainement TIMESTAMPTZ,
    date_deploiement TIMESTAMPTZ,
    nombre_entrainements INT DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS predictions_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    modele_id UUID NOT NULL REFERENCES modeles_ml(id),
    projet_id UUID REFERENCES projets(id),
    entite_type VARCHAR(100),
    entite_id UUID,
    type_prediction VARCHAR(100) NOT NULL,
    valeur_predite DECIMAL(15,4),
    intervalle_bas DECIMAL(15,4),
    intervalle_haut DECIMAL(15,4),
    confiance DECIMAL(5,4),
    features_input JSONB,
    valeur_reelle DECIMAL(15,4),
    erreur_absolue DECIMAL(15,4),
    horizon_jours INT,
    date_prediction TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS features_historiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    entite_type VARCHAR(100) NOT NULL,
    entite_id UUID NOT NULL,
    nom_feature VARCHAR(100) NOT NULL,
    valeur DECIMAL(15,6),
    valeur_texte VARCHAR(255),
    date_mesure DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entite_type, entite_id, nom_feature, date_mesure)
);
CREATE TABLE IF NOT EXISTS ia_historique_meteo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ville VARCHAR(100) NOT NULL,
    pays VARCHAR(100) DEFAULT 'Maroc',
    date_meteo DATE NOT NULL,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    temperature_moy DECIMAL(5,2),
    precipitations_mm DECIMAL(8,2),
    humidite_pct DECIMAL(5,2),
    vitesse_vent_kmh DECIMAL(6,2),
    ensoleillement_h DECIMAL(5,2),
    conditions VARCHAR(100),
    source VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ville, pays, date_meteo)
);
CREATE TABLE IF NOT EXISTS ia_rendements_ouvriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    ressource_id UUID REFERENCES ressources_humaines(id),
    specialite VARCHAR(100) NOT NULL,
    ouvrage_id UUID REFERENCES ouvrages(id),
    activite_type VARCHAR(100),
    unite VARCHAR(20) NOT NULL,
    rendement_heure DECIMAL(10,4) NOT NULL,
    conditions_meteo VARCHAR(100),
    temperature_celsius DECIMAL(5,2),
    saison VARCHAR(50) CHECK (saison IN ('HIVER','PRINTEMPS','ETE','AUTOMNE')),
    niveau_difficulte INT DEFAULT 3 CHECK (niveau_difficulte BETWEEN 1 AND 5),
    date_mesure DATE,
    projet_id UUID REFERENCES projets(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_alertes_predictives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    modele_id UUID REFERENCES modeles_ml(id),
    projet_id UUID REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    type_alerte VARCHAR(100) NOT NULL CHECK (type_alerte IN ('RETARD_RISQUE','DEPASSEMENT_BUDGET','MANQUE_RESSOURCE','INCIDENT_HSE','NC_QUALITE','METEO_ADVERSE','STOCK_BAS')),
    niveau VARCHAR(20) NOT NULL CHECK (niveau IN ('INFO','ATTENTION','ALERTE','CRITIQUE')),
    message TEXT NOT NULL,
    valeur_actuelle DECIMAL(15,4),
    valeur_seuil DECIMAL(15,4),
    confiance DECIMAL(5,4),
    recommandations JSONB,
    est_lue BOOLEAN DEFAULT false,
    est_resolue BOOLEAN DEFAULT false,
    resolue_le TIMESTAMPTZ,
    resolue_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_evaluations_modele (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modele_id UUID NOT NULL REFERENCES modeles_ml(id),
    dataset_size INT,
    train_size INT,
    test_size INT,
    accuracy DECIMAL(5,4),
    autres_metriques JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id),
    modele_id UUID REFERENCES modeles_ml(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'ENTRAINEMENT' CHECK (type IN ('ENTRAINEMENT','VALIDATION','TEST')),
    nombre_echantillons INT,
    colonnes JSONB,
    url_stockage TEXT,
    checksum VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictions_ia_org ON predictions_ia(organisation_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ia_modele ON predictions_ia(modele_id);
CREATE INDEX IF NOT EXISTS idx_predictions_ia_projet ON predictions_ia(projet_id);
CREATE INDEX IF NOT EXISTS idx_features_historiques_entite ON features_historiques(entite_type, entite_id);
CREATE INDEX IF NOT EXISTS idx_meteo_ville_date ON ia_historique_meteo(ville, date_meteo);
CREATE INDEX IF NOT EXISTS idx_alertes_pred_org ON ia_alertes_predictives(organisation_id);
CREATE INDEX IF NOT EXISTS idx_alertes_pred_lue ON ia_alertes_predictives(est_lue) WHERE est_lue = false;
