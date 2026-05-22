-- ================================================================
-- ENGIPILOT — Données de démonstration
-- Login : demo@engipilot.ma / demo123
-- ================================================================

-- Organisation démo
INSERT INTO organisations (id, nom, plan_abonnement) VALUES
('00000000-0000-0000-0000-000000000001', 'BTP Maroc Constructions', 'PRO')
ON CONFLICT DO NOTHING;

-- Utilisateurs (mot_de_passe = "demo123" hashé BCrypt strength 12)
INSERT INTO utilisateurs (id, organisation_id, email, mot_de_passe, prenom, nom, role) VALUES
('00000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000001',
 'demo@engipilot.ma',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9apAcYYFq.P0wd2JxXi',
 'Ahmed', 'Khalil', 'CHEF_PROJET'),
('00000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0000-000000000001',
 'admin@engipilot.ma',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9apAcYYFq.P0wd2JxXi',
 'Fatima', 'Benali', 'ADMIN'),
('00000000-0000-0000-0000-000000000012',
 '00000000-0000-0000-0000-000000000001',
 'chef@engipilot.ma',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9apAcYYFq.P0wd2JxXi',
 'Youssef', 'Amrani', 'CHEF_CHANTIER')
ON CONFLICT DO NOTHING;

-- Projet 1 : Résidence Al Andalous — SPI correct (modéré)
INSERT INTO projets (
    id, organisation_id, code_projet, nom, description,
    statut, priorite,
    avancement_physique, avancement_theorique,
    budget_previsionnel, cout_reel,
    date_debut, date_fin_prevue,
    client, chef_chantier, ville
) VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    'P-2024-CA-007', 'Résidence Al Andalous',
    'Résidence de standing 48 appartements avec parking souterrain et piscine',
    'EN_COURS', 'HAUTE',
    63.0, 67.0,
    48500000, 33000000,
    '2024-03-01', '2025-11-30',
    'ADDOHA Group', 'Ahmed Khalil', 'Casablanca'
) ON CONFLICT DO NOTHING;

-- Projet 2 : Usine Bouskoura — SPI critique
INSERT INTO projets (
    id, organisation_id, code_projet, nom, description,
    statut, priorite,
    avancement_physique, avancement_theorique,
    budget_previsionnel, cout_reel,
    date_debut, date_fin_prevue,
    client, chef_chantier, ville
) VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'P-2024-BS-003', 'Usine Bouskoura — Ligne de production',
    'Construction usine agro-alimentaire 8000m² avec chambres froides et bureaux',
    'EN_COURS', 'CRITIQUE',
    45.0, 63.0,
    82000000, 43800000,
    '2024-01-15', '2026-02-28',
    'OCP Group', 'Karima Fassi', 'Bouskoura'
) ON CONFLICT DO NOTHING;

-- Projet 3 : Centre Commercial Rabat
INSERT INTO projets (
    id, organisation_id, code_projet, nom, description,
    statut, priorite,
    avancement_physique, avancement_theorique,
    budget_previsionnel, cout_reel,
    date_debut, date_fin_prevue,
    client, chef_chantier, ville
) VALUES (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'P-2024-RB-011', 'Centre Commercial Hay Riad',
    'Centre commercial 15 000m² avec 80 boutiques, food court et cinéma multiplex',
    'EN_COURS', 'NORMALE',
    88.0, 85.0,
    135000000, 115000000,
    '2023-06-01', '2025-08-31',
    'LabelVie Group', 'Omar Tazi', 'Rabat'
) ON CONFLICT DO NOTHING;

-- Lots pour Résidence Al Andalous
INSERT INTO lots (projet_id, code, nom, avancement, budget, cout_reel, statut) VALUES
('00000000-0000-0000-0000-000000000100', 'LOT-01', 'Gros Œuvre',       100, 15000000, 14800000, 'TERMINE'),
('00000000-0000-0000-0000-000000000100', 'LOT-02', 'Charpente & Toiture', 78, 8000000,  7200000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000100', 'LOT-03', 'Façades & Menuiseries', 45, 6500000, 3100000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000100', 'LOT-04', 'Électricité',       32, 5200000,  1800000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000100', 'LOT-05', 'Plomberie & CVC',   28, 4800000,  1400000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000100', 'LOT-06', 'Finitions & Peinture', 0, 4000000,     0, 'PLANIFIE')
ON CONFLICT DO NOTHING;

-- Lots pour Usine Bouskoura
INSERT INTO lots (projet_id, code, nom, avancement, budget, cout_reel, statut) VALUES
('00000000-0000-0000-0000-000000000101', 'LOT-01', 'Terrassement & VRD', 100, 8000000,  8400000, 'TERMINE'),
('00000000-0000-0000-0000-000000000101', 'LOT-02', 'Structure Béton Armé', 82, 25000000, 22000000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000101', 'LOT-03', 'Charpente Métallique', 45, 18000000, 9000000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000101', 'LOT-04', 'Électricité HT/BT',   12, 12000000, 2000000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000101', 'LOT-05', 'Génie Climatique',     5, 9000000,   500000, 'EN_COURS'),
('00000000-0000-0000-0000-000000000101', 'LOT-06', 'Chambres Froides',     0, 10000000,       0, 'PLANIFIE')
ON CONFLICT DO NOTHING;

-- Tâches Kanban pour Résidence Al Andalous
INSERT INTO taches (projet_id, titre, statut, priorite, responsable, avancement) VALUES
('00000000-0000-0000-0000-000000000100', 'Coulage dalle niveau R+4',          'TERMINE',          'HAUTE',    'Équipe Gros Œuvre A', 100),
('00000000-0000-0000-0000-000000000100', 'Pose fenêtres aluminium R+1 à R+3',  'EN_COURS',         'HAUTE',    'Menuiserie Alami',     65),
('00000000-0000-0000-0000-000000000100', 'Installation tableau électrique T1', 'EN_COURS',         'NORMALE',  'Électricité Fassi',    40),
('00000000-0000-0000-0000-000000000100', 'Recalage planning façade nord',      'A_FAIRE',          'CRITIQUE', 'Ahmed Khalil',          0),
('00000000-0000-0000-0000-000000000100', 'Réception charpente niveau R+5',     'CONTROLE_QUALITE', 'HAUTE',    'Bureau de Contrôle',   95),
('00000000-0000-0000-0000-000000000100', 'Inspection étanchéité terrasse R+5', 'A_FAIRE',          'HAUTE',    'Chef de chantier',      0),
('00000000-0000-0000-0000-000000000100', 'Commande carrelage RDC',             'A_FAIRE',          'NORMALE',  'Service achats',        0),
('00000000-0000-0000-0000-000000000100', 'Passage gaines électriques R+2',     'EN_COURS',         'NORMALE',  'Électricité Fassi',    30)
ON CONFLICT DO NOTHING;

-- Tâches pour Usine Bouskoura
INSERT INTO taches (projet_id, titre, statut, priorite, responsable, avancement) VALUES
('00000000-0000-0000-0000-000000000101', 'Coffrage poteaux zone B',            'EN_COURS',         'CRITIQUE', 'Équipe BA',            70),
('00000000-0000-0000-0000-000000000101', 'Réception acier lot charpente',       'A_FAIRE',          'CRITIQUE', 'Karima Fassi',          0),
('00000000-0000-0000-0000-000000000101', 'Plan câblage HT validé ingénieur',   'CONTROLE_QUALITE', 'HAUTE',    'Bureau Études',        90),
('00000000-0000-0000-0000-000000000101', 'Recrutement électriciens (8 postes)', 'A_FAIRE',          'CRITIQUE', 'DRH',                   0),
('00000000-0000-0000-0000-000000000101', 'Levée NC béton zone A-4',            'EN_COURS',         'MAJEURE',  'Chef Qualité',         50)
ON CONFLICT DO NOTHING;

-- Rapports journaliers
INSERT INTO rapports_journaliers (
    projet_id, date_rapport, numero_rapport, meteo,
    effectif_total, travaux_realises, beton_coule_m3, acier_kg,
    avancement_journalier, statut
) VALUES
('00000000-0000-0000-0000-000000000100', CURRENT_DATE - 1, 'RJ-2025-084',
 'Ensoleillé', 42,
 'Pose fenêtres R+2 (8 unités). Tirage câbles électriques niveaux R+1 et R+2. Préparation banche pour coulage R+4.',
 24.5, 850, 1.2, 'VALIDE'),
('00000000-0000-0000-0000-000000000100', CURRENT_DATE - 2, 'RJ-2025-083',
 'Nuageux', 38,
 'Coulage dalle R+3 terminé. Décoffrage R+2 partiel. Inspection chantier chef de projet.',
 42.0, 1200, 0.8, 'VALIDE'),
('00000000-0000-0000-0000-000000000101', CURRENT_DATE - 1, 'RJ-2025-047',
 'Ensoleillé', 35,
 'Coffrage poteaux zone B (6 poteaux). Attente livraison acier charpente. Réunion coordination électricité.',
 0, 0, 0.5, 'SOUMIS')
ON CONFLICT DO NOTHING;

-- Non-conformités
INSERT INTO non_conformites (
    projet_id, organisation_id, reference, description,
    priorite, statut, lot, responsable, date_constat
) VALUES
('00000000-0000-0000-0000-000000000100',
 '00000000-0000-0000-0000-000000000001',
 'NC-001', 'Fissures constatées sur dalle R+2 — joint de dilatation non conforme au plan',
 'MAJEURE', 'EN_COURS', 'Gros Œuvre', 'Ahmed Khalil', CURRENT_DATE - 15),
('00000000-0000-0000-0000-000000000100',
 '00000000-0000-0000-0000-000000000001',
 'NC-002', 'Enrobage insuffisant armatures poteaux P12 à P15 (enrobage 2cm au lieu de 3cm)',
 'CRITIQUE', 'OUVERTE', 'Gros Œuvre', 'Bureau de Contrôle', CURRENT_DATE - 8),
('00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000001',
 'NC-003', 'Béton zone A-4 : résistance à 28j non conforme (25 MPa obtenu, 30 MPa requis)',
 'CRITIQUE', 'EN_COURS', 'Structure Béton Armé', 'Karima Fassi', CURRENT_DATE - 12),
('00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000001',
 'NC-004', 'Soudures charpente métallique — contrôle magnétoscopique non réalisé',
 'MAJEURE', 'OUVERTE', 'Charpente Métallique', 'Bureau Études', CURRENT_DATE - 5),
('00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000001',
 'NC-005', 'Plan d installation câblage HT non approuvé — travaux bloqués',
 'CRITIQUE', 'OUVERTE', 'Électricité HT/BT', 'Karima Fassi', CURRENT_DATE - 3)
ON CONFLICT DO NOTHING;

-- Incidents HSE
INSERT INTO incidents_hse (
    projet_id, organisation_id, type, description,
    date_incident, lieu, nombre_jours_arret, mesures_prises
) VALUES
('00000000-0000-0000-0000-000000000100',
 '00000000-0000-0000-0000-000000000001',
 'PRESQU_ACCIDENT',
 'Chute objet depuis échafaudage R+3 — aucun blessé — filet de sécurité a fonctionné',
 CURRENT_DATE - 21, 'Façade nord R+3', 0,
 'Inspection complète des filets. Sensibilisation équipe. Vérification ancrage échafaudages.'),
('00000000-0000-0000-0000-000000000101',
 '00000000-0000-0000-0000-000000000001',
 'ACCIDENT_SANS_ARRET',
 'Coupure main ouvrier lors manipulation tôles acier — soins infirmerie chantier',
 CURRENT_DATE - 45, 'Zone charpente', 0,
 'Port gants anti-coupures rendu obligatoire. Toolbox sécurité réalisé.')
ON CONFLICT DO NOTHING;

-- Historique KPIs pour graphiques Analytics
DO $$
DECLARE
    i INT;
    proj1 UUID := '00000000-0000-0000-0000-000000000100';
    proj2 UUID := '00000000-0000-0000-0000-000000000101';
BEGIN
    FOR i IN 1..6 LOOP
        INSERT INTO kpis_historiques
            (projet_id, date_mesure, avancement_physique, avancement_theorique, spi, cpi, sv, cv, eac)
        VALUES
            (proj1, CURRENT_DATE - (i * 30),
             63 - (i * 5.5), 67 - (i * 5.0),
             ROUND((0.94 - i * 0.008)::numeric, 3),
             ROUND((0.96 - i * 0.005)::numeric, 3),
             ROUND((-1500000 + i * 200000)::numeric, 2),
             ROUND((-500000  + i * 100000)::numeric, 2),
             ROUND((50000000 + i * 300000)::numeric, 2))
        ON CONFLICT DO NOTHING;

        INSERT INTO kpis_historiques
            (projet_id, date_mesure, avancement_physique, avancement_theorique, spi, cpi, sv, cv, eac)
        VALUES
            (proj2, CURRENT_DATE - (i * 30),
             45 - (i * 4.0), 63 - (i * 3.5),
             ROUND((0.714 - i * 0.015)::numeric, 3),
             ROUND((0.843 - i * 0.010)::numeric, 3),
             ROUND((-14760000 + i * 1000000)::numeric, 2),
             ROUND((-6900000  + i * 500000)::numeric,  2),
             ROUND((97272000  + i * 800000)::numeric,  2))
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
