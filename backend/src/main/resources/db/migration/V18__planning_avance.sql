-- V18 : Planning avance CPM
CREATE TABLE IF NOT EXISTS calendriers_travail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    heures_par_jour DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    jours_travail INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
    est_defaut BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS jours_feries_calendrier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendrier_id UUID NOT NULL REFERENCES calendriers_travail(id),
    date_ferie DATE NOT NULL,
    nom VARCHAR(100),
    type VARCHAR(50) NOT NULL DEFAULT 'FERIE' CHECK (type IN ('FERIE','PONT','CONGE')),
    recurrent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_jours_feries_calendrier_date UNIQUE (calendrier_id, date_ferie)
);
CREATE TABLE IF NOT EXISTS versions_planning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    version_numero INT NOT NULL DEFAULT 1,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    est_reference BOOLEAN NOT NULL DEFAULT false,
    est_actif BOOLEAN NOT NULL DEFAULT true,
    date_reference DATE,
    cree_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_versions_planning_projet_version UNIQUE (projet_id, version_numero)
);
CREATE TABLE IF NOT EXISTS activites_planning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    planning_id UUID NOT NULL REFERENCES versions_planning(id),
    parent_id UUID REFERENCES activites_planning(id),
    code_wbs VARCHAR(50),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'TACHE' CHECK (type IN ('TACHE','JALON','LIVRABLE','PHASE','SUMMARY')),
    duree_jours DECIMAL(8,2) NOT NULL DEFAULT 0,
    duree_reelle_jours DECIMAL(8,2) NOT NULL DEFAULT 0,
    date_debut_prevue DATE,
    date_fin_prevue DATE,
    date_debut_reelle DATE,
    date_fin_reelle DATE,
    date_debut_tot DATE,
    date_fin_tot DATE,
    date_debut_tard DATE,
    date_fin_tard DATE,
    marge_libre DECIMAL(8,2) NOT NULL DEFAULT 0,
    marge_totale DECIMAL(8,2) NOT NULL DEFAULT 0,
    est_chemin_critique BOOLEAN NOT NULL DEFAULT false,
    avancement DECIMAL(5,2) NOT NULL DEFAULT 0,
    priorite INT NOT NULL DEFAULT 0,
    lot_id UUID REFERENCES lots(id),
    ressource_responsable_id UUID REFERENCES ressources_humaines(id),
    calendrier_id UUID REFERENCES calendriers_travail(id),
    ordre INT NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS dependances_activites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    activite_pred_id UUID NOT NULL REFERENCES activites_planning(id),
    activite_succ_id UUID NOT NULL REFERENCES activites_planning(id),
    type_dependance VARCHAR(10) NOT NULL DEFAULT 'FS' CHECK (type_dependance IN ('FS','SS','FF','SF')),
    decalage_jours DECIMAL(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dependances_activites_pred_succ UNIQUE (activite_pred_id, activite_succ_id)
);
CREATE TABLE IF NOT EXISTS ressources_planning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'HUMAINE' CHECK (type IN ('HUMAINE','MATERIEL','MATERIAU','COUT')),
    unite VARCHAR(50) NOT NULL DEFAULT 'H',
    capacite_max DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    cout_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    devise_id UUID REFERENCES devises(id),
    disponible BOOLEAN NOT NULL DEFAULT true,
    ressource_humaine_id UUID REFERENCES ressources_humaines(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ressources_planning_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS affectations_planning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    activite_id UUID NOT NULL REFERENCES activites_planning(id),
    ressource_id UUID NOT NULL REFERENCES ressources_planning(id),
    quantite DECIMAL(10,3) NOT NULL DEFAULT 1.0,
    taux_utilisation DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    cout_estime DECIMAL(15,2) NOT NULL DEFAULT 0,
    cout_reel DECIMAL(15,2) NOT NULL DEFAULT 0,
    date_debut DATE,
    date_fin DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_affectations_planning_activite_ressource UNIQUE (activite_id, ressource_id)
);
CREATE TABLE IF NOT EXISTS contraintes_planning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activite_id UUID NOT NULL REFERENCES activites_planning(id),
    type VARCHAR(100) NOT NULL,
    date_contrainte DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendriers_travail_organisation_id ON calendriers_travail(organisation_id);
CREATE INDEX IF NOT EXISTS idx_versions_planning_projet_id ON versions_planning(projet_id);
CREATE INDEX IF NOT EXISTS idx_activites_planning_planning_id ON activites_planning(planning_id);
CREATE INDEX IF NOT EXISTS idx_activites_planning_parent_id ON activites_planning(parent_id);
CREATE INDEX IF NOT EXISTS idx_activites_planning_est_chemin_critique ON activites_planning(est_chemin_critique);
CREATE INDEX IF NOT EXISTS idx_dependances_activites_pred_id ON dependances_activites(activite_pred_id);
CREATE INDEX IF NOT EXISTS idx_dependances_activites_succ_id ON dependances_activites(activite_succ_id);
CREATE INDEX IF NOT EXISTS idx_ressources_planning_organisation_id ON ressources_planning(organisation_id);
CREATE INDEX IF NOT EXISTS idx_affectations_planning_activite_id ON affectations_planning(activite_id);
