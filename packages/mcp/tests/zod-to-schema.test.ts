/**
 * Tests for Zod to JSON Schema conversion
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToMCPSchema, toMCPSchema, isZodSchema } from '../src/utils/zod-to-schema.js';

describe('Zod to MCP Schema', () => {
  describe('isZodSchema', () => {
    it('should return true for Zod schemas', () => {
      expect(isZodSchema(z.string())).toBe(true);
      expect(isZodSchema(z.number())).toBe(true);
      expect(isZodSchema(z.object({}))).toBe(true);
      expect(isZodSchema(z.array(z.string()))).toBe(true);
    });

    it('should return false for non-Zod values', () => {
      expect(isZodSchema(null)).toBe(false);
      expect(isZodSchema(undefined)).toBe(false);
      expect(isZodSchema({})).toBe(false);
      expect(isZodSchema('string')).toBe(false);
      expect(isZodSchema(123)).toBe(false);
      expect(isZodSchema({ type: 'string' })).toBe(false);
    });
  });

  describe('zodToMCPSchema', () => {
    it('should convert simple string schema', () => {
      const schema = z.string();
      const result = zodToMCPSchema(schema);
      
      expect(result).toHaveProperty('type', 'string');
    });

    it('should convert number schema', () => {
      const schema = z.number();
      const result = zodToMCPSchema(schema);
      
      expect(result).toHaveProperty('type', 'number');
    });

    it('should convert boolean schema', () => {
      const schema = z.boolean();
      const result = zodToMCPSchema(schema);
      
      expect(result).toHaveProperty('type', 'boolean');
    });

    it('should convert object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('properties');
      expect(result.properties).toHaveProperty('name');
      expect(result.properties).toHaveProperty('age');
      expect(result).toHaveProperty('required');
      expect(result.required).toContain('name');
      expect(result.required).toContain('age');
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result.required).toContain('name');
      expect(result.required).not.toContain('nickname');
    });

    it('should convert array schema', () => {
      const schema = z.array(z.string());
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).toHaveProperty('type', 'array');
      expect(result).toHaveProperty('items');
      expect((result.items as Record<string, unknown>).type).toBe('string');
    });

    it('should include description from .describe()', () => {
      const schema = z.object({
        path: z.string().describe('The file path to read'),
      });
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      const properties = result.properties as Record<string, Record<string, unknown>>;
      
      expect(properties.path.description).toBe('The file path to read');
    });

    it('should convert enum schema', () => {
      const schema = z.enum(['a', 'b', 'c']);
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).toHaveProperty('enum');
      expect(result.enum).toEqual(['a', 'b', 'c']);
    });

    it('should handle string constraints', () => {
      const schema = z.string().min(1).max(100);
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).toHaveProperty('type', 'string');
      expect(result).toHaveProperty('minLength', 1);
      expect(result).toHaveProperty('maxLength', 100);
    });

    it('should handle number constraints', () => {
      const schema = z.number().min(0).max(100);
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).toHaveProperty('type', 'number');
      expect(result).toHaveProperty('minimum', 0);
      expect(result).toHaveProperty('maximum', 100);
    });

    it('should handle default values', () => {
      const schema = z.object({
        count: z.number().default(10),
      });
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      const properties = result.properties as Record<string, Record<string, unknown>>;
      
      expect(properties.count.default).toBe(10);
    });

    it('should not include $schema property', () => {
      const schema = z.object({ name: z.string() });
      const result = zodToMCPSchema(schema) as Record<string, unknown>;
      
      expect(result).not.toHaveProperty('$schema');
    });
  });

  describe('toMCPSchema', () => {
    it('should convert Zod schema', () => {
      const schema = z.string();
      const result = toMCPSchema(schema);
      
      expect(result).toHaveProperty('type', 'string');
    });

    it('should return undefined for undefined input', () => {
      const result = toMCPSchema(undefined);
      
      expect(result).toBeUndefined();
    });
  });
});
