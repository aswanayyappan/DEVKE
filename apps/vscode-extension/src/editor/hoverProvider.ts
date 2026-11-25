import * as vscode from 'vscode';
import type { IKnowledgeEngine } from '@udke/search-engine';

export class SymbolHoverProvider implements vscode.HoverProvider {
  constructor(private readonly knowledgeEngine: IKnowledgeEngine) {}

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const range = document.getWordRangeAtPosition(position, /[\w.]+/);
    if (!range) return null;

    const word = document.getText(range);
    if (!word || word.length < 3) return null;

    // Check symbol match
    const symbol = await this.knowledgeEngine.getSymbol(word);
    if (symbol) {
      const contents = new vscode.MarkdownString();
      contents.isTrusted = true;
      contents.appendMarkdown(`### \`${symbol.name}\` *(UDKE Reference)*\n\n`);
      contents.appendMarkdown(`**Kind**: \`${symbol.kind}\`\n\n`);
      contents.appendCodeblock(symbol.syntax, document.languageId || 'typescript');
      contents.appendMarkdown(`\n${symbol.description}\n\n`);

      if (symbol.parameters.length > 0) {
        contents.appendMarkdown(`**Parameters**:\n`);
        for (const p of symbol.parameters) {
          contents.appendMarkdown(`- \`${p.name}\`: \`${p.data_type}\` — ${p.description}\n`);
        }
      }

      contents.appendMarkdown(`\n[📖 Open Full Documentation](command:udke.openDocument?${encodeURIComponent(JSON.stringify([symbol.document_id]))})`);
      return new vscode.Hover(contents, range);
    }

    // Check document title match (e.g. Scaffold, Argon2, SQLite, JWT)
    const results = await this.knowledgeEngine.search(word, { limit: 1 });
    if (results.length > 0 && results[0]?.name.toLowerCase() === word.toLowerCase()) {
      const doc = await this.knowledgeEngine.getDocument(results[0].id);
      if (doc) {
        const contents = new vscode.MarkdownString();
        contents.isTrusted = true;
        contents.appendMarkdown(`### ${doc.title} *(${doc.language} ${doc.type})*\n\n`);
        contents.appendMarkdown(`${doc.documentation.overview}\n\n`);
        if (doc.package?.installation) {
          contents.appendMarkdown(`**Install**: \`${doc.package.installation}\`\n\n`);
        }
        contents.appendMarkdown(`[📖 Open Complete Reference](command:udke.openDocument?${encodeURIComponent(JSON.stringify([doc.id]))})`);
        return new vscode.Hover(contents, range);
      }
    }

    return null;
  }
}
