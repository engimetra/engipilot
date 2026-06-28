-- V25 : Business Intelligence
CREATE TABLE IF NOT EXISTS bi_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) DEFAULT 'CUSTOM' CHECK (type IN ('GLOBAL','PROJET','HSE','FINANCIER','PLANNING','TERRAIN','CUSTOM')),
    projet_id UUID REFERENCES projets(id),
    layout JSONB DEFAULT '{}',
    filtres_defaut JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES utilisateurs(id),
    deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS bi_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES bi_dashboards(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    titre VARCHAR(100) NOT NULL,
    type_widget VARCHAR(30) NOT NULL CHECK (type_widget IN ('KPI_CARD','LINE_CHART','BAR_CHART','PIE_CHART','TABLE','MAP','GAUGE','HEATMAP','GANTT','TEXT')),
    source_donnees VARCHAR(50) NOT NULL,
    requete_sql TEXT,
    config JSONB DEFAULT '{}',
    filtres JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    largeur INTEGER DEFAULT 4,
    hauteur INTEGER DEFAULT 3,
    refresh_interval_s INTEGER DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS bi_kpis_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie VARCHAR(30) CHECK (categorie IN ('AVANCEMENT','FINANCIER','HSE','QUALITE','PLANNING','RESSOURCES','IA')),
    formule TEXT NOT NULL,
    unite VARCHAR(20),
    seuil_alerte DECIMAL(15,4),
    seuil_critique DECIMAL(15,4),
    sens_amelioration VARCHAR(5) DEFAULT 'UP' CHECK (sens_amelioration IN ('UP','DOWN')),
    periodicite VARCHAR(20) DEFAULT 'JOURNALIER',
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS bi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    kpi_id UUID REFERENCES bi_kpis_config(id),
    projet_id UUID REFERENCES projets(id),
    nom_kpi VARCHAR(100) NOT NULL,
    valeur DECIMAL(20,6) NOT NULL,
    valeur_precedente DECIMAL(20,6),
    variation_pct DECIMAL(8,4),
    periode DATE NOT NULL,
    granularite VARCHAR(20) DEFAULT 'JOUR' CHECK (granularite IN ('HEURE','JOUR','SEMAINE','MOIS','TRIMESTRE','ANNEE')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bi_rapports_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    type_rapport VARCHAR(30) DEFAULT 'PDF' CHECK (type_rapport IN ('PDF','EXCEL','CSV','EMAIL')),
    dashboard_id UUID REFERENCES bi_dashboards(id),
    frequence VARCHAR(20) DEFAULT 'HEBDOMADAIRE' CHECK (frequence IN ('QUOTIDIEN','HEBDOMADAIRE','MENSUEL','TRIMESTRIEL')),
    jour_envoi INTEGER,
    heure_envoi TIME DEFAULT '08:00:00',
    destinataires JSONB DEFAULT '[]',
    derniere_execution TIMESTAMPTZ,
    prochaine_execution TIMESTAMPTZ,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE OR REPLACE VIEW v_bi_kpis_globaux AS
SELECT o.id AS organisation_id, o.nom AS organisation,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'EN_COURS') AS projets_en_cours,
    COUNT(DISTINCT p.id) FILTER (WHERE p.statut = 'TERMINE') AS projets_termines,
    ROUND(AVG(p.avancement_physique) FILTER (WHERE p.statut = 'EN_COURS'), 2) AS avancement_moyen_pct,
    COALESCE(SUM(p.budget_previsionnel), 0) AS budget_total,
    COALESCE(SUM(p.cout_reel), 0) AS budget_consomme,
    COUNT(DISTINCT nc.id) FILTER (WHERE nc.statut != 'CLOTUREE') AS nc_ouvertes,
    COUNT(DISTINCT i.id) FILTER (WHERE i.statut != 'RESOLU') AS incidents_ouverts
FROM organisations o
LEFT JOIN projets p ON p.organisation_id = o.id
LEFT JOIN non_conformites nc ON nc.organisation_id = o.id
LEFT JOIN incidents_hse i ON i.organisation_id = o.id
GROUP BY o.id, o.nom;
CREATE OR REPLACE VIEW v_bi_performance_projets AS
SELECT p.id AS projet_id, p.organisation_id, p.nom AS nom_projet, p.statut,
    p.date_debut, p.date_fin_prevue, p.avancement_physique AS avancement_reel,
    CASE WHEN p.date_fin_prevue IS NOT NULL AND p.date_debut IS NOT NULL THEN
        ROUND((CURRENT_DATE - p.date_debut)::numeric / NULLIF((p.date_fin_prevue - p.date_debut), 0) * 100, 2)
    ELSE NULL END AS avancement_theorique,
    COALESCE(p.budget_previsionnel,0) AS budget_initial,
    COALESCE(p.cout_reel,0) AS budget_consomme,
    CASE WHEN COALESCE(p.budget_previsionnel,0) > 0 THEN
        ROUND(COALESCE(p.cout_reel,0) / p.budget_previsionnel * 100, 2) ELSE 0
    END AS taux_consommation_budget,
    COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'EN_COURS') AS taches_en_cours,
    COUNT(DISTINCT t.id) FILTER (WHERE t.statut = 'EN_RETARD') AS taches_en_retard,
    COUNT(DISTINCT nc.id) FILTER (WHERE nc.statut != 'CLOTUREE') AS nc_ouvertes,
    COUNT(DISTINCT i.id) FILTER (WHERE i.statut != 'RESOLU') AS incidents_ouverts
FROM projets p
LEFT JOIN taches t ON t.projet_id = p.id
LEFT JOIN non_conformites nc ON nc.projet_id = p.id
LEFT JOIN incidents_hse i ON i.projet_id = p.id
GROUP BY p.id, p.organisation_id, p.nom, p.statut, p.date_debut, p.date_fin_prevue, p.avancement_physique, p.budget_previsionnel, p.cout_reel;
CREATE OR REPLACE VIEW v_bi_financier AS
SELECT d.organisation_id, d.projet_id, DATE_TRUNC('month', d.created_at) AS mois,
    COUNT(DISTINCT d.id) AS nb_devis,
    SUM(d.montant_ttc) FILTER (WHERE d.statut = 'ACCEPTE') AS ca_accepte,
    COUNT(DISTINCT d.id) FILTER (WHERE d.statut = 'ACCEPTE') AS devis_acceptes,
    COUNT(DISTINCT d.id) FILTER (WHERE d.statut = 'REFUSE') AS devis_refuses,
    ROUND(COUNT(DISTINCT d.id) FILTER (WHERE d.statut = 'ACCEPTE')::DECIMAL /
        NULLIF(COUNT(DISTINCT d.id) FILTER (WHERE d.statut IN ('ACCEPTE','REFUSE')),0) * 100, 2) AS taux_conversion_pct
FROM devis d
GROUP BY d.organisation_id, d.projet_id, DATE_TRUNC('month', d.created_at);
CREATE OR REPLACE FUNCTION calculer_snapshot_kpi(
    p_organisation_id UUID, p_kpi_nom VARCHAR, p_valeur DECIMAL, p_projet_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_id UUID; v_precedent DECIMAL;
BEGIN
    SELECT valeur INTO v_precedent FROM bi_snapshots
    WHERE organisation_id = p_organisation_id AND nom_kpi = p_kpi_nom
      AND (projet_id = p_projet_id OR (p_projet_id IS NULL AND projet_id IS NULL))
    ORDER BY created_at DESC LIMIT 1;
    INSERT INTO bi_snapshots (organisation_id, projet_id, nom_kpi, valeur, valeur_precedente, variation_pct, periode)
    VALUES (p_organisation_id, p_projet_id, p_kpi_nom, p_valeur, v_precedent,
        CASE WHEN v_precedent IS NOT NULL AND v_precedent != 0
             THEN ROUND((p_valeur - v_precedent) / ABS(v_precedent) * 100, 4) ELSE NULL END,
        CURRENT_DATE) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;
CREATE INDEX IF NOT EXISTS idx_bi_dashboards_org ON bi_dashboards(organisation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bi_widgets_dashboard ON bi_widgets(dashboard_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bi_snapshots_org_kpi ON bi_snapshots(organisation_id, nom_kpi, periode DESC);
CREATE INDEX IF NOT EXISTS idx_bi_kpis_config_org ON bi_kpis_config(organisation_id) WHERE deleted_at IS NULL;
INSERT INTO bi_kpis_config (organisation_id, nom, description, categorie, formule, unite, seuil_alerte, seuil_critique, sens_amelioration)
SELECT o.id, k.nom, k.description, k.cat, k.form, k.unite, k.alerte, k.critique, k.sens
FROM organisations o,
(VALUES
    ('Taux avancement moyen','Avancement moyen projets actifs','AVANCEMENT','avancement_moyen_pct','%',60::DECIMAL,40::DECIMAL,'UP'),
    ('Taux consommation budget','Budget consomme / initial','FINANCIER','taux_consommation_budget','%',90::DECIMAL,110::DECIMAL,'DOWN'),
    ('Incidents HSE ouverts','Incidents non resolus','HSE','incidents_ouverts','incidents',3::DECIMAL,5::DECIMAL,'DOWN'),
    ('Non-conformites ouvertes','NC non cloturees','QUALITE','nc_ouvertes','NC',5::DECIMAL,10::DECIMAL,'DOWN'),
    ('Taux conversion devis','Devis acceptes','FINANCIER','taux_conversion_pct','%',40::DECIMAL,25::DECIMAL,'UP')
) AS k(nom,description,cat,form,unite,alerte,critique,sens)
ON CONFLICT DO NOTHING;
