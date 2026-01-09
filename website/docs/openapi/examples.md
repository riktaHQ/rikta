---
sidebar_position: 4
---

# Practical Examples

Real-world examples showing how to use `@riktajs/swagger` in common scenarios.

## Complete CRUD API

A full CRUD controller with proper documentation:

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  NotFoundException,
  BadRequestException,
} from '@riktajs/core';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@riktajs/swagger';
import { z } from 'zod';

// Define schemas
const UserSchema = z.object({
  id: z.string().uuid().describe('User unique identifier'),
  name: z.string().describe('User full name'),
  email: z.string().email().describe('User email address'),
  role: z.enum(['admin', 'user']).describe('User role'),
  createdAt: z.date().describe('Creation timestamp'),
  updatedAt: z.date().describe('Last update timestamp'),
});

const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

const UpdateUserSchema = CreateUserSchema.partial();

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

@Controller('/users')
@ApiTags('Users')
export class UserController {
  
  @Get()
  @ApiOperation({ 
    summary: 'List all users',
    description: 'Retrieve a paginated list of users with optional filtering',
  })
  @ApiQuery({ name: 'page', type: 'integer', required: false, default: 1 })
  @ApiQuery({ name: 'limit', type: 'integer', required: false, default: 10 })
  @ApiQuery({ name: 'role', enum: ['admin', 'user'], required: false })
  @ApiOkResponse({ 
    description: 'Paginated list of users',
    schema: z.object({
      data: z.array(UserSchema),
      meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
  })
  async findAll(
    @Query(PaginationSchema) pagination: z.infer<typeof PaginationSchema>,
    @Query('role') role?: string,
  ) {
    // Implementation here
    return {
      data: [],
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  @Get('/:id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their unique identifier',
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'User ID',
  })
  @ApiOkResponse({ description: 'User found', schema: UserSchema })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user with the provided information',
  })
  @ApiBody({ 
    schema: CreateUserSchema,
    description: 'User creation data',
  })
  @ApiCreatedResponse({ 
    description: 'User created successfully',
    schema: UserSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async create(@Body(CreateUserSchema) data: z.infer<typeof CreateUserSchema>) {
    return await this.userService.create(data);
  }

  @Put('/:id')
  @ApiOperation({ 
    summary: 'Update a user',
    description: 'Update user information (partial updates supported)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ schema: UpdateUserSchema })
  @ApiOkResponse({ description: 'User updated', schema: UserSchema })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body(UpdateUserSchema) data: z.infer<typeof UpdateUserSchema>,
  ) {
    const user = await this.userService.update(id, data);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Delete('/:id')
  @ApiOperation({ 
    summary: 'Delete a user',
    description: 'Permanently delete a user by ID',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('id') id: string) {
    const deleted = await this.userService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { message: 'User deleted successfully' };
  }
}
```

## API with Authentication

Example showing how to document protected endpoints:

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@riktajs/core';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiSecurity,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@riktajs/swagger';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email().describe('User email'),
  password: z.string().min(8).describe('User password'),
});

const TokenSchema = z.object({
  accessToken: z.string().describe('JWT access token'),
  refreshToken: z.string().describe('JWT refresh token'),
  expiresIn: z.number().describe('Token expiration time in seconds'),
});

@Controller('/auth')
@ApiTags('Authentication')
export class AuthController {
  
  @Post('/login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user and receive JWT tokens',
  })
  @ApiBody({ schema: LoginSchema })
  @ApiOkResponse({ 
    description: 'Login successful',
    schema: TokenSchema,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body(LoginSchema) credentials: z.infer<typeof LoginSchema>) {
    // Implementation
    return {
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };
  }

  @Get('/profile')
  @ApiBearerAuth()  // Shorthand for @ApiSecurity('bearerAuth')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information',
  })
  @ApiOkResponse({ description: 'User profile' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async getProfile() {
    // This endpoint requires authentication
    return { id: '123', email: 'user@example.com' };
  }
}
```

Setup authentication in your app:

```typescript
import { Rikta } from '@riktajs/core';
import { swaggerPlugin } from '@riktajs/swagger';

const app = await Rikta.create({ port: 3000 });

await app.server.register(swaggerPlugin, {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  config: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
  },
});
```

## Search and Filtering

Advanced search with multiple filters:

```typescript
import { Controller, Get, Query } from '@riktajs/core';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse } from '@riktajs/swagger';
import { z } from 'zod';

const SearchFilters = z.object({
  q: z.string().optional().describe('Search query'),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().optional().describe('Filter by category'),
  tags: z.array(z.string()).optional().describe('Filter by tags'),
  sortBy: z.enum(['title', 'date', 'views']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller('/posts')
@ApiTags('Posts')
export class PostController {
  
  @Get('/search')
  @ApiOperation({ 
    summary: 'Search posts',
    description: 'Search and filter posts with various criteria',
  })
  @ApiQuery({ name: 'q', type: 'string', required: false, description: 'Search query' })
  @ApiQuery({ name: 'status', enum: ['draft', 'published', 'archived'], required: false })
  @ApiQuery({ name: 'category', type: 'string', required: false })
  @ApiQuery({ name: 'tags', type: 'array', items: { type: 'string' }, required: false })
  @ApiQuery({ name: 'sortBy', enum: ['title', 'date', 'views'], required: false, default: 'date' })
  @ApiQuery({ name: 'sortOrder', enum: ['asc', 'desc'], required: false, default: 'desc' })
  @ApiQuery({ name: 'page', type: 'integer', required: false, default: 1 })
  @ApiQuery({ name: 'limit', type: 'integer', required: false, default: 20 })
  @ApiOkResponse({ description: 'Search results' })
  async search(@Query(SearchFilters) filters: z.infer<typeof SearchFilters>) {
    // Implementation
    return {
      results: [],
      meta: {
        total: 0,
        page: filters.page,
        limit: filters.limit,
      },
    };
  }
}
```

## File Upload

Document file upload endpoints properly:

```typescript
import { Controller, Post, Body } from '@riktajs/core';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@riktajs/swagger';

@Controller('/media')
@ApiTags('Media')
export class MediaController {
  
  @Post('/upload')
  @ApiOperation({ 
    summary: 'Upload a file',
    description: 'Upload a single file with metadata',
  })
  @ApiBody({
    description: 'File upload with metadata',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        title: {
          type: 'string',
          description: 'File title',
        },
        description: {
          type: 'string',
          description: 'File description',
        },
      },
    },
  })
  @ApiOkResponse({ 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        size: { type: 'number' },
      },
    },
  })
  async upload(@Body() data: any) {
    // Handle file upload
    return {
      id: 'file-id',
      filename: 'document.pdf',
      url: 'https://example.com/files/document.pdf',
      size: 1024000,
    };
  }

  @Post('/upload-multiple')
  @ApiOperation({ 
    summary: 'Upload multiple files',
    description: 'Upload multiple files at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of files to upload',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Files uploaded successfully' })
  async uploadMultiple(@Body() data: any) {
    // Handle multiple file upload
    return { uploaded: 3 };
  }
}
```

## Nested Resources

Document nested resource endpoints:

```typescript
import { Controller, Get, Post, Param, Body } from '@riktajs/core';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiBody,
  ApiOkResponse 
} from '@riktajs/swagger';
import { z } from 'zod';

const CommentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  content: z.string(),
  author: z.string(),
  createdAt: z.date(),
});

const CreateCommentSchema = CommentSchema.omit({ 
  id: true, 
  postId: true, 
  createdAt: true 
});

@Controller('/posts/:postId/comments')
@ApiTags('Comments')
export class PostCommentsController {
  
  @Get()
  @ApiOperation({ 
    summary: 'Get post comments',
    description: 'Retrieve all comments for a specific post',
  })
  @ApiParam({ 
    name: 'postId', 
    type: 'string', 
    format: 'uuid',
    description: 'Post ID',
  })
  @ApiOkResponse({ 
    description: 'List of comments',
    schema: z.array(CommentSchema),
  })
  async getComments(@Param('postId') postId: string) {
    return [];
  }

  @Post()
  @ApiOperation({ 
    summary: 'Add comment to post',
    description: 'Create a new comment on a specific post',
  })
  @ApiParam({ name: 'postId', type: 'string', format: 'uuid' })
  @ApiBody({ schema: CreateCommentSchema })
  @ApiOkResponse({ 
    description: 'Comment created',
    schema: CommentSchema,
  })
  async createComment(
    @Param('postId') postId: string,
    @Body(CreateCommentSchema) data: z.infer<typeof CreateCommentSchema>,
  ) {
    // Implementation
    return { 
      id: 'comment-id', 
      postId, 
      ...data, 
      createdAt: new Date() 
    };
  }
}
```

## Error Responses

Document consistent error responses across your API:

```typescript
import { z } from 'zod';

// Define error schemas
export const ErrorSchema = z.object({
  statusCode: z.number().describe('HTTP status code'),
  message: z.string().describe('Error message'),
  error: z.string().describe('Error type'),
});

export const ValidationErrorSchema = ErrorSchema.extend({
  errors: z.array(z.object({
    path: z.array(z.string()).describe('Field path'),
    message: z.string().describe('Validation error message'),
  })),
});

// Use in controllers
@Get('/:id')
@ApiOkResponse({ description: 'Success', schema: UserSchema })
@ApiNotFoundResponse({ 
  description: 'User not found',
  schema: ErrorSchema,
})
@ApiBadRequestResponse({ 
  description: 'Validation error',
  schema: ValidationErrorSchema,
})
findOne(@Param('id') id: string) {}
```

## Versioned API

Document multiple API versions:

```typescript
// v1/user.controller.ts
@Controller('/api/v1/users')
@ApiTags('Users (v1)')
@ApiDeprecated()
export class UserControllerV1 {
  @Get()
  @ApiOperation({ 
    summary: 'List users (v1 - deprecated)',
    description: 'Use /api/v2/users instead',
  })
  findAll() {}
}

// v2/user.controller.ts
@Controller('/api/v2/users')
@ApiTags('Users (v2)')
export class UserControllerV2 {
  @Get()
  @ApiOperation({ 
    summary: 'List users (v2)',
    description: 'Current version with improved response format',
  })
  findAll() {}
}

// Configure servers in Swagger
await app.server.register(swaggerPlugin, {
  info: { title: 'My API', version: '2.0.0' },
  config: {
    servers: [
      { url: 'http://localhost:3000/api/v2', description: 'v2 (current)' },
      { url: 'http://localhost:3000/api/v1', description: 'v1 (deprecated)' },
    ],
  },
});
```