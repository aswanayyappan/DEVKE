import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { KnowledgeDatabase, KnowledgeRepository, PackManager } from '@udke/search-engine';
import { CategoryTreeProvider } from './sidebar/categoryTree.js';
import { SearchProvider } from './search/searchProvider.js';
import { DocumentationViewerPanel } from './viewer/documentationViewer.js';
import { PackCommands } from './commands/packCommands.js';
import { SymbolHoverProvider } from './editor/hoverProvider.js';
import { EditorCommands } from './commands/editorCommands.js';

let dbInstance: KnowledgeDatabase | undefined;

export function activate(context: vscode.ExtensionContext): void {
  // 1. Initialize SQLite Database
  const dbDir = context.globalStorageUri?.fsPath || path.resolve(context.extensionPath, 'storage/database');
  const dbPath = path.join(dbDir, 'udke.db');

  dbInstance = new KnowledgeDatabase({ dbPath });
  const knowledgeEngine = new KnowledgeRepository(dbInstance.getRawDatabase());

  // 2. Ingest All Installed Starter Knowledge Packs
  let foundKnowledgeDir: string | null = null;
  try {
    const knowledgeDirs = [
      path.resolve(context.extensionPath, 'knowledge'),
      path.resolve(context.extensionPath, '../../knowledge'),
      path.resolve('knowledge'),
    ];

    for (const d of knowledgeDirs) {
      if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
        foundKnowledgeDir = d;
        break;
      }
    }

    if (foundKnowledgeDir) {
      const walk = (dir: string) => {
        for (const item of fs.readdirSync(dir)) {
          const full = path.join(dir, item);
          if (fs.statSync(full).isDirectory()) {
            walk(full);
          } else if (item.endsWith('.json') && !item.includes('pack.json') && !item.includes('packs.json') && item !== 'package.json') {
            try {
              const rawJson = JSON.parse(fs.readFileSync(full, 'utf8'));
              knowledgeEngine.ingestDocument(rawJson);
            } catch {
              // Ignore single item parsing issues
            }
          }
        }
      };
      walk(foundKnowledgeDir);
    }
  } catch (err) {
    console.error('[UDKE] Failed to ingest initial knowledge packs:', err);
  }

  // 3. Register Sidebar TreeView
  const treeProvider = new CategoryTreeProvider(knowledgeEngine, context.extensionPath);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('udke.explorer', treeProvider)
  );

  // 4. Register Global Search Command
  const searchProvider = new SearchProvider(knowledgeEngine);
  context.subscriptions.push(
    vscode.commands.registerCommand('udke.search', async () => {
      await searchProvider.openSearch();
    })
  );

  // 5. Register Open Document Viewer Command
  context.subscriptions.push(
    vscode.commands.registerCommand('udke.openDocument', async (docId: string, targetId?: string) => {
      if (!docId) return;
      const doc = await knowledgeEngine.getDocument(docId);
      if (doc) {
        DocumentationViewerPanel.show(doc, targetId);
      } else {
        vscode.window.showErrorMessage(`Documentation for '${docId}' was not found in the local database.`);
      }
    })
  );

  // 6. Manage Packs Command
  const packManager = new PackManager(dbInstance.getRawDatabase(), foundKnowledgeDir || path.resolve(context.extensionPath, 'knowledge'));
  const packCommands = new PackCommands(packManager);
  context.subscriptions.push(
    vscode.commands.registerCommand('udke.managePacks', async () => {
      await packCommands.showPackManager();
    })
  );

  // 7. In-Editor Hover Provider (TypeScript, JavaScript, Dart, SQL)
  const hoverProvider = new SymbolHoverProvider(knowledgeEngine);
  const supportedLanguages = ['typescript', 'javascript', 'dart', 'sql', 'python'];
  for (const lang of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: lang }, hoverProvider)
    );
  }

  // 8. Editor Context Commands
  const editorCommands = new EditorCommands(knowledgeEngine);
  context.subscriptions.push(
    vscode.commands.registerCommand('udke.lookupSelection', async () => {
      await editorCommands.lookupSelection();
    }),
    vscode.commands.registerCommand('udke.copyAIContext', async () => {
      await editorCommands.copyAIContext();
    })
  );

  // 9. Refresh Explorer Command
  context.subscriptions.push(
    vscode.commands.registerCommand('udke.refreshExplorer', () => {
      treeProvider.refresh();
    })
  );

  vscode.window.showInformationMessage('Universal Dev Knowledge Engine activated successfully.');
}

export function deactivate(): void {
  if (dbInstance) {
    dbInstance.close();
  }
}
