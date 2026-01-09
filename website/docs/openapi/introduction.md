---
sidebar_position: 1
---

# Introduction

The `@riktajs/swagger` package provides automatic OpenAPI (Swagger) documentation generation for your Rikta APIs.

## Key Features

- ✅ **Automatic route discovery** - Scans all your controllers automatically
- ✅ **Zod integration** - Convert Zod schemas to OpenAPI schemas automatically
- ✅ **Type safety** - Full TypeScript support with type inference
- ✅ **Interactive UI** - Beautiful Swagger UI out of the box
- ✅ **Rich decorators** - Document your API with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.
- ✅ **Zero configuration** - Works with sensible defaults
- ✅ **OpenAPI 3.0/3.1** - Full specification support

## Installation

```bash
npm install @riktajs/swagger
```

## Quick Start

### Basic Setup

```typescript
import { Rikta } from '@riktajs/core';
import { swaggerPlugin } from '@riktajs/swagger';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
  });

  // Register Swagger plugin
  await app.server.register(swaggerPlugin, {
    info: {
      title: 'My API',
      description: 'API documentation for My Application',
      version: '1.0.0',
    },
  });

  await app.listen();
  console.log('Swagger UI available at http://localhost:3000/docs');
}

bootstrap();
```

### Access Documentation

Once configured, access your API documentation at:
- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs/json`

## Configuration Options

```typescript
await app.server.register(swaggerPlugin, {
  // API Information
  info: {
    title: 'My API',
    description: 'API documentation',
    version: '1.0.0',
  },
  
  // OpenAPI Configuration
  config: {
    // Server definitions
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
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
  
  // UI Customization
  uiPath: '/docs',          // Swagger UI path (default: /docs)
  jsonPath: '/docs/json',   // OpenAPI JSON path (default: /docs/json)
  exposeUI: true,           // Enable Swagger UI (default: true)
  exposeSpec: true,         // Enable JSON spec endpoint (default: true)
  
  // Theme
  theme: 'default',  // or 'dark'
  
  // Logo
  logo: {
    url: 'https://example.com/logo.png',
    altText: 'My API',
  },
});
```

## How It Works

The Swagger package automatically:

1. **Scans controllers** - Discovers all `@Controller()` decorated classes
2. **Analyzes routes** - Extracts HTTP methods, paths, and parameters
3. **Processes decorators** - Uses OpenAPI decorators for additional metadata
4. **Generates schema** - Creates OpenAPI 3.0 specification
5. **Serves documentation** - Provides Swagger UI interface

```
┌─────────────────────────────────────────────────────────────┐
│                    Swagger Generation                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  @Controller ──▶ Extract Routes ──▶ Generate Paths         │
│        │                                                     │
│        ▼                                                     │
│  @ApiTags      ──▶ Extract Metadata ──▶ Add to Spec         │
│  @ApiOperation                                               │
│  @ApiResponse                                                │
│        │                                                     │
│        ▼                                                     │
│  Zod Schemas ──▶ Generate Schemas ──▶ Add Definitions       │
│        │                                                     │
│        ▼                                                     │
│  OpenAPI 3.0 Specification ──▶ Swagger UI                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Automatic Schema Generation

Zod schemas are automatically converted to OpenAPI schemas:

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).describe('User full name'),
  email: z.string().email().describe('Email address'),
  age: z.number().int().optional().describe('User age'),
});

@Post()
@ApiBody({ schema: CreateUserSchema })
create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {
  // The schema is automatically:
  // 1. Used for request validation
  // 2. Converted to OpenAPI schema
  // 3. Shown in Swagger UI
  // 4. Provides TypeScript type safety
}
```

**The generated OpenAPI schema will include:**
- Property types (string, number, etc.)
- Validations (min, max, email format, etc.)
- Descriptions from `.describe()`
- Required vs optional fields
- Nested objects and arrays

### Working with Zod Schemas

**String validations:**
```typescript
const schema = z.object({
  email: z.string().email(),           // → format: email
  url: z.string().url(),                // → format: uri
  uuid: z.string().uuid(),              // → format: uuid
  name: z.string().min(1).max(100),     // → minLength: 1, maxLength: 100
  code: z.string().regex(/^[A-Z]{3}$/), // → pattern: ^[A-Z]{3}$
});
```

**Number validations:**
```typescript
const schema = z.object({
  age: z.number().int().min(0).max(150),  // → type: integer, minimum: 0, maximum: 150
  price: z.number().positive(),            // → type: number, minimum: 0
  rating: z.number().min(1).max(5),        // → type: number, minimum: 1, maximum: 5
});
```

**Arrays and nested objects:**
```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

const UserSchema = z.object({
  name: z.string(),
  addresses: z.array(AddressSchema).min(1),  // Array with at least 1 item
  tags: z.array(z.string()),                 // Array of strings
  metadata: z.record(z.string()),            // Object with string values
});
```

**Enums:**
```typescript
const schema = z.object({
  role: z.enum(['admin', 'user', 'guest']),     // → enum: ['admin', 'user', 'guest']
  status: z.nativeEnum(Status),                  // For TypeScript enums
});
```

**Optional and nullable:**
```typescript
const schema = z.object({
  name: z.string(),                    // Required
  nickname: z.string().optional(),     // Optional field
  middleName: z.string().nullable(),   // Can be null
  suffix: z.string().nullish(),        // Optional AND nullable
});
```

### Route Parameter Detection

Parameters are automatically detected and documented:

```typescript
@Get('/:id')
findOne(@Param('id') id: string) {
  // 'id' parameter is documented as path parameter
}

@Get()
findAll(@Query('page') page: number, @Query('limit') limit: number) {
  // 'page' and 'limit' are documented as query parameters
}
```

## Complete Working Example

Here's a real-world example showing how to setup Swagger with a complete CRUD controller:

```typescript
import { Rikta, Controller, Get, Post, Put, Delete, Body, Param, Query } from '@riktajs/core';
import { 
  swaggerPlugin, 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@riktajs/swagger';
import { z } from 'zod';

// Define Zod schemas for validation and automatic OpenAPI generation
const CreateUserSchema = z.object({
  name: z.string().min(1).describe('User full name'),
  email: z.string().email().describe('Email address'),
  age: z.number().int().min(0).optional().describe('User age'),
});

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().optional(),
  createdAt: z.date(),
});

@ApiTags('Users')
@Controller('/users')
class UserController {
  
  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', type: 'integer', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', type: 'integer', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of users', schema: z.array(UserSchema) })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Your logic here
    return [];
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', schema: UserSchema })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    // Your logic here
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ schema: CreateUserSchema })
  @ApiResponse({ status: 201, description: 'User created', schema: UserSchema })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {
    // Data is automatically validated and typed!
    // Your logic here
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  delete(@Param('id') id: string) {
    // Your logic here
  }
}

// Bootstrap application
async function bootstrap() {
  const app = await Rikta.create({ port: 3000 });

  await app.server.register(swaggerPlugin, {
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'Complete API with automatic documentation',
    },
    config: {
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
      ],
    },
  });

  await app.listen();
  console.log('📚 Swagger UI: http://localhost:3000/docs');
}

bootstrap();
```

Key benefits:
- ✅ **Zod schemas** are automatically converted to OpenAPI schemas
- ✅ **Type safety** with TypeScript inference from Zod
- ✅ **Validation** happens automatically on requests
- ✅ **Documentation** is generated from decorators and schemas
- ✅ **No duplication** - write your schema once, get validation + docs

### Response Documentation

Add response documentation with decorators:

```typescript
@Get('/:id')
@ApiResponse({ status: 200, description: 'User found' })
@ApiResponse({ status: 404, description: 'User not found' })
findOne(@Param('id') id: string) {
  return this.userService.findById(id);
}
```
