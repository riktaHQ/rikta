import { describe, it, expect, beforeEach } from 'vitest';
import 'reflect-metadata';
import {
  ApiTags,
  getApiTags,
  ApiOperation,
  getApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  getApiResponses,
  ApiBody,
  getApiBody,
  ApiParam,
  getApiParams,
  ApiQuery,
  getApiQueries,
  ApiHeader,
  getApiHeaders,
  ApiSecurity,
  ApiBearerAuth,
  getApiSecurity,
  ApiProperty,
  ApiPropertyOptional,
  getApiProperties,
  ApiExcludeEndpoint,
  ApiExcludeController,
  isApiExcluded,
  ApiDeprecated,
  getApiDeprecated,
} from '../src/decorators/index.js';

describe('Swagger Decorators', () => {
  describe('@ApiTags', () => {
    it('should store tags on a class', () => {
      @ApiTags('Users', 'Authentication')
      class TestController {}

      const tags = getApiTags(TestController);
      expect(tags).toEqual(['Users', 'Authentication']);
    });

    it('should store tags on a method', () => {
      class TestController {
        @ApiTags('Admin')
        testMethod() {}
      }

      const tags = getApiTags(TestController, 'testMethod');
      expect(tags).toContain('Admin');
    });

    it('should merge class and method tags', () => {
      @ApiTags('Users')
      class TestController {
        @ApiTags('Admin')
        testMethod() {}
      }

      const tags = getApiTags(TestController, 'testMethod');
      expect(tags).toContain('Users');
      expect(tags).toContain('Admin');
    });

    it('should accumulate multiple @ApiTags calls', () => {
      @ApiTags('Tag1')
      @ApiTags('Tag2')
      class TestController {}

      const tags = getApiTags(TestController);
      expect(tags).toContain('Tag1');
      expect(tags).toContain('Tag2');
    });
  });

  describe('@ApiOperation', () => {
    it('should store operation metadata', () => {
      class TestController {
        @ApiOperation({
          summary: 'Get user',
          description: 'Retrieves a user by ID',
          operationId: 'getUser',
          deprecated: false,
        })
        getUser() {}
      }

      const operation = getApiOperation(TestController, 'getUser');
      expect(operation).toEqual({
        summary: 'Get user',
        description: 'Retrieves a user by ID',
        operationId: 'getUser',
        deprecated: false,
      });
    });
  });

  describe('@ApiResponse', () => {
    it('should store single response', () => {
      class TestController {
        @ApiResponse({ status: 200, description: 'Success' })
        testMethod() {}
      }

      const responses = getApiResponses(TestController, 'testMethod');
      expect(responses).toHaveLength(1);
      expect(responses[0]).toEqual({ status: 200, description: 'Success' });
    });

    it('should accumulate multiple responses', () => {
      class TestController {
        @ApiResponse({ status: 200, description: 'Success' })
        @ApiResponse({ status: 404, description: 'Not found' })
        @ApiResponse({ status: 500, description: 'Error' })
        testMethod() {}
      }

      const responses = getApiResponses(TestController, 'testMethod');
      expect(responses).toHaveLength(3);
      // Decorators are applied bottom-to-top, so order is reversed
      expect(responses.map(r => r.status).sort()).toEqual([200, 404, 500]);
    });

    it('should work with shorthand decorators', () => {
      class TestController {
        @ApiOkResponse({ description: 'User found' })
        @ApiNotFoundResponse()
        testMethod() {}
      }

      const responses = getApiResponses(TestController, 'testMethod');
      expect(responses).toHaveLength(2);
      expect(responses.find(r => r.status === 200)?.description).toBe('User found');
      expect(responses.find(r => r.status === 404)?.description).toBe('Not Found');
    });
  });

  describe('@ApiBody', () => {
    it('should store body metadata', () => {
      class TestController {
        @ApiBody({
          description: 'User data',
          required: true,
        })
        createUser() {}
      }

      const body = getApiBody(TestController, 'createUser');
      expect(body).toEqual({
        description: 'User data',
        required: true,
      });
    });

    it('should default required to true', () => {
      class TestController {
        @ApiBody({ description: 'Data' })
        testMethod() {}
      }

      const body = getApiBody(TestController, 'testMethod');
      expect(body?.required).toBe(true);
    });
  });

  describe('@ApiParam', () => {
    it('should store path parameter metadata', () => {
      class TestController {
        @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
        getUser() {}
      }

      const params = getApiParams(TestController, 'getUser');
      expect(params).toHaveLength(1);
      expect(params[0]).toMatchObject({ name: 'id', description: 'User ID', type: 'string' });
    });

    it('should accumulate multiple params', () => {
      class TestController {
        @ApiParam({ name: 'userId', description: 'User ID' })
        @ApiParam({ name: 'postId', description: 'Post ID' })
        getUserPost() {}
      }

      const params = getApiParams(TestController, 'getUserPost');
      expect(params).toHaveLength(2);
    });

    it('should default required to true', () => {
      class TestController {
        @ApiParam({ name: 'id' })
        testMethod() {}
      }

      const params = getApiParams(TestController, 'testMethod');
      expect(params[0]?.required).toBe(true);
    });
  });

  describe('@ApiQuery', () => {
    it('should store query parameter metadata', () => {
      class TestController {
        @ApiQuery({ name: 'page', type: 'integer' })
        listUsers() {}
      }

      const queries = getApiQueries(TestController, 'listUsers');
      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({ name: 'page', type: 'integer' });
    });

    it('should default required to false', () => {
      class TestController {
        @ApiQuery({ name: 'page' })
        testMethod() {}
      }

      const queries = getApiQueries(TestController, 'testMethod');
      expect(queries[0]?.required).toBe(false);
    });
  });

  describe('@ApiHeader', () => {
    it('should store header metadata', () => {
      class TestController {
        @ApiHeader({ name: 'X-Request-ID', required: true })
        testMethod() {}
      }

      const headers = getApiHeaders(TestController, 'testMethod');
      expect(headers).toHaveLength(1);
      expect(headers[0]).toMatchObject({ name: 'X-Request-ID', required: true });
    });
  });

  describe('@ApiSecurity', () => {
    it('should store security on class', () => {
      @ApiSecurity('bearerAuth')
      class TestController {}

      const security = getApiSecurity(TestController);
      expect(security).toEqual({ name: 'bearerAuth', scopes: [] });
    });

    it('should store security on method', () => {
      class TestController {
        @ApiSecurity('oauth2', ['read:users'])
        getUsers() {}
      }

      const security = getApiSecurity(TestController, 'getUsers');
      expect(security).toEqual({ name: 'oauth2', scopes: ['read:users'] });
    });

    it('should allow removing security with @ApiSecurity()', () => {
      @ApiSecurity('bearerAuth')
      class TestController {
        @ApiSecurity()
        publicMethod() {}
      }

      const security = getApiSecurity(TestController, 'publicMethod');
      expect(security).toBeNull();
    });

    it('should work with @ApiBearerAuth shorthand', () => {
      @ApiBearerAuth()
      class TestController {}

      const security = getApiSecurity(TestController);
      expect(security).toEqual({ name: 'bearerAuth', scopes: [] });
    });
  });

  describe('@ApiProperty', () => {
    it('should store property metadata', () => {
      class UserDto {
        @ApiProperty({ description: 'User email', type: 'string', format: 'email' })
        email!: string;
      }

      const properties = getApiProperties(UserDto);
      expect(properties).toHaveLength(1);
      expect(properties[0]).toMatchObject({
        propertyKey: 'email',
        options: { description: 'User email', type: 'string', format: 'email' },
      });
    });

    it('should accumulate multiple properties', () => {
      class UserDto {
        @ApiProperty({ type: 'string' })
        name!: string;

        @ApiProperty({ type: 'string', format: 'email' })
        email!: string;

        @ApiPropertyOptional({ type: 'integer' })
        age?: number;
      }

      const properties = getApiProperties(UserDto);
      expect(properties).toHaveLength(3);
    });

    it('should mark optional properties correctly', () => {
      class UserDto {
        @ApiPropertyOptional({ type: 'integer' })
        age?: number;
      }

      const properties = getApiProperties(UserDto);
      expect(properties[0]?.options.required).toBe(false);
    });
  });

  describe('@ApiExcludeEndpoint', () => {
    it('should mark endpoint as excluded', () => {
      class TestController {
        @ApiExcludeEndpoint()
        internalMethod() {}

        normalMethod() {}
      }

      expect(isApiExcluded(TestController, 'internalMethod')).toBe(true);
      expect(isApiExcluded(TestController, 'normalMethod')).toBe(false);
    });

    it('should work with @ApiExcludeController', () => {
      @ApiExcludeController()
      class InternalController {
        method1() {}
        method2() {}
      }

      expect(isApiExcluded(InternalController)).toBe(true);
      expect(isApiExcluded(InternalController, 'method1')).toBe(true);
    });
  });

  describe('@ApiDeprecated', () => {
    it('should mark endpoint as deprecated', () => {
      class TestController {
        @ApiDeprecated('Use /v2 instead')
        legacyMethod() {}
      }

      const deprecated = getApiDeprecated(TestController, 'legacyMethod');
      expect(deprecated).toEqual({ deprecated: true, message: 'Use /v2 instead' });
    });

    it('should work without message', () => {
      class TestController {
        @ApiDeprecated()
        oldMethod() {}
      }

      const deprecated = getApiDeprecated(TestController, 'oldMethod');
      expect(deprecated?.deprecated).toBe(true);
    });
  });
});
