import { z } from 'zod';

export const ParameterSchema = z.object({
  id: z.string().min(1),
  symbol_id: z.string().min(1),
  name: z.string().min(1),
  data_type: z.string().min(1),
  default_value: z.string().nullable().optional(),
  is_required: z.boolean().default(true),
  is_optional: z.boolean().default(false),
  is_named: z.boolean().default(false),
  description: z.string(),
  sort_order: z.number().int().default(0),
});

export const SymbolKindSchema = z.enum([
  'class',
  'constructor',
  'method',
  'function',
  'property',
  'interface',
  'enum',
  'constant',
]);

export const SymbolSchema = z.object({
  id: z.string().min(1),
  document_id: z.string().min(1),
  name: z.string().min(1),
  kind: SymbolKindSchema,
  syntax: z.string().min(1),
  return_type: z.string().nullable().optional(),
  description: z.string().min(1),
  is_static: z.boolean().default(false),
  is_async: z.boolean().default(false),
  is_deprecated: z.boolean().default(false),
  deprecation_reason: z.string().nullable().optional(),
  parameters: z.array(ParameterSchema).default([]),
  sort_order: z.number().int().default(0),
});

export const CodeExampleSchema = z.object({
  id: z.string().min(1),
  document_id: z.string().min(1),
  symbol_id: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  code: z.string().min(1),
  language: z.string().min(1),
  expected_output: z.string().nullable().optional(),
  source_attribution: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const PipelineStepSchema = z.object({
  id: z.string().min(1),
  pipeline_id: z.string().min(1),
  step_number: z.number().int().positive(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  input_data: z.string().nullable().optional(),
  output_data: z.string().nullable().optional(),
  syntax: z.string().nullable().optional(),
  code_example: z.string().nullable().optional(),
  error_handling: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const ImplementationPipelineSchema = z.object({
  id: z.string().min(1),
  document_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  objective: z.string().min(1),
  steps: z.array(PipelineStepSchema).min(1),
  sort_order: z.number().int().default(0),
});

export const RelationshipTypeSchema = z.enum([
  'requires',
  'depends_on',
  'related_to',
  'implements',
  'alternative_to',
  'used_by',
  'prerequisite_for',
]);

export const RelationshipSchema = z.object({
  id: z.string().min(1),
  source_doc_id: z.string().min(1),
  target_doc_id: z.string().min(1),
  relationship_type: RelationshipTypeSchema,
  description: z.string().nullable().optional(),
});

export const DocumentationSectionsSchema = z.object({
  overview: z.string().min(1),
  purpose: z.string().optional(),
  installation: z.string().optional(),
  configuration: z.string().optional(),
  security_considerations: z.string().optional(),
  error_handling: z.string().optional(),
  compatibility: z.string().optional(),
  troubleshooting: z.string().optional(),
});

export const CompletenessStatusSchema = z.enum([
  'complete',
  'partial',
  'metadata_only',
  'outdated',
  'unverified',
]);

export const EntityTypeSchema = z.enum([
  'language',
  'framework',
  'library',
  'module',
  'class',
  'concept',
  'guide',
  'pipeline',
]);

export const DocumentationRecordSchema = z.object({
  id: z.string().min(1),
  library_id: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  type: EntityTypeSchema,
  language: z.string().min(1),
  runtime: z.string().nullable().optional(),
  categories: z.array(z.string()).min(1),
  package: z.object({
    name: z.string().min(1),
    manager: z.string().min(1),
    installation: z.string().min(1),
    repository_url: z.string().url().optional(),
    documentation_url: z.string().url().optional(),
    license: z.string().min(1),
  }).optional(),
  documentation: DocumentationSectionsSchema,
  symbols: z.array(SymbolSchema).default([]),
  examples: z.array(CodeExampleSchema).default([]),
  pipelines: z.array(ImplementationPipelineSchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  metadata: z.object({
    source_url: z.string().min(1),
    license: z.string().min(1),
    documentation_version: z.string().default('latest'),
    completeness_status: CompletenessStatusSchema.default('complete'),
    last_verified: z.string().nullable().optional(),
  }),
});
