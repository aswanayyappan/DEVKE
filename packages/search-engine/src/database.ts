import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DatabaseOptions {
  dbPath?: string;
  schemaPath?: string;
  inMemory?: boolean;
}

export class KnowledgeDatabase {
  private db: DatabaseSync;

  constructor(options: DatabaseOptions = {}) {
    if (options.inMemory || !options.dbPath) {
      this.db = new DatabaseSync(':memory:');
    } else {
      // Ensure directory exists
      const dir = path.dirname(path.resolve(options.dbPath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(path.resolve(options.dbPath));
    }

    this.initializeSchema(options.schemaPath);
  }

  private initializeSchema(customSchemaPath?: string): void {
    // Enable WAL and foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');
    
    const possibleSchemaPaths = [
      customSchemaPath,
      path.resolve('database/schema.sql'),
      path.resolve(__dirname, '../../../database/schema.sql'),
      path.resolve(__dirname, '../../database/schema.sql'),
    ].filter(Boolean) as string[];

    let schemaSql: string | null = null;
    for (const p of possibleSchemaPaths) {
      if (fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (schemaSql) {
      this.db.exec(schemaSql);
    }
  }

  public getRawDatabase(): DatabaseSync {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}
