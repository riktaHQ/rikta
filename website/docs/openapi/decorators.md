---
sidebar_position: 2
---

# Decorators

The `@riktajs/swagger` package provides decorators to enrich your API documentation with additional metadata.

## Controller Decorators

### @ApiTags()

Group related endpoints under a tag:

```typescript
import { Controller } from '@riktajs/core';
import { ApiTags } from '@riktajs/swagger';

@Controller('/users')
@ApiTags('Users')
export class UserController {
  // All routes will be grouped under "Users" tag
}

@Controller('/auth')
@ApiTags('Authentication')
export class AuthController {
  // All routes will be grouped under "Authentication" tag
}
```

Multiple tags:

```typescript
@Controller('/admin/users')
@ApiTags('Users', 'Admin')
export class AdminUserController {}
```

### @ApiSecurity()

Specify security requirements:

```typescript
import { ApiSecurity } from '@riktajs/swagger';

@Controller('/users')
@ApiSecurity('bearerAuth')
export class UserController {
  // All routes require bearer authentication
}

// Or per-route:
@Get('/:id')
@ApiSecurity('bearerAuth')
findOne(@Param('id') id: string) {}
```

## Operation Decorators

### @ApiOperation()

Describe an operation:

```typescript
import { ApiOperation } from '@riktajs/swagger';

@Get()
@ApiOperation({
  summary: 'Get all users',
  description: 'Retrieves a paginated list of all users in the system.',
  operationId: 'getUsers',
})
findAll() {
  return this.userService.findAll();
}
```

### @ApiResponse()

Document response types:

```typescript
import { ApiResponse } from '@riktajs/swagger';

@Get('/:id')
@ApiResponse({
  status: 200,
  description: 'User found successfully',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'User not found',
})
findOne(@Param('id') id: string) {}
```

Common response decorators:

```typescript
import { 
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@riktajs/swagger';

@Post()
@ApiCreatedResponse({ description: 'User created successfully' })
@ApiBadRequestResponse({ description: 'Invalid input data' })
create(@Body() data: CreateUserDto) {}

@Get('/:id')
@ApiOkResponse({ description: 'User found' })
@ApiNotFoundResponse({ description: 'User not found' })
findOne(@Param('id') id: string) {}

@Delete('/:id')
@ApiOkResponse({ description: 'User deleted' })
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
@ApiForbiddenResponse({ description: 'Not authorized' })
delete(@Param('id') id: string) {}
```

## Parameter Decorators

### @ApiParam()

Document path parameters:

```typescript
import { ApiParam } from '@riktajs/swagger';

@Get('/:id')
@ApiParam({
  name: 'id',
  description: 'User ID',
  type: 'string',
  format: 'uuid',
  required: true,
})
findOne(@Param('id') id: string) {}

@Get('/:category/:id')
@ApiParam({ name: 'category', description: 'Product category' })
@ApiParam({ name: 'id', description: 'Product ID' })
findProduct(
  @Param('category') category: string,
  @Param('id') id: string,
) {}
```

### @ApiQuery()

Document query parameters:

```typescript
import { ApiQuery } from '@riktajs/swagger';

@Get()
@ApiQuery({
  name: 'page',
  description: 'Page number',
  type: 'integer',
  required: false,
  default: 1,
})
@ApiQuery({
  name: 'limit',
  description: 'Items per page',
  type: 'integer',
  required: false,
  default: 10,
  minimum: 1,
  maximum: 100,
})
@ApiQuery({
  name: 'sort',
  description: 'Sort order',
  enum: ['asc', 'desc'],
  required: false,
  default: 'desc',
})
findAll(
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('sort') sort: string,
) {}
```

### @ApiHeader()

Document header parameters:

```typescript
import { ApiHeader } from '@riktajs/swagger';

@Get()
@ApiHeader({
  name: 'X-Request-ID',
  description: 'Unique request identifier',
  required: false,
})
@ApiHeader({
  name: 'Accept-Language',
  description: 'Preferred language',
  schema: { default: 'en' },
})
findAll() {}
```

## Body Decorators

### @ApiBody()

Document request body:

```typescript
import { ApiBody } from '@riktajs/swagger';

@Post()
@ApiBody({
  description: 'User creation payload',
  schema: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com',
      },
      password: {
        type: 'string',
        minLength: 8,
        example: 'securePass123',
      },
    },
  },
})
create(@Body() data: CreateUserDto) {}
```

### Using with Zod

When using Zod schemas, the body is auto-documented:

```typescript
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

@Post()
// Body is automatically documented from Zod schema
create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {}
```

## Schema Decorators

### @ApiProperty()

Document DTO properties (when not using Zod):

```typescript
import { ApiProperty } from '@riktajs/swagger';

class CreateUserDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    writeOnly: true,
  })
  password: string;

  @ApiProperty({
    description: 'User age',
    required: false,
    minimum: 0,
    maximum: 150,
  })
  age?: number;
}
```

### @ApiPropertyOptional()

Mark property as optional:

```typescript
import { ApiPropertyOptional } from '@riktajs/swagger';

class UpdateUserDto {
  @ApiPropertyOptional({ description: 'New name' })
  name?: string;

  @ApiPropertyOptional({ description: 'New email' })
  email?: string;
}
```

## Utility Decorators

### @ApiExcludeEndpoint()

Hide an endpoint from documentation:

```typescript
import { ApiExcludeEndpoint } from '@riktajs/swagger';

@Get('/internal')
@ApiExcludeEndpoint()
internalEndpoint() {
  // Not shown in Swagger UI
}
```

### @ApiExcludeController()

Hide entire controller:

```typescript
import { ApiExcludeController } from '@riktajs/swagger';

@Controller('/internal')
@ApiExcludeController()
export class InternalController {
  // None of these routes are shown
}
```

### @ApiDeprecated()

Mark endpoint as deprecated:

```typescript
import { ApiDeprecated } from '@riktajs/swagger';

@Get('/v1/users')
@ApiDeprecated()
@ApiOperation({ summary: 'Get users (deprecated, use /v2/users)' })
findAllV1() {}
```

## Complete Example

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@riktajs/core';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@riktajs/swagger';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).describe('User full name'),
  email: z.string().email().describe('Email address'),
  role: z.enum(['admin', 'user']).default('user').describe('User role'),
});

@Controller('/users')
@ApiTags('Users')
@ApiSecurity('bearerAuth')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', type: 'integer', required: false })
  @ApiQuery({ name: 'limit', type: 'integer', required: false })
  @ApiOkResponse({ description: 'List of users' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.findAll({ page, limit });
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {
    return this.userService.create(data);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
```
