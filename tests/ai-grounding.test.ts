import * as fs from 'node:fs';
import * as path from 'node:path';
import { KnowledgeDatabase, KnowledgeRepository, AIContextGroundingEngine } from '../packages/search-engine/dist/index.js';
import { DocumentationRecordSchema } from '../packages/knowledge-schema/dist/index.js';

console.log('======================================================================');
console.log('UDKE AI CONTEXT GROUNDING & VERIFICATION TEST');
console.log('Testing RAG System Prompts, Parameter Constraints & Code Verification');
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

async function runAIGroundingTest() {
  const db = new KnowledgeDatabase({ inMemory: true });
  const repo = new KnowledgeRepository(db.getRawDatabase());

  // 1. Ingest Knowledge Base
  const seedFiles = [
    'knowledge/backend/nodejs/argon2.json',
    'knowledge/mobile/flutter/scaffold.json',
    'knowledge/databases/sqlite/sqlite.json',
    'knowledge/authentication/jwt/jwt.json'
  ];

  for (const f of seedFiles) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
    repo.ingestDocument(raw);
  }

  const aiEngine = new AIContextGroundingEngine(repo);

  // 2. Test Grounding Prompt Generation for Argon2
  console.log('--- Testing Argon2 AI Grounding Context ---');
  const argon2Prompt = await aiEngine.buildGroundingPrompt('Argon2');
  assert(argon2Prompt.includes('UDKE VERIFIED GROUND-TRUTH API CONTEXT'), 'Grounding prompt contains header banner');
  assert(argon2Prompt.includes('argon2.hash') && argon2Prompt.includes('argon2.verify'), 'Prompt contains exact formal signatures');
  assert(argon2Prompt.includes('Password Registration Pipeline'), 'Prompt contains implementation pipeline');
  assert(argon2Prompt.includes('Password Verification Pipeline'), 'Prompt contains verification pipeline');
  assert(argon2Prompt.includes('Argon2id'), 'Prompt includes security guidance');

  // 3. Test Grounding Prompt Generation for Flutter Scaffold
  console.log('\n--- Testing Flutter Scaffold AI Grounding Context ---');
  const flutterPrompt = await aiEngine.buildGroundingPrompt('Scaffold');
  assert(flutterPrompt.includes('Scaffold implements the basic Material Design visual layout structure'), 'Prompt contains overview');
  assert(flutterPrompt.includes('Material Screen Construction Pipeline'), 'Prompt contains pipeline');
  assert(flutterPrompt.includes('PreferredSizeWidget? appBar'), 'Prompt contains constructor parameter signatures');

  // 4. Test Code Verification Engine
  console.log('\n--- Testing Code Syntax Verification ---');
  
  // Safe Argon2 code
  const secureArgonCode = `
    const hash = await argon2.hash(password, { type: argon2.argon2id });
  `;
  const secureResult = await aiEngine.verifyCodeSyntax(secureArgonCode, 'typescript');
  assert(secureResult.valid, 'Secure Argon2 code validated with 0 warnings');
  assert(secureResult.matchedSymbols.includes('argon2.hash'), 'Identified argon2.hash symbol');

  // Insecure JWT code (missing expiration)
  const insecureJwtCode = `
    const token = jwt.sign({ sub: userId }, SECRET);
  `;
  const jwtResult = await aiEngine.verifyCodeSyntax(insecureJwtCode, 'typescript');
  assert(!jwtResult.valid && jwtResult.warnings.some(w => w.includes('expiresIn')), 'Detected missing expiresIn constraint in JWT creation');

  // Invalid Scaffold code (missing body)
  const invalidScaffoldCode = `
    return Scaffold(
      appBar: AppBar(title: Text('Title')),
    );
  `;
  const scaffoldResult = await aiEngine.verifyCodeSyntax(invalidScaffoldCode, 'dart');
  assert(!scaffoldResult.valid && scaffoldResult.warnings.some(w => w.includes('body')), 'Detected Scaffold missing required body widget');

  db.close();

  console.log('\n----------------------------------------------------------------------');
  console.log(`RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('----------------------------------------------------------------------');
}

runAIGroundingTest().catch(err => {
  console.error('Fatal AI grounding test error:', err);
  process.exit(1);
});
