-- V19 : Suivi terrain
CREATE TABLE IF NOT EXISTS pointages_ouvriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id),
    ressource_id UUID NOT NULL REFERENCES ressources_humaines(id),
    date_pointage DATE NOT NULL,
    heure_entree TIME,
    heure_sortie TIME,
    heures_normales DECIMAL(5,2) NOT NULL DEFAULT 0,
    heures_sup DECIMAL(5,2) NOT NULL DEFAULT 0,
    statut VARCHAR(50) NOT NULL DEFAULT 'PRESENT' CHECK (statut IN ('PRESENT','ABSENT','CONGE','MALADIE','DEMI_JOURNEE','JFERIE')),
    notes TEXT,
    saisie_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pointages_ouvriers_chantier_ressource_date UNIQUE (chantier_id, ressource_id, date_pointage)
);
CREATE TABLE IF NOT EXISTS affectations_taches_ressources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tache_id UUID NOT NULL REFERENCES taches(id),
    ressource_id UUID NOT NULL REFERENCES ressources_humaines(id),
    heures_estimees DECIMAL(8,2) NOT NULL DEFAULT 0,
    heures_reelles DECIMAL(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_affectations_taches_ressources_tache_ressource UNIQUE (tache_id, ressource_id)
);
CREATE TABLE IF NOT EXISTS materiels_chantier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    chantier_id UUID REFERENCES chantiers(id),
    code VARCHAR(50) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    marque VARCHAR(100),
    modele VARCHAR(100),
    numero_serie VARCHAR(100),
    statut VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE' CHECK (statut IN ('DISPONIBLE','EN_SERVICE','MAINTENANCE','PANNE','HORS_SERVICE')),
    cout_journalier DECIMAL(10,2) NOT NULL DEFAULT 0,
    date_acquisition DATE,
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_materiels_chantier_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS pointages_materiels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    materiel_id UUID NOT NULL REFERENCES materiels_chantier(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id),
    date_pointage DATE NOT NULL,
    heures_travail DECIMAL(5,2) NOT NULL DEFAULT 0,
    heures_arret DECIMAL(5,2) NOT NULL DEFAULT 0,
    motif_arret TEXT,
    kilometrage_debut DECIMAL(10,1),
    kilometrage_fin DECIMAL(10,1),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pointages_materiels_materiel_chantier_date UNIQUE (materiel_id, chantier_id, date_pointage)
);
CREATE TABLE IF NOT EXISTS consommation_materiaux_chantier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    rapport_id UUID REFERENCES rapports_journaliers(id),
    chantier_id UUID NOT NULL REFERENCES chantiers(id),
    activite_id UUID REFERENCES activites_planning(id),
    article_id UUID REFERENCES bibliotheque_prix(id),
    libelle_article VARCHAR(255) NOT NULL,
    quantite DECIMAL(15,3) NOT NULL,
    unite VARCHAR(20) NOT NULL,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant DECIMAL(15,2) NOT NULL DEFAULT 0,
    date_consommation DATE NOT NULL,
    bon_livraison VARCHAR(100),
    fournisseur_id UUID REFERENCES fournisseurs(id),
    lot_id UUID REFERENCES lots(id),
    saisie_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS photos_chantier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    chantier_id UUID REFERENCES chantiers(id),
    projet_id UUID REFERENCES projets(id),
    rapport_id UUID REFERENCES rapports_journaliers(id),
    tache_id UUID REFERENCES taches(id),
    nom_fichier VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL,
    miniature_url TEXT,
    taille_octets BIGINT,
    format VARCHAR(20),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    description TEXT,
    tags TEXT[],
    prise_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    prise_par UUID REFERENCES utilisateurs(id),
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS interventions_materiels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    materiel_id UUID NOT NULL REFERENCES materiels_chantier(id),
    type_intervention VARCHAR(50) NOT NULL DEFAULT 'PREVENTIVE' CHECK (type_intervention IN ('PREVENTIVE','CORRECTIVE','REVISION')),
    description TEXT NOT NULL,
    date_intervention DATE NOT NULL,
    cout DECIMAL(15,2) NOT NULL DEFAULT 0,
    prestataire VARCHAR(255),
    duree_immobilisation_h DECIMAL(6,2),
    prochaine_intervention DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rapports_hebdomadaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID NOT NULL REFERENCES projets(id),
    chantier_id UUID REFERENCES chantiers(id),
    semaine_numero INT NOT NULL,
    annee INT NOT NULL,
    date_debut_semaine DATE NOT NULL,
    avancement_debut DECIMAL(5,2),
    avancement_fin DECIMAL(5,2),
    effectif_moyen DECIMAL(6,1),
    observations TEXT,
    statut VARCHAR(50) NOT NULL DEFAULT 'BROUILLON',
    cree_par UUID REFERENCES utilisateurs(id),
    valide_par UUID REFERENCES utilisateurs(id),
    date_validation TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rapports_hebdomadaires_projet_semaine_annee UNIQUE (projet_id, semaine_numero, annee)
);
CREATE INDEX IF NOT EXISTS idx_pointages_ouvriers_chantier_id ON pointages_ouvriers(chantier_id);
CREATE INDEX IF NOT EXISTS idx_pointages_ouvriers_ressource_id ON pointages_ouvriers(ressource_id);
CREATE INDEX IF NOT EXISTS idx_pointages_ouvriers_date ON pointages_ouvriers(date_pointage);
CREATE INDEX IF NOT EXISTS idx_materiels_chantier_organisation_id ON materiels_chantier(organisation_id);
CREATE INDEX IF NOT EXISTS idx_materiels_chantier_statut ON materiels_chantier(statut);
CREATE INDEX IF NOT EXISTS idx_pointages_materiels_materiel_id ON pointages_materiels(materiel_id);
CREATE INDEX IF NOT EXISTS idx_consommation_materiaux_chantier_chantier_id ON consommation_materiaux_chantier(chantier_id);
CREATE INDEX IF NOT EXISTS idx_photos_chantier_chantier_id ON photos_chantier(chantier_id);
CREATE INDEX IF NOT EXISTS idx_interventions_materiels_materiel_id ON interventions_materiels(materiel_id);
CREATE INDEX IF NOT EXISTS idx_rapports_hebdomadaires_projet_id ON rapports_hebdomadaires(projet_id);
