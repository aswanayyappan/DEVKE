import * as fs from 'node:fs';
import * as path from 'node:path';
import { KnowledgeDatabase, KnowledgeRepository } from '../packages/search-engine/dist/index.js';
import { DocumentationRecordSchema } from '../packages/knowledge-schema/dist/index.js';

console.log('======================================================================');
console.log('UDKE VERTICAL SLICE VERIFICATION');
console.log('Pipeline: argon2.json -> Zod Validation -> SQLite -> FTS5 -> Retrieval');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
    if (detail) console.log(`           ${detail}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`           ${detail}`);
    process.exitCode = 1;
  }
}

async function runVerticalSliceTest() {
  // Step 1: Load and Validate Seed Record
  const argon2Path = path.resolve('knowledge/nodejs/argon2.json');
  assert(fs.existsSync(argon2Path), 'Seed record exists on disk', argon2Path);

  const rawJson = JSON.parse(fs.readFileSync(argon2Path, 'utf8'));
  const schemaResult = DocumentationRecordSchema.safeParse(rawJson);
  assert(schemaResult.success, 'argon2.json passes Zod schema validation');

  // Step 2: Initialize Database and Ingest Record
  const db = new KnowledgeDatabase({ inMemory: true });
  const engine = new KnowledgeRepository(db.getRawDatabase());

  const ingested = engine.ingestDocument(rawJson);
  assert(ingested.id === 'nodejs.security.argon2', 'Record ingested into KnowledgeRepository with ID nodejs.security.argon2');

  // Step 3: Verify FTS5 Search for Document
  const docResults = await engine.search('Argon2');
  assert(docResults.length > 0, 'FTS5 search("Argon2") returns matched documents', `Found: ${docResults.length} matches`);
  assert(docResults.some(r => r.name === 'Argon2'), 'Found exact document "Argon2" in search results');

  // Step 4: Verify FTS5 Search for Symbols
  const symbolResults = await engine.search('verify');
  assert(symbolResults.length > 0, 'FTS5 search("verify") returns symbols', `Found: ${symbolResults.length} matches`);
  const verifySym = symbolResults.find(r => r.name === 'argon2.verify');
  assert(Boolean(verifySym), 'Search matched "argon2.verify" symbol', verifySym?.snippet);

  // Step 5: Verify Full Document Retrieval & Structural Integrity
  const doc = await engine.getDocument('nodejs.security.argon2');
  assert(Boolean(doc), 'getDocument("nodejs.security.argon2") returns hydrated record');

  if (doc) {
    assert(doc.title === 'Argon2', 'Document title matches', doc.title);
    assert(doc.package?.installation === 'npm install argon2', 'Installation command matches', doc.package?.installation);
    assert(doc.symbols.length === 2, '2 API symbols attached', doc.symbols.map(s => s.name).join(', '));
    assert(doc.pipelines.length === 2, '2 Implementation pipelines attached', doc.pipelines.map(p => p.name).join(', '));
    
    // Check Pipeline Steps
    const regPipeline = doc.pipelines.find(p => p.name === 'Password Registration Pipeline');
    assert(Boolean(regPipeline && regPipeline.steps.length === 4), 'Password Registration Pipeline has 4 ordered steps');

    const verPipeline = doc.pipelines.find(p => p.name === 'Password Verification Pipeline');
    assert(Boolean(verPipeline && verPipeline.steps.length === 4), 'Password Verification Pipeline has 4 ordered steps');

    // Check Code Examples
    assert(doc.examples.length === 2, '2 practical code examples attached', doc.examples.map(e => e.title).join(', '));

    // Check Relationships
    assert(doc.relationships.length === 2, '2 concept relationships attached', doc.relationships.map(r => `${r.target_doc_id} (${r.relationship_type})`).join(', '));

    // Check License & Provenance
    assert(doc.metadata.license === 'MIT', 'License is recorded as MIT', doc.metadata.license);
    assert(doc.metadata.source_url.includes('github.com'), 'Source URL recorded', doc.metadata.source_url);
    assert(doc.metadata.completeness_status === 'complete', 'Status is complete', doc.metadata.completeness_status);
  }

  // Step 6: Negative Testing (Zod Validation Protection)
  let rejected = false;
  try {
    engine.ingestDocument({ id: 'bad-record' });
  } catch {
    rejected = true;
  }
  assert(rejected, 'Corrupt record rejected by engine during ingestion');

  db.close();

  console.log('\n----------------------------------------------------------------------');
  console.log(`RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('----------------------------------------------------------------------');
}

runVerticalSliceTest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
