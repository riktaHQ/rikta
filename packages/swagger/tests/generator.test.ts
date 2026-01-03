import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { OpenApiGenerator, createOpenApiGenerator } from '../src/openapi/generator.js';
import {
  CONTROLLER_METADATA,
  ROUTES_METADATA,
  PARAM_METADATA,
  HTTP_CODE_METADATA,
  ZOD_SCHEMA_METADATA,
  ParamType,
} from '@riktajs/core';
import {
  API_TAGS_METADATA,
  API_OPERATION_METADATA,
  API_RESPONSE_METADATA,
  API_BODY_METADATA,
  API_PARAM_METADATA,
  API_QUERY_METADATA,
  API_SECURITY_METADATA,
  API_EXCLUDE_METADATA,
  API_DEPRECATED_METADATA,
} from '../src/constants.js';

describe('OpenApiGenerator', () => {
  // Helper to create a mock controller with metadata
  function createMockController(
    prefix: string,
    routes: Array<{ method: string; path: string; handlerName: string }>,
    metadata: {
      tags?: string[];
      operations?: Record<string, { summary?: string; description?: string }>;
      responses?: Record<string, Array<{ status: number; description?: string; schema?: unknown }>>;
      excludeEndpoints?: string[];
      excludeController?: boolean;
      deprecated?: boolean;
      deprecatedMethods?: string[];
      security?: Array<{ name: string; scopes?: string[] }>;
      bodies?: Record<string, { description?: string; schema?: unknown }>;
      params?: Record<string, Array<{ name: string; description?: string }>>;
      queries?: Record<string, Array<{ name: string; required?: boolean; description?: string }>>;
    } = {}
  ) {
    class MockController {}

    // Set controller metadata
    Reflect.defineMetadata(CONTROLLER_METADATA, { prefix }, MockController);
    Reflect.defineMetadata(ROUTES_METADATA, routes.map(r => ({
      method: r.method,
      path: r.path,
      handlerName: r.handlerName,
    })), MockController);

    // Set tags
    if (metadata.tags) {
      Reflect.defineMetadata(API_TAGS_METADATA, metadata.tags, MockController);
    }

    // Set security
    if (metadata.security) {
      Reflect.defineMetadata(API_SECURITY_METADATA, metadata.security, MockController);
    }

    // Set excluded controller
    if (metadata.excludeController) {
      Reflect.defineMetadata(API_EXCLUDE_METADATA, true, MockController);
    }

    // Set deprecated controller
    if (metadata.deprecated) {
      Reflect.defineMetadata(API_DEPRECATED_METADATA, { deprecated: true }, MockController);
    }

    // Set operation metadata
    for (const route of routes) {
      const opMeta = metadata.operations?.[route.handlerName];
      if (opMeta) {
        Reflect.defineMetadata(API_OPERATION_METADATA, opMeta, MockController.prototype, route.handlerName);
      }

      const responses = metadata.responses?.[route.handlerName];
      if (responses) {
        Reflect.defineMetadata(API_RESPONSE_METADATA, responses, MockController.prototype, route.handlerName);
      }

      if (metadata.excludeEndpoints?.includes(route.handlerName)) {
        Reflect.defineMetadata(API_EXCLUDE_METADATA, true, MockController.prototype, route.handlerName);
      }

      if (metadata.deprecatedMethods?.includes(route.handlerName)) {
        Reflect.defineMetadata(API_DEPRECATED_METADATA, { deprecated: true }, MockController.prototype, route.handlerName);
      }

      const body = metadata.bodies?.[route.handlerName];
      if (body) {
        Reflect.defineMetadata(API_BODY_METADATA, body, MockController.prototype, route.handlerName);
      }

      const params = metadata.params?.[route.handlerName];
      if (params) {
        Reflect.defineMetadata(API_PARAM_METADATA, params, MockController.prototype, route.handlerName);
      }

      const queries = metadata.queries?.[route.handlerName];
      if (queries) {
        Reflect.defineMetadata(API_QUERY_METADATA, queries, MockController.prototype, route.handlerName);
      }
    }

    return MockController;
  }

  describe('constructor and configuration', () => {
    it('should create generator with default config', () => {
      const generator = new OpenApiGenerator();
      const doc = generator.generate();

      expect(doc.openapi).toBe('3.0.3');
      expect(doc.info.title).toBe('API Documentation');
      expect(doc.info.version).toBe('1.0.0');
    });

    it('should create generator with custom config', () => {
      const generator = new OpenApiGenerator({
        info: {
          title: 'My Custom API',
          version: '2.0.0',
          description: 'A custom API',
        },
      });
      const doc = generator.generate();

      expect(doc.info.title).toBe('My Custom API');
      expect(doc.info.version).toBe('2.0.0');
      expect(doc.info.description).toBe('A custom API');
    });

    it('should use createOpenApiGenerator factory', () => {
      const generator = createOpenApiGenerator({
        info: { title: 'Factory API', version: '1.0.0' },
      });
      expect(generator).toBeInstanceOf(OpenApiGenerator);
    });
  });

  describe('controller processing', () => {
    it('should add single controller', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users']).toBeDefined();
    });

    it('should add multiple controllers', () => {
      const usersController = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ]);
      const productsController = createMockController('/products', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addControllers([usersController, productsController]);
      const doc = generator.generate();

      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/products']).toBeDefined();
    });
  });

  describe('path generation', () => {
    it('should normalize paths correctly', () => {
      const controller = createMockController('users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
        { method: 'GET', path: '/:id', handlerName: 'findOne' },
        { method: 'POST', path: '', handlerName: 'create' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/users/{id}']).toBeDefined();
    });

    it('should convert :param to {param} format', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/:userId/posts/:postId', handlerName: 'getPost' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users/{userId}/posts/{postId}']).toBeDefined();
    });
  });

  describe('operation generation', () => {
    it('should use @ApiOperation metadata', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ], {
        operations: {
          findAll: {
            summary: 'Get all users',
            description: 'Returns a list of all users',
          },
        },
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const operation = doc.paths['/users'].get!;
      expect(operation.summary).toBe('Get all users');
      expect(operation.description).toBe('Returns a list of all users');
    });

    it('should use @ApiTags on controller', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ], {
        tags: ['Users', 'Admin'],
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users'].get!.tags).toEqual(['Users', 'Admin']);
      expect(doc.tags).toContainEqual({ name: 'Users' });
      expect(doc.tags).toContainEqual({ name: 'Admin' });
    });
  });

  describe('response generation', () => {
    it('should use @ApiResponse metadata', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ], {
        responses: {
          findAll: [
            { status: 200, description: 'List of users' },
            { status: 401, description: 'Unauthorized' },
          ],
        },
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const responses = doc.paths['/users'].get!.responses;
      expect(responses['200'].description).toBe('List of users');
      expect(responses['401'].description).toBe('Unauthorized');
    });

    it('should add default 200 response if none specified', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users'].get!.responses['200']).toBeDefined();
    });
  });

  describe('request body generation', () => {
    it('should use @ApiBody metadata', () => {
      const controller = createMockController('/users', [
        { method: 'POST', path: '/', handlerName: 'create' },
      ], {
        bodies: {
          create: {
            description: 'User data',
            schema: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const requestBody = doc.paths['/users'].post!.requestBody!;
      expect(requestBody.description).toBe('User data');
      expect(requestBody.content['application/json'].schema).toBeDefined();
    });
  });

  describe('parameter generation', () => {
    it('should extract path parameters from route', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/:id', handlerName: 'findOne' },
      ]);

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const params = doc.paths['/users/{id}'].get!.parameters!;
      expect(params).toContainEqual(expect.objectContaining({
        name: 'id',
        in: 'path',
        required: true,
      }));
    });

    it('should use @ApiParam metadata', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/:id', handlerName: 'findOne' },
      ], {
        params: {
          findOne: [
            { name: 'id', description: 'User ID' },
          ],
        },
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const params = doc.paths['/users/{id}'].get!.parameters!;
      const idParam = params.find(p => p.name === 'id');
      expect(idParam?.description).toBe('User ID');
    });

    it('should use @ApiQuery metadata', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
      ], {
        queries: {
          findAll: [
            { name: 'page', required: false, description: 'Page number' },
            { name: 'limit', required: false, description: 'Items per page' },
          ],
        },
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      const params = doc.paths['/users'].get!.parameters!;
      expect(params).toContainEqual(expect.objectContaining({
        name: 'page',
        in: 'query',
        description: 'Page number',
      }));
      expect(params).toContainEqual(expect.objectContaining({
        name: 'limit',
        in: 'query',
        description: 'Items per page',
      }));
    });
  });

  describe('exclusion handling', () => {
    it('should exclude endpoints with @ApiExcludeEndpoint', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
        { method: 'GET', path: '/internal', handlerName: 'internal' },
      ], {
        excludeEndpoints: ['internal'],
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/users/internal']).toBeUndefined();
    });

    it('should exclude controllers with @ApiExcludeController', () => {
      const controller = createMockController('/internal', [
        { method: 'GET', path: '/', handlerName: 'health' },
      ], {
        excludeController: true,
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/internal']).toBeUndefined();
    });
  });

  describe('deprecation handling', () => {
    it('should mark deprecated endpoints', () => {
      const controller = createMockController('/users', [
        { method: 'GET', path: '/legacy', handlerName: 'legacy' },
      ], {
        deprecatedMethods: ['legacy'],
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/users/legacy'].get!.deprecated).toBe(true);
    });

    it('should mark all endpoints deprecated when controller is deprecated', () => {
      const controller = createMockController('/old', [
        { method: 'GET', path: '/', handlerName: 'findAll' },
        { method: 'POST', path: '/', handlerName: 'create' },
      ], {
        deprecated: true,
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/old'].get!.deprecated).toBe(true);
      expect(doc.paths['/old'].post!.deprecated).toBe(true);
    });
  });

  describe('security handling', () => {
    it('should add security requirements from controller', () => {
      const controller = createMockController('/admin', [
        { method: 'GET', path: '/', handlerName: 'dashboard' },
      ], {
        security: [{ name: 'bearerAuth', scopes: [] }],
      });

      const generator = new OpenApiGenerator();
      generator.addController(controller);
      const doc = generator.generate();

      expect(doc.paths['/admin'].get!.security).toEqual([{ bearerAuth: [] }]);
    });

    it('should add global security scheme', () => {
      const generator = new OpenApiGenerator();
      generator.addSecurityScheme('bearerAuth', {
        name: 'bearerAuth',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
      const doc = generator.generate();

      expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
      expect(doc.components?.securitySchemes?.bearerAuth.type).toBe('http');
    });
  });

  describe('servers configuration', () => {
    it('should include servers in document', () => {
      const generator = new OpenApiGenerator({
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
          { url: 'https://staging.example.com', description: 'Staging' },
        ],
      });
      const doc = generator.generate();

      expect(doc.servers).toHaveLength(2);
      expect(doc.servers![0].url).toBe('https://api.example.com');
    });
  });

  describe('external docs', () => {
    it('should include external docs in document', () => {
      const generator = new OpenApiGenerator({
        externalDocs: {
          url: 'https://docs.example.com',
          description: 'Full documentation',
        },
      });
      const doc = generator.generate();

      expect(doc.externalDocs?.url).toBe('https://docs.example.com');
    });
  });
});
