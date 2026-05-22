-- D2: Index manquants pour les requêtes multi-tenant et filtres fréquents

-- Filtrage par statut sur projets (ProjetRepository.findEnCoursByOrganisation)
CREATE INDEX IF NOT EXISTS idx_projets_statut
    ON projets(statut);

-- Filtrage par statut sur tâches (tableau Kanban)
CREATE INDEX IF NOT EXISTS idx_taches_statut
    ON taches(statut);

-- Join FK lot_id → lots (absent malgré la FK)
CREATE INDEX IF NOT EXISTS idx_taches_lot
    ON taches(lot_id);

-- Requêtes multi-tenant sur non_conformites (NCService.listerParOrganisation)
CREATE INDEX IF NOT EXISTS idx_nc_organisation
    ON non_conformites(organisation_id);

-- Requêtes multi-tenant sur incidents_hse (HSEService.compterParOrganisation)
CREATE INDEX IF NOT EXISTS idx_hse_organisation
    ON incidents_hse(organisation_id);

-- KPI date-range par organisation + date (HSEService taux de fréquence mensuel)
CREATE INDEX IF NOT EXISTS idx_hse_org_date
    ON incidents_hse(organisation_id, date_incident DESC);

-- Requêtes documents par projet
CREATE INDEX IF NOT EXISTS idx_documents_projet
    ON documents(projet_id);

-- Requêtes documents multi-tenant
CREATE INDEX IF NOT EXISTS idx_documents_organisation
    ON documents(organisation_id);

-- Audit logs filtrables par organisation
CREATE INDEX IF NOT EXISTS idx_audit_organisation
    ON audit_logs(organisation_id);

-- Audit logs filtrables par date (purge, pagination chronologique)
CREATE INDEX IF NOT EXISTS idx_audit_created_at
    ON audit_logs(created_at DESC);

-- Audit logs filtrables par action (recherche d'événements spécifiques)
CREATE INDEX IF NOT EXISTS idx_audit_action
    ON audit_logs(action);
