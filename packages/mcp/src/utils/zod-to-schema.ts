/**
 * @riktajs/mcp - Zod to JSON Schema Conversion
 * 
 * Utilities for converting Zod schemas to JSON Schema format
 * compatible with @platformatic/mcp.
 */
import { z, type ZodType } from 'zod';

/**
 * JSON Schema type (simplified)
 */
export type JsonSchema = Record<string, unknown>;

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
export function zodToMCPSchema(schema: ZodType): JsonSchema {
  // Use Zod v4 native toJSONSchema
  const jsonSchema = z.toJSONSchema(schema) as JsonSchema;

  // Remove $schema property as MCP doesn't need it
  if (typeof jsonSchema === 'object' && jsonSchema !== null) {
    const result = { ...jsonSchema };
    delete result.$schema;
    return result;
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
): JsonSchema | undefined {
  if (!schemaOrUndefined) {
    return undefined;
  }
  
  if (isZodSchema(schemaOrUndefined)) {
    return zodToMCPSchema(schemaOrUndefined);
  }
  
  return undefined;
}
