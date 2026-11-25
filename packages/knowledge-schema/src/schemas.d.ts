import { z } from 'zod';
export declare const ParameterSchema: z.ZodObject<{
    id: z.ZodString;
    symbol_id: z.ZodString;
    name: z.ZodString;
    data_type: z.ZodString;
    default_value: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_required: z.ZodDefault<z.ZodBoolean>;
    is_optional: z.ZodDefault<z.ZodBoolean>;
    is_named: z.ZodDefault<z.ZodBoolean>;
    description: z.ZodString;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    symbol_id: string;
    name: string;
    data_type: string;
    is_required: boolean;
    is_optional: boolean;
    is_named: boolean;
    description: string;
    sort_order: number;
    default_value?: string | null | undefined;
}, {
    id: string;
    symbol_id: string;
    name: string;
    data_type: string;
    description: string;
    default_value?: string | null | undefined;
    is_required?: boolean | undefined;
    is_optional?: boolean | undefined;
    is_named?: boolean | undefined;
    sort_order?: number | undefined;
}>;
export declare const SymbolKindSchema: z.ZodEnum<["class", "constructor", "method", "function", "property", "interface", "enum", "constant"]>;
export declare const SymbolSchema: z.ZodObject<{
    id: z.ZodString;
    document_id: z.ZodString;
    name: z.ZodString;
    kind: z.ZodEnum<["class", "constructor", "method", "function", "property", "interface", "enum", "constant"]>;
    syntax: z.ZodString;
    return_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodString;
    is_static: z.ZodDefault<z.ZodBoolean>;
    is_async: z.ZodDefault<z.ZodBoolean>;
    is_deprecated: z.ZodDefault<z.ZodBoolean>;
    deprecation_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    parameters: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        symbol_id: z.ZodString;
        name: z.ZodString;
        data_type: z.ZodString;
        default_value: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        is_required: z.ZodDefault<z.ZodBoolean>;
        is_optional: z.ZodDefault<z.ZodBoolean>;
        is_named: z.ZodDefault<z.ZodBoolean>;
        description: z.ZodString;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        symbol_id: string;
        name: string;
        data_type: string;
        is_required: boolean;
        is_optional: boolean;
        is_named: boolean;
        description: string;
        sort_order: number;
        default_value?: string | null | undefined;
    }, {
        id: string;
        symbol_id: string;
        name: string;
        data_type: string;
        description: string;
        default_value?: string | null | undefined;
        is_required?: boolean | undefined;
        is_optional?: boolean | undefined;
        is_named?: boolean | undefined;
        sort_order?: number | undefined;
    }>, "many">>;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    sort_order: number;
    document_id: string;
    kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
    syntax: string;
    is_static: boolean;
    is_async: boolean;
    is_deprecated: boolean;
    parameters: {
        id: string;
        symbol_id: string;
        name: string;
        data_type: string;
        is_required: boolean;
        is_optional: boolean;
        is_named: boolean;
        description: string;
        sort_order: number;
        default_value?: string | null | undefined;
    }[];
    return_type?: string | null | undefined;
    deprecation_reason?: string | null | undefined;
}, {
    id: string;
    name: string;
    description: string;
    document_id: string;
    kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
    syntax: string;
    sort_order?: number | undefined;
    return_type?: string | null | undefined;
    is_static?: boolean | undefined;
    is_async?: boolean | undefined;
    is_deprecated?: boolean | undefined;
    deprecation_reason?: string | null | undefined;
    parameters?: {
        id: string;
        symbol_id: string;
        name: string;
        data_type: string;
        description: string;
        default_value?: string | null | undefined;
        is_required?: boolean | undefined;
        is_optional?: boolean | undefined;
        is_named?: boolean | undefined;
        sort_order?: number | undefined;
    }[] | undefined;
}>;
export declare const CodeExampleSchema: z.ZodObject<{
    id: z.ZodString;
    document_id: z.ZodString;
    symbol_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    code: z.ZodString;
    language: z.ZodString;
    expected_output: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source_attribution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    language: string;
    id: string;
    sort_order: number;
    code: string;
    document_id: string;
    title: string;
    symbol_id?: string | null | undefined;
    description?: string | null | undefined;
    expected_output?: string | null | undefined;
    source_attribution?: string | null | undefined;
}, {
    language: string;
    id: string;
    code: string;
    document_id: string;
    title: string;
    symbol_id?: string | null | undefined;
    description?: string | null | undefined;
    sort_order?: number | undefined;
    expected_output?: string | null | undefined;
    source_attribution?: string | null | undefined;
}>;
export declare const PipelineStepSchema: z.ZodObject<{
    id: z.ZodString;
    pipeline_id: z.ZodString;
    step_number: z.ZodNumber;
    title: z.ZodString;
    explanation: z.ZodString;
    input_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    output_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    syntax: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    code_example: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    error_handling: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sort_order: number;
    title: string;
    pipeline_id: string;
    step_number: number;
    explanation: string;
    syntax?: string | null | undefined;
    input_data?: string | null | undefined;
    output_data?: string | null | undefined;
    code_example?: string | null | undefined;
    error_handling?: string | null | undefined;
}, {
    id: string;
    title: string;
    pipeline_id: string;
    step_number: number;
    explanation: string;
    sort_order?: number | undefined;
    syntax?: string | null | undefined;
    input_data?: string | null | undefined;
    output_data?: string | null | undefined;
    code_example?: string | null | undefined;
    error_handling?: string | null | undefined;
}>;
export declare const ImplementationPipelineSchema: z.ZodObject<{
    id: z.ZodString;
    document_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    objective: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pipeline_id: z.ZodString;
        step_number: z.ZodNumber;
        title: z.ZodString;
        explanation: z.ZodString;
        input_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        output_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        syntax: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        code_example: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        error_handling: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        sort_order: number;
        title: string;
        pipeline_id: string;
        step_number: number;
        explanation: string;
        syntax?: string | null | undefined;
        input_data?: string | null | undefined;
        output_data?: string | null | undefined;
        code_example?: string | null | undefined;
        error_handling?: string | null | undefined;
    }, {
        id: string;
        title: string;
        pipeline_id: string;
        step_number: number;
        explanation: string;
        sort_order?: number | undefined;
        syntax?: string | null | undefined;
        input_data?: string | null | undefined;
        output_data?: string | null | undefined;
        code_example?: string | null | undefined;
        error_handling?: string | null | undefined;
    }>, "many">;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    sort_order: number;
    document_id: string;
    objective: string;
    steps: {
        id: string;
        sort_order: number;
        title: string;
        pipeline_id: string;
        step_number: number;
        explanation: string;
        syntax?: string | null | undefined;
        input_data?: string | null | undefined;
        output_data?: string | null | undefined;
        code_example?: string | null | undefined;
        error_handling?: string | null | undefined;
    }[];
    description?: string | null | undefined;
}, {
    id: string;
    name: string;
    document_id: string;
    objective: string;
    steps: {
        id: string;
        title: string;
        pipeline_id: string;
        step_number: number;
        explanation: string;
        sort_order?: number | undefined;
        syntax?: string | null | undefined;
        input_data?: string | null | undefined;
        output_data?: string | null | undefined;
        code_example?: string | null | undefined;
        error_handling?: string | null | undefined;
    }[];
    description?: string | null | undefined;
    sort_order?: number | undefined;
}>;
export declare const RelationshipTypeSchema: z.ZodEnum<["requires", "depends_on", "related_to", "implements", "alternative_to", "used_by", "prerequisite_for"]>;
export declare const RelationshipSchema: z.ZodObject<{
    id: z.ZodString;
    source_doc_id: z.ZodString;
    target_doc_id: z.ZodString;
    relationship_type: z.ZodEnum<["requires", "depends_on", "related_to", "implements", "alternative_to", "used_by", "prerequisite_for"]>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    source_doc_id: string;
    target_doc_id: string;
    relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
    description?: string | null | undefined;
}, {
    id: string;
    source_doc_id: string;
    target_doc_id: string;
    relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
    description?: string | null | undefined;
}>;
export declare const DocumentationSectionsSchema: z.ZodObject<{
    overview: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    installation: z.ZodOptional<z.ZodString>;
    configuration: z.ZodOptional<z.ZodString>;
    security_considerations: z.ZodOptional<z.ZodString>;
    error_handling: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    overview: string;
    error_handling?: string | undefined;
    purpose?: string | undefined;
    installation?: string | undefined;
    configuration?: string | undefined;
    security_considerations?: string | undefined;
}, {
    overview: string;
    error_handling?: string | undefined;
    purpose?: string | undefined;
    installation?: string | undefined;
    configuration?: string | undefined;
    security_considerations?: string | undefined;
}>;
export declare const CompletenessStatusSchema: z.ZodEnum<["complete", "partial", "metadata_only", "outdated", "unverified"]>;
export declare const EntityTypeSchema: z.ZodEnum<["language", "framework", "library", "module", "class", "concept", "guide", "pipeline"]>;
export declare const DocumentationRecordSchema: z.ZodObject<{
    id: z.ZodString;
    library_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    title: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["language", "framework", "library", "module", "class", "concept", "guide", "pipeline"]>;
    language: z.ZodString;
    runtime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categories: z.ZodArray<z.ZodString, "many">;
    package: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        manager: z.ZodString;
        installation: z.ZodString;
        repository_url: z.ZodOptional<z.ZodString>;
        documentation_url: z.ZodOptional<z.ZodString>;
        license: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        installation: string;
        manager: string;
        license: string;
        repository_url?: string | undefined;
        documentation_url?: string | undefined;
    }, {
        name: string;
        installation: string;
        manager: string;
        license: string;
        repository_url?: string | undefined;
        documentation_url?: string | undefined;
    }>>;
    documentation: z.ZodObject<{
        overview: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        installation: z.ZodOptional<z.ZodString>;
        configuration: z.ZodOptional<z.ZodString>;
        security_considerations: z.ZodOptional<z.ZodString>;
        error_handling: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        overview: string;
        error_handling?: string | undefined;
        purpose?: string | undefined;
        installation?: string | undefined;
        configuration?: string | undefined;
        security_considerations?: string | undefined;
    }, {
        overview: string;
        error_handling?: string | undefined;
        purpose?: string | undefined;
        installation?: string | undefined;
        configuration?: string | undefined;
        security_considerations?: string | undefined;
    }>;
    symbols: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        document_id: z.ZodString;
        name: z.ZodString;
        kind: z.ZodEnum<["class", "constructor", "method", "function", "property", "interface", "enum", "constant"]>;
        syntax: z.ZodString;
        return_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        description: z.ZodString;
        is_static: z.ZodDefault<z.ZodBoolean>;
        is_async: z.ZodDefault<z.ZodBoolean>;
        is_deprecated: z.ZodDefault<z.ZodBoolean>;
        deprecation_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        parameters: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            symbol_id: z.ZodString;
            name: z.ZodString;
            data_type: z.ZodString;
            default_value: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            is_required: z.ZodDefault<z.ZodBoolean>;
            is_optional: z.ZodDefault<z.ZodBoolean>;
            is_named: z.ZodDefault<z.ZodBoolean>;
            description: z.ZodString;
            sort_order: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            is_required: boolean;
            is_optional: boolean;
            is_named: boolean;
            description: string;
            sort_order: number;
            default_value?: string | null | undefined;
        }, {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            description: string;
            default_value?: string | null | undefined;
            is_required?: boolean | undefined;
            is_optional?: boolean | undefined;
            is_named?: boolean | undefined;
            sort_order?: number | undefined;
        }>, "many">>;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        sort_order: number;
        document_id: string;
        kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
        syntax: string;
        is_static: boolean;
        is_async: boolean;
        is_deprecated: boolean;
        parameters: {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            is_required: boolean;
            is_optional: boolean;
            is_named: boolean;
            description: string;
            sort_order: number;
            default_value?: string | null | undefined;
        }[];
        return_type?: string | null | undefined;
        deprecation_reason?: string | null | undefined;
    }, {
        id: string;
        name: string;
        description: string;
        document_id: string;
        kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
        syntax: string;
        sort_order?: number | undefined;
        return_type?: string | null | undefined;
        is_static?: boolean | undefined;
        is_async?: boolean | undefined;
        is_deprecated?: boolean | undefined;
        deprecation_reason?: string | null | undefined;
        parameters?: {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            description: string;
            default_value?: string | null | undefined;
            is_required?: boolean | undefined;
            is_optional?: boolean | undefined;
            is_named?: boolean | undefined;
            sort_order?: number | undefined;
        }[] | undefined;
    }>, "many">>;
    examples: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        document_id: z.ZodString;
        symbol_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        code: z.ZodString;
        language: z.ZodString;
        expected_output: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        source_attribution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        id: string;
        sort_order: number;
        code: string;
        document_id: string;
        title: string;
        symbol_id?: string | null | undefined;
        description?: string | null | undefined;
        expected_output?: string | null | undefined;
        source_attribution?: string | null | undefined;
    }, {
        language: string;
        id: string;
        code: string;
        document_id: string;
        title: string;
        symbol_id?: string | null | undefined;
        description?: string | null | undefined;
        sort_order?: number | undefined;
        expected_output?: string | null | undefined;
        source_attribution?: string | null | undefined;
    }>, "many">>;
    pipelines: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        document_id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        objective: z.ZodString;
        steps: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            pipeline_id: z.ZodString;
            step_number: z.ZodNumber;
            title: z.ZodString;
            explanation: z.ZodString;
            input_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            output_data: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            syntax: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            code_example: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            error_handling: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            sort_order: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            sort_order: number;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }, {
            id: string;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            sort_order?: number | undefined;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }>, "many">;
        sort_order: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        sort_order: number;
        document_id: string;
        objective: string;
        steps: {
            id: string;
            sort_order: number;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }[];
        description?: string | null | undefined;
    }, {
        id: string;
        name: string;
        document_id: string;
        objective: string;
        steps: {
            id: string;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            sort_order?: number | undefined;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }[];
        description?: string | null | undefined;
        sort_order?: number | undefined;
    }>, "many">>;
    relationships: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source_doc_id: z.ZodString;
        target_doc_id: z.ZodString;
        relationship_type: z.ZodEnum<["requires", "depends_on", "related_to", "implements", "alternative_to", "used_by", "prerequisite_for"]>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        source_doc_id: string;
        target_doc_id: string;
        relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
        description?: string | null | undefined;
    }, {
        id: string;
        source_doc_id: string;
        target_doc_id: string;
        relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
        description?: string | null | undefined;
    }>, "many">>;
    metadata: z.ZodObject<{
        source_url: z.ZodString;
        license: z.ZodString;
        documentation_version: z.ZodDefault<z.ZodString>;
        completeness_status: z.ZodDefault<z.ZodEnum<["complete", "partial", "metadata_only", "outdated", "unverified"]>>;
        last_verified: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        license: string;
        source_url: string;
        documentation_version: string;
        completeness_status: "complete" | "partial" | "metadata_only" | "outdated" | "unverified";
        last_verified?: string | null | undefined;
    }, {
        license: string;
        source_url: string;
        documentation_version?: string | undefined;
        completeness_status?: "complete" | "partial" | "metadata_only" | "outdated" | "unverified" | undefined;
        last_verified?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    language: string;
    id: string;
    type: "language" | "framework" | "library" | "module" | "class" | "concept" | "guide" | "pipeline";
    title: string;
    slug: string;
    categories: string[];
    documentation: {
        overview: string;
        error_handling?: string | undefined;
        purpose?: string | undefined;
        installation?: string | undefined;
        configuration?: string | undefined;
        security_considerations?: string | undefined;
    };
    symbols: {
        id: string;
        name: string;
        description: string;
        sort_order: number;
        document_id: string;
        kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
        syntax: string;
        is_static: boolean;
        is_async: boolean;
        is_deprecated: boolean;
        parameters: {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            is_required: boolean;
            is_optional: boolean;
            is_named: boolean;
            description: string;
            sort_order: number;
            default_value?: string | null | undefined;
        }[];
        return_type?: string | null | undefined;
        deprecation_reason?: string | null | undefined;
    }[];
    examples: {
        language: string;
        id: string;
        sort_order: number;
        code: string;
        document_id: string;
        title: string;
        symbol_id?: string | null | undefined;
        description?: string | null | undefined;
        expected_output?: string | null | undefined;
        source_attribution?: string | null | undefined;
    }[];
    pipelines: {
        id: string;
        name: string;
        sort_order: number;
        document_id: string;
        objective: string;
        steps: {
            id: string;
            sort_order: number;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }[];
        description?: string | null | undefined;
    }[];
    relationships: {
        id: string;
        source_doc_id: string;
        target_doc_id: string;
        relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
        description?: string | null | undefined;
    }[];
    metadata: {
        license: string;
        source_url: string;
        documentation_version: string;
        completeness_status: "complete" | "partial" | "metadata_only" | "outdated" | "unverified";
        last_verified?: string | null | undefined;
    };
    library_id?: string | null | undefined;
    category_id?: string | null | undefined;
    source_id?: string | null | undefined;
    runtime?: string | null | undefined;
    package?: {
        name: string;
        installation: string;
        manager: string;
        license: string;
        repository_url?: string | undefined;
        documentation_url?: string | undefined;
    } | undefined;
}, {
    language: string;
    id: string;
    type: "language" | "framework" | "library" | "module" | "class" | "concept" | "guide" | "pipeline";
    title: string;
    slug: string;
    categories: string[];
    documentation: {
        overview: string;
        error_handling?: string | undefined;
        purpose?: string | undefined;
        installation?: string | undefined;
        configuration?: string | undefined;
        security_considerations?: string | undefined;
    };
    metadata: {
        license: string;
        source_url: string;
        documentation_version?: string | undefined;
        completeness_status?: "complete" | "partial" | "metadata_only" | "outdated" | "unverified" | undefined;
        last_verified?: string | null | undefined;
    };
    library_id?: string | null | undefined;
    category_id?: string | null | undefined;
    source_id?: string | null | undefined;
    runtime?: string | null | undefined;
    package?: {
        name: string;
        installation: string;
        manager: string;
        license: string;
        repository_url?: string | undefined;
        documentation_url?: string | undefined;
    } | undefined;
    symbols?: {
        id: string;
        name: string;
        description: string;
        document_id: string;
        kind: "function" | "class" | "constructor" | "method" | "property" | "interface" | "enum" | "constant";
        syntax: string;
        sort_order?: number | undefined;
        return_type?: string | null | undefined;
        is_static?: boolean | undefined;
        is_async?: boolean | undefined;
        is_deprecated?: boolean | undefined;
        deprecation_reason?: string | null | undefined;
        parameters?: {
            id: string;
            symbol_id: string;
            name: string;
            data_type: string;
            description: string;
            default_value?: string | null | undefined;
            is_required?: boolean | undefined;
            is_optional?: boolean | undefined;
            is_named?: boolean | undefined;
            sort_order?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    examples?: {
        language: string;
        id: string;
        code: string;
        document_id: string;
        title: string;
        symbol_id?: string | null | undefined;
        description?: string | null | undefined;
        sort_order?: number | undefined;
        expected_output?: string | null | undefined;
        source_attribution?: string | null | undefined;
    }[] | undefined;
    pipelines?: {
        id: string;
        name: string;
        document_id: string;
        objective: string;
        steps: {
            id: string;
            title: string;
            pipeline_id: string;
            step_number: number;
            explanation: string;
            sort_order?: number | undefined;
            syntax?: string | null | undefined;
            input_data?: string | null | undefined;
            output_data?: string | null | undefined;
            code_example?: string | null | undefined;
            error_handling?: string | null | undefined;
        }[];
        description?: string | null | undefined;
        sort_order?: number | undefined;
    }[] | undefined;
    relationships?: {
        id: string;
        source_doc_id: string;
        target_doc_id: string;
        relationship_type: "requires" | "depends_on" | "related_to" | "implements" | "alternative_to" | "used_by" | "prerequisite_for";
        description?: string | null | undefined;
    }[] | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map