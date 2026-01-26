---
sidebar_position: 5
---

# Interceptors

Interceptors are a powerful feature that allows you to bind extra logic before and after method execution. They can transform the result returned from a function, extend the basic function behavior, or completely override the handler function.

## Overview

Interceptors have a set of useful capabilities inspired by the Aspect-Oriented Programming (AOP) technique:

- **Transform** the result before returning
- **Bind extra logic** before/after method execution
- **Measure execution time** for performance monitoring
- **Catch exceptions** and transform them
- **Cache responses** for improved performance
- **Logging and auditing** of requests

## Creating an Interceptor

An interceptor implements the `Interceptor` interface with an `intercept()` method:

```typescript
import { Injectable, Interceptor, ExecutionContext, CallHandler } from '@riktajs/core';

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    console.log('Before handler execution...');
    
    const start = Date.now();
    const result = await next.handle();
    const duration = Date.now() - start;
    
    console.log(`After handler execution... (${duration}ms)`);
    
    return result;
  }
}
```

## Using Interceptors

### Controller-level

Apply to all routes in a controller:

```typescript
import { Controller, Get, UseInterceptors } from '@riktajs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Controller('/users')
@UseInterceptors(LoggingInterceptor)
export class UserController {
  @Get('/')
  findAll() {
    return [{ id: 1, name: 'John' }];
  }

  @Get('/:id')
  findOne() {
    return { id: 1, name: 'John' };
  }
}
```

### Route-level

Apply to a specific route:

```typescript
@Controller('/users')
export class UserController {
  @Get('/')
  @UseInterceptors(LoggingInterceptor)
  findAll() {
    return [{ id: 1, name: 'John' }];
  }

  @Get('/:id')
  findOne() {
    // No interceptor here
    return { id: 1, name: 'John' };
  }
}
```

### Multiple Interceptors

Apply multiple interceptors (executed in order):

```typescript
@Controller('/users')
@UseInterceptors(LoggingInterceptor, CacheInterceptor, TransformInterceptor)
export class UserController {
  // ...
}
```

## Execution Order (Onion Model)

When multiple interceptors are applied, they wrap around each other like an onion:

```
Request → [Interceptor1 before] → [Interceptor2 before] → Handler → [Interceptor2 after] → [Interceptor1 after] → Response
```

Example with timing:

```typescript
@Injectable()
class FirstInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    console.log('First - Before');
    const result = await next.handle();
    console.log('First - After');
    return result;
  }
}

@Injectable()
class SecondInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    console.log('Second - Before');
    const result = await next.handle();
    console.log('Second - After');
    return result;
  }
}

// Output order:
// First - Before
// Second - Before
// (handler executes)
// Second - After
// First - After
```

## Common Use Cases

### Response Transformation

Transform the response structure:

```typescript
@Injectable()
export class TransformInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const result = await next.handle();
    
    return {
      data: result,
      timestamp: new Date().toISOString(),
      success: true,
    };
  }
}
```

### Response Caching

Cache responses for performance:

```typescript
@Injectable()
export class CacheInterceptor implements Interceptor {
  private cache = new Map<string, { data: unknown; expires: number }>();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const result = await next.handle();
    
    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + 60000, // 1 minute TTL
    });
    
    return result;
  }
}
```

### Error Handling

Catch and transform errors:

```typescript
@Injectable()
export class ErrorInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    try {
      return await next.handle();
    } catch (error) {
      const request = context.switchToHttp().getRequest();
      
      console.error(`Error in ${request.method} ${request.url}:`, error);
      
      // Return a friendly error response
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

### Request Timing

Track request duration:

```typescript
@Injectable()
export class TimingInterceptor implements Interceptor {
  @Autowired(MetricsService)
  private metrics!: MetricsService;

  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();
    
    try {
      return await next.handle();
    } finally {
      const duration = Date.now() - start;
      this.metrics.recordRequestDuration(request.url, duration);
    }
  }
}
```

## Accessing ExecutionContext

The `ExecutionContext` provides access to request details:

```typescript
@Injectable()
export class ContextAwareInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    // Access HTTP context
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    
    // Get metadata about the handler
    const controllerClass = context.getClass();
    const handlerName = context.getHandler();
    
    console.log(`Handling ${controllerClass.name}.${String(handlerName)}`);
    
    return next.handle();
  }
}
```

## Dependency Injection

Interceptors support full dependency injection:

```typescript
@Injectable()
export class AuditInterceptor implements Interceptor {
  @Autowired(AuditService)
  private auditService!: AuditService;

  @Autowired(UserService)
  private userService!: UserService;

  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = await this.userService.getCurrentUser(request);
    
    await this.auditService.logAccess({
      userId: user?.id,
      action: `${request.method} ${request.url}`,
      timestamp: new Date(),
    });
    
    return next.handle();
  }
}
```

## Interceptor Caching

Interceptor instances are cached and reused across routes, similar to guards and middleware. This ensures:

- **Consistent state** for singleton interceptors
- **Performance optimization** by avoiding repeated instantiation
- **Memory efficiency** with shared instances

```typescript
// Both routes share the same LoggingInterceptor instance
@Controller('/users')
class UserController {
  @Get('/one')
  @UseInterceptors(LoggingInterceptor)
  one() { ... }

  @Get('/two')
  @UseInterceptors(LoggingInterceptor)
  two() { ... }
}
```

## API Reference

### Interceptor Interface

```typescript
interface Interceptor {
  intercept(context: ExecutionContext, next: CallHandler): Promise<unknown>;
}
```

### CallHandler Interface

```typescript
interface CallHandler {
  handle(): Promise<unknown>;
}
```

### ExecutionContext

```typescript
interface ExecutionContext {
  switchToHttp(): HttpArgumentsHost;
  getRequest<T>(): T;  // deprecated
  getReply<T>(): T;    // deprecated
  getClass(): Constructor;
  getHandler(): string | symbol;
  getMetadata<T>(key: string | symbol): T | undefined;
}

interface HttpArgumentsHost {
  getRequest<T>(): T;
  getResponse<T>(): T;
}
```
