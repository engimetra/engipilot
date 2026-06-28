-- V17 : Devis avances et facturation
CREATE TABLE IF NOT EXISTS variantes_devis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devis_id UUID NOT NULL REFERENCES devis(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    est_retenue BOOLEAN NOT NULL DEFAULT false,
    montant_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS revisions_devis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devis_id UUID NOT NULL REFERENCES devis(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    numero_revision INT NOT NULL DEFAULT 1,
    motif TEXT,
    donnees_snapshot JSONB NOT NULL,
    cree_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_revisions_devis_devis_revision UNIQUE (devis_id, numero_revision)
);
CREATE TABLE IF NOT EXISTS bordereaux_prix_unitaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    code VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'BPU' CHECK (type IN ('BPU','DQE','DPGF','CCTP')),
    statut VARCHAR(50) NOT NULL DEFAULT 'BROUILLON',
    version INT NOT NULL DEFAULT 1,
    actif BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bordereaux_prix_unitaires_code_org UNIQUE (organisation_id, code)
);
CREATE TABLE IF NOT EXISTS lignes_bordereau (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bordereau_id UUID NOT NULL REFERENCES bordereaux_prix_unitaires(id),
    article_id UUID REFERENCES bibliotheque_prix(id),
    ouvrage_id UUID REFERENCES ouvrages(id),
    numero_ligne VARCHAR(20),
    designation VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(20),
    quantite_estimee DECIMAL(15,3) NOT NULL DEFAULT 0,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant DECIMAL(15,2) NOT NULL DEFAULT 0,
    rubrique VARCHAR(100),
    ordre INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS factures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    devis_id UUID REFERENCES devis(id),
    client_id UUID REFERENCES clients_crm(id),
    numero VARCHAR(100) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON','EMISE','PARTIELLEMENT_PAYEE','PAYEE','EN_RETARD','ANNULEE')),
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance DATE,
    conditions_paiement TEXT,
    mode_paiement VARCHAR(100),
    montant_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
    taux_tva DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    montant_tva DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_ttc DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(15,2) NOT NULL DEFAULT 0,
    retenue_garantie DECIMAL(5,2) NOT NULL DEFAULT 0,
    notes TEXT,
    devise_id UUID REFERENCES devises(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_factures_numero_org UNIQUE (organisation_id, numero)
);
CREATE TABLE IF NOT EXISTS lignes_facture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id),
    ordre INT NOT NULL DEFAULT 0,
    designation VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(20),
    quantite DECIMAL(15,3) NOT NULL DEFAULT 0,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    taux_tva DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    montant_ht DECIMAL(15,2) NOT NULL DEFAULT 0,
    rubrique VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reglements_facture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    montant DECIMAL(15,2) NOT NULL,
    date_reglement DATE NOT NULL,
    mode_paiement VARCHAR(100),
    reference_paiement VARCHAR(255),
    banque VARCHAR(100),
    notes TEXT,
    valide_par UUID REFERENCES utilisateurs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS acomptes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    client_id UUID REFERENCES clients_crm(id),
    facture_id UUID REFERENCES factures(id),
    montant DECIMAL(15,2) NOT NULL,
    pourcentage DECIMAL(5,2),
    date_acompte DATE NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'ATTENDU' CHECK (statut IN ('ATTENDU','RECU','IMPUTE','ANNULE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE devis ADD COLUMN IF NOT EXISTS bordereau_id UUID REFERENCES bordereaux_prix_unitaires(id);
ALTER TABLE devis ADD COLUMN IF NOT EXISTS marge_pct DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS remise_pct DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS montant_remise DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS validite_jours INT NOT NULL DEFAULT 30;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS accepte_le DATE;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS refuse_le DATE;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients_crm(id);
CREATE INDEX IF NOT EXISTS idx_variantes_devis_devis_id ON variantes_devis(devis_id);
CREATE INDEX IF NOT EXISTS idx_bordereaux_prix_unitaires_organisation_id ON bordereaux_prix_unitaires(organisation_id);
CREATE INDEX IF NOT EXISTS idx_lignes_bordereau_bordereau_id ON lignes_bordereau(bordereau_id);
CREATE INDEX IF NOT EXISTS idx_factures_organisation_id ON factures(organisation_id);
CREATE INDEX IF NOT EXISTS idx_factures_projet_id ON factures(projet_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture_id ON lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_reglements_facture_facture_id ON reglements_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_acomptes_organisation_id ON acomptes(organisation_id);
