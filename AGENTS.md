# AI Agent Operating Directives & Codebase Consistency Rules
## Universal Dev Knowledge Engine (UDKE)

> **Purpose of this file**: This document defines the permanent, mandatory engineering rules for any AI agent or automated assistant contributing to this repository. Every pull request, file edit, refactor, and new component must strictly conform to these directives to guarantee uncompromising quality, architectural consistency, and zero technical debt.

---

## 1. Core Principles & Philosophy

### 1.1 The Anti-Generic Mandate
Every line of code, UI component, and documentation record must be **production-grade, verified, and handcrafted in feel**. 
* Never produce incomplete stubs, generic placeholder functions, or `// TODO: implement later` shortcuts.
* Never insert fake placeholder documentation, "Lorem Ipsum", or synthetic APIs. All documentation records must reflect real, verified technical specifications.
* If a feature or parser is being built, build it completely with rigorous validation, robust error handling, and complete test coverage.

### 1.2 Separation of Concerns
This project has two distinct responsibilities that must **NEVER** be conflated:
1. **Knowledge Core & Ingestion Engine (`packages/*` & `apps/knowledge-cli`)**:
   Responsible for downloading, parsing, normalizing, validating, storing, and indexing programming documentation. This core must remain **completely independent of VS Code or any specific IDE**. It must run in pure Node.js environments.
2. **IDE Interface (`apps/vscode-extension`)**:
   Responsible strictly for user interaction, TreeView navigation, search triggering, and rendering documentation in Webviews. It consumes the Knowledge Core via clean, decoupled interfaces.

---

## 2. Monorepo Architecture & Boundary Enforcement

The repository follows a clean, decoupled monorepo structure:

```
universal-dev-knowledge-engine/
├── apps/
│   ├── vscode-extension/      # VS Code Extension (Presentation layer)
│   └── knowledge-cli/         # CLI Ingestion & Pack Generator (Ingestion orchestrator)
├── packages/
│   ├── knowledge-schema/      # Canonical TypeScript types & Zod validation schemas
│   ├── search-engine/         # SQLite storage, FTS5 queries, & knowledge repository
│   ├── document-parser/       # HTML, Markdown, & AST extractors (Cheerio, Remark)
│   └── source-connectors/     # Ecosystem connectors (npm, pub.dev, Git, web)
├── database/
│   └── schema.sql             # Authoritative SQLite & FTS5 DDL schema
├── knowledge/                 # Seed & verified offline knowledge packs (JSON/Markdown)
│   ├── nodejs/
│   ├── flutter/
│   ├── dart/
│   ├── python/
│   ├── react/
│   ├── databases/
│   └── security/
├── tests/                     # Monorepo E2E and integration test suites
└── docs/                      # Architectural specs, PRD, and guides
```

### Strict Import Boundaries
* `packages/knowledge-schema`: Pure TypeScript interfaces + Zod schemas. **Zero internal dependencies**; zero references to other packages or apps.
* `packages/search-engine`: Depends ONLY on `packages/knowledge-schema` and SQLite (`better-sqlite3`). **Never imports from `apps/*` or other packages**.
* `packages/document-parser`: Depends ONLY on `packages/knowledge-schema` and parsing utilities (Cheerio, Unified, Remark).
* `packages/source-connectors`: Depends on `packages/knowledge-schema` and network/filesystem utilities.
* `apps/knowledge-cli`: Consumes `packages/*`. Coordinates ingestion pipelines.
* `apps/vscode-extension`: Consumes `packages/knowledge-schema` and `packages/search-engine`. **Never contains raw parsing or scraping logic**.
* **CIRCULAR DEPENDENCIES ARE STRICTLY FORBIDDEN**.

---

## 3. TypeScript & Engineering Standards

### 3.1 Strict Mode & Type Hygiene
All projects must compile under the strictest TypeScript configuration:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true
  }
}
```

* **Avoid `any` (Justified Exceptions Only)**: Do not use `any` as a casual convenience. Prefer `unknown` and narrow with type guards or Zod schemas. If an untyped external library, dynamic C/C++ native binding, or legacy API boundary genuinely requires `any`, isolate it within an adapter module and add an explicit `// EXCEPTION: [reason]` comment explaining why a more specific type is impossible.
* **Explicit Return Types**: Every exported function, method, and API boundary must declare an explicit return type.
* **Branded Types for Identifiers**: Prevent identifier confusion by utilizing branded types:
  ```typescript
  export type DocumentId = string & { readonly __brand: 'DocumentId' };
  export type SymbolId = string & { readonly __brand: 'SymbolId' };
  export type PipelineId = string & { readonly __brand: 'PipelineId' };
  ```

### 3.2 Error Handling & Resilience
* Never return unhandled errors or let background parsing processes silently fail.
* Use explicit, typed result envelopes or well-defined error classes:
  ```typescript
  export type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E };
  ```
* All database transactions must employ `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` wrappers to ensure SQLite database integrity.
* In the VS Code extension, an error loading one document or symbol must **never** crash the extension host or corrupt other views.

---

## 4. Knowledge Schema & Ingestion Invariants

### 4.1 Schema Normalization
Every technology, library, class, function, method, and pipeline must validate against the canonical Zod schema in `@udke/knowledge-schema` before being written to SQLite.

Required top-level fields for any knowledge record:
* `id`: Standardized hierarchical key format: `<ecosystem>.<category>.<entity_name>` (e.g., `nodejs.security.argon2`).
* `name`: Human-readable display name.
* `type`: One of `'language' | 'framework' | 'library' | 'concept' | 'pipeline' | 'symbol'`.
* `language` / `runtime`: Specific language and execution target.
* `categories`: Ordered array of hierarchical path segments.
* `documentation`: Structured sections (overview, syntax, parameters, methods, examples, pipelines, errors).
* `metadata`: Source URL, license identifier (SPDX), retrieval timestamp, and verified documentation version.

### 4.2 Implementation Pipeline Standard
Pipelines provide step-by-step technical guides (e.g., Argon2 password registration & verification, OAuth 2.0 PKCE flow, Flutter custom painter lifecycle).
Every pipeline must contain:
1. `name`: Clear operational objective (e.g., "Argon2 Password Verification Pipeline").
2. `steps`: Ordered list of steps, each containing:
   - `step_number`: Sequential integer (1-indexed).
   - `title`: Imperative action phrase (e.g., "Receive submitted password and fetch stored hash").
   - `explanation`: Detailed technical reasoning.
   - `input`: Expected data structures.
   - `output`: Resulting data or cryptographic artifacts.
   - `syntax`: Relevant API signature.
   - `code_example`: Tested snippet.
   - `error_handling`: Common failure modes and mitigations.

---

## 5. Database & Storage Architecture

### 5.1 SQLite & FTS5 Rules
1. **Schema Authority**: The authoritative database schema is maintained in `database/schema.sql`.
2. **Foreign Keys**: Always enable `PRAGMA foreign_keys = ON;`.
3. **FTS5 Synchronization**: FTS5 virtual tables (`documents_fts`, `symbols_fts`) are updated automatically via database triggers on `INSERT`, `UPDATE`, and `DELETE`.
4. **Parameterized Queries**: Raw query interpolation is strictly prohibited. Every query must use parameterized values (`?` or named parameters `:param`).
5. **Batching**: Large ingestion operations must be executed in batches using SQLite transactions to sustain `> 2,000 records/sec` indexing velocity.

---

## 6. VS Code Extension & UI Rules

### 6.1 Design Token Consistency
* The extension UI must seamlessly blend into VS Code by exclusively utilizing official VS Code theme variables:
  * Backgrounds: `var(--vscode-editor-background)`, `var(--vscode-sideBar-background)`
  * Foreground: `var(--vscode-editor-foreground)`, `var(--vscode-descriptionForeground)`
  * Accent/Borders: `var(--vscode-focusBorder)`, `var(--vscode-widget-border)`
  * Code blocks: `var(--vscode-textCodeBlock-background)`
* Zero hardcoded hex colors in Webviews unless required for semantic badges with dark/light theme adjustments.

### 6.2 Accessibility (WCAG 2.1 AA)
* **Keyboard Accessible**: Every TreeView item and Webview action must be navigable via Tab and Arrow keys.
* **Focus Indicators**: Clear focus rings using `var(--vscode-focusBorder)`.
* **Screen Reader Semantics**: Use proper ARIA landmarks (`role="tree"`, `role="region"`, `role="search"`).
* **High Contrast**: Support `vscode-high-contrast` and `vscode-high-contrast-light` themes gracefully.

### 6.3 Performance Guardrails
* Extension activation must complete in `< 500ms`.
* Global search queries must return results in `< 50ms`.
* Webviews must lazy-load heavy content sections and cache rendered DOM nodes.

---

## 7. Future AI Retrieval Compatibility

The Knowledge Core exposes a deterministic, high-signal retrieval interface designed for future AI integration without schema refactoring:

```typescript
export interface IKnowledgeEngine {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDocument(id: DocumentId): Promise<DocumentationRecord | null>;
  getSymbol(name: string, context?: { language?: string; version?: string }): Promise<SymbolRecord | null>;
  getPipeline(id: PipelineId): Promise<ImplementationPipeline | null>;
  getRelated(id: DocumentId): Promise<DocumentationRecord[]>;
  getSource(sourceId: string): Promise<SourceMetadata | null>;
}
```

AI agents developing or modifying the system must maintain this interface invariant.

---

## 8. Verification & Completion Checklist

Before declaring any feature, fix, or module complete, verify:
- [ ] TypeScript compilation passes with zero errors (`npm run build` or `pnpm build`).
- [ ] Linter checks pass (`npm run lint`).
- [ ] All unit, integration, and schema validation tests pass (`npm run test`).
- [ ] No hardcoded temporary strings, stubs, or mock data in production paths.
- [ ] Every new entity type has a corresponding Zod schema, database migration, and test fixture.
- [ ] All new files are documented and linked in `ARCHITECTURE.md` and `TRACKER.md`.
