import { describe, it, expect } from 'vitest';

describe('Package exports', () => {
  it('should export swagger-specific constants', async () => {
    const exports = await import('../src/index.js');
    
    expect(exports.API_TAGS_METADATA).toBeDefined();
    expect(exports.API_OPERATION_METADATA).toBeDefined();
    expect(exports.API_RESPONSE_METADATA).toBeDefined();
  });

  it('should export all swagger metadata symbols', async () => {
    const exports = await import('../src/index.js');
    
    const swaggerSymbols = [
      'API_TAGS_METADATA',
      'API_OPERATION_METADATA',
      'API_RESPONSE_METADATA',
      'API_PROPERTY_METADATA',
      'API_BODY_METADATA',
      'API_PARAM_METADATA',
      'API_QUERY_METADATA',
      'API_HEADER_METADATA',
      'API_SECURITY_METADATA',
      'API_EXCLUDE_METADATA',
      'API_DEPRECATED_METADATA',
    ];

    for (const symbolName of swaggerSymbols) {
      expect(exports).toHaveProperty(symbolName);
      expect(typeof (exports as Record<string, unknown>)[symbolName]).toBe('symbol');
    }
  });

  it('should re-export core metadata symbols from @riktajs/core', async () => {
    const exports = await import('../src/index.js');
    
    const coreSymbols = [
      'CONTROLLER_METADATA',
      'ROUTES_METADATA',
      'PARAM_METADATA',
      'HTTP_CODE_METADATA',
      'GUARDS_METADATA',
      'ZOD_SCHEMA_METADATA',
    ];

    for (const symbolName of coreSymbols) {
      expect(exports).toHaveProperty(symbolName);
      expect(typeof (exports as Record<string, unknown>)[symbolName]).toBe('symbol');
    }
  });

  it('should have core symbols matching @riktajs/core', async () => {
    const swaggerExports = await import('../src/index.js');
    const coreExports = await import('@riktajs/core');
    
    // Verify that the re-exported symbols are the same instances
    expect(swaggerExports.CONTROLLER_METADATA).toBe(coreExports.CONTROLLER_METADATA);
    expect(swaggerExports.ROUTES_METADATA).toBe(coreExports.ROUTES_METADATA);
    expect(swaggerExports.PARAM_METADATA).toBe(coreExports.PARAM_METADATA);
    expect(swaggerExports.HTTP_CODE_METADATA).toBe(coreExports.HTTP_CODE_METADATA);
    expect(swaggerExports.GUARDS_METADATA).toBe(coreExports.GUARDS_METADATA);
    expect(swaggerExports.ZOD_SCHEMA_METADATA).toBe(coreExports.ZOD_SCHEMA_METADATA);
  });

  it('should export OpenApiGenerator', async () => {
    const exports = await import('../src/index.js');
    
    expect(exports.OpenApiGenerator).toBeDefined();
    expect(typeof exports.OpenApiGenerator).toBe('function');
  });

  it('should export Zod-to-OpenAPI utilities', async () => {
    const exports = await import('../src/index.js');
    
    expect(exports.zodToOpenApi).toBeDefined();
    expect(typeof exports.zodToOpenApi).toBe('function');
    
    expect(exports.toOpenApiSchema).toBeDefined();
    expect(typeof exports.toOpenApiSchema).toBe('function');
    
    expect(exports.isZodSchema).toBeDefined();
    expect(typeof exports.isZodSchema).toBe('function');
  });

  it('should export Fastify plugin', async () => {
    const exports = await import('../src/index.js');
    
    expect(exports.swaggerPlugin).toBeDefined();
    expect(typeof exports.swaggerPlugin).toBe('function');
    
    expect(exports.registerSwagger).toBeDefined();
    expect(typeof exports.registerSwagger).toBe('function');
    
    expect(exports.createSwaggerConfig).toBeDefined();
    expect(typeof exports.createSwaggerConfig).toBe('function');
  });
});
