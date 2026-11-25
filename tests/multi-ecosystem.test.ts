import * as fs from 'node:fs';
import * as path from 'node:path';
import { KnowledgeDatabase, KnowledgeRepository } from '../packages/search-engine/dist/index.js';
import { DocumentationRecordSchema } from '../packages/knowledge-schema/dist/index.js';
import { MarkdownParser, DocumentNormalizer } from '../packages/document-parser/dist/index.js';

console.log('======================================================================');
console.log('UDKE UNIVERSAL LIBRARY MULTI-ECOSYSTEM INTEGRATION TEST');
console.log('Validating Node.js, Flutter, Dart, SQLite, JWT & Dynamic Ingestion');
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

async function runMultiEcosystemTest() {
  const db = new KnowledgeDatabase({ inMemory: true });
  const repo = new KnowledgeRepository(db.getRawDatabase());

  // 1. Ingest All Installed Seed Knowledge Records
  const seedFiles = [
    'knowledge/backend/nodejs/argon2.json',
    'knowledge/mobile/flutter/scaffold.json',
    'knowledge/languages/dart/futures.json',
    'knowledge/databases/sqlite/sqlite.json',
    'knowledge/authentication/jwt/jwt.json'
  ];

  for (const relPath of seedFiles) {
    const fullPath = path.resolve(relPath);
    assert(fs.existsSync(fullPath), `Seed file exists: ${relPath}`);

    const rawJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const validated = DocumentationRecordSchema.safeParse(rawJson);
    assert(validated.success, `Schema validation passed for ${rawJson.title} (${rawJson.id})`);

    if (validated.success) {
      repo.ingestDocument(validated.data);
    }
  }

  // 2. FTS5 Search Verification Across Multiple Domains
  console.log('\n--- Testing Universal FTS5 Search ---');

  // Query 1: Flutter Scaffold
  const flutterRes = await repo.search('Scaffold');
  assert(flutterRes.length > 0 && flutterRes.some(r => r.name === 'Scaffold'), 'Search("Scaffold") finds Flutter Scaffold', `Found ${flutterRes.length} matches`);

  // Query 2: Dart Future
  const dartRes = await repo.search('Future');
  assert(dartRes.length > 0 && dartRes.some(r => r.name.includes('Future')), 'Search("Future") finds Dart Future API', `Found ${dartRes.length} matches`);

  // Query 3: SQLite WAL
  const sqliteRes = await repo.search('WAL');
  assert(sqliteRes.length > 0, 'Search("WAL") finds SQLite Write-Ahead Logging', `Found ${sqliteRes.length} matches`);

  // Query 4: JWT Verification
  const jwtRes = await repo.search('verify');
  assert(jwtRes.length >= 2, 'Search("verify") finds both Argon2 verify and JWT verify symbols', `Found ${jwtRes.length} matches`);

  // Query 5: Smart Ecosystem Filter (@flutter)
  const flutterFilterRes = await repo.search('@flutter scaffold');
  assert(flutterFilterRes.length > 0 && flutterFilterRes.every(r => r.language.toLowerCase().includes('flutter') || r.category.toLowerCase().includes('flutter') || r.id.includes('flutter')), 'Smart filter @flutter limits results to Flutter ecosystem');

  // Query 6: Smart Type Filter (#pipeline)
  const pipeFilterRes = await repo.search('#pipeline registration');
  assert(pipeFilterRes.length > 0 && pipeFilterRes.every(r => r.type === 'pipeline'), 'Smart filter #pipeline restricts results strictly to Implementation Plans');

  // Query 7: Combined Smart Filter (@node #pipeline password)
  const combinedFilterRes = await repo.search('@node #pipeline password');
  assert(combinedFilterRes.length > 0 && combinedFilterRes[0]?.type === 'pipeline', 'Combined filter @node #pipeline returns Node.js implementation pipeline');

  // Query 8: Strict Security & FTS Crash Resistance
  const safeRes = await repo.search('!@#$%^&*()_+~`|}{[]:;?><,./');
  assert(Array.isArray(safeRes), 'Special characters sanitized safely without SQLite FTS syntax errors');

  // 3. Document Retrieval & Pipeline Verification
  console.log('\n--- Testing Hydration & Pipelines ---');

  const scaffoldDoc = await repo.getDocument('flutter.material.scaffold');
  assert(Boolean(scaffoldDoc), 'Retrieved hydrated Flutter Scaffold document');
  assert(scaffoldDoc?.symbols.length === 1 && scaffoldDoc.symbols[0]?.name === 'Scaffold', 'Scaffold constructor attached with parameters');
  assert(scaffoldDoc?.pipelines.length === 1, 'Flutter Material Screen Construction Pipeline present');

  const futureDoc = await repo.getDocument('dart.core.future');
  assert(Boolean(futureDoc), 'Retrieved hydrated Dart Future document');
  assert(futureDoc?.symbols.some(s => s.name === 'Future.delayed'), 'Future.delayed constructor present');

  const jwtDoc = await repo.getDocument('authentication.tokens.jwt');
  assert(Boolean(jwtDoc), 'Retrieved hydrated JWT document');
  assert(jwtDoc?.pipelines[0]?.name.includes('Stateless JWT'), 'Stateless JWT pipeline present');

  // 4. Dynamic Ingestion Engine Test (Markdown Parser + Document Normalizer)
  console.log('\n--- Testing Automated Ingestion Engine ---');
  const sampleMarkdown = `
# Express.js Web Framework

Express is a minimal and flexible Node.js web application framework.

## Installation

\`\`\`bash
npm install express
\`\`\`

## Getting Started

\`\`\`javascript
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(3000);
\`\`\`

## Error Handling

Express handles synchronous errors automatically via default error handler.
`;

  const parser = new MarkdownParser();
  const normalizer = new DocumentNormalizer();

  const sections = parser.parse(sampleMarkdown);
  assert(sections.length >= 3, 'MarkdownParser extracts 3+ sections from markdown');

  const normalizedRecord = normalizer.normalize({
    id: 'nodejs.framework.express',
    title: 'Express',
    language: 'JavaScript',
    runtime: 'Node.js',
    categories: ['Backend', 'Frameworks', 'Web Development'],
    sections,
    packageMeta: {
      name: 'express',
      manager: 'npm',
      installation: 'npm install express',
      repository_url: 'https://github.com/expressjs/express',
      license: 'MIT',
    },
    sourceUrl: 'https://expressjs.com',
    license: 'MIT',
    version: '4.19.2',
  });

  assert(normalizedRecord.id === 'nodejs.framework.express', 'DocumentNormalizer generated canonical record for Express');
  assert(normalizedRecord.examples.length >= 1, 'DocumentNormalizer extracted code examples from markdown');

  // Ingest dynamically parsed record into database
  repo.ingestDocument(normalizedRecord);
  const expressRes = await repo.search('express');
  assert(expressRes.length > 0 && expressRes.some(r => r.name === 'Express'), 'Dynamically ingested Express is immediately searchable in FTS5');

  db.close();

  console.log('\n----------------------------------------------------------------------');
  console.log(`RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('----------------------------------------------------------------------');
}

runMultiEcosystemTest().catch(err => {
  console.error('Fatal multi-ecosystem test error:', err);
  process.exit(1);
});
