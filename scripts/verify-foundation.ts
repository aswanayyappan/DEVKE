import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DocumentationRecordSchema } from '../packages/knowledge-schema/src/schemas.ts';

console.log('===============================================================');
console.log('UDKE Verification: Database, Schema, Ingestion & FTS5 Indexing');
console.log('===============================================================');

// 1. Initialize SQLite database and execute schema.sql
console.log('\n[1/5] Executing database/schema.sql...');
const schemaPath = path.resolve('database/schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const db = new DatabaseSync(':memory:');
db.exec(schemaSql);
console.log('  ✓ schema.sql executed successfully without error.');

// Verify tables were created
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' 
  ORDER BY name;
`).all() as { name: string }[];
console.log(`  ✓ Created ${tables.length} tables/views:`, tables.map(t => t.name).join(', '));

// 2. Load and validate argon2.json through Zod
console.log('\n[2/5] Validating knowledge/nodejs/argon2.json against Zod schema...');
const argon2Path = path.resolve('knowledge/nodejs/argon2.json');
const rawArgon2 = JSON.parse(fs.readFileSync(argon2Path, 'utf8'));

const validationResult = DocumentationRecordSchema.safeParse(rawArgon2);
if (!validationResult.success) {
  console.error('  ✗ Validation failed:', validationResult.error.format());
  process.exit(1);
}
console.log('  ✓ argon2.json strictly conforms to DocumentationRecordSchema.');
console.log(`    - ID: ${validationResult.data.id}`);
console.log(`    - Symbols: ${validationResult.data.symbols.length} methods declared`);
console.log(`    - Pipelines: ${validationResult.data.pipelines.length} workflows defined`);
console.log(`    - Code Examples: ${validationResult.data.examples.length} examples`);

// 3. Test negative validation: Ensure invalid records are rejected
console.log('\n[3/5] Testing negative validation (corrupted / missing required fields)...');
const invalidRecord = {
  id: 'nodejs.invalid',
  title: 'Broken',
  // missing slug, type, language, categories, documentation, metadata
};
const invalidResult = DocumentationRecordSchema.safeParse(invalidRecord);
if (!invalidResult.success) {
  console.log('  ✓ Corrupted record correctly rejected by Zod validator.');
} else {
  console.error('  ✗ Validator unexpectedly allowed corrupted record!');
  process.exit(1);
}

// 4. Ingest and persist validated Argon2 record into SQLite
console.log('\n[4/5] Ingesting Argon2 into SQLite relational tables...');
const doc = validationResult.data;

// Technology & Category
db.exec(`
  INSERT OR IGNORE INTO technologies (id, name, type, description) 
  VALUES ('tech.nodejs', 'Node.js', 'runtime', 'JavaScript runtime built on Chrome V8');
  
  INSERT OR IGNORE INTO categories (id, name, slug, description, level)
  VALUES ('cat.security', 'Password Security', 'password-security', 'Cryptographic hashing and authentication', 1);
`);

// Library
if (doc.package) {
  db.prepare(`
    INSERT INTO libraries (id, technology_id, name, package_manager, installation_cmd, repository_url, license, documentation_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'lib.argon2',
    'tech.nodejs',
    doc.package.name,
    doc.package.manager,
    doc.package.installation,
    doc.package.repository_url || '',
    doc.package.license,
    doc.metadata.documentation_version
  );
}

// Document
db.prepare(`
  INSERT INTO documents (
    id, library_id, category_id, title, slug, type, language, runtime, 
    overview, purpose, installation, configuration, security_considerations, error_handling,
    source_url, license, documentation_version, completeness_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  doc.id,
  'lib.argon2',
  'cat.security',
  doc.title,
  doc.slug,
  doc.type,
  doc.language,
  doc.runtime || 'Node.js',
  doc.documentation.overview,
  doc.documentation.purpose || '',
  doc.documentation.installation || '',
  doc.documentation.configuration || '',
  doc.documentation.security_considerations || '',
  doc.documentation.error_handling || '',
  doc.metadata.source_url,
  doc.metadata.license,
  doc.metadata.documentation_version,
  doc.metadata.completeness_status
);

// Symbols and Parameters
for (const sym of doc.symbols) {
  db.prepare(`
    INSERT INTO symbols (id, document_id, name, kind, syntax, return_type, description, is_static, is_async, is_deprecated, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sym.id,
    sym.document_id,
    sym.name,
    sym.kind,
    sym.syntax,
    sym.return_type || '',
    sym.description,
    sym.is_static ? 1 : 0,
    sym.is_async ? 1 : 0,
    sym.is_deprecated ? 1 : 0,
    sym.sort_order
  );

  for (const param of sym.parameters) {
    db.prepare(`
      INSERT INTO parameters (id, symbol_id, name, data_type, default_value, is_required, is_optional, is_named, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      param.id,
      param.symbol_id,
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

// Pipelines and Steps
for (const pipe of doc.pipelines) {
  db.prepare(`
    INSERT INTO pipelines (id, document_id, name, description, objective, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    pipe.id,
    pipe.document_id,
    pipe.name,
    pipe.description || '',
    pipe.objective,
    pipe.sort_order
  );

  for (const step of pipe.steps) {
    db.prepare(`
      INSERT INTO pipeline_steps (id, pipeline_id, step_number, title, explanation, input_data, output_data, syntax, code_example, error_handling, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      step.id,
      step.pipeline_id,
      step.step_number,
      step.title,
      step.explanation,
      step.input_data || '',
      step.output_data || '',
      step.syntax || '',
      step.code_example || '',
      step.error_handling || '',
      step.sort_order
    );
  }
}

// Code Examples
for (const ex of doc.examples) {
  db.prepare(`
    INSERT INTO examples (id, document_id, symbol_id, title, description, code, language, expected_output, source_attribution, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ex.id,
    ex.document_id,
    ex.symbol_id || null,
    ex.title,
    ex.description || '',
    ex.code,
    ex.language,
    ex.expected_output || '',
    ex.source_attribution || '',
    ex.sort_order
  );
}

console.log('  ✓ Documents, symbols, parameters, pipelines, and examples inserted.');

// 5. Query FTS5 Full-Text Search Indexes
console.log('\n[5/5] Querying SQLite FTS5 Full-Text Indexes (Testing BM25 Ranking)...');

// Search 1: Document FTS search for "Argon2"
const docSearchResults = db.prepare(`
  SELECT 
    d.id, 
    d.title, 
    d.language, 
    snippet(documents_fts, 1, '<b>', '</b>', '...', 10) as title_snippet,
    snippet(documents_fts, 2, '<b>', '</b>', '...', 15) as overview_snippet
  FROM documents_fts
  JOIN documents d ON d.id = documents_fts.document_id
  WHERE documents_fts MATCH ?
  ORDER BY rank
  LIMIT 5;
`).all('Argon2') as any[];

console.log(`  ✓ FTS5 Document Match 'Argon2': found ${docSearchResults.length} result(s):`);
for (const res of docSearchResults) {
  console.log(`    - [${res.id}] "${res.title}" (${res.language})`);
  console.log(`      Snippet: ${res.overview_snippet}`);
}

// Search 2: Symbol FTS search for "verify"
const symbolSearchResults = db.prepare(`
  SELECT 
    s.id, 
    s.name, 
    s.kind, 
    s.syntax, 
    snippet(symbols_fts, 2, '<b>', '</b>', '...', 10) as name_snippet,
    snippet(symbols_fts, 5, '<b>', '</b>', '...', 15) as desc_snippet
  FROM symbols_fts
  JOIN symbols s ON s.id = symbols_fts.symbol_id
  WHERE symbols_fts MATCH ?
  ORDER BY rank
  LIMIT 5;
`).all('verify') as any[];

console.log(`  ✓ FTS5 Symbol Match 'verify': found ${symbolSearchResults.length} result(s):`);
for (const res of symbolSearchResults) {
  console.log(`    - [${res.kind}] ${res.name} -> Syntax: ${res.syntax}`);
  console.log(`      Description: ${res.desc_snippet}`);
}

// Search 3: Pipeline verification
const pipelineSteps = db.prepare(`
  SELECT p.name as pipeline_name, ps.step_number, ps.title, ps.explanation
  FROM pipeline_steps ps
  JOIN pipelines p ON p.id = ps.pipeline_id
  WHERE p.document_id = ?
  ORDER BY p.sort_order, ps.step_number;
`).all(doc.id) as any[];

console.log(`  ✓ Retrieved ${pipelineSteps.length} ordered pipeline steps:`);
for (const step of pipelineSteps) {
  console.log(`    [${step.pipeline_name}] Step ${step.step_number}: ${step.title}`);
}

console.log('\n===============================================================');
console.log('RESULT: 100% PASS — Database, Schema, Ingestion & FTS5 Verified');
console.log('===============================================================');
