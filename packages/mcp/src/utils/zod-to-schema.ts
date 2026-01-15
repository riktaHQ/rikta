/**
 * @riktajs/mcp - Zod to JSON Schema Conversion
 * 
 * Utilities for converting Zod schemas to JSON Schema format
 * compatible with @platformatic/mcp.
 */
import type { ZodType, ZodTypeDef } from 'zod';
import { zodToJsonSchema, type JsonSchema7Type } from 'zod-to-json-schema';

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
 * Convert a Zod schema to JSON Schema format for MCP
 * 
 * @param schema - The Zod schema to convert
 * @returns JSON Schema object compatible with MCP
 * 
 * @example
 * ```typescript
 * import { z } from 'zod';
 * 
 * const schema = z.object({
 *   path: z.string().describe('File path'),
 *   encoding: z.string().optional(),
 * });
 * 
 * const jsonSchema = zodToMCPSchema(schema);
 * // {
 * //   type: 'object',
 * //   properties: {
 * //     path: { type: 'string', description: 'File path' },
 * //     encoding: { type: 'string' }
 * //   },
 * //   required: ['path']
 * // }
 * ```
 */
export function zodToMCPSchema(schema: ZodType): JsonSchema7Type {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none', // Inline all references
  });

  // Remove $schema property as MCP doesn't need it
  if (typeof jsonSchema === 'object' && jsonSchema !== null) {
    const result = { ...jsonSchema } as Record<string, unknown>;
    delete result.$schema;
    return result as JsonSchema7Type;
  }

  return jsonSchema;
}

/**
 * Convert a Zod schema to JSON Schema, or return undefined if not a Zod schema
 * 
 * @param schemaOrUndefined - The Zod schema or undefined
 * @returns JSON Schema object or undefined
 */
export function toMCPSchema(
  schemaOrUndefined: ZodType | undefined
): JsonSchema7Type | undefined {
  if (!schemaOrUndefined) {
    return undefined;
  }
  
  if (isZodSchema(schemaOrUndefined)) {
    return zodToMCPSchema(schemaOrUndefined);
  }
  
  return undefined;
}
