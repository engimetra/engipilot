-- V24 : Embeddings pgvector RAG
CREATE TABLE IF NOT EXISTS ia_documents_indexes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    projet_id UUID REFERENCES projets(id),
    document_id UUID REFERENCES documents(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_source VARCHAR(100) DEFAULT 'DOCUMENT' CHECK (type_source IN ('DOCUMENT','METRE','DEVIS','RAPPORT','IFC','NORME','MARCHE','AO','CCTP','PLAN')),
    url_source TEXT,
    statut VARCHAR(50) DEFAULT 'ATTENTE' CHECK (statut IN ('ATTENTE','INDEXATION','INDEXE','ERREUR')),
    nombre_chunks INT DEFAULT 0,
    modele_embedding VARCHAR(100) DEFAULT 'text-embedding-3-small',
    tokens_total INT DEFAULT 0,
    metadonnees JSONB,
    date_indexation TIMESTAMPTZ,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_index_id UUID NOT NULL REFERENCES ia_documents_indexes(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    numero_chunk INT NOT NULL,
    contenu TEXT NOT NULL,
    tokens INT,
    page_debut INT,
    page_fin INT,
    section VARCHAR(255),
    titre_section VARCHAR(255),
    metadonnees JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_index_id, numero_chunk)
);
CREATE TABLE IF NOT EXISTS ia_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id UUID NOT NULL UNIQUE REFERENCES ia_chunks(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    embedding vector(1536) NOT NULL,
    modele VARCHAR(100) DEFAULT 'text-embedding-3-small',
    dimensions INT DEFAULT 1536,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_recherches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    requete TEXT NOT NULL,
    requete_embedding vector(1536),
    mode VARCHAR(50) DEFAULT 'HYBRIDE' CHECK (mode IN ('SEMANTIQUE','LEXICALE','HYBRIDE')),
    nombre_resultats INT DEFAULT 5,
    seuil_similarite DECIMAL(5,4) DEFAULT 0.7,
    filtres JSONB,
    contexte_projet_id UUID REFERENCES projets(id),
    latence_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ia_resultats_recherche (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recherche_id UUID NOT NULL REFERENCES ia_recherches(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES ia_chunks(id),
    score_similarite DECIMAL(7,6) NOT NULL,
    rang INT NOT NULL,
    score_bm25 DECIMAL(7,6),
    score_final DECIMAL(7,6),
    selectionne BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE VIEW v_chunks_avec_contenu AS
SELECT c.id, c.numero_chunk, c.contenu, c.section,
    d.titre AS titre_document, d.type_source, d.organisation_id, d.projet_id, e.embedding
FROM ia_chunks c
JOIN ia_documents_indexes d ON c.document_index_id = d.id
LEFT JOIN ia_embeddings e ON e.chunk_id = c.id;
CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
    ON ia_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_chunks_fts
    ON ia_chunks USING gin (to_tsvector('french', contenu));
CREATE INDEX IF NOT EXISTS idx_doc_indexes_org ON ia_documents_indexes(organisation_id);
CREATE INDEX IF NOT EXISTS idx_doc_indexes_statut ON ia_documents_indexes(statut);
CREATE INDEX IF NOT EXISTS idx_ia_chunks_doc ON ia_chunks(document_index_id);
CREATE INDEX IF NOT EXISTS idx_ia_embeddings_org ON ia_embeddings(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ia_recherches_org ON ia_recherches(organisation_id);
CREATE OR REPLACE FUNCTION search_similar_chunks(
    p_embedding vector(1536),
    p_org_id UUID,
    p_limite INT DEFAULT 10,
    p_seuil DECIMAL DEFAULT 0.7
)
RETURNS TABLE (chunk_id UUID, contenu TEXT, titre_document VARCHAR(255), type_source VARCHAR(100), score DECIMAL)
LANGUAGE sql STABLE AS $$
    SELECT c.id, c.contenu, d.titre, d.type_source,
        (1 - (e.embedding <=> p_embedding))::DECIMAL AS score
    FROM ia_embeddings e
    JOIN ia_chunks c ON c.id = e.chunk_id
    JOIN ia_documents_indexes d ON d.id = c.document_index_id
    WHERE e.organisation_id = p_org_id AND d.actif = true
      AND (1 - (e.embedding <=> p_embedding)) >= p_seuil
    ORDER BY e.embedding <=> p_embedding
    LIMIT p_limite;
$$;
