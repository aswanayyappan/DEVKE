import * as vscode from 'vscode';
import { PackManager, KnowledgePackMetadata } from '@udke/search-engine';

interface PackQuickPickItem extends vscode.QuickPickItem {
  pack: KnowledgePackMetadata;
}

export class PackCommands {
  constructor(private readonly packManager: PackManager) {}

  public async showPackManager(): Promise<void> {
    const packs = this.packManager.getRegistry();

    if (packs.length === 0) {
      vscode.window.showInformationMessage('No knowledge packs found in the registry.');
      return;
    }

    const items: PackQuickPickItem[] = packs.map(pack => {
      const sizeKb = Math.round(pack.size_bytes / 1024);
      const isInstalled = pack.status === 'installed';
      const icon = isInstalled ? '$(check)' : '$(cloud-download)';

      return {
        label: `${icon} ${pack.name}`,
        description: `v${pack.version} · ${pack.technology} · ${sizeKb} KB`,
        detail: `Status: ${pack.status.toUpperCase()} · License: ${pack.license} · Records: ${pack.record_count}`,
        pack,
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a documentation pack to install, update, or view details',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (!selected) return;

    const action = await vscode.window.showQuickPick(
      [
        { label: '$(cloud-download) Install / Sync Pack', action: 'install' },
        { label: '$(trash) Remove Pack from Database', action: 'remove' },
      ],
      { placeHolder: `Action for ${selected.pack.name}` }
    );

    if (action?.action === 'install') {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `UDKE: Installing ${selected.pack.name}...`,
          cancellable: false,
        },
        async () => {
          const res = this.packManager.installPack(selected.pack.id);
          if (res.success) {
            vscode.window.showInformationMessage(res.message);
            await vscode.commands.executeCommand('udke.refreshExplorer');
          } else {
            vscode.window.showErrorMessage(res.message);
          }
        }
      );
    } else if (action?.action === 'remove') {
      const res = this.packManager.removePack(selected.pack.id);
      if (res.success) {
        vscode.window.showInformationMessage(res.message);
        await vscode.commands.executeCommand('udke.refreshExplorer');
      } else {
        vscode.window.showErrorMessage(res.message);
      }
    }
  }
}
