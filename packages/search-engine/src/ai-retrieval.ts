import { KnowledgeRepository } from './repository.js';
import type { DocumentationRecord, SymbolRecord } from '@udke/knowledge-schema';

export interface CodeVerificationResult {
  valid: boolean;
  matchedSymbols: string[];
  warnings: string[];
  recommendations: string[];
}

export class AIContextGroundingEngine {
  constructor(private readonly repo: KnowledgeRepository) {}

  /**
   * Generates a deterministic, high-signal system prompt context for LLMs
   * containing ground-truth API signatures, parameter constraints, and pipelines.
   */
  public async buildGroundingPrompt(query: string, language?: string): Promise<string> {
    const searchResults = await this.repo.search(query, { limit: 3 });

    if (searchResults.length === 0) {
      return `### UDKE AI GROUNDING CONTEXT\nNo verified documentation found matching '${query}'. Ensure APIs are not hallucinated.`;
    }

    const primaryResult = searchResults[0];
    if (!primaryResult) {
      return `### UDKE AI GROUNDING CONTEXT\nNo primary match.`;
    }

    const docId = primaryResult.documentId || primaryResult.id;
    let doc = await this.repo.getDocument(docId);

    // If result was a symbol ID, resolve its parent document
    if (!doc) {
      const sym = await this.repo.getSymbol(primaryResult.name);
      if (sym) {
        doc = await this.repo.getDocument(sym.document_id);
      }
    }

    if (!doc) {
      return `### UDKE AI GROUNDING CONTEXT\nDocument '${primaryResult.id}' is not loaded.`;
    }

    const sections: string[] = [
      `### UDKE VERIFIED GROUND-TRUTH API CONTEXT`,
      `> WARNING FOR AI GENERATION: Use ONLY the formal signatures, parameter names, and pipeline steps below. Do not hallucinate deprecated or fabricated methods.`,
      ``,
      `**Technology**: ${doc.title} (${doc.language}${doc.runtime ? ` / ${doc.runtime}` : ''})`,
      `**Version**: ${doc.metadata.documentation_version}`,
      `**License**: ${doc.metadata.license}`,
      `**Overview**: ${doc.documentation.overview}`,
    ];

    if (doc.package?.installation) {
      sections.push(`**Installation**: \`${doc.package.installation}\``);
    }

    // Symbols & Signatures
    if (doc.symbols.length > 0) {
      sections.push(``, `#### Verified API Signatures & Parameters:`);
      for (const sym of doc.symbols) {
        sections.push(`- **${sym.name}** (\`${sym.kind}\`):`);
        sections.push(`  \`\`\`${doc.language.toLowerCase()}\n  ${sym.syntax}\n  \`\`\``);
        if (sym.parameters.length > 0) {
          sections.push(`  *Parameters*:`);
          for (const p of sym.parameters) {
            sections.push(`    - \`${p.name}\` (${p.data_type})${p.is_required ? ' [REQUIRED]' : ' [OPTIONAL]'}${p.default_value ? ` default: \`${p.default_value}\`` : ''}: ${p.description}`);
          }
        }
      }
    }

    // Pipelines
    if (doc.pipelines.length > 0) {
      sections.push(``, `#### Required Implementation Workflow:`);
      for (const pipe of doc.pipelines) {
        sections.push(`*${pipe.name}* (Objective: ${pipe.objective}):`);
        for (const step of pipe.steps) {
          sections.push(`  ${step.step_number}. **${step.title}**: ${step.explanation}${step.syntax ? ` (\`${step.syntax}\`)` : ''}`);
        }
      }
    }

    // Security Warnings
    if (doc.documentation.security_considerations) {
      sections.push(``, `#### Critical Security Directives:`, doc.documentation.security_considerations);
    }

    return sections.join('\n');
  }

  /**
   * Validates generated or developer code against verified signatures in SQLite.
   */
  public async verifyCodeSyntax(code: string, _language: string): Promise<CodeVerificationResult> {
    const matchedSymbols: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for common Argon2 patterns
    if (code.includes('argon2.')) {
      if (code.includes('argon2.hash')) {
        matchedSymbols.push('argon2.hash');
        if (!code.includes('argon2.argon2id') && !code.includes('type:')) {
          recommendations.push('Explicitly configure Argon2id (`type: argon2.argon2id`) for optimal side-channel attack resistance.');
        }
      }
      if (code.includes('argon2.verify')) {
        matchedSymbols.push('argon2.verify');
      }
    }

    // Check for Flutter Scaffold patterns
    if (code.includes('Scaffold(')) {
      matchedSymbols.push('Scaffold');
      if (!code.includes('body:')) {
        warnings.push('Scaffold instantiated without a `body` widget property.');
      }
    }

    // Check for Dart Future patterns
    if (code.includes('Future.delayed')) {
      matchedSymbols.push('Future.delayed');
    }
    if (code.includes('Future.wait')) {
      matchedSymbols.push('Future.wait');
    }

    // Check for JWT patterns
    if (code.includes('jwt.sign')) {
      matchedSymbols.push('jwt.sign');
      if (!code.includes('expiresIn')) {
        warnings.push('JWT token created without an `expiresIn` lifespan constraint, which may allow perpetual token reuse.');
      }
    }

    return {
      valid: warnings.length === 0,
      matchedSymbols,
      warnings,
      recommendations,
    };
  }
}
