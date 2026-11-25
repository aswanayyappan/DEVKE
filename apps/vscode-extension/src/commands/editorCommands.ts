import * as vscode from 'vscode';
import { IKnowledgeEngine, AIContextGroundingEngine } from '@udke/search-engine';

export class EditorCommands {
  private aiEngine: AIContextGroundingEngine;

  constructor(private readonly knowledgeEngine: IKnowledgeEngine) {
    this.aiEngine = new AIContextGroundingEngine(this.knowledgeEngine as any);
  }

  /**
   * Look up documentation for the text currently selected in the editor.
   */
  public async lookupSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let query = editor.document.getText(editor.selection).trim();
    if (!query) {
      const range = editor.document.getWordRangeAtPosition(editor.selection.active);
      if (range) {
        query = editor.document.getText(range).trim();
      }
    }

    if (!query) {
      vscode.window.showInformationMessage('Please select or position the cursor on a symbol or package name.');
      return;
    }

    const results = await this.knowledgeEngine.search(query, { limit: 1 });
    if (results.length > 0 && results[0]) {
      await vscode.commands.executeCommand('udke.openDocument', results[0].id);
    } else {
      vscode.window.showWarningMessage(`No verified reference found for '${query}'.`);
    }
  }

  /**
   * Generates grounded AI context prompt for the selected symbol and copies it to clipboard.
   */
  public async copyAIContext(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    let query = editor?.document.getText(editor.selection).trim() || '';

    if (!query && editor) {
      const range = editor.document.getWordRangeAtPosition(editor.selection.active);
      if (range) query = editor.document.getText(range).trim();
    }

    if (!query) {
      query = await vscode.window.showInputBox({
        prompt: 'Enter technology, symbol, or workflow to generate grounded AI context for',
        placeHolder: 'e.g. Argon2, Scaffold, JWT, Future.delayed',
      }) || '';
    }

    if (!query) return;

    const prompt = await this.aiEngine.buildGroundingPrompt(query);
    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage(`✓ Copied verified ground-truth AI context for '${query}' to clipboard.`);
  }
}
