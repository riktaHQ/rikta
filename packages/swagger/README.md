# @riktajs/swagger

[![npm version](https://img.shields.io/npm/v/@riktajs/swagger.svg)](https://www.npmjs.com/package/@riktajs/swagger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automatic OpenAPI/Swagger documentation generation for the Rikta Framework.

> **Note:** This package is completely agnostic from `@riktajs/core` - it only reads metadata and can be used with any Fastify application.

## Features

- 🚀 **Automatic route extraction** from `@Controller`, `@Get`, `@Post`, etc.
- 🏷️ **Rich decorators** for API documentation (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.)
- 📝 **Zod integration** for automatic request/response type documentation
- 🎨 **Interactive Swagger UI** powered by `@fastify/swagger-ui`
- 📋 **Full OpenAPI 3.0/3.1** specification support
- 🔌 **Zero-config** with sensible defaults
- 🏗️ **Completely agnostic** from `@riktajs/core` - can be used independently

## Installation

```bash
npm install @riktajs/swagger
```

## Quick Start

```typescript
import { Rikta, Controller, Get, Body, Post } from '@riktajs/core';
import { swaggerPlugin, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@riktajs/swagger';
import { z } from 'zod';

// Define your schemas with Zod
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

@ApiTags('Users')
@Controller('/users')
class UserController {
  @Get('/')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Array of users', schema: z.array(UserSchema) })
  async listUsers() {
    return [];
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ schema: CreateUserSchema })
  @ApiResponse({ status: 201, description: 'User created', schema: UserSchema })
  async createUser(@Body() data: z.infer<typeof CreateUserSchema>) {
    return { id: 'uuid', ...data };
  }
}

// Create and start the application
const app = await Rikta.create({ port: 3000 });

// Register swagger plugin
await app.server.register(swaggerPlugin, {
  title: 'My API',
  version: '1.0.0',
  description: 'My awesome API documentation',
});

await app.listen();

// Swagger UI: http://localhost:3000/docs
// OpenAPI JSON: http://localhost:3000/docs/json
```

## Configuration

```typescript
await app.server.register(swaggerPlugin, {
  // Required
  title: 'My API',
  version: '1.0.0',
  
  // Optional
  description: 'API description with **Markdown** support',
  termsOfService: 'https://example.com/terms',
  contact: {
    name: 'API Support',
    url: 'https://example.com/support',
    email: 'support@example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  
  // Server configuration
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://api.example.com', description: 'Production' },
  ],
  
  // Security schemes
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  
  // Custom paths
  uiPath: '/docs',       // Default: /docs
  jsonPath: '/docs/json', // Default: /docs/json
  
  // OpenAPI version
  openApiVersion: '3.0.3', // Default: 3.0.3
});
```

## Decorators

### Class Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiTags(...tags)` | Group endpoints by tags |
| `@ApiBearerAuth()` | Apply Bearer auth to all endpoints |
| `@ApiSecurity(name, scopes?)` | Apply security requirement |

### Method Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiOperation(options)` | Describe the operation (summary, description) |
| `@ApiResponse(options)` | Document a response (status, schema, description) |
| `@ApiBody(options)` | Document request body |
| `@ApiParam(options)` | Document path parameter |
| `@ApiQuery(options)` | Document query parameter |
| `@ApiHeader(options)` | Document header parameter |
| `@ApiExcludeEndpoint()` | Exclude endpoint from documentation |

### Property Decorators

| Decorator | Description |
|-----------|-------------|
| `@ApiProperty(options)` | Document DTO property |

## Zod Integration

The package automatically converts Zod schemas to OpenAPI schemas:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid().describe('Unique user identifier'),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.date(),
});

// Use in decorators
@ApiResponse({ status: 200, schema: UserSchema })
```

Supported Zod types:
- Primitives: `string`, `number`, `boolean`, `bigint`
- Complex: `object`, `array`, `tuple`, `record`
- Modifiers: `optional`, `nullable`, `default`
- Validators: `min`, `max`, `email`, `uuid`, `url`, etc.
- Enums: `enum`, `nativeEnum`
- Unions and intersections

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## Alternative APIs

### registerSwagger Helper

A simpler API for registering the plugin:

```typescript
import { registerSwagger } from '@riktajs/swagger';

await registerSwagger(app, {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
});
```

### createSwaggerConfig

For more control or integration with existing Fastify apps:

```typescript
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { createSwaggerConfig } from '@riktajs/swagger';

const app = fastify();
const { swaggerOptions, swaggerUIOptions, specification } = createSwaggerConfig({
  info: { title: 'My API', version: '1.0.0' },
  controllers: [UserController, ProductController],
});

await app.register(fastifySwagger, swaggerOptions);
await app.register(fastifySwaggerUI, swaggerUIOptions);
```

### OpenApiGenerator Direct Usage

Generate OpenAPI spec without Fastify:

```typescript
import { OpenApiGenerator } from '@riktajs/swagger';

const generator = new OpenApiGenerator({
  info: { title: 'My API', version: '1.0.0' },
});

generator.addController(UserController);
generator.addController(ProductController);

const spec = generator.generate();
console.log(JSON.stringify(spec, null, 2));
```

## Related Packages

- [@riktajs/core](https://www.npmjs.com/package/@riktajs/core) - Rikta Framework core

## License

MIT
