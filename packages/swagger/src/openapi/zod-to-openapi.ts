import { z, type ZodType } from 'zod';
import type { OpenApiSchemaObject } from '../types.js';

/**
 * JSON Schema type (simplified)
 */
type JsonSchema = Record<string, unknown>;

/**
 * Type guard to check if a value is a Zod schema
 * Uses duck typing to detect Zod schemas without requiring the full library
 * Compatible with both Zod v3 (_def) and Zod v4 (_zod)
 */
export function isZodSchema(value: unknown): value is ZodType<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    ('_zod' in value || '_def' in value) &&
    'safeParse' in value &&
    typeof (value as { safeParse: unknown }).safeParse === 'function'
  );
}

/**
 * Convert JSON Schema to OpenAPI 3.0 compatible schema
 * 
 * Main differences:
 * - OpenAPI uses `nullable: true` instead of `type: ['string', 'null']`
 * - OpenAPI 3.0 doesn't support `$schema`, `$id`, etc.
 * - Some JSON Schema features need to be simplified
 */
function jsonSchemaToOpenApi(jsonSchema: JsonSchema | boolean): OpenApiSchemaObject {
  if (typeof jsonSchema === 'boolean') {
    return jsonSchema ? {} : { not: {} };
  }

  const result: OpenApiSchemaObject = {};
  const schema = jsonSchema as Record<string, unknown>;

  // Handle type with null (convert to nullable)
  if (Array.isArray(schema.type)) {
    const types = schema.type as string[];
    const nullIndex = types.indexOf('null');
    if (nullIndex !== -1) {
      result.nullable = true;
      const nonNullTypes = types.filter(t => t !== 'null');
      if (nonNullTypes.length === 1) {
        result.type = nonNullTypes[0] as OpenApiSchemaObject['type'];
      } else if (nonNullTypes.length > 1) {
        // Multiple non-null types - use oneOf
        result.oneOf = nonNullTypes.map(t => ({ type: t as OpenApiSchemaObject['type'] }));
      }
    } else if (types.length === 1) {
      result.type = types[0] as OpenApiSchemaObject['type'];
    }
  } else if (schema.type) {
    result.type = schema.type as OpenApiSchemaObject['type'];
  }

  // Copy simple properties
  const simpleProps = [
    'format', 'description', 'default', 'example', 'enum',
    'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
    'minLength', 'maxLength', 'pattern',
    'minItems', 'maxItems', 'uniqueItems',
    'minProperties', 'maxProperties',
    'required', 'readOnly', 'writeOnly', 'deprecated',
  ] as const;

  for (const prop of simpleProps) {
    if (schema[prop] !== undefined) {
      (result as Record<string, unknown>)[prop] = schema[prop];
    }
  }

  // Handle items (for arrays)
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      // Tuple - OpenAPI 3.0 doesn't support tuple validation well
      result.items = { oneOf: (schema.items as JsonSchema[]).map(jsonSchemaToOpenApi) };
    } else {
      result.items = jsonSchemaToOpenApi(schema.items as JsonSchema);
    }
  }

  // Handle properties (for objects)
  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties as Record<string, JsonSchema>)) {
      result.properties[key] = jsonSchemaToOpenApi(value);
    }
  }

  // Handle additionalProperties
  if (schema.additionalProperties !== undefined) {
    if (typeof schema.additionalProperties === 'boolean') {
      result.additionalProperties = schema.additionalProperties;
    } else {
      result.additionalProperties = jsonSchemaToOpenApi(schema.additionalProperties as JsonSchema);
    }
  }

  // Handle allOf, oneOf, anyOf
  if (schema.allOf) {
    result.allOf = (schema.allOf as JsonSchema[]).map(jsonSchemaToOpenApi);
  }
  if (schema.oneOf) {
    result.oneOf = (schema.oneOf as JsonSchema[]).map(jsonSchemaToOpenApi);
  }
  if (schema.anyOf) {
    result.anyOf = (schema.anyOf as JsonSchema[]).map(jsonSchemaToOpenApi);
  }

  // Handle not
  if (schema.not) {
    result.not = jsonSchemaToOpenApi(schema.not as JsonSchema);
  }

  // Handle const (convert to enum with single value)
  if (schema.const !== undefined) {
    result.enum = [schema.const];
  }

  return result;
}

/**
 * Convert a Zod schema to an OpenAPI 3.0 schema object
 * 
 * Uses Zod v4's native z.toJSONSchema() for the heavy lifting, then converts
 * JSON Schema to OpenAPI 3.0 compatible format.
 * 
 * Supports all Zod types including:
 * - Primitives: string, number, boolean, bigint
 * - Complex: object, array, tuple, record
 * - Modifiers: optional, nullable, default
 * - Validators: min, max, email, uuid, url, etc.
 * - Enums: enum, nativeEnum
 * - Unions and intersections
 * - Literals
 * - Effects (transform, refine)
 * 
 * @param schema - The Zod schema to convert
 * @returns OpenAPI schema object
 * 
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   id: z.string().uuid(),
 *   email: z.string().email(),
 *   age: z.number().int().min(0).optional(),
 * });
 * 
 * const openApiSchema = zodToOpenApi(UserSchema);
 * // {
 * //   type: 'object',
 * //   properties: {
 * //     id: { type: 'string', format: 'uuid' },
 * //     email: { type: 'string', format: 'email' },
 * //     age: { type: 'integer', minimum: 0 }
 * //   },
 * //   required: ['id', 'email']
 * // }
 * ```
 */
export function zodToOpenApi(schema: ZodType): OpenApiSchemaObject {
  // Convert to JSON Schema using Zod v4 native method with OpenAPI 3.0 target
  // and custom handling for unrepresentable types
  const jsonSchema = z.toJSONSchema(schema, {
    // Target OpenAPI 3.0 Schema Object format
    target: 'openapi-3.0',
    // Allow unrepresentable types to be converted to {} instead of throwing
    unrepresentable: 'any',
    // Custom override for types that need special handling
    override: (ctx) => {
      const def = ctx.zodSchema._zod?.def;
      if (!def) return;
      
      // Handle z.date() - convert to string with date-time format
      if (def.type === 'date') {
        ctx.jsonSchema.type = 'string';
        ctx.jsonSchema.format = 'date-time';
      }
      
      // Handle z.bigint() - convert to integer with int64 format
      if (def.type === 'bigint') {
        ctx.jsonSchema.type = 'integer';
        ctx.jsonSchema.format = 'int64';
      }
    },
  }) as JsonSchema;

  // Convert JSON Schema to OpenAPI format (handle remaining differences)
  return jsonSchemaToOpenApi(jsonSchema);
}

/**
 * Convert a Zod schema to OpenAPI schema, or pass through if already an OpenAPI schema
 */
export function toOpenApiSchema(
  schemaOrOpenApi: ZodType | OpenApiSchemaObject | undefined
): OpenApiSchemaObject | undefined {
  if (!schemaOrOpenApi) {
    return undefined;
  }
  
  if (isZodSchema(schemaOrOpenApi)) {
    return zodToOpenApi(schemaOrOpenApi);
  }
  
  // Already an OpenAPI schema object
  return schemaOrOpenApi as OpenApiSchemaObject;
}
