import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { IKnowledgeEngine } from '@udke/search-engine';

export class DocTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: 'domain' | 'technology' | 'category' | 'document',
    public readonly docId?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(label, collapsibleState);

    if (itemType === 'document') {
      this.iconPath = new vscode.ThemeIcon('book');
      this.contextValue = 'document';
      this.command = {
        command: 'udke.openDocument',
        title: 'Open Documentation',
        arguments: [docId]
      };
    } else if (itemType === 'technology') {
      this.iconPath = new vscode.ThemeIcon('symbol-package');
    } else if (itemType === 'domain') {
      this.iconPath = new vscode.ThemeIcon('library');
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }
}

export class CategoryTreeProvider implements vscode.TreeDataProvider<DocTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DocTreeItem | undefined | null | void> = new vscode.EventEmitter<DocTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<DocTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private readonly knowledgeEngine: IKnowledgeEngine,
    private readonly extensionPath: string
  ) {}

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: DocTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: DocTreeItem): Promise<DocTreeItem[]> {
    if (!element) {
      // Level 0: 12 Master Domains
      return [
        new DocTreeItem('Programming Languages', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Frontend Development', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Backend Development', vscode.TreeItemCollapsibleState.Expanded, 'domain'),
        new DocTreeItem('Mobile Development', vscode.TreeItemCollapsibleState.Expanded, 'domain'),
        new DocTreeItem('Databases & Storage', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Authentication & Security', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('APIs & Communication', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('DevOps & Infrastructure', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Architecture & Design', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Testing & Debugging', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('AI & Machine Learning', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
        new DocTreeItem('Tools & Environments', vscode.TreeItemCollapsibleState.Collapsed, 'domain'),
      ];
    }

    // Level 1: Technologies within Domain
    if (element.itemType === 'domain') {
      switch (element.label) {
        case 'Backend Development':
          return [
            new DocTreeItem('Node.js', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
            new DocTreeItem('Express', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('FastAPI', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
          ];
        case 'Mobile Development':
          return [
            new DocTreeItem('Flutter', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
            new DocTreeItem('Android Native', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('React Native', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
          ];
        case 'Programming Languages':
          return [
            new DocTreeItem('Dart', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
            new DocTreeItem('TypeScript', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('Python', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('Rust', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
          ];
        case 'Databases & Storage':
          return [
            new DocTreeItem('SQLite', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
            new DocTreeItem('PostgreSQL', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('Redis', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
          ];
        case 'Authentication & Security':
          return [
            new DocTreeItem('JWT (JSON Web Tokens)', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
            new DocTreeItem('OAuth 2.0 & OIDC', vscode.TreeItemCollapsibleState.Collapsed, 'technology'),
            new DocTreeItem('Password Hashing', vscode.TreeItemCollapsibleState.Expanded, 'technology'),
          ];
        default:
          return [
            new DocTreeItem('(Pack available for download)', vscode.TreeItemCollapsibleState.None, 'category')
          ];
      }
    }

    // Level 2: Sub-categories and Installed Documents
    if (element.itemType === 'technology') {
      switch (element.label) {
        case 'Node.js':
          return [
            new DocTreeItem('Password Security', vscode.TreeItemCollapsibleState.Expanded, 'category'),
            new DocTreeItem('HTTP & Networking', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
            new DocTreeItem('File System', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
          ];
        case 'Flutter':
          return [
            new DocTreeItem('Material Design Widgets', vscode.TreeItemCollapsibleState.Expanded, 'category'),
            new DocTreeItem('State Management', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
            new DocTreeItem('Layout & Rendering', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
          ];
        case 'Dart':
          return [
            new DocTreeItem('Asynchronous Programming', vscode.TreeItemCollapsibleState.Expanded, 'category'),
            new DocTreeItem('Collections & Generics', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
          ];
        case 'SQLite':
          return [
            new DocTreeItem('SQLite Engine & FTS5', vscode.TreeItemCollapsibleState.None, 'document', 'database.storage.sqlite'),
          ];
        case 'JWT (JSON Web Tokens)':
          return [
            new DocTreeItem('JSON Web Token (JWT)', vscode.TreeItemCollapsibleState.None, 'document', 'authentication.tokens.jwt'),
          ];
        case 'Password Hashing':
          return [
            new DocTreeItem('Argon2', vscode.TreeItemCollapsibleState.None, 'document', 'nodejs.security.argon2'),
          ];
        default:
          return [];
      }
    }

    // Level 3: Categories to Documents
    if (element.itemType === 'category') {
      switch (element.label) {
        case 'Password Security':
          return [
            new DocTreeItem('Argon2', vscode.TreeItemCollapsibleState.None, 'document', 'nodejs.security.argon2'),
          ];
        case 'Material Design Widgets':
          return [
            new DocTreeItem('Scaffold', vscode.TreeItemCollapsibleState.None, 'document', 'flutter.material.scaffold'),
          ];
        case 'Asynchronous Programming':
          return [
            new DocTreeItem('Future', vscode.TreeItemCollapsibleState.None, 'document', 'dart.core.future'),
          ];
        default:
          return [];
      }
    }

    return [];
  }
}
