import type { ZodType, ZodTypeDef } from 'zod';
import { zodToJsonSchema, type JsonSchema7Type } from 'zod-to-json-schema';
import type { OpenApiSchemaObject } from '../types.js';

/**
 * Type guard to check if a value is a Zod schema
 * Uses duck typing to detect Zod schemas without requiring the full library
 */
export function isZodSchema(value: unknown): value is ZodType<unknown, ZodTypeDef, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    '_def' in value &&
    'safeParse' in value &&
    typeof (value as { safeParse: unknown }).safeParse === 'function'
  );
}

/**
 * Convert JSON Schema 7 to OpenAPI 3.0 compatible schema
 * 
 * Main differences:
 * - OpenAPI uses `nullable: true` instead of `type: ['string', 'null']`
 * - OpenAPI 3.0 doesn't support `$schema`, `$id`, etc.
 * - Some JSON Schema features need to be simplified
 */
function jsonSchemaToOpenApi(jsonSchema: JsonSchema7Type): OpenApiSchemaObject {
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
      result.items = { oneOf: (schema.items as JsonSchema7Type[]).map(jsonSchemaToOpenApi) };
    } else {
      result.items = jsonSchemaToOpenApi(schema.items as JsonSchema7Type);
    }
  }

  // Handle properties (for objects)
  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties as Record<string, JsonSchema7Type>)) {
      result.properties[key] = jsonSchemaToOpenApi(value);
    }
  }

  // Handle additionalProperties
  if (schema.additionalProperties !== undefined) {
    if (typeof schema.additionalProperties === 'boolean') {
      result.additionalProperties = schema.additionalProperties;
    } else {
      result.additionalProperties = jsonSchemaToOpenApi(schema.additionalProperties as JsonSchema7Type);
    }
  }

  // Handle allOf, oneOf, anyOf
  if (schema.allOf) {
    result.allOf = (schema.allOf as JsonSchema7Type[]).map(jsonSchemaToOpenApi);
  }
  if (schema.oneOf) {
    result.oneOf = (schema.oneOf as JsonSchema7Type[]).map(jsonSchemaToOpenApi);
  }
  if (schema.anyOf) {
    result.anyOf = (schema.anyOf as JsonSchema7Type[]).map(jsonSchemaToOpenApi);
  }

  // Handle not
  if (schema.not) {
    result.not = jsonSchemaToOpenApi(schema.not as JsonSchema7Type);
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
 * Uses `zod-to-json-schema` for the heavy lifting, then converts
 * JSON Schema 7 to OpenAPI 3.0 compatible format.
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
  // Convert to JSON Schema using zod-to-json-schema
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'openApi3',
    $refStrategy: 'none', // Inline all references
  });

  // Convert JSON Schema to OpenAPI format
  // The result from zodToJsonSchema may include $schema and definitions
  // which are not part of JsonSchema7Type but are compatible
  return jsonSchemaToOpenApi(jsonSchema as JsonSchema7Type);
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
