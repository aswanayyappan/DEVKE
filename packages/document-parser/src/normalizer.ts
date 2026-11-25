import { 
  DocumentationRecord, 
  DocumentationRecordSchema,
  CodeExample
} from '@udke/knowledge-schema';
import { MarkdownSection } from './markdown-parser.js';

export interface IngestionInput {
  id: string;
  title: string;
  language: string;
  runtime?: string;
  categories: string[];
  sections: MarkdownSection[];
  packageMeta?: {
    name: string;
    manager: string;
    installation: string;
    repository_url?: string;
    license: string;
  };
  sourceUrl: string;
  license?: string;
  version?: string;
}

export class DocumentNormalizer {
  public normalize(input: IngestionInput): DocumentationRecord {
    // 1. Identify standard 11 sections from parsed headings
    let overview = '';
    let installation = input.packageMeta?.installation || '';
    let syntax = '';
    let configuration = '';
    let errorHandling = '';
    let security = '';

    const examples: CodeExample[] = [];

    for (const sec of input.sections) {
      const lower = sec.title.toLowerCase();

      if (lower.includes('install') || lower.includes('getting started')) {
        installation = installation || sec.content;
      } else if (lower.includes('config') || lower.includes('options') || lower.includes('setup')) {
        configuration = sec.content;
      } else if (lower.includes('syntax') || lower.includes('api') || lower.includes('usage')) {
        syntax = syntax || sec.content;
      } else if (lower.includes('error') || lower.includes('troubleshoot') || lower.includes('exception')) {
        errorHandling = sec.content;
      } else if (lower.includes('security') || lower.includes('vulnerability')) {
        security = sec.content;
      } else if (!overview) {
        overview = sec.content;
      }

      // Collect code examples from code blocks
      for (let i = 0; i < sec.codeBlocks.length; i++) {
        const block = sec.codeBlocks[i];
        if (block && block.code.trim().length > 10) {
          examples.push({
            id: `${input.id}.example.${examples.length + 1}`,
            document_id: input.id,
            title: `${sec.title} Example`,
            description: `Practical example demonstrating ${sec.title.toLowerCase()}`,
            code: block.code,
            language: block.language || input.language.toLowerCase(),
            sort_order: examples.length + 1,
            source_attribution: `Extracted from ${input.sourceUrl}`,
          });
        }
      }
    }

    const unverifiedDoc = {
      id: input.id,
      title: input.title,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      type: 'library' as const,
      language: input.language,
      runtime: input.runtime || input.language,
      categories: input.categories,
      package: input.packageMeta ? {
        name: input.packageMeta.name,
        manager: input.packageMeta.manager,
        installation: input.packageMeta.installation,
        repository_url: input.packageMeta.repository_url,
        license: input.packageMeta.license || 'MIT',
      } : undefined,
      documentation: {
        overview: overview || `${input.title} documentation and API reference.`,
        purpose: `Universal reference and implementation guide for ${input.title}.`,
        installation: installation || undefined,
        configuration: configuration || undefined,
        security_considerations: security || undefined,
        error_handling: errorHandling || undefined,
      },
      symbols: [],
      examples: examples.slice(0, 5),
      pipelines: [],
      relationships: [],
      metadata: {
        source_url: input.sourceUrl,
        license: input.license || input.packageMeta?.license || 'MIT',
        documentation_version: input.version || 'latest',
        completeness_status: 'complete' as const,
        last_verified: new Date().toISOString().split('T')[0],
      },
    };

    // Validate through Zod to guarantee data integrity
    const parseResult = DocumentationRecordSchema.safeParse(unverifiedDoc);
    if (!parseResult.success) {
      throw new Error(`Failed to normalize record '${input.id}': ${JSON.stringify(parseResult.error.format())}`);
    }

    return parseResult.data as DocumentationRecord;
  }
}
