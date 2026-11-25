/**
 * Universal Dev Knowledge Engine (UDKE)
 * Core Domain Entities and Branded Identifiers
 */

export type DocumentId = string & { readonly __brand: unique symbol };
export type SymbolId = string & { readonly __brand: unique symbol };
export type PipelineId = string & { readonly __brand: unique symbol };
export type CategoryId = string & { readonly __brand: unique symbol };
export type SourceId = string & { readonly __brand: unique symbol };

export type EntityType = 
  | 'language' 
  | 'framework' 
  | 'library' 
  | 'module' 
  | 'class' 
  | 'concept' 
  | 'guide' 
  | 'pipeline';

export type SymbolKind = 
  | 'class' 
  | 'constructor' 
  | 'method' 
  | 'function' 
  | 'property' 
  | 'interface' 
  | 'enum' 
  | 'constant';

export type RelationshipType = 
  | 'requires' 
  | 'depends_on' 
  | 'related_to' 
  | 'implements' 
  | 'alternative_to' 
  | 'used_by' 
  | 'prerequisite_for';

export type CompletenessStatus = 
  | 'complete' 
  | 'partial' 
  | 'metadata_only' 
  | 'outdated' 
  | 'unverified';

export interface ParameterRecord {
  id: string;
  symbol_id: string;
  name: string;
  data_type: string;
  default_value?: string | null;
  is_required: boolean;
  is_optional: boolean;
  is_named: boolean;
  description: string;
  sort_order: number;
}

export interface SymbolRecord {
  id: string;
  document_id: string;
  name: string;
  kind: SymbolKind;
  syntax: string;
  return_type?: string | null;
  description: string;
  is_static: boolean;
  is_async: boolean;
  is_deprecated: boolean;
  deprecation_reason?: string | null;
  parameters: ParameterRecord[];
  sort_order: number;
}

export interface CodeExample {
  id: string;
  document_id: string;
  symbol_id?: string | null;
  title: string;
  description?: string | null;
  code: string;
  language: string;
  expected_output?: string | null;
  source_attribution?: string | null;
  sort_order: number;
}

export interface PipelineStep {
  id: string;
  pipeline_id: string;
  step_number: number;
  title: string;
  explanation: string;
  input_data?: string | null;
  output_data?: string | null;
  syntax?: string | null;
  code_example?: string | null;
  error_handling?: string | null;
  sort_order: number;
}

export interface ImplementationPipeline {
  id: string;
  document_id: string;
  name: string;
  description?: string | null;
  objective: string;
  steps: PipelineStep[];
  sort_order: number;
}

export interface SourceMetadata {
  id: string;
  name: string;
  url: string;
  source_type: 'official_website' | 'git_repo' | 'registry' | 'api_spec' | 'manual_curation';
  license: string;
  retrieval_date: string;
  content_hash?: string | null;
  metadata_json?: string | null;
}

export interface RelationshipRecord {
  id: string;
  source_doc_id: string;
  target_doc_id: string;
  relationship_type: RelationshipType;
  description?: string | null;
}

export interface PackageMetadata {
  name: string;
  manager: string;
  installation: string;
  repository_url?: string;
  documentation_url?: string;
  license: string;
}

export interface DocumentationSections {
  overview: string;
  purpose?: string;
  installation?: string;
  configuration?: string;
  security_considerations?: string;
  error_handling?: string;
  compatibility?: string;
  troubleshooting?: string;
}

export interface DocumentationRecord {
  id: string;
  library_id?: string | null;
  category_id?: string | null;
  source_id?: string | null;
  title: string;
  slug: string;
  type: EntityType;
  language: string;
  runtime?: string | null;
  categories: string[];
  package?: PackageMetadata;
  documentation: DocumentationSections;
  symbols: SymbolRecord[];
  examples: CodeExample[];
  pipelines: ImplementationPipeline[];
  relationships: RelationshipRecord[];
  metadata: {
    source_url: string;
    license: string;
    documentation_version: string;
    completeness_status: CompletenessStatus;
    last_verified?: string | null;
  };
}
