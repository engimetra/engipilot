-- V1_1__create_organisations.sql
-- Crée la table organisations dont V2 (users) a besoin via REFERENCES.
-- V1__init_schema.sql est baseliné (non exécuté) car la DB existe déjà via Prisma ;
-- cette migration remplace le CREATE de V1 pour la seule table nécessaire comme FK parent.

CREATE TABLE IF NOT EXISTS organisations (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nom              VARCHAR(255) NOT NULL,
    plan_abonnement  VARCHAR(50)  NOT NULL DEFAULT 'STARTER',
    actif            BOOLEAN      NOT NULL DEFAULT true,
    created_at       TIMESTAMP    NOT NULL DEFAULT now()
);

-- Organisation de test pour le développement local
INSERT INTO organisations (id, nom, plan_abonnement)
VALUES ('00000000-0000-0000-0000-000000000001', 'ENGIPILOT Demo', 'ENTERPRISE')
ON CONFLICT (id) DO NOTHING;
