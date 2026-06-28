-- V23 : LLM / Agents IA
CREATE TABLE IF NOT EXISTS ia_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id),
    code VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_agent VARCHAR(100) DEFAULT 'ASSISTANT' CHECK (type_agent IN ('ASSISTANT','ANALYSTE','PLANIFICATEUR','VERIFICATEUR','ORCHESTRATEUR')),
    prompt_systeme TEXT NOT NULL,
    modele_llm VARCHAR(100) DEFAULT 'claude-opus-4-8',
    temperature DECIMAL(3,2) DEFAULT 0.3 CHECK (temperature BETWEEN 0 AND 2),
    max_tokens INT DEFAULT 4096,
    contexte_max INT DEFAULT 100000,
    outils_actifs TEXT[] DEFAULT '{}',
    domaines TEXT[] DEFAULT '{}',
    actif BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_outils_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ia_agents(id),
    code VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_outil VARCHAR(50) DEFAULT 'FUNCTION' CHECK (type_outil IN ('FUNCTION','MCP','HTTP','DATABASE')),
    schema_input JSONB NOT NULL,
    schema_output JSONB,
    implementation TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    projet_id UUID REFERENCES projets(id),
    agent_id UUID REFERENCES ia_agents(id),
    titre VARCHAR(255),
    mode VARCHAR(100) DEFAULT 'CHAT' CHECK (mode IN ('CHAT','ANALYSE_PROJET','GENERATION_RAPPORT','ANALYSE_RISQUE','METRE_ASSISTANT','DEVIS_ASSISTANT','PLANNING_ASSISTANT','EXTRACTION_AO')),
    modele_llm VARCHAR(100) DEFAULT 'claude-opus-4-8',
    tokens_total INT DEFAULT 0,
    tokens_entree INT DEFAULT 0,
    tokens_sortie INT DEFAULT 0,
    nombre_messages INT DEFAULT 0,
    metadonnees JSONB,
    actif BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ia_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system','tool')),
    contenu TEXT NOT NULL,
    contenu_structuree JSONB,
    thinking TEXT,
    nom_outil VARCHAR(100),
    resultat_outil JSONB,
    tokens_entree INT DEFAULT 0,
    tokens_sortie INT DEFAULT 0,
    latence_ms INT,
    confiance DECIMAL(5,4),
    sources JSONB,
    ordre INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_memoires_contexte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    utilisateur_id UUID REFERENCES utilisateurs(id),
    projet_id UUID REFERENCES projets(id),
    cle VARCHAR(255) NOT NULL,
    valeur TEXT NOT NULL,
    contexte JSONB,
    type_memoire VARCHAR(50) DEFAULT 'COURT_TERME' CHECK (type_memoire IN ('COURT_TERME','LONG_TERME','PROJET','UTILISATEUR','GLOBAL')),
    expire_le TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memoires_contexte_unique_projet
    ON ia_memoires_contexte (organisation_id, projet_id, cle)
    WHERE projet_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS ia_prompts_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES organisations(id),
    code VARCHAR(100) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_prompt VARCHAR(100) NOT NULL,
    contenu_template TEXT NOT NULL,
    variables JSONB,
    langue VARCHAR(10) DEFAULT 'fr',
    version INT DEFAULT 1,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_sessions_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    mois INT NOT NULL,
    annee INT NOT NULL,
    tokens_entree BIGINT DEFAULT 0,
    tokens_sortie BIGINT DEFAULT 0,
    nombre_conversations INT DEFAULT 0,
    nombre_messages INT DEFAULT 0,
    cout_estime DECIMAL(10,4) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organisation_id, utilisateur_id, mois, annee)
);
CREATE INDEX IF NOT EXISTS idx_ia_conversations_org ON ia_conversations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ia_conversations_user ON ia_conversations(utilisateur_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ia_conversations_projet ON ia_conversations(projet_id);
CREATE INDEX IF NOT EXISTS idx_ia_messages_conversation ON ia_messages(conversation_id, ordre);
CREATE INDEX IF NOT EXISTS idx_ia_memoires_org ON ia_memoires_contexte(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ia_sessions_usage_org ON ia_sessions_usage(organisation_id, annee, mois);
CREATE INDEX IF NOT EXISTS idx_ia_agents_code ON ia_agents(code);
