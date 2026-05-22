-- ================================================================
-- ENGIPILOT — V1__init_schema.sql
-- PostgreSQL 17 — Flyway 10
-- ================================================================

-- gen_random_uuid() est natif en PG13+, pas besoin de pgcrypto pour UUID
-- On garde pgcrypto pour d'autres besoins crypto éventuels
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── organisations ────────────────────────────────────────────────
CREATE TABLE organisations (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nom              VARCHAR(255) NOT NULL,
    siret            VARCHAR(20),
    plan_abonnement  VARCHAR(20)  NOT NULL DEFAULT 'STARTER'
                     CHECK (plan_abonnement IN ('STARTER','PRO','BUSINESS','ENTERPRISE')),
    actif            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── utilisateurs ─────────────────────────────────────────────────
CREATE TABLE utilisateurs (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id  UUID         NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email            VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe     VARCHAR(255) NOT NULL,
    prenom           VARCHAR(100),
    nom              VARCHAR(100),
    role             VARCHAR(20)  NOT NULL DEFAULT 'CHEF_CHANTIER'
                     CHECK (role IN ('ADMIN','CHEF_PROJET','CHEF_CHANTIER','CONSULTANT')),
    actif            BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── projets ──────────────────────────────────────────────────────
CREATE TABLE projets (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id      UUID          NOT NULL REFERENCES organisations(id),
    code_projet          VARCHAR(50)   NOT NULL,
    nom                  VARCHAR(255)  NOT NULL,
    description          TEXT,
    statut               VARCHAR(20)   NOT NULL DEFAULT 'EN_COURS'
                         CHECK (statut IN ('PLANIFIE','EN_COURS','EN_PAUSE','TERMINE','ANNULE')),
    priorite             VARCHAR(20)   NOT NULL DEFAULT 'NORMALE'
                         CHECK (priorite IN ('CRITIQUE','HAUTE','NORMALE','BASSE')),
    avancement_physique  NUMERIC(5,2)  NOT NULL DEFAULT 0
                         CHECK (avancement_physique  BETWEEN 0 AND 100),
    avancement_theorique NUMERIC(5,2)  NOT NULL DEFAULT 0
                         CHECK (avancement_theorique BETWEEN 0 AND 100),
    budget_previsionnel  NUMERIC(15,2) NOT NULL CHECK (budget_previsionnel > 0),
    cout_reel            NUMERIC(15,2) NOT NULL DEFAULT 0,
    date_debut           DATE          NOT NULL,
    date_fin_prevue      DATE          NOT NULL,
    date_fin_reelle      DATE,
    ville                VARCHAR(100),
    client               VARCHAR(255),
    chef_chantier        VARCHAR(255),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (code_projet, organisation_id),
    CHECK (date_fin_prevue > date_debut)
);

-- Trigger auto updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER projets_updated_at
    BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── lots ─────────────────────────────────────────────────────────
CREATE TABLE lots (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id       UUID          NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    code            VARCHAR(20)   NOT NULL,
    nom             VARCHAR(255)  NOT NULL,
    avancement      NUMERIC(5,2)  NOT NULL DEFAULT 0
                    CHECK (avancement BETWEEN 0 AND 100),
    budget          NUMERIC(15,2),
    cout_reel       NUMERIC(15,2) NOT NULL DEFAULT 0,
    date_debut      DATE,
    date_fin_prevue DATE,
    statut          VARCHAR(20)   NOT NULL DEFAULT 'EN_COURS'
                    CHECK (statut IN ('PLANIFIE','EN_COURS','RETARD','TERMINE')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── taches ───────────────────────────────────────────────────────
CREATE TABLE taches (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id      UUID          NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    lot_id         UUID          REFERENCES lots(id) ON DELETE SET NULL,
    titre          VARCHAR(500)  NOT NULL,
    description    TEXT,
    statut         VARCHAR(30)   NOT NULL DEFAULT 'A_FAIRE'
                   CHECK (statut IN ('A_FAIRE','EN_COURS','CONTROLE_QUALITE','TERMINE')),
    priorite       VARCHAR(20)   NOT NULL DEFAULT 'NORMALE'
                   CHECK (priorite IN ('CRITIQUE','HAUTE','NORMALE','BASSE')),
    responsable    VARCHAR(255),
    date_echeance  DATE,
    avancement     NUMERIC(5,2)  NOT NULL DEFAULT 0
                   CHECK (avancement BETWEEN 0 AND 100),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── rapports_journaliers ─────────────────────────────────────────
CREATE TABLE rapports_journaliers (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id             UUID         NOT NULL REFERENCES projets(id),
    date_rapport          DATE         NOT NULL,
    numero_rapport        VARCHAR(30)  NOT NULL UNIQUE,
    meteo                 VARCHAR(50),
    temperature_celsius   SMALLINT,
    vent_km_h             SMALLINT,
    effectif_total        INTEGER      NOT NULL DEFAULT 0,
    travaux_realises      TEXT,
    beton_coule_m3        NUMERIC(8,2),
    acier_kg              NUMERIC(10,2),
    avancement_journalier NUMERIC(5,2),
    problemes             TEXT,
    statut                VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON'
                          CHECK (statut IN ('BROUILLON','SOUMIS','VALIDE')),
    redacteur_id          UUID         REFERENCES utilisateurs(id),
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── non_conformites ──────────────────────────────────────────────
CREATE TABLE non_conformites (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id        UUID         NOT NULL REFERENCES projets(id),
    organisation_id  UUID         NOT NULL REFERENCES organisations(id),
    reference        VARCHAR(20)  NOT NULL UNIQUE,
    description      TEXT         NOT NULL,
    priorite         VARCHAR(20)  NOT NULL DEFAULT 'MINEURE'
                     CHECK (priorite IN ('CRITIQUE','MAJEURE','MINEURE')),
    statut           VARCHAR(20)  NOT NULL DEFAULT 'OUVERTE'
                     CHECK (statut IN ('OUVERTE','EN_COURS','RESOLUE','FERMEE')),
    lot              VARCHAR(100),
    zone             VARCHAR(100),
    responsable      VARCHAR(255),
    date_constat     DATE,
    date_resolution  DATE,
    actions_correctives TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── incidents_hse ────────────────────────────────────────────────
CREATE TABLE incidents_hse (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id                   UUID         NOT NULL REFERENCES projets(id),
    organisation_id             UUID         NOT NULL REFERENCES organisations(id),
    type                        VARCHAR(30)  NOT NULL
                                CHECK (type IN ('ACCIDENT_ARRET','ACCIDENT_SANS_ARRET','PRESQU_ACCIDENT','MALADIE_PRO')),
    description                 TEXT         NOT NULL,
    date_incident               DATE         NOT NULL,
    lieu                        VARCHAR(255),
    nombre_jours_arret          INTEGER      NOT NULL DEFAULT 0,
    nombre_blesses              INTEGER      NOT NULL DEFAULT 0,
    mesures_prises              TEXT,
    declare_inspection_travail  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── kpis_historiques (time-series EVM) ───────────────────────────
CREATE TABLE kpis_historiques (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id            UUID          NOT NULL REFERENCES projets(id),
    date_mesure          DATE          NOT NULL,
    avancement_physique  NUMERIC(5,2),
    avancement_theorique NUMERIC(5,2),
    spi                  NUMERIC(6,3),
    cpi                  NUMERIC(6,3),
    sv                   NUMERIC(15,2),
    cv                   NUMERIC(15,2),
    eac                  NUMERIC(15,2),
    etc                  NUMERIC(15,2),
    tcpi                 NUMERIC(6,3),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (projet_id, date_mesure)
);

-- ── documents ────────────────────────────────────────────────────
CREATE TABLE documents (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id       UUID         NOT NULL REFERENCES projets(id),
    organisation_id UUID         NOT NULL REFERENCES organisations(id),
    nom             VARCHAR(500) NOT NULL,
    type_document   VARCHAR(50),
    taille_bytes    BIGINT,
    url_storage     VARCHAR(1000),
    version         SMALLINT     NOT NULL DEFAULT 1,
    uploaded_by     UUID         REFERENCES utilisateurs(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── audit_logs ───────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id   UUID,
    utilisateur_id    UUID,
    utilisateur_email VARCHAR(255),
    action            VARCHAR(50)  NOT NULL,
    resource_type     VARCHAR(100),
    resource_id       UUID,
    details           TEXT,
    ip_address        VARCHAR(45),
    http_status       SMALLINT,
    duration_ms       BIGINT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEX DE PERFORMANCE
-- ================================================================
CREATE INDEX idx_projets_org_statut   ON projets(organisation_id, statut);
CREATE INDEX idx_projets_updated      ON projets(organisation_id, updated_at DESC);
CREATE INDEX idx_lots_projet          ON lots(projet_id);
CREATE INDEX idx_taches_projet_statut ON taches(projet_id, statut);
CREATE INDEX idx_rapports_projet_date ON rapports_journaliers(projet_id, date_rapport DESC);
CREATE INDEX idx_nc_projet_statut     ON non_conformites(projet_id, statut);
CREATE INDEX idx_hse_projet_date      ON incidents_hse(projet_id, date_incident DESC);
CREATE INDEX idx_kpis_projet_date     ON kpis_historiques(projet_id, date_mesure DESC);
CREATE INDEX idx_documents_projet     ON documents(projet_id);
CREATE INDEX idx_audit_org_date       ON audit_logs(organisation_id, created_at DESC);
