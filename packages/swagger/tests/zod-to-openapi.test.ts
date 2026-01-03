import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToOpenApi, isZodSchema, toOpenApiSchema } from '../src/openapi/zod-to-openapi.js';

describe('Zod to OpenAPI Converter', () => {
  describe('isZodSchema', () => {
    it('should detect Zod schemas', () => {
      expect(isZodSchema(z.string())).toBe(true);
      expect(isZodSchema(z.object({}))).toBe(true);
      expect(isZodSchema(z.array(z.string()))).toBe(true);
    });

    it('should reject non-Zod values', () => {
      expect(isZodSchema(null)).toBe(false);
      expect(isZodSchema(undefined)).toBe(false);
      expect(isZodSchema({})).toBe(false);
      expect(isZodSchema({ type: 'string' })).toBe(false);
      expect(isZodSchema('string')).toBe(false);
    });
  });

  describe('Primitive types', () => {
    it('should convert z.string()', () => {
      const result = zodToOpenApi(z.string());
      expect(result).toEqual({ type: 'string' });
    });

    it('should convert z.number()', () => {
      const result = zodToOpenApi(z.number());
      expect(result).toEqual({ type: 'number' });
    });

    it('should convert z.number().int()', () => {
      const result = zodToOpenApi(z.number().int());
      expect(result).toEqual({ type: 'integer' });
    });

    it('should convert z.boolean()', () => {
      const result = zodToOpenApi(z.boolean());
      expect(result).toEqual({ type: 'boolean' });
    });

    it('should convert z.bigint()', () => {
      const result = zodToOpenApi(z.bigint());
      expect(result).toEqual({ type: 'integer', format: 'int64' });
    });

    it('should convert z.date()', () => {
      const result = zodToOpenApi(z.date());
      expect(result).toEqual({ type: 'string', format: 'date-time' });
    });
  });

  describe('String validations', () => {
    it('should convert z.string().email()', () => {
      const result = zodToOpenApi(z.string().email());
      expect(result).toEqual({ type: 'string', format: 'email' });
    });

    it('should convert z.string().uuid()', () => {
      const result = zodToOpenApi(z.string().uuid());
      expect(result).toEqual({ type: 'string', format: 'uuid' });
    });

    it('should convert z.string().url()', () => {
      const result = zodToOpenApi(z.string().url());
      expect(result).toEqual({ type: 'string', format: 'uri' });
    });

    it('should convert z.string().datetime()', () => {
      const result = zodToOpenApi(z.string().datetime());
      expect(result).toEqual({ type: 'string', format: 'date-time' });
    });

    it('should convert z.string().min().max()', () => {
      const result = zodToOpenApi(z.string().min(3).max(100));
      expect(result).toEqual({ type: 'string', minLength: 3, maxLength: 100 });
    });

    it('should convert z.string().length()', () => {
      const result = zodToOpenApi(z.string().length(10));
      expect(result).toEqual({ type: 'string', minLength: 10, maxLength: 10 });
    });

    it('should convert z.string().regex()', () => {
      const result = zodToOpenApi(z.string().regex(/^[a-z]+$/));
      expect(result).toEqual({ type: 'string', pattern: '^[a-z]+$' });
    });
  });

  describe('Number validations', () => {
    it('should convert z.number().min().max()', () => {
      const result = zodToOpenApi(z.number().min(0).max(100));
      expect(result).toEqual({ type: 'number', minimum: 0, maximum: 100 });
    });

    it('should convert z.number().int().min().max()', () => {
      const result = zodToOpenApi(z.number().int().min(1).max(10));
      expect(result).toEqual({ type: 'integer', minimum: 1, maximum: 10 });
    });
  });

  describe('Enums', () => {
    it('should convert z.enum()', () => {
      const result = zodToOpenApi(z.enum(['admin', 'user', 'guest']));
      expect(result).toEqual({ type: 'string', enum: ['admin', 'user', 'guest'] });
    });

    it('should convert z.nativeEnum() with string enum', () => {
      enum Role { Admin = 'admin', User = 'user' }
      const result = zodToOpenApi(z.nativeEnum(Role));
      expect(result.enum).toContain('admin');
      expect(result.enum).toContain('user');
    });
  });

  describe('Literals', () => {
    it('should convert z.literal() with string', () => {
      const result = zodToOpenApi(z.literal('active'));
      expect(result).toEqual({ type: 'string', enum: ['active'] });
    });

    it('should convert z.literal() with number', () => {
      const result = zodToOpenApi(z.literal(42));
      expect(result).toEqual({ type: 'number', enum: [42] });
    });

    it('should convert z.literal() with boolean', () => {
      const result = zodToOpenApi(z.literal(true));
      expect(result).toEqual({ type: 'boolean', enum: [true] });
    });
  });

  describe('Arrays', () => {
    it('should convert z.array()', () => {
      const result = zodToOpenApi(z.array(z.string()));
      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('should convert z.array().min().max()', () => {
      const result = zodToOpenApi(z.array(z.number()).min(1).max(10));
      expect(result).toEqual({
        type: 'array',
        items: { type: 'number' },
        minItems: 1,
        maxItems: 10,
      });
    });

    it('should convert nested arrays', () => {
      const result = zodToOpenApi(z.array(z.array(z.string())));
      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      });
    });
  });

  describe('Objects', () => {
    it('should convert z.object()', () => {
      const result = zodToOpenApi(z.object({
        name: z.string(),
        age: z.number(),
      }));
      expect(result.type).toBe('object');
      expect(result.properties?.name).toEqual({ type: 'string' });
      expect(result.properties?.age).toEqual({ type: 'number' });
      expect(result.required).toEqual(['name', 'age']);
    });

    it('should handle optional properties', () => {
      const result = zodToOpenApi(z.object({
        name: z.string(),
        age: z.number().optional(),
      }));
      expect(result.type).toBe('object');
      expect(result.properties?.name).toEqual({ type: 'string' });
      expect(result.properties?.age).toEqual({ type: 'number' });
      expect(result.required).toEqual(['name']);
    });

    it('should handle all optional properties', () => {
      const result = zodToOpenApi(z.object({
        name: z.string().optional(),
        age: z.number().optional(),
      }));
      expect(result.type).toBe('object');
      expect(result.properties?.name).toEqual({ type: 'string' });
      expect(result.properties?.age).toEqual({ type: 'number' });
      expect(result.required).toBeUndefined();
    });

    it('should convert nested objects', () => {
      const result = zodToOpenApi(z.object({
        user: z.object({
          name: z.string(),
        }),
      }));
      expect(result.type).toBe('object');
      expect(result.properties?.user).toBeDefined();
      const userProp = result.properties?.user as Record<string, unknown>;
      expect(userProp.type).toBe('object');
      expect((userProp.properties as Record<string, unknown>)?.name).toEqual({ type: 'string' });
      expect(userProp.required).toEqual(['name']);
      expect(result.required).toEqual(['user']);
    });
  });

  describe('Records', () => {
    it('should convert z.record()', () => {
      const result = zodToOpenApi(z.record(z.string(), z.number()));
      expect(result).toEqual({
        type: 'object',
        additionalProperties: { type: 'number' },
      });
    });
  });

  describe('Unions', () => {
    it('should convert z.union()', () => {
      const result = zodToOpenApi(z.union([z.string(), z.number()]));
      // zod-to-json-schema uses anyOf for unions
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(2);
      expect(result.anyOf?.[0]).toEqual({ type: 'string' });
      expect(result.anyOf?.[1]).toEqual({ type: 'number' });
    });

    it('should convert string literal unions', () => {
      const result = zodToOpenApi(z.union([z.literal('a'), z.literal('b'), z.literal('c')]));
      // zod-to-json-schema uses anyOf for unions, which is valid OpenAPI
      expect(result.anyOf).toBeDefined();
      expect(result.anyOf).toHaveLength(3);
    });
  });

  describe('Intersections', () => {
    it('should convert z.intersection()', () => {
      const result = zodToOpenApi(z.intersection(
        z.object({ name: z.string() }),
        z.object({ age: z.number() })
      ));
      expect(result).toEqual({
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          { type: 'object', properties: { age: { type: 'number' } }, required: ['age'] },
        ],
      });
    });
  });

  describe('Modifiers', () => {
    it('should convert z.optional()', () => {
      const result = zodToOpenApi(z.string().optional());
      // zod-to-json-schema represents optionals as anyOf with undefined, OpenAPI handles this at object level
      expect(result.anyOf || result.type).toBeDefined();
    });

    it('should convert z.nullable()', () => {
      const result = zodToOpenApi(z.string().nullable());
      // OpenAPI 3.1 uses anyOf with null type, or nullable: true in 3.0
      expect(result.type === 'string' || result.anyOf).toBeTruthy();
    });

    it('should convert z.default()', () => {
      const result = zodToOpenApi(z.string().default('hello'));
      expect(result).toEqual({ type: 'string', default: 'hello' });
    });

    it('should convert z.describe()', () => {
      const result = zodToOpenApi(z.string().describe('A user name'));
      expect(result).toEqual({ type: 'string', description: 'A user name' });
    });
  });

  describe('Effects', () => {
    it('should handle z.transform()', () => {
      const result = zodToOpenApi(z.string().transform(s => parseInt(s)));
      expect(result).toEqual({ type: 'string' });
    });

    it('should handle z.refine()', () => {
      const result = zodToOpenApi(z.string().refine(s => s.length > 0));
      expect(result).toEqual({ type: 'string' });
    });
  });

  describe('toOpenApiSchema helper', () => {
    it('should convert Zod schema', () => {
      const result = toOpenApiSchema(z.string());
      expect(result).toEqual({ type: 'string' });
    });

    it('should pass through OpenAPI schema', () => {
      const openApiSchema = { type: 'string' as const, format: 'email' };
      const result = toOpenApiSchema(openApiSchema);
      expect(result).toEqual(openApiSchema);
    });

    it('should return undefined for undefined input', () => {
      const result = toOpenApiSchema(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('Complex schemas', () => {
    it('should convert a complete User schema', () => {
      const UserSchema = z.object({
        id: z.string().uuid().describe('Unique user identifier'),
        email: z.string().email(),
        name: z.string().min(2).max(100),
        age: z.number().int().min(0).max(150).optional(),
        role: z.enum(['admin', 'user', 'guest']).default('user'),
        createdAt: z.date(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      });

      const result = zodToOpenApi(UserSchema);

      expect(result.type).toBe('object');
      expect(result.properties?.id).toEqual({
        type: 'string',
        format: 'uuid',
        description: 'Unique user identifier',
      });
      expect(result.properties?.email).toEqual({ type: 'string', format: 'email' });
      expect(result.properties?.name).toEqual({ type: 'string', minLength: 2, maxLength: 100 });
      expect(result.properties?.age).toEqual({ type: 'integer', minimum: 0, maximum: 150 });
      expect(result.properties?.role).toEqual({ type: 'string', enum: ['admin', 'user', 'guest'], default: 'user' });
      expect(result.properties?.createdAt).toEqual({ type: 'string', format: 'date-time' });
      expect(result.required).toContain('id');
      expect(result.required).toContain('email');
      expect(result.required).toContain('name');
      expect(result.required).not.toContain('age');
      expect(result.required).not.toContain('metadata');
    });
  });
});
