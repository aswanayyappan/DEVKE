# Universal Dev Knowledge Engine (UDKE)

An offline-first, structured developer documentation platform and VS Code extension designed to provide verified technical reference, syntax guidance, and implementation pipelines across multiple programming ecosystems.

---

## 1. Project Overview

Universal Dev Knowledge Engine (UDKE) is organized as a decoupled TypeScript monorepo with two core systems:
* **Knowledge Core & Ingestion Engine**: Collects, normalizes, validates, stores, and indexes documentation from official and open-source sources into an embedded SQLite database using FTS5 full-text search.
* **VS Code Extension**: Provides developers with an integrated UI featuring a TreeView explorer, command palette search, and an interactive Webview documentation viewer.

```
universal-dev-knowledge-engine/
├── apps/
│   ├── vscode-extension/      # VS Code extension UI
│   └── knowledge-cli/         # Ingestion, validation, and pack generator CLI
├── packages/
│   ├── knowledge-schema/      # Canonical TypeScript types & Zod schemas
│   ├── search-engine/         # SQLite storage and FTS5 search queries
│   ├── document-parser/       # Cheerio HTML & Remark Markdown parsers
│   └── source-connectors/     # Ecosystem connectors (npm, pub.dev, Git)
├── database/
│   └── schema.sql             # Authoritative SQLite DDL & FTS5 triggers
├── knowledge/                 # Verified offline knowledge packs
├── docs/                      # Architectural specifications and PRD
├── AGENTS.md                  # Operating rules for AI coding agents
├── ARCHITECTURE.md            # In-depth architectural specification
├── PRD.md                     # Complete product requirements document
└── TRACKER.md                 # Project phase roadmap & task tracker
```

---

## 2. Key Documentation

* [PRD.md](./PRD.md): Product Requirements Document detailing vision, requirements, and taxonomy.
* [AGENTS.md](./AGENTS.md): Engineering rules and consistency guidelines for AI agents working on this codebase.
* [ARCHITECTURE.md](./ARCHITECTURE.md): Technical architecture, package boundaries, data flows, and schema design.
* [TRACKER.md](./TRACKER.md): Active progress tracker and milestone roadmap.

---

## 3. Technology Stack

* **Monorepo**: TypeScript, npm workspaces
* **Storage & Search**: SQLite + FTS5 full-text indexing with unicode tokenization
* **Parsers**: Cheerio (HTML extraction), Remark / Unified (Markdown AST)
* **IDE Integration**: VS Code Extension API (TreeView, WebviewPanel, QuickPick)
* **Testing**: Vitest
* **Validation**: Zod runtime schema validation

---

## 4. Contributing & Agent Directives

All contributors and AI agents must review and strictly abide by the rules laid out in [AGENTS.md](./AGENTS.md).
