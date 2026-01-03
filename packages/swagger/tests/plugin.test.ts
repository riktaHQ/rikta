import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  swaggerPlugin,
  registerSwagger,
  createSwaggerConfig,
  OpenApiGenerator,
} from '../src/index.js';
import {
  CONTROLLER_METADATA,
  ROUTES_METADATA,
} from '@riktajs/core';

/**
 * Helper to create a mock controller with metadata
 */
function createMockController(basePath: string, routes: Array<{ method: string; path: string; handlerName: string }>) {
  class MockController {
    [key: string]: () => object;
  }

  // Add handler methods
  for (const route of routes) {
    MockController.prototype[route.handlerName] = function() {
      return { message: 'ok' };
    };
  }

  // Set controller metadata - using 'prefix' as expected by core
  Reflect.defineMetadata(CONTROLLER_METADATA, { prefix: basePath }, MockController);

  // Set routes metadata
  const routesMeta = routes.map(route => ({
    method: route.method,
    path: route.path,
    handlerName: route.handlerName,
  }));
  Reflect.defineMetadata(ROUTES_METADATA, routesMeta, MockController);

  return MockController;
}

describe('Swagger Plugin', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('swaggerPlugin', () => {
    it('should register without errors with default options', async () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      });

      await app.ready();
      expect(app.openApiSpec).toBeDefined();
    });

    it('should serve OpenAPI JSON at default path', async () => {
      const controller = createMockController('/api', [
        { method: 'GET', path: '/health', handlerName: 'health' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Health API',
          version: '2.0.0',
        },
      });

      await app.ready();

      // Default JSON path is /docs/json (served by swagger-ui)
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      const spec = JSON.parse(response.payload);
      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('Health API');
      expect(spec.info.version).toBe('2.0.0');
      expect(spec.paths['/api/health']).toBeDefined();
    });

    it('should serve OpenAPI JSON at custom path', async () => {
      const controller = createMockController('/api', [
        { method: 'GET', path: '/status', handlerName: 'status' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        jsonPath: '/api-spec.json',
        info: {
          title: 'Status API',
          version: '1.0.0',
        },
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/api-spec.json',
      });

      expect(response.statusCode).toBe(200);
      const spec = JSON.parse(response.payload);
      expect(spec.paths['/api/status']).toBeDefined();
    });

    it('should apply transform function', async () => {
      const controller = createMockController('/items', [
        { method: 'GET', path: '/', handlerName: 'list' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Original Title',
          version: '1.0.0',
        },
        transform: (spec) => ({
          ...spec,
          info: {
            ...spec.info,
            title: 'Transformed Title',
          },
        }),
      });

      await app.ready();

      expect(app.openApiSpec?.info.title).toBe('Transformed Title');
    });

    it('should apply async transform function', async () => {
      const controller = createMockController('/async', [
        { method: 'POST', path: '/', handlerName: 'create' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Async API',
          version: '1.0.0',
        },
        transform: async (spec) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return {
            ...spec,
            info: {
              ...spec.info,
              description: 'Async transformed',
            },
          };
        },
      });

      await app.ready();

      expect(app.openApiSpec?.info.description).toBe('Async transformed');
    });

    it('should use config.info if info is not provided', async () => {
      const controller = createMockController('/test', [
        { method: 'GET', path: '/', handlerName: 'test' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        config: {
          info: {
            title: 'Config Title',
            version: '3.0.0',
          },
        },
      });

      await app.ready();

      expect(app.openApiSpec?.info.title).toBe('Config Title');
      expect(app.openApiSpec?.info.version).toBe('3.0.0');
    });

    it('should add security schemes from config', async () => {
      const controller = createMockController('/secure', [
        { method: 'GET', path: '/', handlerName: 'secure' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Secure API',
          version: '1.0.0',
        },
        config: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
            },
          },
        },
      });

      await app.ready();

      expect(app.openApiSpec?.components?.securitySchemes?.bearerAuth).toBeDefined();
      expect(app.openApiSpec?.components?.securitySchemes?.apiKey).toBeDefined();
    });

    it('should use default title and version when not provided', async () => {
      const controller = createMockController('/default', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
      });

      await app.ready();

      expect(app.openApiSpec?.info.title).toBe('API Documentation');
      expect(app.openApiSpec?.info.version).toBe('1.0.0');
    });

    it('should disable UI when exposeUI is false', async () => {
      const controller = createMockController('/no-ui', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        exposeUI: false,
        info: {
          title: 'No UI API',
          version: '1.0.0',
        },
      });

      await app.ready();

      // JSON spec should work at default jsonPath since UI is disabled
      const jsonResponse = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });
      expect(jsonResponse.statusCode).toBe(200);

      // UI should not be available
      const uiResponse = await app.inject({
        method: 'GET',
        url: '/docs',
      });
      expect(uiResponse.statusCode).toBe(404);
    });

    it('should use dark theme when specified', async () => {
      const controller = createMockController('/dark', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        theme: 'dark',
        info: {
          title: 'Dark Theme API',
          version: '1.0.0',
        },
      });

      await app.ready();
      expect(app.openApiSpec).toBeDefined();
    });
  });

  describe('registerSwagger', () => {
    it('should register plugin using helper function', async () => {
      const controller = createMockController('/helper', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await registerSwagger(app, {
        controllers: [controller],
        info: {
          title: 'Helper API',
          version: '1.0.0',
        },
      });

      await app.ready();

      expect(app.openApiSpec).toBeDefined();
      expect(app.openApiSpec?.info.title).toBe('Helper API');
    });

    it('should work with empty options', async () => {
      await registerSwagger(app, {});

      await app.ready();

      expect(app.openApiSpec).toBeDefined();
    });
  });

  describe('createSwaggerConfig', () => {
    it('should return swagger configuration objects', () => {
      const controller = createMockController('/config', [
        { method: 'GET', path: '/', handlerName: 'index' },
        { method: 'POST', path: '/', handlerName: 'create' },
      ]);

      const result = createSwaggerConfig({
        controllers: [controller],
        info: {
          title: 'Config API',
          version: '2.0.0',
        },
      });

      expect(result.swaggerOptions).toBeDefined();
      expect(result.swaggerOptions.mode).toBe('static');
      expect(result.swaggerUIOptions).toBeDefined();
      expect(result.specification).toBeDefined();
      expect(result.specification.info.title).toBe('Config API');
    });

    it('should use default uiPath in swaggerUIOptions', () => {
      const controller = createMockController('/test', [
        { method: 'GET', path: '/', handlerName: 'test' },
      ]);

      const result = createSwaggerConfig({
        controllers: [controller],
      });

      expect(result.swaggerUIOptions.routePrefix).toBe('/docs');
    });

    it('should include security schemes in specification', () => {
      const controller = createMockController('/auth', [
        { method: 'GET', path: '/protected', handlerName: 'protected' },
      ]);

      const result = createSwaggerConfig({
        controllers: [controller],
        config: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://auth.example.com',
                  scopes: { read: 'Read access' },
                },
              },
            },
          },
        },
      });

      expect(result.specification.components?.securitySchemes?.oauth2).toBeDefined();
    });

    it('should work with empty options using defaults', () => {
      const result = createSwaggerConfig({});

      expect(result.specification.info.title).toBe('API Documentation');
      expect(result.specification.info.version).toBe('1.0.0');
    });
  });

  describe('Swagger UI endpoint', () => {
    it('should serve Swagger UI at default path', async () => {
      const controller = createMockController('/ui-test', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'UI Test API',
          version: '1.0.0',
        },
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should serve Swagger UI at custom path', async () => {
      const controller = createMockController('/custom-ui', [
        { method: 'GET', path: '/', handlerName: 'index' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        uiPath: '/swagger',
        info: {
          title: 'Custom UI API',
          version: '1.0.0',
        },
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/swagger',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('OpenAPI spec validation', () => {
    it('should generate valid OpenAPI 3.0 structure', async () => {
      const controller = createMockController('/validation', [
        { method: 'GET', path: '/', handlerName: 'list' },
        { method: 'POST', path: '/', handlerName: 'create' },
        { method: 'GET', path: '/:id', handlerName: 'findOne' },
        { method: 'PUT', path: '/:id', handlerName: 'update' },
        { method: 'DELETE', path: '/:id', handlerName: 'remove' },
      ]);

      await app.register(swaggerPlugin, {
        controllers: [controller],
        info: {
          title: 'Validation API',
          version: '1.0.0',
          description: 'Testing OpenAPI structure',
        },
      });

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = JSON.parse(response.payload);

      // Validate OpenAPI structure
      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Validation API');
      expect(spec.paths).toBeDefined();
      expect(Object.keys(spec.paths).length).toBeGreaterThan(0);

      // Validate paths
      expect(spec.paths['/validation']).toBeDefined();
      expect(spec.paths['/validation'].get).toBeDefined();
      expect(spec.paths['/validation'].post).toBeDefined();
      expect(spec.paths['/validation/{id}']).toBeDefined();
      expect(spec.paths['/validation/{id}'].get).toBeDefined();
      expect(spec.paths['/validation/{id}'].put).toBeDefined();
      expect(spec.paths['/validation/{id}'].delete).toBeDefined();
    });
  });
});
