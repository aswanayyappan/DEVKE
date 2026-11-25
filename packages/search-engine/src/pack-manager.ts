import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { KnowledgeRepository } from './repository.js';

export interface KnowledgePackMetadata {
  id: string;
  name: string;
  domain_id?: string;
  technology: string;
  version: string;
  status: 'installed' | 'available' | 'update_available';
  record_count: number;
  size_bytes: number;
  license: string;
  checksum?: string;
  path: string;
}

export class PackManager {
  private repo: KnowledgeRepository;

  constructor(private readonly db: DatabaseSync, private readonly knowledgeBaseDir: string) {
    this.repo = new KnowledgeRepository(db);
  }

  public getRegistry(): KnowledgePackMetadata[] {
    const packsPath = path.join(this.knowledgeBaseDir, 'packs.json');
    if (!fs.existsSync(packsPath)) {
      return [];
    }

    try {
      const data = JSON.parse(fs.readFileSync(packsPath, 'utf8'));
      return data.packs || [];
    } catch {
      return [];
    }
  }

  public getInstalledPacks(): KnowledgePackMetadata[] {
    const registry = this.getRegistry();
    return registry.filter(p => p.status === 'installed');
  }

  public installPack(packId: string): { success: boolean; message: string; recordCount?: number } {
    const registry = this.getRegistry();
    const pack = registry.find(p => p.id === packId);

    if (!pack) {
      return { success: false, message: `Pack '${packId}' not found in registry.` };
    }

    const packFullPath = path.resolve(this.knowledgeBaseDir, '..', pack.path);
    const packDir = path.dirname(packFullPath);

    if (!fs.existsSync(packFullPath)) {
      return { success: false, message: `Pack manifest file not found at ${packFullPath}` };
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(packFullPath, 'utf8'));
      const recordFiles = manifest.records || [];
      let count = 0;

      for (const recFile of recordFiles) {
        const fullRecPath = path.join(packDir, recFile);
        if (fs.existsSync(fullRecPath)) {
          const docJson = JSON.parse(fs.readFileSync(fullRecPath, 'utf8'));
          this.repo.ingestDocument(docJson);
          count++;
        }
      }

      // Ensure domain and technology records exist to satisfy foreign key constraints
      if (pack.domain_id) {
        const domainName = pack.domain_id.replace('domain.', '');
        this.db.prepare(`
          INSERT OR IGNORE INTO domains (id, name, slug)
          VALUES (?, ?, ?)
        `).run(pack.domain_id, domainName.charAt(0).toUpperCase() + domainName.slice(1), domainName);
      }

      const techId = `tech.${pack.technology.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      this.db.prepare(`
        INSERT OR IGNORE INTO technologies (id, name, slug, type)
        VALUES (?, ?, ?, 'runtime')
      `).run(techId, pack.technology, techId.replace('tech.', ''));

      // Record in SQLite knowledge_packs table
      this.db.prepare(`
        INSERT OR REPLACE INTO knowledge_packs (
          id, technology_id, domain_id, name, version, status, record_count, size_bytes, license, pack_path, installed_at
        ) VALUES (?, ?, ?, ?, ?, 'installed', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        pack.id,
        techId,
        pack.domain_id || null,
        pack.name,
        pack.version,
        count,
        pack.size_bytes,
        pack.license,
        pack.path
      );

      return {
        success: true,
        message: `Successfully installed pack '${pack.name}' (${count} records indexed).`,
        recordCount: count,
      };
    } catch (err) {
      return { success: false, message: `Failed to install pack '${pack.name}': ${err}` };
    }
  }

  public removePack(packId: string): { success: boolean; message: string } {
    try {
      this.db.prepare(`DELETE FROM knowledge_packs WHERE id = ?`).run(packId);
      return { success: true, message: `Pack '${packId}' removed from active database.` };
    } catch (err) {
      return { success: false, message: `Failed to remove pack '${packId}': ${err}` };
    }
  }
}
