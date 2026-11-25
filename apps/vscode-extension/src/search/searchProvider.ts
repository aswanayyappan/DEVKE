import * as vscode from 'vscode';
import type { IKnowledgeEngine, SearchResult } from '@udke/search-engine';

interface DocQuickPickItem extends vscode.QuickPickItem {
  docId: string;
  targetId?: string;
}

export class SearchProvider {
  constructor(private readonly knowledgeEngine: IKnowledgeEngine) {}

  public async openSearch(initialFilter?: string): Promise<void> {
    const quickPick = vscode.window.createQuickPick<DocQuickPickItem>();
    quickPick.placeholder = 'Search modules, syntax, plans (use @node, @flutter, @auth, #pipeline, #syntax)...';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    quickPick.buttons = [
      { iconPath: new vscode.ThemeIcon('symbol-method'), tooltip: 'Filter: Syntax & APIs (#syntax)' },
      { iconPath: new vscode.ThemeIcon('checklist'), tooltip: 'Filter: Implementation Plans (#pipeline)' },
      { iconPath: new vscode.ThemeIcon('code'), tooltip: 'Filter: Code Examples (#example)' },
      { iconPath: new vscode.ThemeIcon('clear-all'), tooltip: 'Clear Filters' }
    ];

    quickPick.onDidTriggerButton((button) => {
      let current = quickPick.value.replace(/#(syntax|pipeline|example|plan|api|code)/gi, '').trim();
      if (button.tooltip?.includes('Syntax')) {
        quickPick.value = current ? `${current} #syntax` : '#syntax ';
      } else if (button.tooltip?.includes('Implementation')) {
        quickPick.value = current ? `${current} #pipeline` : '#pipeline ';
      } else if (button.tooltip?.includes('Examples')) {
        quickPick.value = current ? `${current} #example` : '#example ';
      } else {
        quickPick.value = '';
      }
    });

    const executeSearch = async (val: string) => {
      const trimmed = val.trim();
      if (!trimmed) {
        quickPick.items = [];
        return;
      }

      quickPick.busy = true;
      try {
        const results = await this.knowledgeEngine.search(trimmed, { limit: 30 });
        if (results.length === 0) {
          quickPick.items = [
            {
              label: '$(info) No direct matches found',
              description: 'Try searching with @node, @flutter, @auth, or #pipeline',
              detail: 'Check installed offline packs or browse the UDKE Explorer in the sidebar.',
              docId: ''
            }
          ];
          return;
        }

        quickPick.items = results.map((r: SearchResult) => {
          let icon = '$(book)';
          let badge = 'Module';
          if (r.type.startsWith('symbol')) {
            icon = '$(symbol-method)';
            badge = 'Syntax & API';
          } else if (r.type === 'pipeline') {
            icon = '$(checklist)';
            badge = 'Implementation Plan';
          } else if (r.type === 'example') {
            icon = '$(code)';
            badge = 'Code Example';
          }

          const docId = r.documentId || r.id;

          return {
            label: `${icon} ${r.name}`,
            description: `[${badge}] ${r.language} · ${r.category}`,
            detail: r.snippet.replace(/<[^>]*>?/gm, ''),
            docId,
            targetId: r.targetId
          };
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        quickPick.busy = false;
      }
    };

    quickPick.onDidChangeValue(async (value) => {
      await executeSearch(value);
    });

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0];
      if (selected && selected.docId) {
        quickPick.hide();
        await vscode.commands.executeCommand('udke.openDocument', selected.docId, selected.targetId);
      }
    });

    if (initialFilter) {
      quickPick.value = initialFilter;
      executeSearch(initialFilter);
    }

    quickPick.show();
  }
}
