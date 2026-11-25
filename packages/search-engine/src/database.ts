import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DatabaseOptions {
  dbPath?: string;
  schemaPath?: string;
  inMemory?: boolean;
}

export class KnowledgeDatabase {
  private db: DatabaseSync;

  constructor(options: DatabaseOptions = {}) {
    if (options.inMemory || !options.dbPath) {
      this.db = new DatabaseSync(':memory:');
    } else {
      // Ensure directory exists
      const dir = path.dirname(path.resolve(options.dbPath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(path.resolve(options.dbPath));
    }

    this.initializeSchema(options.schemaPath);
  }

  private initializeSchema(customSchemaPath?: string): void {
    // Enable WAL and foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');
    
    const possibleSchemaPaths = [
      customSchemaPath,
      path.resolve('database/schema.sql'),
      path.resolve(__dirname, '../../../database/schema.sql'),
      path.resolve(__dirname, '../../database/schema.sql'),
    ].filter(Boolean) as string[];

    let schemaSql: string | null = null;
    for (const p of possibleSchemaPaths) {
      if (fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (schemaSql) {
      this.db.exec(schemaSql);
    } else {
      this.db.exec(EMBEDDED_SCHEMA_SQL);
    }
  }

  public getRawDatabase(): DatabaseSync {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}

const EMBEDDED_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technologies (
    id TEXT PRIMARY KEY,
    domain_id TEXT REFERENCES domains(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,
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

CREATE TABLE IF NOT EXISTS knowledge_packs (
    id TEXT PRIMARY KEY,
    technology_id TEXT REFERENCES technologies(id) ON DELETE CASCADE,
    domain_id TEXT REFERENCES domains(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
    technology_id TEXT REFERENCES technologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_tech ON categories(technology_id);

CREATE TABLE IF NOT EXISTS libraries (
    id TEXT PRIMARY KEY,
    technology_id TEXT NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    pack_id TEXT REFERENCES knowledge_packs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    package_manager TEXT,
    installation_cmd TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    license TEXT,
    documentation_version TEXT,
    maintenance_status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_libraries_tech ON libraries(technology_id);
CREATE INDEX IF NOT EXISTS idx_libraries_name ON libraries(name);
CREATE INDEX IF NOT EXISTS idx_libraries_pack ON libraries(pack_id);

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

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    pack_id TEXT REFERENCES knowledge_packs(id) ON DELETE SET NULL,
    library_id TEXT REFERENCES libraries(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('library', 'module', 'class', 'concept', 'guide', 'pipeline', 'tool', 'architecture')),
    language TEXT NOT NULL,
    runtime TEXT,
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

CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('class', 'constructor', 'method', 'function', 'property', 'interface', 'enum', 'constant')),
    syntax TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source_doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_doc_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('requires', 'depends_on', 'related_to', 'implements', 'alternative_to', 'used_by', 'prerequisite_for')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_doc_id, target_doc_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_doc_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_doc_id);

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
`;
