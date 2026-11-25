-- ============================================================================
-- Universal Dev Knowledge Engine (UDKE)
-- Authoritative SQLite & FTS5 DDL Schema — Version 2.0
-- Universal Developer Documentation & Knowledge Platform
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ----------------------------------------------------------------------------
-- 1. Master Knowledge Domains (12 Top-Level Engineering Domains)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,             -- e.g. 'domain.backend', 'domain.mobile'
    name TEXT NOT NULL UNIQUE,       -- e.g. 'Backend Development', 'Mobile Development'
    slug TEXT NOT NULL UNIQUE,       -- e.g. 'backend', 'mobile'
    description TEXT,
    icon TEXT,                       -- VS Code icon identifier
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Technologies (Languages, Frameworks, Runtimes, Platforms)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS technologies (
    id TEXT PRIMARY KEY,             -- e.g. 'tech.nodejs', 'tech.flutter', 'tech.python'
    domain_id TEXT REFERENCES domains(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,       -- e.g. 'Node.js', 'Flutter', 'Python'
    slug TEXT,
    type TEXT NOT NULL CHECK(type IN ('language', 'framework', 'runtime', 'platform', 'tool', 'architecture')),
    description TEXT,
    icon TEXT,
    official_website TEXT,
    documentation_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_technologies_domain ON technologies(domain_id);

-- ----------------------------------------------------------------------------
-- 3. Knowledge Packs (Modular Offline Pack Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_packs (
    id TEXT PRIMARY KEY,             -- e.g. 'pack.backend.nodejs', 'pack.mobile.flutter'
    technology_id TEXT REFERENCES technologies(id) ON DELETE CASCADE,
    domain_id TEXT REFERENCES domains(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,           -- e.g. '20.x', '3.x'
    status TEXT NOT NULL CHECK(status IN ('installed', 'available', 'update_available')),
    record_count INTEGER NOT NULL DEFAULT 0,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    license TEXT NOT NULL,
    checksum TEXT,
    pack_path TEXT,
    installed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packs_tech ON knowledge_packs(technology_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON knowledge_packs(status);

-- ----------------------------------------------------------------------------
-- 4. Standardized Technology Knowledge Sub-Categories (14 Standard Sections)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    technology_id TEXT REFERENCES technologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,              -- e.g. 'Fundamentals', 'Authentication', 'File System'
    slug TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_tech ON categories(technology_id);

-- ----------------------------------------------------------------------------
-- 5. Libraries & Packages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS libraries (
    id TEXT PRIMARY KEY,             -- e.g. 'lib.argon2', 'lib.express', 'lib.scaffold'
    technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    pack_id TEXT REFERENCES knowledge_packs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    package_manager TEXT,            -- e.g. 'npm', 'pub.dev', 'pypi', 'cargo'
    installation_cmd TEXT,           -- e.g. 'npm install argon2'
    repository_url TEXT,
    documentation_url TEXT,
    license TEXT,                    -- SPDX identifier e.g. 'MIT', 'Apache-2.0'
    documentation_version TEXT,
    maintenance_status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_libraries_tech ON libraries(technology_id);
CREATE INDEX IF NOT EXISTS idx_libraries_name ON libraries(name);
CREATE INDEX IF NOT EXISTS idx_libraries_pack ON libraries(pack_id);

-- ----------------------------------------------------------------------------
-- 6. Sources & Provenance
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('official_website', 'git_repo', 'registry', 'api_spec', 'manual_curation')),
    license TEXT NOT NULL,
    retrieval_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content_hash TEXT,
    metadata_json TEXT
);

-- ----------------------------------------------------------------------------
-- 7. Documentation Records (11 Standard Knowledge Sections)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,             -- Hierarchical key: e.g. 'nodejs.security.argon2'
    pack_id TEXT REFERENCES knowledge_packs(id) ON DELETE SET NULL,
    library_id TEXT REFERENCES libraries(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('library', 'module', 'class', 'concept', 'guide', 'pipeline', 'tool', 'architecture')),
    language TEXT NOT NULL,
    runtime TEXT,
    
    -- 11 Standard Knowledge Sections
    overview TEXT NOT NULL,
    purpose TEXT,
    installation TEXT,
    syntax TEXT,
    configuration TEXT,
    errors TEXT,
    error_handling TEXT,
    security_considerations TEXT,
    compatibility TEXT,
    
    source_url TEXT,
    license TEXT,
    documentation_version TEXT DEFAULT 'latest',
    completeness_status TEXT DEFAULT 'complete' CHECK(completeness_status IN ('complete', 'partial', 'metadata_only', 'outdated', 'unverified')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_pack ON documents(pack_id);
CREATE INDEX IF NOT EXISTS idx_documents_library ON documents(library_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_lang ON documents(language);

-- ----------------------------------------------------------------------------
-- 8. Symbols (Classes, Functions, Methods, Constructors, Properties)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,              -- e.g. 'hash', 'verify', 'Scaffold'
    kind TEXT NOT NULL CHECK(kind IN ('class', 'constructor', 'method', 'function', 'property', 'interface', 'enum', 'constant')),
    syntax TEXT NOT NULL,            -- Exact formal signature
    return_type TEXT,
    description TEXT NOT NULL,
    is_static BOOLEAN DEFAULT 0,
    is_async BOOLEAN DEFAULT 0,
    is_deprecated BOOLEAN DEFAULT 0,
    deprecation_reason TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_symbols_document ON symbols(document_id);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(kind);

-- ----------------------------------------------------------------------------
-- 9. Parameters
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parameters (
    id TEXT PRIMARY KEY,
    symbol_id TEXT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    default_value TEXT,
    is_required BOOLEAN DEFAULT 1,
    is_optional BOOLEAN DEFAULT 0,
    is_named BOOLEAN DEFAULT 0,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_parameters_symbol ON parameters(symbol_id);

-- ----------------------------------------------------------------------------
-- 10. Code Examples
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS examples (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    symbol_id TEXT REFERENCES symbols(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    expected_output TEXT,
    source_attribution TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_examples_document ON examples(document_id);
CREATE INDEX IF NOT EXISTS idx_examples_symbol ON examples(symbol_id);

-- ----------------------------------------------------------------------------
-- 11. Implementation Pipelines & Ordered Steps
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,              -- e.g. 'Password Registration', 'Password Verification'
    description TEXT,
    objective TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipelines_doc ON pipelines(document_id);

CREATE TABLE IF NOT EXISTS pipeline_steps (
    id TEXT PRIMARY KEY,
    pipeline_id TEXT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    input_data TEXT,
    output_data TEXT,
    syntax TEXT,
    code_example TEXT,
    error_handling TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pipeline_steps_pipeline ON pipeline_steps(pipeline_id);

-- ----------------------------------------------------------------------------
-- 12. Relationships & Graph Edges
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source_doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_doc_id TEXT NOT NULL,     -- Allows referencing target documents across packs
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('requires', 'depends_on', 'related_to', 'implements', 'alternative_to', 'used_by', 'prerequisite_for')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_doc_id, target_doc_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_doc_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_doc_id);

-- ----------------------------------------------------------------------------
-- 13. SQLite FTS5 Full-Text Search Virtual Tables
-- ----------------------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    document_id UNINDEXED,
    title,
    overview,
    purpose,
    syntax,
    security_considerations,
    tokenize = 'unicode61 remove_diacritics 2'
);

CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
    symbol_id UNINDEXED,
    document_id UNINDEXED,
    name,
    kind,
    syntax,
    description,
    return_type,
    tokenize = 'unicode61 remove_diacritics 2'
);

-- ----------------------------------------------------------------------------
-- 14. FTS Synchronization Triggers
-- ----------------------------------------------------------------------------

-- Documents FTS Triggers
CREATE TRIGGER IF NOT EXISTS trg_documents_ai AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(document_id, title, overview, purpose, syntax, security_considerations)
    VALUES (new.id, new.title, new.overview, coalesce(new.purpose, ''), coalesce(new.syntax, ''), coalesce(new.security_considerations, ''));
END;

CREATE TRIGGER IF NOT EXISTS trg_documents_ad AFTER DELETE ON documents BEGIN
    DELETE FROM documents_fts WHERE document_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_documents_au AFTER UPDATE ON documents BEGIN
    DELETE FROM documents_fts WHERE document_id = old.id;
    INSERT INTO documents_fts(document_id, title, overview, purpose, syntax, security_considerations)
    VALUES (new.id, new.title, new.overview, coalesce(new.purpose, ''), coalesce(new.syntax, ''), coalesce(new.security_considerations, ''));
END;

-- Symbols FTS Triggers
CREATE TRIGGER IF NOT EXISTS trg_symbols_ai AFTER INSERT ON symbols BEGIN
    INSERT INTO symbols_fts(symbol_id, document_id, name, kind, syntax, description, return_type)
    VALUES (new.id, new.document_id, new.name, new.kind, new.syntax, new.description, coalesce(new.return_type, ''));
END;

CREATE TRIGGER IF NOT EXISTS trg_symbols_ad AFTER DELETE ON symbols BEGIN
    DELETE FROM symbols_fts WHERE symbol_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_symbols_au AFTER UPDATE ON symbols BEGIN
    DELETE FROM symbols_fts WHERE symbol_id = old.id;
    INSERT INTO symbols_fts(symbol_id, document_id, name, kind, syntax, description, return_type)
    VALUES (new.id, new.document_id, new.name, new.kind, new.syntax, new.description, coalesce(new.return_type, ''));
END;
