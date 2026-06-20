-- Migration V10 : organisation_id sur tables sans isolation multi-tenant

ALTER TABLE kpis_historiques
    ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE taches
    ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);
ALTER TABLE rapports_journaliers
    ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

UPDATE kpis_historiques k SET organisation_id = p.organisation_id
    FROM projets p WHERE k.projet_id = p.id AND k.organisation_id IS NULL;
UPDATE lots l SET organisation_id = p.organisation_id
    FROM projets p WHERE l.projet_id = p.id AND l.organisation_id IS NULL;
UPDATE rapports_journaliers r SET organisation_id = p.organisation_id
    FROM projets p WHERE r.projet_id = p.id AND r.organisation_id IS NULL;
UPDATE taches t SET organisation_id = p.organisation_id
    FROM lots l JOIN projets p ON l.projet_id = p.id
    WHERE t.lot_id = l.id AND t.organisation_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_kpis_org    ON kpis_historiques(organisation_id);
CREATE INDEX IF NOT EXISTS idx_lots_org    ON lots(organisation_id);
CREATE INDEX IF NOT EXISTS idx_taches_org  ON taches(organisation_id);
CREATE INDEX IF NOT EXISTS idx_rapports_org ON rapports_journaliers(organisation_id);
