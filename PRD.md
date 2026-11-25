# Universal Dev Knowledge Engine (UDKE)
## Product Requirements Document (PRD) — Version 2.0
### Specification for Universal Developer Documentation & Knowledge Platform

| Document Attribute | Specification |
| :--- | :--- |
| **Product Name** | Universal Dev Knowledge Engine (UDKE) |
| **Product Type** | Universal Programming Documentation & Knowledge Platform |
| **Initial Platform** | Visual Studio Code Extension |
| **Secondary Platform** | Antigravity, subject to API compatibility verification |
| **Primary Language** | TypeScript (Strict Mode) |
| **Persistence Engine** | SQLite with FTS5 Full-Text Search & BM25 Ranking |
| **Architecture** | Decoupled TypeScript Monorepo with Modular Offline Knowledge Packs |
| **Operating Model** | 100% Offline-First (Local packs + local search indexes) |
| **AI Strategy** | Ground-truth verification substrate via `IKnowledgeEngine` interface |

---

## 1. Product Overview & Vision

### 1.1 Product Vision
Universal Dev Knowledge Engine (UDKE) is a comprehensive, offline-first programming documentation and knowledge platform designed to provide software engineers with instant, verified, and deeply structured technical references directly inside the IDE.

Rather than fragmenting documentation into web searches, disparate portals, or ungrounded AI chat queries that hallucinate API signatures, UDKE organizes programming knowledge across 12 master engineering domains. It structures every technology into verified API references, formal syntax definitions, parameter matrices, step-by-step implementation workflows, and practical code examples.

In future phases, this same knowledge infrastructure serves as the deterministic ground-truth foundation for autonomous AI coding agents, providing them with verified syntax and workflow context without schema rework.

### 1.2 Core Scope Shift: The Complete Programming Knowledge Library
The product scope is **not** a single-technology viewer (e.g. Node.js only), but a universal developer reference library. Complete coverage does **not** mean hand-writing every documentation page; it means building a standardized knowledge infrastructure powered by:
1. A **Universal Taxonomy** covering all major programming languages, frameworks, libraries, APIs, architectures, and tools.
2. An **Automated Ingestion Pipeline** harvesting official documentation, package registries, Git repositories, and API specifications.
3. **Modular Offline Knowledge Packs** allowing developers to install, update, and query specific technologies without bloating storage.
4. **Standardized Knowledge Schemas** guaranteeing that every library entry across any language adheres to a uniform reference structure.

---

## 2. Universal Library Taxonomy (12 Master Domains)

The platform organizes technical knowledge into 12 top-level domains:

```
Universal Developer Knowledge Library
├── 1. Programming Languages
│   └── JavaScript, TypeScript, Python, Java, C, C++, C#, Dart, Go, Rust, PHP, Kotlin, Swift, Ruby
├── 2. Frontend Development
│   └── HTML5, CSS3, React, Next.js, Vue, Angular, Svelte, Tailwind CSS
├── 3. Backend Development
│   └── Node.js, Express, NestJS, Django, FastAPI, Spring Boot, Laravel, ASP.NET Core
├── 4. Mobile Development
│   └── Flutter, Android Native, Kotlin Multiplatform, Swift/iOS, React Native, Jetpack Compose
├── 5. Databases & Storage
│   └── PostgreSQL, MySQL, SQLite, MongoDB, Redis, Firebase Firestore, Supabase
├── 6. Authentication & Security
│   └── OAuth 2.0, OpenID Connect, JWT, Argon2, bcrypt, WebAuthn, Passkeys, TLS/mTLS, WebCrypto
├── 7. APIs & Communication
│   └── REST, GraphQL, WebSocket, gRPC, Webhooks, MQTT, OpenAPI/Swagger, Server-Sent Events
├── 8. DevOps & Infrastructure
│   └── Docker, Kubernetes, Git, GitHub Actions, Linux Systems, Nginx, CI/CD, Terraform, Cloud Platforms
├── 9. Architecture & Design
│   └── MVC, MVVM, Clean Architecture, Microservices, Event-Driven Architecture, Domain-Driven Design (DDD)
├── 10. Testing & Debugging
│   └── Unit Testing, Integration Testing, E2E Testing, Playwright, Jest, Vitest, Profiling, Memory Analysis
├── 11. AI & Machine Learning
│   └── PyTorch, TensorFlow, Hugging Face Transformers, LLMs, RAG Architectures, Embeddings, Vector Databases
└── 12. Tools & Development Environments
    └── VS Code, Antigravity, IntelliJ IDEA, Android Studio, Shells/Terminals, Package Managers (npm, pip, cargo, pub)
```

---

## 3. Technology Knowledge Structure (The 14-Section Model)

Selecting any technology in the UDKE navigation tree opens a standardized, consistent hierarchy. For example, selecting **Node.js** opens:

```
Backend Development
└── Node.js
    ├── 1. Fundamentals (Event loop, asynchronous I/O, V8 engine)
    ├── 2. Installation & Setup (nvm, runtime configuration, tsconfig)
    ├── 3. Runtime & Architecture (libuv, thread pool, memory management)
    ├── 4. Core Modules (events, path, util, buffer, streams)
    ├── 5. File System (fs, fs/promises, file descriptors, streams)
    ├── 6. HTTP & Networking (http, https, net, http2, dgram)
    ├── 7. Authentication
    │   ├── Password Hashing (Argon2, bcrypt, scrypt)
    │   ├── JWT (jsonwebtoken, jose)
    │   ├── OAuth 2.0 (PKCE, grant flows)
    │   └── OpenID Connect (session management)
    ├── 8. Databases (PostgreSQL pg, SQLite node:sqlite, Prisma, Redis)
    ├── 9. API Development (REST endpoints, Fastify, Express, error envelopes)
    ├── 10. Error Handling (AppError patterns, uncaughtException, domain errors)
    ├── 11. Security (CORS, Helmet, rate limiting, crypto, timing-safe equality)
    ├── 12. Testing (node:test, Vitest, supertest, mocking)
    ├── 13. Deployment (Docker multi-stage, PM2, environment configuration)
    └── 14. API Reference (Complete formal signatures and parameters)
```

---

## 4. Library Entry Structure (The 11-Section Standard)

Every individual library, module, or package entry must conform to this standardized structure:

| Section | Required Content |
| :--- | :--- |
| **1. Overview** | Core purpose, high-level operational model, and recommended use cases. |
| **2. Installation** | Package manager commands (`npm`, `pip`, `cargo`, `pub add`), peer dependencies, and environment requirements. |
| **3. Syntax** | Exact formal programming language syntax, signatures, and type definitions. |
| **4. Classes & Functions** | Complete breakdown of constructors, methods, static functions, parameters, return types, and exceptions. |
| **5. Configuration** | Configuration options, tuning parameters, default values, and environment variables. |
| **6. Examples** | Verified, syntax-highlighted, runnable code examples attributed to official sources. |
| **7. Implementation** | Multi-step implementation pipelines detailing ordered procedures (e.g. registration, verification, migration). |
| **8. Errors** | Common runtime exceptions, error codes, root cause diagnosis, and recovery strategies. |
| **9. Security** | Cryptographic considerations, memory limits, injection prevention, and vulnerability mitigations. |
| **10. Compatibility** | Supported runtime versions, framework versions, OS platform support, and deprecation schedules. |
| **11. References** | Upstream documentation URLs, SPDX license identifier, repository URL, and verification date. |

---

## 5. Modular Knowledge Pack Architecture

To prevent a single monolithic database from becoming unmaintainable and bloated, documentation is divided into independent, downloadable **Knowledge Packs**:

```
knowledge/
├── packs.json                         # Master registry of all available packs
├── languages/
│   ├── javascript/
│   ├── typescript/
│   ├── python/
│   ├── dart/
│   ├── java/
│   └── rust/
├── frontend/
│   ├── react/
│   ├── nextjs/
│   └── tailwind/
├── backend/
│   ├── nodejs/
│   ├── express/
│   └── fastapi/
├── mobile/
│   ├── flutter/
│   └── android/
├── databases/
│   ├── postgresql/
│   └── sqlite/
├── authentication/
├── security/
├── apis/
├── devops/
├── architecture/
├── testing/
├── ai-ml/
└── tools/
```

### Knowledge Pack Invariants:
* Each pack contains its own `pack.json` manifest specifying `id`, `name`, `version`, `min_udke_version`, `license`, `checksum`, and `size_bytes`.
* Packs can be installed, updated, or removed independently.
* The local SQLite search engine can index multiple active packs concurrently without table collision.

---

## 6. Automated Ingestion Pipeline

To populate thousands of libraries across 12 domains without manual copying:
1. **Source Connectors**:
   - `RegistryConnector`: Queries npm, PyPI, pub.dev, crates.io for package metadata, READMEs, and published API declarations.
   - `WebConnector`: Scrapes official documentation portals (e.g., nodejs.org, docs.flutter.dev, python.org) using Cheerio with content cleaning.
   - `GitConnector`: Clones official repositories and extracts markdown guides, changelogs, and tested examples.
   - `SpecConnector`: Ingests OpenAPI specifications, TypeScript `.d.ts` declaration ASTs, and Dartdoc JSON metadata.
2. **Document Normalizer**: Translates diverse formats into canonical Zod-validated `@udke/knowledge-schema` records.
3. **Pipeline Synthesizer**: Structures multi-step procedural flows from official guides into ordered `ImplementationPipeline` entities.
4. **License & Provenance Guard**: Checks licenses against permissive redistribution criteria (MIT, Apache-2.0, BSD-3-Clause) and stores attribution.

---

## 7. IDE Interface Requirements (VS Code)

* **TreeView Explorer**: Multi-level hierarchical tree organizing the 12 domains, their technologies, the 14 sub-categories, and individual libraries.
* **Global QuickPick Search**: Real-time FTS5 query execution with snippet extraction, filtering by language and category.
* **Webview Documentation Viewer**: Clean typography utilizing official VS Code theme variables, code block syntax highlighting, copy buttons, parameter tables, and interactive pipeline steps.
* **Offline Guarantee**: Zero external HTTP requests during browsing or searching of installed packs.

---

## 8. Future AI Grounding Interface (`IKnowledgeEngine`)

The knowledge engine exposes a clean, high-signal retrieval interface for future AI models:

```typescript
export interface IKnowledgeEngine {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  getDocument(id: string): Promise<DocumentationRecord | null>;
  getSymbol(name: string, context?: { language?: string; version?: string }): Promise<SymbolRecord | null>;
  getPipeline(id: string): Promise<ImplementationPipeline | null>;
  getRelated(id: string): Promise<DocumentationRecord[]>;
  getSource(sourceId: string): Promise<SourceMetadata | null>;
}
```

This guarantees future AI agents receive verified, deterministic syntax and workflows rather than hallucinating API signatures.
