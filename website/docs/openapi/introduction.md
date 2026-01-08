---
sidebar_position: 1
---

# Introduction

The `@riktajs/swagger` package provides automatic OpenAPI (Swagger) documentation generation for your Rikta APIs.

## Installation

```bash
npm install @riktajs/swagger
```

## Quick Start

### Basic Setup

```typescript
import { Rikta } from '@riktajs/core';
import { setupSwagger } from '@riktajs/swagger';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
    autowired: ['./src'],
  });

  // Setup Swagger
  setupSwagger(app, {
    title: 'My API',
    description: 'API documentation for My Application',
    version: '1.0.0',
  });

  await app.listen();
  console.log('Swagger UI available at http://localhost:3000/api-docs');
}

bootstrap();
```

### Access Documentation

Once configured, access your API documentation at:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api-docs/json`

## Configuration Options

```typescript
setupSwagger(app, {
  // Basic info
  title: 'My API',
  description: 'API documentation',
  version: '1.0.0',
  
  // Server info
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://api.example.com', description: 'Production' },
  ],
  
  // Authentication
  securityDefinitions: {
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
  
  // UI options
  path: '/api-docs',
  jsonPath: '/api-docs/json',
  
  // Custom options
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'My API Docs',
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
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().optional(),
});

@Post()
create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {
  // Schema is automatically documented
}
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

## Next Steps

- [Decorators](/docs/openapi/decorators) - Learn about OpenAPI decorators
- [Operations](/docs/openapi/operations) - Document operations in detail
