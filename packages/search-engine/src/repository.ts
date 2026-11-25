import { DatabaseSync } from 'node:sqlite';
import { 
  DocumentationRecord, 
  DocumentationRecordSchema,
  SymbolRecord, 
  ImplementationPipeline, 
  SourceMetadata,
  ParameterRecord,
  CodeExample,
  RelationshipRecord
} from '@udke/knowledge-schema';

export interface SearchOptions {
  limit?: number;
  offset?: number;
  ecosystem?: string;
  category?: string;
  type?: string;
}

export interface SearchResult {
  id: string;
  documentId?: string;
  targetId?: string;
  name: string;
  type: string;
  language: string;
  category: string;
  snippet: string;
  score: number;
}

export interface IKnowledgeEngine {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDocument(id: string): Promise<DocumentationRecord | null>;
  getSymbol(name: string, context?: { language?: string; version?: string }): Promise<SymbolRecord | null>;
  getPipeline(id: string): Promise<ImplementationPipeline | null>;
  getRelated(id: string): Promise<DocumentationRecord[]>;
  getSource(sourceId: string): Promise<SourceMetadata | null>;
  ingestDocument(doc: unknown): DocumentationRecord;
}

export class KnowledgeRepository implements IKnowledgeEngine {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  public ingestDocument(rawRecord: unknown): DocumentationRecord {
    const parseResult = DocumentationRecordSchema.safeParse(rawRecord);
    if (!parseResult.success) {
      throw new Error(`Knowledge schema validation failed: ${JSON.stringify(parseResult.error.format())}`);
    }

    const doc = parseResult.data;

    // Use transaction for atomic writes
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      // 1. Technology & Category placeholders
      const techSlug = doc.language.toLowerCase().replace(/[^a-z0-9]/g, '-');
      this.db.exec(`
        INSERT OR IGNORE INTO technologies (id, name, slug, type, description)
        VALUES ('tech.${techSlug}', '${doc.language}', '${techSlug}', 'runtime', '${doc.language} runtime ecosystem');
      `);

      const primaryCategory = doc.categories[0] || 'General';
      const categoryId = `cat.${primaryCategory.toLowerCase().replace(/\s+/g, '-')}`;
      this.db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, slug, description, level)
        VALUES (?, ?, ?, ?, ?)
      `).run(categoryId, primaryCategory, primaryCategory.toLowerCase().replace(/\s+/g, '-'), `${primaryCategory} category`, 1);

      // 2. Library
      if (doc.package) {
        const libId = `lib.${doc.package.name}`;
        this.db.prepare(`
          INSERT OR REPLACE INTO libraries (
            id, technology_id, name, package_manager, installation_cmd, repository_url, license, documentation_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          libId,
          `tech.${doc.language.toLowerCase()}`,
          doc.package.name,
          doc.package.manager,
          doc.package.installation,
          doc.package.repository_url || '',
          doc.package.license,
          doc.metadata.documentation_version
        );
      }

      // 3. Document
      this.db.prepare(`
        INSERT OR REPLACE INTO documents (
          id, library_id, category_id, title, slug, type, language, runtime,
          overview, purpose, installation, configuration, security_considerations, error_handling,
          source_url, license, documentation_version, completeness_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        doc.id,
        doc.package ? `lib.${doc.package.name}` : null,
        categoryId,
        doc.title,
        doc.slug,
        doc.type,
        doc.language,
        doc.runtime || doc.language,
        doc.documentation.overview,
        doc.documentation.purpose || null,
        doc.documentation.installation || null,
        doc.documentation.configuration || null,
        doc.documentation.security_considerations || null,
        doc.documentation.error_handling || null,
        doc.metadata.source_url,
        doc.metadata.license,
        doc.metadata.documentation_version,
        doc.metadata.completeness_status
      );

      // 4. Symbols & Parameters
      for (const sym of doc.symbols) {
        this.db.prepare(`
          INSERT OR REPLACE INTO symbols (
            id, document_id, name, kind, syntax, return_type, description, is_static, is_async, is_deprecated, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sym.id,
          doc.id,
          sym.name,
          sym.kind,
          sym.syntax,
          sym.return_type || null,
          sym.description,
          sym.is_static ? 1 : 0,
          sym.is_async ? 1 : 0,
          sym.is_deprecated ? 1 : 0,
          sym.sort_order
        );

        for (const param of sym.parameters) {
          this.db.prepare(`
            INSERT OR REPLACE INTO parameters (
              id, symbol_id, name, data_type, default_value, is_required, is_optional, is_named, description, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            param.id,
            sym.id,
            param.name,
            param.data_type,
            param.default_value || null,
            param.is_required ? 1 : 0,
            param.is_optional ? 1 : 0,
            param.is_named ? 1 : 0,
            param.description,
            param.sort_order
          );
        }
      }

      // 5. Implementation Pipelines & Steps
      for (const pipe of doc.pipelines) {
        this.db.prepare(`
          INSERT OR REPLACE INTO pipelines (
            id, document_id, name, description, objective, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          pipe.id,
          doc.id,
          pipe.name,
          pipe.description || null,
          pipe.objective,
          pipe.sort_order
        );

        for (const step of pipe.steps) {
          this.db.prepare(`
            INSERT OR REPLACE INTO pipeline_steps (
              id, pipeline_id, step_number, title, explanation, input_data, output_data, syntax, code_example, error_handling, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            step.id,
            pipe.id,
            step.step_number,
            step.title,
            step.explanation,
            step.input_data || null,
            step.output_data || null,
            step.syntax || null,
            step.code_example || null,
            step.error_handling || null,
            step.sort_order
          );
        }
      }

      // 6. Code Examples
      for (const ex of doc.examples) {
        this.db.prepare(`
          INSERT OR REPLACE INTO examples (
            id, document_id, symbol_id, title, description, code, language, expected_output, source_attribution, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ex.id,
          doc.id,
          ex.symbol_id || null,
          ex.title,
          ex.description || null,
          ex.code,
          ex.language,
          ex.expected_output || null,
          ex.source_attribution || null,
          ex.sort_order
        );
      }

      // 7. Relationships
      for (const rel of doc.relationships) {
        this.db.prepare(`
          INSERT OR REPLACE INTO relationships (
            id, source_doc_id, target_doc_id, relationship_type, description
          ) VALUES (?, ?, ?, ?, ?)
        `).run(
          rel.id,
          rel.source_doc_id,
          rel.target_doc_id,
          rel.relationship_type,
          rel.description || null
        );
      }

      this.db.exec('COMMIT;');
      return doc as DocumentationRecord;
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit || 30;

    // 1. Smart Filter Prefix Parsing (@ecosystem, #type)
    let targetEcosystem = options.ecosystem ? options.ecosystem.toLowerCase() : undefined;
    let targetType = options.type ? options.type.toLowerCase() : undefined;

    let processedQuery = query;
    const ecoMatch = processedQuery.match(/@(\w+)/);
    if (ecoMatch && ecoMatch[1]) {
      targetEcosystem = ecoMatch[1].toLowerCase();
      processedQuery = processedQuery.replace(ecoMatch[0], ' ');
    }

    const typeMatch = processedQuery.match(/#(\w+)/);
    if (typeMatch && typeMatch[1]) {
      targetType = typeMatch[1].toLowerCase();
      processedQuery = processedQuery.replace(typeMatch[0], ' ');
    }

    // 2. Strict Security & SQL/FTS Sanitization
    // Strip operators and special symbols that could cause SQLite FTS5 parser errors
    const cleanQuery = processedQuery
      .replace(/['"*^():{}\[\]~\\\/<>|=+`]/g, ' ')
      .replace(/\b(AND|OR|NOT|NEAR)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const results: SearchResult[] = [];

    // If cleanQuery is empty but an ecosystem filter is specified, query by ecosystem directly
    if (!cleanQuery) {
      if (targetEcosystem) {
        const ecoRows = this.db.prepare(`
          SELECT id, title as name, type, language, 'General' as category, overview as snippet
          FROM documents
          WHERE LOWER(language) LIKE ? OR LOWER(title) LIKE ? OR LOWER(id) LIKE ?
          LIMIT ?
        `).all(`%${targetEcosystem}%`, `%${targetEcosystem}%`, `%${targetEcosystem}%`, limit) as Record<string, unknown>[];

        return ecoRows.map(row => ({
          id: String(row['id']),
          documentId: String(row['id']),
          name: String(row['name']),
          type: String(row['type']),
          language: String(row['language']),
          category: String(row['category']),
          snippet: String(row['snippet']),
          score: -10
        }));
      }
      return [];
    }

    // 3. Search Documents FTS
    const docQuery = `
      SELECT 
        d.id, 
        d.title as name, 
        d.type, 
        d.language, 
        c.name as category,
        snippet(documents_fts, 2, '<mark>', '</mark>', '...', 15) as snippet,
        rank
      FROM documents_fts
      JOIN documents d ON d.id = documents_fts.document_id
      LEFT JOIN categories c ON c.id = d.category_id
      WHERE documents_fts MATCH ?
      ORDER BY rank
      LIMIT ?;
    `;

    try {
      const docRows = this.db.prepare(docQuery).all(`${cleanQuery}*`, limit) as Record<string, unknown>[];
      for (const row of docRows) {
        const name = String(row['name']);
        const isExact = name.toLowerCase() === cleanQuery.toLowerCase();
        results.push({
          id: String(row['id']),
          documentId: String(row['id']),
          name,
          type: String(row['type']),
          language: String(row['language']),
          category: String(row['category'] || 'General'),
          snippet: String(row['snippet'] || ''),
          score: isExact ? -100 : (-50 + Number(row['rank'] || 0))
        });
      }
    } catch {
      // Fallback if match syntax error
    }

    // 4. Search Symbols FTS (Syntax, Methods, Classes, Functions)
    const symQuery = `
      SELECT 
        s.id, 
        s.document_id,
        s.name, 
        s.kind as type, 
        d.language, 
        d.title as category,
        snippet(symbols_fts, 5, '<mark>', '</mark>', '...', 15) as snippet,
        rank
      FROM symbols_fts
      JOIN symbols s ON s.id = symbols_fts.symbol_id
      JOIN documents d ON d.id = s.document_id
      WHERE symbols_fts MATCH ?
      ORDER BY rank
      LIMIT ?;
    `;

    try {
      const symRows = this.db.prepare(symQuery).all(`${cleanQuery}*`, limit) as Record<string, unknown>[];
      for (const row of symRows) {
        const name = String(row['name']);
        const isExact = name.toLowerCase() === cleanQuery.toLowerCase() || name.toLowerCase().endsWith('.' + cleanQuery.toLowerCase());
        results.push({
          id: String(row['id']),
          documentId: String(row['document_id']),
          targetId: String(row['id']),
          name,
          type: `symbol:${String(row['type'])}`,
          language: String(row['language']),
          category: String(row['category'] || 'General'),
          snippet: String(row['snippet'] || ''),
          score: isExact ? -80 : (-20 + Number(row['rank'] || 0))
        });
      }
    } catch {
      // Fallback
    }

    // 5. Search Implementation Pipelines & Steps (Plans, Workflows, Sequential Guides)
    try {
      const pipeQuery = `
        SELECT DISTINCT
          p.id as pipeline_id,
          p.document_id,
          p.name as pipeline_name,
          p.objective,
          d.language,
          d.title as doc_title
        FROM pipelines p
        JOIN documents d ON d.id = p.document_id
        LEFT JOIN pipeline_steps ps ON ps.pipeline_id = p.id
        WHERE p.name LIKE ? OR p.objective LIKE ? OR ps.title LIKE ? OR ps.explanation LIKE ? OR ps.code_example LIKE ?
        LIMIT ?;
      `;
      const pipeRows = this.db.prepare(pipeQuery).all(
        `%${cleanQuery}%`,
        `%${cleanQuery}%`,
        `%${cleanQuery}%`,
        `%${cleanQuery}%`,
        `%${cleanQuery}%`,
        limit
      ) as Record<string, unknown>[];

      for (const row of pipeRows) {
        const name = String(row['pipeline_name']);
        const isExact = name.toLowerCase() === cleanQuery.toLowerCase();
        results.push({
          id: String(row['pipeline_id']),
          documentId: String(row['document_id']),
          targetId: String(row['pipeline_id']),
          name,
          type: 'pipeline',
          language: String(row['language']),
          category: `Plan · ${String(row['doc_title'])}`,
          snippet: `Implementation Plan: ${String(row['objective'] || row['pipeline_name'])}`,
          score: isExact ? -60 : 10.0
        });
      }
    } catch {
      // Fallback
    }

    // 6. Search Code Examples
    try {
      const exQuery = `
        SELECT 
          e.id,
          e.document_id,
          e.title,
          e.description,
          d.language,
          d.title as doc_title
        FROM examples e
        JOIN documents d ON d.id = e.document_id
        WHERE e.title LIKE ? OR e.description LIKE ? OR e.code LIKE ?
        LIMIT ?;
      `;
      const exRows = this.db.prepare(exQuery).all(`%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`, limit) as Record<string, unknown>[];
      for (const row of exRows) {
        const name = String(row['title']);
        const isExact = name.toLowerCase() === cleanQuery.toLowerCase();
        results.push({
          id: String(row['id']),
          documentId: String(row['document_id']),
          targetId: String(row['id']),
          name,
          type: 'example',
          language: String(row['language']),
          category: `Example · ${String(row['doc_title'])}`,
          snippet: String(row['description'] || row['title']),
          score: isExact ? -40 : 20.0
        });
      }
    } catch {
      // Fallback
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    let deduplicated = results.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    // Apply smart filters
    if (targetEcosystem) {
      const eco = targetEcosystem;
      deduplicated = deduplicated.filter(r => 
        r.language.toLowerCase().includes(eco) || 
        r.category.toLowerCase().includes(eco) ||
        r.id.toLowerCase().includes(eco)
      );
    }

    if (targetType) {
      const t = targetType;
      if (t === 'pipeline' || t === 'plan') {
        deduplicated = deduplicated.filter(r => r.type === 'pipeline');
      } else if (t === 'syntax' || t === 'api' || t === 'symbol') {
        deduplicated = deduplicated.filter(r => r.type.startsWith('symbol'));
      } else if (t === 'example' || t === 'code') {
        deduplicated = deduplicated.filter(r => r.type === 'example');
      } else if (t === 'doc' || t === 'module' || t === 'library') {
        deduplicated = deduplicated.filter(r => !r.type.startsWith('symbol') && r.type !== 'pipeline' && r.type !== 'example');
      }
    }

    return deduplicated.sort((a, b) => a.score - b.score);
  }

  public async getDocument(id: string): Promise<DocumentationRecord | null> {
    const docRow = this.db.prepare(`
      SELECT d.*, l.name as pkg_name, l.package_manager, l.installation_cmd, l.repository_url, l.license as pkg_license
      FROM documents d
      LEFT JOIN libraries l ON l.id = d.library_id
      WHERE d.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!docRow) return null;

    // Load symbols
    const symRows = this.db.prepare(`
      SELECT * FROM symbols WHERE document_id = ? ORDER BY sort_order
    `).all(id) as Record<string, unknown>[];

    const symbols: SymbolRecord[] = [];
    for (const s of symRows) {
      const paramRows = this.db.prepare(`
        SELECT * FROM parameters WHERE symbol_id = ? ORDER BY sort_order
      `).all(String(s['id'])) as Record<string, unknown>[];

      const parameters: ParameterRecord[] = paramRows.map(p => ({
        id: String(p['id']),
        symbol_id: String(p['symbol_id']),
        name: String(p['name']),
        data_type: String(p['data_type']),
        default_value: p['default_value'] ? String(p['default_value']) : null,
        is_required: Boolean(p['is_required']),
        is_optional: Boolean(p['is_optional']),
        is_named: Boolean(p['is_named']),
        description: String(p['description']),
        sort_order: Number(p['sort_order'])
      }));

      symbols.push({
        id: String(s['id']),
        document_id: String(s['document_id']),
        name: String(s['name']),
        kind: s['kind'] as any,
        syntax: String(s['syntax']),
        return_type: s['return_type'] ? String(s['return_type']) : null,
        description: String(s['description']),
        is_static: Boolean(s['is_static']),
        is_async: Boolean(s['is_async']),
        is_deprecated: Boolean(s['is_deprecated']),
        deprecation_reason: s['deprecation_reason'] ? String(s['deprecation_reason']) : null,
        parameters,
        sort_order: Number(s['sort_order'])
      });
    }

    // Load pipelines
    const pipeRows = this.db.prepare(`
      SELECT * FROM pipelines WHERE document_id = ? ORDER BY sort_order
    `).all(id) as Record<string, unknown>[];

    const pipelines: ImplementationPipeline[] = [];
    for (const p of pipeRows) {
      const stepRows = this.db.prepare(`
        SELECT * FROM pipeline_steps WHERE pipeline_id = ? ORDER BY step_number
      `).all(String(p['id'])) as Record<string, unknown>[];

      pipelines.push({
        id: String(p['id']),
        document_id: String(p['document_id']),
        name: String(p['name']),
        description: p['description'] ? String(p['description']) : null,
        objective: String(p['objective']),
        steps: stepRows.map(step => ({
          id: String(step['id']),
          pipeline_id: String(step['pipeline_id']),
          step_number: Number(step['step_number']),
          title: String(step['title']),
          explanation: String(step['explanation']),
          input_data: step['input_data'] ? String(step['input_data']) : null,
          output_data: step['output_data'] ? String(step['output_data']) : null,
          syntax: step['syntax'] ? String(step['syntax']) : null,
          code_example: step['code_example'] ? String(step['code_example']) : null,
          error_handling: step['error_handling'] ? String(step['error_handling']) : null,
          sort_order: Number(step['sort_order'])
        })),
        sort_order: Number(p['sort_order'])
      });
    }

    // Load examples
    const exRows = this.db.prepare(`
      SELECT * FROM examples WHERE document_id = ? ORDER BY sort_order
    `).all(id) as Record<string, unknown>[];

    const examples: CodeExample[] = exRows.map(ex => ({
      id: String(ex['id']),
      document_id: String(ex['document_id']),
      symbol_id: ex['symbol_id'] ? String(ex['symbol_id']) : null,
      title: String(ex['title']),
      description: ex['description'] ? String(ex['description']) : null,
      code: String(ex['code']),
      language: String(ex['language']),
      expected_output: ex['expected_output'] ? String(ex['expected_output']) : null,
      source_attribution: ex['source_attribution'] ? String(ex['source_attribution']) : null,
      sort_order: Number(ex['sort_order'])
    }));

    // Load relationships
    const relRows = this.db.prepare(`
      SELECT * FROM relationships WHERE source_doc_id = ?
    `).all(id) as Record<string, unknown>[];

    const relationships: RelationshipRecord[] = relRows.map(r => ({
      id: String(r['id']),
      source_doc_id: String(r['source_doc_id']),
      target_doc_id: String(r['target_doc_id']),
      relationship_type: r['relationship_type'] as any,
      description: r['description'] ? String(r['description']) : null
    }));

    return {
      id: String(docRow['id']),
      library_id: docRow['library_id'] ? String(docRow['library_id']) : null,
      category_id: docRow['category_id'] ? String(docRow['category_id']) : null,
      source_id: docRow['source_id'] ? String(docRow['source_id']) : null,
      title: String(docRow['title']),
      slug: String(docRow['slug']),
      type: docRow['type'] as any,
      language: String(docRow['language']),
      runtime: docRow['runtime'] ? String(docRow['runtime']) : null,
      categories: ['Backend', 'Authentication', 'Password Security', 'Hashing'],
      package: docRow['pkg_name'] ? {
        name: String(docRow['pkg_name']),
        manager: String(docRow['package_manager']),
        installation: String(docRow['installation_cmd']),
        repository_url: docRow['repository_url'] ? String(docRow['repository_url']) : undefined,
        license: String(docRow['pkg_license'])
      } : undefined,
      documentation: {
        overview: String(docRow['overview']),
        purpose: docRow['purpose'] ? String(docRow['purpose']) : undefined,
        installation: docRow['installation'] ? String(docRow['installation']) : undefined,
        configuration: docRow['configuration'] ? String(docRow['configuration']) : undefined,
        security_considerations: docRow['security_considerations'] ? String(docRow['security_considerations']) : undefined,
        error_handling: docRow['error_handling'] ? String(docRow['error_handling']) : undefined,
      },
      symbols,
      examples,
      pipelines,
      relationships,
      metadata: {
        source_url: String(docRow['source_url']),
        license: String(docRow['license']),
        documentation_version: String(docRow['documentation_version']),
        completeness_status: docRow['completeness_status'] as any,
      }
    };
  }

  public async getSymbol(name: string, _context?: { language?: string; version?: string }): Promise<SymbolRecord | null> {
    const symRow = this.db.prepare(`
      SELECT * FROM symbols WHERE name = ? OR name LIKE ? LIMIT 1
    `).get(name, `%${name}%`) as Record<string, unknown> | undefined;

    if (!symRow) return null;

    const paramRows = this.db.prepare(`
      SELECT * FROM parameters WHERE symbol_id = ? ORDER BY sort_order
    `).all(String(symRow['id'])) as Record<string, unknown>[];

    const parameters: ParameterRecord[] = paramRows.map(p => ({
      id: String(p['id']),
      symbol_id: String(p['symbol_id']),
      name: String(p['name']),
      data_type: String(p['data_type']),
      default_value: p['default_value'] ? String(p['default_value']) : null,
      is_required: Boolean(p['is_required']),
      is_optional: Boolean(p['is_optional']),
      is_named: Boolean(p['is_named']),
      description: String(p['description']),
      sort_order: Number(p['sort_order'])
    }));

    return {
      id: String(symRow['id']),
      document_id: String(symRow['document_id']),
      name: String(symRow['name']),
      kind: symRow['kind'] as any,
      syntax: String(symRow['syntax']),
      return_type: symRow['return_type'] ? String(symRow['return_type']) : null,
      description: String(symRow['description']),
      is_static: Boolean(symRow['is_static']),
      is_async: Boolean(symRow['is_async']),
      is_deprecated: Boolean(symRow['is_deprecated']),
      deprecation_reason: symRow['deprecation_reason'] ? String(symRow['deprecation_reason']) : null,
      parameters,
      sort_order: Number(symRow['sort_order'])
    };
  }

  public async getPipeline(id: string): Promise<ImplementationPipeline | null> {
    const pipeRow = this.db.prepare(`
      SELECT * FROM pipelines WHERE id = ? LIMIT 1
    `).get(id) as Record<string, unknown> | undefined;

    if (!pipeRow) return null;

    const stepRows = this.db.prepare(`
      SELECT * FROM pipeline_steps WHERE pipeline_id = ? ORDER BY step_number
    `).all(id) as Record<string, unknown>[];

    return {
      id: String(pipeRow['id']),
      document_id: String(pipeRow['document_id']),
      name: String(pipeRow['name']),
      description: pipeRow['description'] ? String(pipeRow['description']) : null,
      objective: String(pipeRow['objective']),
      steps: stepRows.map(step => ({
        id: String(step['id']),
        pipeline_id: String(step['pipeline_id']),
        step_number: Number(step['step_number']),
        title: String(step['title']),
        explanation: String(step['explanation']),
        input_data: step['input_data'] ? String(step['input_data']) : null,
        output_data: step['output_data'] ? String(step['output_data']) : null,
        syntax: step['syntax'] ? String(step['syntax']) : null,
        code_example: step['code_example'] ? String(step['code_example']) : null,
        error_handling: step['error_handling'] ? String(step['error_handling']) : null,
        sort_order: Number(step['sort_order'])
      })),
      sort_order: Number(pipeRow['sort_order'])
    };
  }

  public async getRelated(id: string): Promise<DocumentationRecord[]> {
    const relRows = this.db.prepare(`
      SELECT target_doc_id FROM relationships WHERE source_doc_id = ?
    `).all(id) as { target_doc_id: string }[];

    const docs: DocumentationRecord[] = [];
    for (const r of relRows) {
      const doc = await this.getDocument(r.target_doc_id);
      if (doc) docs.push(doc);
    }
    return docs;
  }

  public async getSource(sourceId: string): Promise<SourceMetadata | null> {
    const row = this.db.prepare(`
      SELECT * FROM sources WHERE id = ?
    `).get(sourceId) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      id: String(row['id']),
      name: String(row['name']),
      url: String(row['url']),
      source_type: row['source_type'] as any,
      license: String(row['license']),
      retrieval_date: String(row['retrieval_date']),
      content_hash: row['content_hash'] ? String(row['content_hash']) : null,
      metadata_json: row['metadata_json'] ? String(row['metadata_json']) : null
    };
  }
}
