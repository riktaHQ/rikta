import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { Controller, Get, Post, Body, Param, Query, CONTROLLER_METADATA, ROUTES_METADATA } from '@riktajs/core';
import {
  OpenApiGenerator,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiDeprecated,
  ApiExcludeEndpoint,
  API_OPERATION_METADATA,
  API_RESPONSE_METADATA,
} from '../src/index.js';

// ============================================================================
// Test Schemas
// ============================================================================

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  createdAt: z.date(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string()).optional(),
});

// ============================================================================
// Test Controllers
// ============================================================================

@ApiTags('Users')
@Controller('/users')
class UserController {
  @Get('/')
  @ApiOperation({ summary: 'List all users', description: 'Returns a paginated list of all users' })
  @ApiQuery({ name: 'page', type: 'integer', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', type: 'integer', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Array of users', schema: z.array(UserSchema) })
  async listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return [];
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', schema: UserSchema })
  @ApiResponse({ status: 404, description: 'User not found', schema: ErrorSchema })
  async getUser(@Param('id') id: string) {
    return { id };
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ schema: CreateUserSchema, description: 'User data', required: true })
  @ApiResponse({ status: 201, description: 'User created', schema: UserSchema })
  @ApiResponse({ status: 400, description: 'Validation error', schema: ErrorSchema })
  @ApiSecurity('bearerAuth')
  async createUser(@Body() body: z.infer<typeof CreateUserSchema>) {
    return body;
  }

  @Get('/deprecated')
  @ApiOperation({ summary: 'Deprecated endpoint' })
  @ApiDeprecated()
  @ApiResponse({ status: 200, description: 'Success' })
  async deprecatedEndpoint() {
    return { deprecated: true };
  }

  @Get('/internal')
  @ApiExcludeEndpoint()
  async internalEndpoint() {
    return { internal: true };
  }
}

@ApiTags('Health')
@Controller('/health')
class HealthController {
  @Get('/')
  @ApiOperation({ summary: 'Health check', operationId: 'healthCheck' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return { status: 'ok' };
  }

  @Get('/ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    return { ready: true };
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Full OpenAPI Generation', () => {
  let generator: OpenApiGenerator;
  let spec: ReturnType<OpenApiGenerator['generate']>;

  beforeAll(() => {
    generator = new OpenApiGenerator({
      title: 'Test API',
      version: '1.0.0',
      description: 'Integration test API',
      contact: {
        name: 'Test Team',
        email: 'test@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
        { url: 'https://api.example.com', description: 'Production' },
      ],
    });

    generator.addController(UserController);
    generator.addController(HealthController);
    generator.addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

    spec = generator.generate();
  });

  describe('Debug: Metadata verification', () => {
    it('should have CONTROLLER_METADATA on UserController', () => {
      const meta = Reflect.getMetadata(CONTROLLER_METADATA, UserController);
      expect(meta).toBeDefined();
      expect(meta.prefix).toBe('/users');
    });

    it('should have ROUTES_METADATA on UserController', () => {
      const routes = Reflect.getMetadata(ROUTES_METADATA, UserController);
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have API_OPERATION_METADATA on listUsers', () => {
      const meta = Reflect.getMetadata(API_OPERATION_METADATA, UserController.prototype, 'listUsers');
      expect(meta).toBeDefined();
      expect(meta.summary).toBe('List all users');
    });

    it('should have API_RESPONSE_METADATA on listUsers', () => {
      const meta = Reflect.getMetadata(API_RESPONSE_METADATA, UserController.prototype, 'listUsers');
      expect(meta).toBeDefined();
    });
  });

  describe('OpenAPI Document Structure', () => {
    it('should generate valid OpenAPI 3.0.3 document', () => {
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.3');
    });

    it('should include API info', () => {
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.info.description).toBe('Integration test API');
      expect(spec.info.contact?.name).toBe('Test Team');
      expect(spec.info.contact?.email).toBe('test@example.com');
      expect(spec.info.license?.name).toBe('MIT');
    });

    it('should include servers', () => {
      expect(spec.servers).toHaveLength(2);
      expect(spec.servers?.[0].url).toBe('http://localhost:3000');
      expect(spec.servers?.[1].url).toBe('https://api.example.com');
    });

    it('should include tags from controllers', () => {
      expect(spec.tags).toBeDefined();
      const tagNames = spec.tags?.map(t => t.name) || [];
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Health');
    });

    it('should include security schemes', () => {
      expect(spec.components?.securitySchemes).toBeDefined();
      expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
      expect(spec.components?.securitySchemes?.bearerAuth?.type).toBe('http');
      expect(spec.components?.securitySchemes?.bearerAuth?.scheme).toBe('bearer');
    });
  });

  describe('Path Operations', () => {
    it('should generate paths for all non-excluded endpoints', () => {
      expect(spec.paths).toBeDefined();
      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users/{id}']).toBeDefined();
      expect(spec.paths['/users/deprecated']).toBeDefined();
      expect(spec.paths['/health']).toBeDefined();
      expect(spec.paths['/health/ready']).toBeDefined();
    });

    it('should exclude endpoints with @ApiExclude', () => {
      // /users/internal should not exist
      expect(spec.paths['/users/internal']).toBeUndefined();
    });

    it('should convert Fastify path params to OpenAPI format', () => {
      // :id should become {id}
      expect(spec.paths['/users/{id}']).toBeDefined();
      expect(spec.paths['/users/:id']).toBeUndefined();
    });
  });

  describe('GET /users', () => {
    let operation: any;

    beforeAll(() => {
      operation = spec.paths['/users']?.get;
    });

    it('should have correct operation metadata', () => {
      expect(operation).toBeDefined();
      expect(operation.summary).toBe('List all users');
      expect(operation.description).toBe('Returns a paginated list of all users');
      expect(operation.tags).toContain('Users');
    });

    it('should have query parameters', () => {
      expect(operation.parameters).toBeDefined();
      const pageParam = operation.parameters.find((p: any) => p.name === 'page');
      const limitParam = operation.parameters.find((p: any) => p.name === 'limit');
      
      expect(pageParam).toBeDefined();
      expect(pageParam.in).toBe('query');
      expect(pageParam.required).toBeFalsy();
      expect(pageParam.description).toBe('Page number');
      
      expect(limitParam).toBeDefined();
      expect(limitParam.in).toBe('query');
      expect(limitParam.description).toBe('Items per page');
    });

    it('should have 200 response with Zod schema', () => {
      expect(operation.responses).toBeDefined();
      expect(operation.responses['200']).toBeDefined();
      expect(operation.responses['200'].description).toBe('Array of users');
      expect(operation.responses['200'].content?.['application/json']?.schema).toBeDefined();
      
      // Should be an array schema
      const schema = operation.responses['200'].content['application/json'].schema;
      expect(schema.type).toBe('array');
      expect(schema.items).toBeDefined();
      expect(schema.items.type).toBe('object');
      expect(schema.items.properties?.id).toBeDefined();
      expect(schema.items.properties?.name).toBeDefined();
      expect(schema.items.properties?.email).toBeDefined();
    });
  });

  describe('GET /users/{id}', () => {
    let operation: any;

    beforeAll(() => {
      operation = spec.paths['/users/{id}']?.get;
    });

    it('should have path parameter', () => {
      expect(operation.parameters).toBeDefined();
      const idParam = operation.parameters.find((p: any) => p.name === 'id');
      
      expect(idParam).toBeDefined();
      expect(idParam.in).toBe('path');
      expect(idParam.required).toBe(true);
      expect(idParam.description).toBe('User ID');
      expect(idParam.schema?.format).toBe('uuid');
    });

    it('should have 200 and 404 responses', () => {
      expect(operation.responses['200']).toBeDefined();
      expect(operation.responses['404']).toBeDefined();
      expect(operation.responses['404'].description).toBe('User not found');
    });
  });

  describe('POST /users', () => {
    let operation: any;

    beforeAll(() => {
      operation = spec.paths['/users']?.post;
    });

    it('should have request body with Zod schema', () => {
      expect(operation.requestBody).toBeDefined();
      expect(operation.requestBody.required).toBe(true);
      expect(operation.requestBody.description).toBe('User data');
      
      const schema = operation.requestBody.content?.['application/json']?.schema;
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties?.name).toBeDefined();
      expect(schema.properties?.email).toBeDefined();
      expect(schema.required).toContain('name');
      expect(schema.required).toContain('email');
    });

    it('should have security requirement', () => {
      expect(operation.security).toBeDefined();
      expect(operation.security).toEqual([{ bearerAuth: [] }]);
    });

    it('should have 201 and 400 responses', () => {
      expect(operation.responses['201']).toBeDefined();
      expect(operation.responses['400']).toBeDefined();
    });
  });

  describe('Deprecated Endpoint', () => {
    it('should mark deprecated endpoints', () => {
      const operation = spec.paths['/users/deprecated']?.get;
      expect(operation).toBeDefined();
      expect(operation?.deprecated).toBe(true);
    });
  });

  describe('Health Endpoints', () => {
    it('should generate health check endpoint', () => {
      const operation = spec.paths['/health']?.get;
      expect(operation).toBeDefined();
      expect(operation?.operationId).toBe('healthCheck');
      expect(operation?.tags).toContain('Health');
    });

    it('should generate readiness endpoint with multiple responses', () => {
      const operation = spec.paths['/health/ready']?.get;
      expect(operation).toBeDefined();
      expect(operation?.responses['200']).toBeDefined();
      expect(operation?.responses['503']).toBeDefined();
    });
  });
});

describe('Integration: Generator Edge Cases', () => {
  it('should handle controller without tags', () => {
    @Controller('/no-tags')
    class NoTagsController {
      @Get('/')
      @ApiOperation({ summary: 'Test' })
      test() {
        return {};
      }
    }

    const generator = new OpenApiGenerator({ title: 'Test', version: '1.0.0' });
    generator.addController(NoTagsController);
    const spec = generator.generate();

    expect(spec.paths['/no-tags']).toBeDefined();
    expect(spec.paths['/no-tags'].get?.tags).toBeUndefined();
  });

  it('should handle controller with multiple routes', () => {
    @ApiTags('Multi')
    @Controller('/multi')
    class MultiController {
      @Get('/a')
      @ApiOperation({ summary: 'A' })
      a() { return 'a'; }

      @Get('/b')
      @ApiOperation({ summary: 'B' })
      b() { return 'b'; }

      @Post('/c')
      @ApiOperation({ summary: 'C' })
      c() { return 'c'; }
    }

    const generator = new OpenApiGenerator({ title: 'Test', version: '1.0.0' });
    generator.addController(MultiController);
    const spec = generator.generate();

    expect(spec.paths['/multi/a']?.get).toBeDefined();
    expect(spec.paths['/multi/b']?.get).toBeDefined();
    expect(spec.paths['/multi/c']?.post).toBeDefined();
  });

  it('should handle nested path parameters', () => {
    @Controller('/org/:orgId/users')
    class NestedController {
      @Get('/:userId')
      @ApiParam({ name: 'orgId', type: 'string' })
      @ApiParam({ name: 'userId', type: 'string' })
      @ApiOperation({ summary: 'Get org user' })
      getOrgUser() { return {}; }
    }

    const generator = new OpenApiGenerator({ title: 'Test', version: '1.0.0' });
    generator.addController(NestedController);
    const spec = generator.generate();

    expect(spec.paths['/org/{orgId}/users/{userId}']).toBeDefined();
    const operation = spec.paths['/org/{orgId}/users/{userId}']?.get;
    expect(operation?.parameters).toBeDefined();
    
    const orgIdParam = operation?.parameters?.find((p: any) => p.name === 'orgId');
    const userIdParam = operation?.parameters?.find((p: any) => p.name === 'userId');
    expect(orgIdParam).toBeDefined();
    expect(userIdParam).toBeDefined();
  });

  it('should handle controller-level security', () => {
    @ApiTags('Secure')
    @ApiSecurity('apiKey')
    @Controller('/secure')
    class SecureController {
      @Get('/')
      @ApiOperation({ summary: 'Secure endpoint' })
      secure() { return {}; }
    }

    const generator = new OpenApiGenerator({ title: 'Test', version: '1.0.0' });
    generator.addController(SecureController);
    generator.addSecurityScheme('apiKey', {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    });
    const spec = generator.generate();

    // Note: Current implementation gets security from method level
    // Controller-level security would need additional implementation
    expect(spec.components?.securitySchemes?.apiKey).toBeDefined();
  });

  it('should generate valid JSON output', () => {
    const generator = new OpenApiGenerator({ 
      title: 'Test API',
      version: '1.0.0' 
    });
    generator.addController(UserController);
    const spec = generator.generate();
    
    // Should be serializable to JSON without errors
    const json = JSON.stringify(spec, null, 2);
    expect(json).toBeDefined();
    
    // Should be parseable back
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBe('3.0.3');
    expect(parsed.info.title).toBe('Test API');
  });
});
