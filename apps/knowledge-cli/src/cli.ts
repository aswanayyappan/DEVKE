#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DocumentationRecordSchema } from '@udke/knowledge-schema';
import { KnowledgeDatabase, KnowledgeRepository } from '@udke/search-engine';
import { NpmConnector, PubDevConnector } from '@udke/source-connectors';
import { MarkdownParser, DocumentNormalizer } from '@udke/document-parser';

const program = new Command();

program
  .name('udke')
  .description('Universal Dev Knowledge Engine (UDKE) — Ingestion & Pack Generator CLI')
  .version('2.0.0');

// Command: validate
program
  .command('validate')
  .description('Validate knowledge records against the canonical schema')
  .argument('<path>', 'Directory or file to validate')
  .action((targetPath: string) => {
    const fullPath = path.resolve(targetPath);
    console.log(`[UDKE] Validating knowledge records in: ${fullPath}`);

    const filesToValidate: string[] = [];
    if (fs.statSync(fullPath).isDirectory()) {
      const walk = (dir: string) => {
        for (const file of fs.readdirSync(dir)) {
          const p = path.join(dir, file);
          if (fs.statSync(p).isDirectory()) walk(p);
          else if (file.endsWith('.json') && !file.includes('pack.json') && !file.includes('packs.json') && file !== 'package.json') filesToValidate.push(p);
        }
      };
      walk(fullPath);
    } else {
      filesToValidate.push(fullPath);
    }

    let passed = 0;
    let failed = 0;

    for (const file of filesToValidate) {
      try {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const result = DocumentationRecordSchema.safeParse(content);
        if (result.success) {
          console.log(`  ✓ [PASS] ${path.basename(file)} (${result.data.id})`);
          passed++;
        } else {
          console.error(`  ✗ [FAIL] ${path.basename(file)}:`, result.error.format());
          failed++;
        }
      } catch (err) {
        console.error(`  ✗ [ERROR] Parsing ${file}:`, err);
        failed++;
      }
    }

    console.log(`\nValidation complete: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  });

// Command: ingest
program
  .command('ingest')
  .description('Ingest and normalize a package from an ecosystem registry')
  .argument('<ecosystem>', 'Target ecosystem: "npm" or "pub"')
  .argument('<package>', 'Package name to fetch and normalize')
  .option('-o, --output <dir>', 'Output directory for generated knowledge record', './knowledge/backend/nodejs')
  .action(async (ecosystem: string, packageName: string, options: { output: string }) => {
    console.log(`[UDKE] Ingesting package '${packageName}' from ${ecosystem.toUpperCase()}...`);

    const parser = new MarkdownParser();
    const normalizer = new DocumentNormalizer();

    if (ecosystem.toLowerCase() === 'npm') {
      const connector = new NpmConnector();
      const payload = await connector.fetch({
        id: `npm.${packageName}`,
        name: packageName,
        ecosystem: 'JavaScript/TypeScript',
        url: `https://www.npmjs.com/package/${packageName}`,
      });

      const sections = parser.parse(payload.content);
      const record = normalizer.normalize({
        id: `nodejs.library.${packageName}`,
        title: packageName,
        language: 'JavaScript',
        runtime: 'Node.js',
        categories: ['Backend', 'Libraries and Packages'],
        sections,
        packageMeta: {
          name: packageName,
          manager: 'npm',
          installation: `npm install ${packageName}`,
          repository_url: payload.rawMetadata?.['repository_url'] as string | undefined,
          license: payload.license,
        },
        sourceUrl: payload.item.url,
        license: payload.license,
        version: payload.item.version,
      });

      const outDir = path.resolve(options.output);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const outPath = path.join(outDir, `${packageName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(record, null, 2), 'utf8');
      console.log(`  ✓ Successfully normalized and saved to: ${outPath}`);
    } else if (ecosystem.toLowerCase() === 'pub') {
      const connector = new PubDevConnector();
      const payload = await connector.fetch({
        id: `pub.${packageName}`,
        name: packageName,
        ecosystem: 'Dart/Flutter',
        url: `https://pub.dev/packages/${packageName}`,
      });

      const sections = parser.parse(payload.content);
      const record = normalizer.normalize({
        id: `flutter.library.${packageName}`,
        title: packageName,
        language: 'Dart',
        runtime: 'Flutter',
        categories: ['Mobile Development', 'Flutter', 'Packages'],
        sections,
        packageMeta: {
          name: packageName,
          manager: 'pub.dev',
          installation: `flutter pub add ${packageName}`,
          repository_url: payload.rawMetadata?.['repository_url'] as string | undefined,
          license: payload.license,
        },
        sourceUrl: payload.item.url,
        license: payload.license,
        version: payload.item.version,
      });

      const outDir = path.resolve(options.output);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      const outPath = path.join(outDir, `${packageName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(record, null, 2), 'utf8');
      console.log(`  ✓ Successfully normalized and saved to: ${outPath}`);
    } else {
      console.error(`Unsupported ecosystem: ${ecosystem}. Use "npm" or "pub".`);
      process.exit(1);
    }
  });

// Command: build-index
program
  .command('build-index')
  .description('Compile and index knowledge packs into SQLite FTS5 database')
  .option('-o, --output <path>', 'Output SQLite database path', './storage/database/udke.db')
  .action((options: { output: string }) => {
    const dbPath = path.resolve(options.output);
    console.log(`[UDKE] Building SQLite FTS5 database at: ${dbPath}`);

    const db = new KnowledgeDatabase({ dbPath });
    const repo = new KnowledgeRepository(db.getRawDatabase());

    const knowledgeDir = path.resolve('knowledge');
    let indexed = 0;

    const walkAndIndex = (dir: string) => {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walkAndIndex(full);
        } else if (item.endsWith('.json') && !item.includes('pack.json') && !item.includes('packs.json') && item !== 'package.json') {
          try {
            const docJson = JSON.parse(fs.readFileSync(full, 'utf8'));
            repo.ingestDocument(docJson);
            indexed++;
            console.log(`  ✓ Indexed: ${path.basename(full)} (${docJson.id})`);
          } catch (err) {
            console.warn(`  ⚠ Failed to index ${item}:`, err);
          }
        }
      }
    };

    walkAndIndex(knowledgeDir);
    db.close();
    console.log(`\nBuild complete: ${indexed} records indexed into ${dbPath}`);
  });

program.parse(process.argv);
