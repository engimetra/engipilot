-- Migration V2 : index de performance manquants + colonnes reset password

-- ── Index manquants ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email      ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_org        ON utilisateurs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rapports_redacteur      ON rapports_journaliers(redacteur_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader      ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_taches_lot              ON taches(lot_id);
CREATE INDEX IF NOT EXISTS idx_nc_date_constat         ON non_conformites(date_constat);
CREATE INDEX IF NOT EXISTS idx_kpis_date_mesure        ON kpis_historiques(date_mesure DESC);
CREATE INDEX IF NOT EXISTS idx_audit_utilisateur       ON audit_logs(utilisateur_id);

-- ── Colonnes reset password (pour backend-node) ────────────────────────────
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS reset_password_token   VARCHAR(64),
    ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_reset_token
    ON utilisateurs(reset_password_token)
    WHERE reset_password_token IS NOT NULL;
