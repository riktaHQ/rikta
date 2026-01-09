---
sidebar_position: 3
---

# Operations

Learn how to document complex API operations with detailed request/response specifications.

## Request Documentation

### Request Body with Content Types

You can document request bodies with different content types using `@ApiBody`:

```typescript
import { ApiBody } from '@riktajs/swagger';

@Post()
@ApiBody({
  description: 'User data in JSON format',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
  },
})
create(@Body() data: CreateUserDto) {}
```

### File Upload

Document file upload endpoints:

```typescript
@Post('/avatar')
@ApiBody({
  description: 'Upload avatar image',
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'Avatar image file',
      },
    },
  },
})
@ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
uploadAvatar(@Body() file: any) {}

// Multiple files
@Post('/documents')
@ApiBody({
  description: 'Upload multiple documents',
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
        description: 'Document files',
      },
    },
  },
})
uploadDocuments(@Body() files: any) {}
```

## Response Documentation

### Response Schemas

Document response structures in detail:

```typescript
@Get('/:id')
@ApiResponse({
  status: 200,
  description: 'User details',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      profile: {
        type: 'object',
        properties: {
          avatar: { type: 'string', format: 'uri' },
          bio: { type: 'string' },
        },
      },
      roles: {
        type: 'array',
        items: { type: 'string' },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
})
findOne(@Param('id') id: string) {}
```

### Paginated Responses

```typescript
@Get()
@ApiResponse({
  status: 200,
  description: 'Paginated list of users',
  schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
})
findAll(@Query() pagination: PaginationDto) {}
```

### Error Responses

Document error response formats:

```typescript
@Get('/:id')
@ApiResponse({
  status: 404,
  description: 'User not found',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'integer', example: 404 },
      message: { type: 'string', example: 'User not found' },
      error: { type: 'string', example: 'Not Found' },
    },
  },
})
@ApiResponse({
  status: 400,
  description: 'Validation error',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'integer', example: 400 },
      message: { type: 'string', example: 'Validation failed' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' },
          },
        },
      },
    },
  },
})
findOne(@Param('id') id: string) {}
```

## Authentication Documentation

### Bearer Token

```typescript
// Configure in bootstrap
await app.server.register(swaggerPlugin, {
  info: { title: 'My API', version: '1.0.0' },
  config: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
  },
});

// Apply globally to controller
@Controller('/users')
@ApiSecurity('bearerAuth')
export class UserController {}

// Or per route
@Get('/profile')
@ApiSecurity('bearerAuth')
getProfile() {}
```

### API Key

```typescript
await app.server.register(swaggerPlugin, {
  info: { title: 'My API', version: '1.0.0' },
  config: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
});

@Controller('/webhooks')
@ApiSecurity('apiKey')
export class WebhookController {}
```

### OAuth2

```typescript
await app.server.register(swaggerPlugin, {
  info: { title: 'My API', version: '1.0.0' },
  config: {
    securitySchemes: {
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': 'Read user information',
              'write:users': 'Modify user information',
            },
          },
        },
      },
    },
  },
});
```

### Public Endpoints

Mark endpoints that don't require authentication:

```typescript
@Controller('/auth')
export class AuthController {
  @Post('/login')
  // No @ApiSecurity - public endpoint
  login(@Body() credentials: LoginDto) {}

  @Get('/me')
  @ApiSecurity('bearerAuth')
  getProfile() {}
}
```

## Advanced Examples

### Webhooks

```typescript
@Controller('/webhooks')
@ApiTags('Webhooks')
export class WebhookController {
  @Post('/github')
  @ApiOperation({
    summary: 'GitHub webhook endpoint',
    description: 'Receives push events from GitHub repositories',
  })
  @ApiHeader({
    name: 'X-GitHub-Event',
    description: 'Type of event',
    required: true,
  })
  @ApiHeader({
    name: 'X-Hub-Signature-256',
    description: 'HMAC signature',
    required: true,
  })
  @ApiBody({
    description: 'GitHub push event payload',
    schema: {
      type: 'object',
      properties: {
        ref: { type: 'string' },
        repository: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
          },
        },
        commits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  })
  handleGithub(@Body() payload: any, @Headers() headers: any) {}
}
```

### Streaming Responses

```typescript
@Get('/events')
@ApiOperation({
  summary: 'Server-Sent Events stream',
  description: 'Subscribe to real-time updates',
})
@ApiResponse({
  status: 200,
  description: 'SSE stream of events',
  schema: {
    type: 'string',
    description: 'Server-Sent Events stream',
  },
})
streamEvents() {
  // Return SSE stream
}
```

### Bulk Operations

```typescript
@Post('/bulk')
@ApiOperation({
  summary: 'Bulk create users',
  description: 'Create multiple users in a single request',
})
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        minItems: 1,
        maxItems: 100,
      },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Bulk operation result',
  schema: {
    type: 'object',
    properties: {
      created: { type: 'integer' },
      failed: { type: 'integer' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer' },
            error: { type: 'string' },
          },
        },
      },
    },
  },
})
bulkCreate(@Body() data: { users: CreateUserDto[] }) {}
```

## Best Practices

### 1. Use Descriptive Summaries

```typescript
// ✅ Good
@ApiOperation({ summary: 'Get user by ID' })

// ❌ Avoid
@ApiOperation({ summary: 'Get' })
```

### 2. Document All Responses

```typescript
@Get('/:id')
@ApiOkResponse({ description: 'User found' })
@ApiNotFoundResponse({ description: 'User not found' })
@ApiBadRequestResponse({ description: 'Invalid ID format' })
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
```

### 3. Provide Examples

```typescript
@ApiBody({
  schema: {
    type: 'object',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
})
```

### 4. Group Related Endpoints

```typescript
@Controller('/users')
@ApiTags('Users')
export class UserController {}

@Controller('/users/:userId/posts')
@ApiTags('User Posts')
export class UserPostsController {}
```

### 5. Version Your API

```typescript
await app.server.register(swaggerPlugin, {
  info: {
    title: 'My API',
    version: '2.0.0',
  },
  config: {
    servers: [
      { url: '/api/v2', description: 'Version 2' },
      { url: '/api/v1', description: 'Version 1 (deprecated)' },
    ],
  },
});
```
