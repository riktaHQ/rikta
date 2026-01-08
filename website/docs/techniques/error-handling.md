---
sidebar_position: 2
---

# Error Handling

Rikta provides a robust exception handling system that makes it easy to handle errors consistently across your application.

## Introduction

Proper error handling ensures:

- **Consistent responses** - Uniform error format across the API
- **Security** - Don't leak sensitive information
- **Debugging** - Sufficient information for developers
- **User experience** - Clear, actionable error messages

## Built-in Exceptions

Rikta provides built-in HTTP exceptions that map to standard HTTP status codes:

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@riktajs/core';
```

### Using Exceptions

Throw exceptions in your controllers or services:

```typescript
import { Controller, Get, Param, NotFoundException } from '@riktajs/core';

@Controller('/users')
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }
}
```

### Exception Response Format

When an exception is thrown, Rikta returns a JSON response:

```json
{
  "statusCode": 404,
  "message": "User with ID abc123 not found",
  "error": "Not Found"
}
```

## Available Exceptions

| Exception | Status Code | Use Case |
|-----------|-------------|----------|
| `BadRequestException` | 400 | Invalid input data |
| `UnauthorizedException` | 401 | Missing or invalid authentication |
| `ForbiddenException` | 403 | Authenticated but not authorized |
| `NotFoundException` | 404 | Resource not found |
| `MethodNotAllowedException` | 405 | HTTP method not supported |
| `ConflictException` | 409 | Resource conflict (e.g., duplicate) |
| `UnprocessableEntityException` | 422 | Semantic validation error |
| `InternalServerErrorException` | 500 | Server error |

### Examples

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@riktajs/core';

// Invalid input
if (!isValidEmail(email)) {
  throw new BadRequestException('Invalid email format');
}

// Missing authentication
if (!token) {
  throw new UnauthorizedException('Authentication required');
}

// Not authorized
if (user.role !== 'admin') {
  throw new ForbiddenException('Admin access required');
}

// Resource not found
const post = await this.postService.findById(id);
if (!post) {
  throw new NotFoundException('Post not found');
}

// Duplicate resource
const existing = await this.userService.findByEmail(email);
if (existing) {
  throw new ConflictException('User with this email already exists');
}
```

## Custom Exceptions

Create custom exceptions for domain-specific errors:

```typescript
import { HttpException } from '@riktajs/core';

export class InsufficientFundsException extends HttpException {
  constructor(required: number, available: number) {
    super(
      400,
      `Insufficient funds. Required: ${required}, Available: ${available}`
    );
    this.name = 'InsufficientFundsException';
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter: number) {
    super(429, 'Too many requests');
    this.name = 'RateLimitExceededException';
  }
}

// Usage
throw new InsufficientFundsException(100, 50);
throw new RateLimitExceededException(60);
```

## Exception Filters

Handle exceptions globally with exception filters:

```typescript
import { ExceptionFilter, Catch, HttpException } from '@riktajs/core';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, request: FastifyRequest, reply: FastifyReply) {
    const status = exception.getStatus();
    const message = exception.message;

    reply.status(status).send({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Catching All Exceptions

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, request: FastifyRequest, reply: FastifyReply) {
    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error
    console.error('Unhandled exception:', exception);

    reply.status(status).send({
      statusCode: status,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Error Handling in Async Code

### Promise Errors

Exceptions in async handlers are automatically caught:

```typescript
@Get('/:id')
async findOne(@Param('id') id: string) {
  // If findById throws, it's automatically handled
  const user = await this.userService.findById(id);
  
  if (!user) {
    throw new NotFoundException(); // Handled
  }
  
  return user;
}
```

### Explicit Try-Catch

For complex error handling:

```typescript
@Post()
async create(@Body() data: CreateUserDto) {
  try {
    return await this.userService.create(data);
  } catch (error) {
    if (error instanceof DuplicateKeyError) {
      throw new ConflictException('User already exists');
    }
    if (error instanceof ValidationError) {
      throw new BadRequestException(error.message);
    }
    // Re-throw for global handler
    throw error;
  }
}
```

## Validation Errors

Zod validation errors are automatically formatted:

```typescript
// When validation fails, returns:
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

### Custom Validation Error Response

```typescript
import { z } from 'zod';

function formatZodError(error: z.ZodError) {
  return {
    statusCode: 400,
    message: 'Validation failed',
    errors: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
```

## Service-Level Error Handling

Handle errors in services with proper exception translation:

```typescript
@Injectable()
export class UserService {
  @Autowired()
  private database!: DatabaseService;

  async findById(id: string): Promise<User> {
    try {
      const user = await this.database.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (!user) {
        throw new NotFoundException(`User ${id} not found`);
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw HTTP exceptions
      }
      
      // Wrap database errors
      console.error('Database error:', error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      return await this.database.insert('users', data);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
```

## Logging Errors

Integrate error logging:

```typescript
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  @Autowired()
  private logger!: LoggerService;

  catch(exception: unknown, request: FastifyRequest, reply: FastifyReply) {
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : 500;

    // Log based on severity
    if (status >= 500) {
      this.logger.error('Server error', {
        exception,
        url: request.url,
        method: request.method,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn('Client error', {
        status,
        message: exception instanceof Error ? exception.message : 'Unknown error',
        url: request.url,
      });
    }

    reply.status(status).send({
      statusCode: status,
      message: status >= 500 ? 'Internal server error' : (exception as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Best Practices

### 1. Use Appropriate Status Codes

```typescript
// ✅ Good - specific status codes
throw new NotFoundException('User not found');      // 404
throw new ConflictException('Email already taken'); // 409
throw new UnprocessableEntityException('Invalid data'); // 422

// ❌ Avoid - generic errors for specific cases
throw new BadRequestException('Error'); // Too vague
```

### 2. Don't Expose Internal Details

```typescript
// ✅ Good - safe for production
throw new InternalServerErrorException('Failed to process request');

// ❌ Bad - exposes internals
throw new InternalServerErrorException(
  `Database error: connection to postgres:5432 refused`
);
```

### 3. Provide Actionable Messages

```typescript
// ✅ Good - tells user what to do
throw new BadRequestException(
  'Email is required. Please provide a valid email address.'
);

// ❌ Bad - not helpful
throw new BadRequestException('Validation error');
```

### 4. Handle All Error Paths

```typescript
@Post()
async create(@Body() data: CreateUserDto) {
  try {
    const user = await this.userService.create(data);
    return user;
  } catch (error) {
    // Handle known errors
    if (error instanceof DuplicateError) {
      throw new ConflictException('User exists');
    }
    // Always have a fallback
    throw new InternalServerErrorException('Create failed');
  }
}
```

### 5. Log but Don't Double-Handle

```typescript
// ✅ Good - log once at the boundary
@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(exception: unknown, ...) {
    this.logger.error(exception);
    // respond...
  }
}

// ❌ Avoid - logging everywhere
try {
  await this.service.doSomething();
} catch (e) {
  this.logger.error(e); // Already logged by filter
  throw e;
}
```
