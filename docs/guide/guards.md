# 🛡️ Guards

Guards are a powerful mechanism for controlling access to route handlers. They determine whether a request should be processed based on custom logic (authentication, roles, permissions, etc.).

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GUARD EXECUTION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

  HTTP Request                Guards (AND logic)              Route Handler
        │                           │                              │
        ▼                           ▼                              │
  ┌───────────┐           ┌─────────────────┐                      │
  │  Router   │──────────►│  Guard 1        │                      │
  └───────────┘           │  canActivate()  │                      │
                          └────────┬────────┘                      │
                                   │ true                          │
                                   ▼                               │
                          ┌─────────────────┐                      │
                          │  Guard 2        │                      │
                          │  canActivate()  │                      │
                          └────────┬────────┘                      │
                                   │ true                          │
                                   ▼                               ▼
                          ┌─────────────────┐           ┌──────────────────┐
                          │  All passed?    │───────────►  Controller       │
                          └────────┬────────┘    yes    │  Handler Method  │
                                   │ no                 └──────────────────┘
                                   ▼
                          ┌─────────────────┐
                          │ ForbiddenException │
                          │     (403)          │
                          └─────────────────┘
```

## Quick Start

### 1. Create a Guard

Guards must implement the `CanActivate` interface and be decorated with `@Injectable()`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@riktajs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const token = request.headers.authorization;
    return !!token; // Allow if token exists
  }
}
```

### 2. Apply Guards

Use the `@UseGuards()` decorator on controllers or methods:

```typescript
import { Controller, Get, UseGuards } from '@riktajs/core';
import { AuthGuard } from './auth.guard';

@Controller('/protected')
@UseGuards(AuthGuard)
export class ProtectedController {
  @Get('/')
  getSecretData() {
    return { secret: 'Protected data' };
  }
}
```

## CanActivate Interface

Every guard must implement the `CanActivate` interface:

```typescript
interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```

- Return `true` to allow the request to proceed
- Return `false` to deny access (throws `ForbiddenException` with 403 status)
- Can be synchronous or async

## ExecutionContext

The `ExecutionContext` provides access to the current request context:

```typescript
interface ExecutionContext {
  // Get the Fastify request object
  getRequest<T = FastifyRequest>(): T;
  
  // Get the Fastify reply object
  getReply<T = FastifyReply>(): T;
  
  // Get the controller class
  getClass(): Constructor;
  
  // Get the handler method name
  getHandler(): string | symbol;
  
  // Get metadata by key
  getMetadata<T>(key: string | symbol): T | undefined;
}
```

### Example Usage

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const controller = context.getClass();
    const handler = context.getHandler();
    
    console.log(`Checking access for ${controller.name}.${String(handler)}`);
    
    return !!request.headers.authorization;
  }
}
```

## Applying Guards

### Controller-Level Guards

Guards applied to a controller protect ALL routes in that controller:

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  @Get('/users')
  getUsers() {} // Protected by AuthGuard AND AdminGuard
  
  @Get('/stats')
  getStats() {} // Protected by AuthGuard AND AdminGuard
}
```

### Method-Level Guards

Guards applied to a method protect only that specific route:

```typescript
@Controller('/products')
export class ProductController {
  @Get('/')
  findAll() {} // Public - no guards
  
  @Post('/')
  @UseGuards(AuthGuard)
  create() {} // Protected - requires authentication
}
```

### Combined Guards

When guards are applied at both levels, **controller guards run first**, then method guards:

```typescript
@Controller('/api')
@UseGuards(AuthGuard)  // Runs first on all routes
export class ApiController {
  @Get('/data')
  getData() {} // Only AuthGuard runs
  
  @Post('/admin')
  @UseGuards(AdminGuard)  // Runs second
  adminAction() {} // AuthGuard then AdminGuard
}
```

## Multiple Guards (AND Logic)

When multiple guards are specified, **ALL must pass** (AND logic):

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
export class AdminController {
  // User must pass ALL three guards to access any route
}
```

Execution stops at the first guard that returns `false`.

## Dependency Injection

Guards are resolved from the DI container, so they can inject services:

```typescript
@Injectable()
export class AuthService {
  async validateToken(token: string): Promise<User | null> {
    // Validate JWT, check database, etc.
    return await this.verifyJwt(token);
  }
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return false;
    
    const user = await this.authService.validateToken(token);
    if (!user) return false;
    
    // Attach user to request for later use
    (request as any).user = user;
    return true;
  }
}
```

## Async Guards

Guards can return a `Promise<boolean>` for async operations:

```typescript
@Injectable()
export class DatabaseGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const userId = request.headers['x-user-id'] as string;
    
    // Async database lookup
    const user = await this.userService.findById(userId);
    return user?.isActive ?? false;
  }
}
```

## Role-Based Access Control (RBAC)

Implement role-based guards using custom metadata:

### 1. Create a Roles Decorator

```typescript
import 'reflect-metadata';

export const ROLES_KEY = Symbol('roles');

export function Roles(...roles: string[]): MethodDecorator & ClassDecorator {
  return (target, propertyKey?) => {
    if (propertyKey) {
      Reflect.defineMetadata(ROLES_KEY, roles, target.constructor, propertyKey);
    } else {
      Reflect.defineMetadata(ROLES_KEY, roles, target);
    }
  };
}
```

### 2. Create a Roles Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = context.getMetadata<string[]>(ROLES_KEY);
    
    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const request = context.getRequest();
    const user = (request as any).user;
    
    // Check if user has any required role
    return requiredRoles.some(role => user?.roles?.includes(role));
  }
}
```

### 3. Apply Guards and Roles

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('/dashboard')
  @Roles('admin', 'moderator')
  getDashboard() {
    return { message: 'Welcome to admin dashboard' };
  }
  
  @Delete('/users/:id')
  @Roles('admin')
  deleteUser() {
    // Only admins can delete users
  }
}
```

## Error Handling

When a guard returns `false`, Rikta throws a `ForbiddenException` (HTTP 403):

```json
{
  "statusCode": 403,
  "message": "Access denied by AuthGuard",
  "error": "Forbidden",
  "timestamp": "2024-12-20T10:30:00.000Z",
  "path": "/admin/dashboard"
}
```

### Custom Error Messages

To provide custom error messages, throw an exception directly from the guard:

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@riktajs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const token = request.headers.authorization;
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }
    
    if (!this.isValidToken(token)) {
      throw new ForbiddenException('Invalid or expired token');
    }
    
    return true;
  }
  
  private isValidToken(token: string): boolean {
    // Token validation logic
    return token.startsWith('Bearer ');
  }
}
```

## Common Guard Patterns

### Authentication Guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.slice(7);
    
    try {
      const payload = await this.jwtService.verify(token);
      (request as any).user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
```

### Rate Limiting Guard

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();
  private limit = 100;
  private windowMs = 60000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const ip = request.ip;
    const now = Date.now();
    
    const timestamps = this.requests.get(ip) ?? [];
    const recent = timestamps.filter(t => now - t < this.windowMs);
    
    if (recent.length >= this.limit) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    
    recent.push(now);
    this.requests.set(ip, recent);
    
    return true;
  }
}
```

### IP Whitelist Guard

```typescript
@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private allowedIps = ['127.0.0.1', '::1', '192.168.1.100'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    return this.allowedIps.includes(request.ip);
  }
}
```

## Testing Guards

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ExecutionContextImpl } from '@riktajs/core';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('should allow access with valid token', () => {
    const guard = new AuthGuard();
    const context = new ExecutionContextImpl(
      { headers: { authorization: 'Bearer valid-token' } } as any,
      {} as any,
      class TestController {},
      'testMethod'
    );
    
    expect(guard.canActivate(context)).toBe(true);
  });
  
  it('should deny access without token', () => {
    const guard = new AuthGuard();
    const context = new ExecutionContextImpl(
      { headers: {} } as any,
      {} as any,
      class TestController {},
      'testMethod'
    );
    
    expect(guard.canActivate(context)).toBe(false);
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { Rikta, Controller, Get, UseGuards, Injectable, CanActivate } from '@riktajs/core';

describe('Guard Integration', () => {
  it('should protect routes', async () => {
    @Injectable()
    class TestGuard implements CanActivate {
      canActivate(context) {
        return context.getRequest().headers.authorization === 'secret';
      }
    }

    @Controller('/test')
    @UseGuards(TestGuard)
    class TestController {
      @Get('/') getData() { return { ok: true }; }
    }

    const app = await Rikta.create({
      controllers: [TestController],
      logger: false,
    });

    // Without auth
    const denied = await app.server.inject({ method: 'GET', url: '/test/' });
    expect(denied.statusCode).toBe(403);

    // With auth
    const allowed = await app.server.inject({
      method: 'GET',
      url: '/test/',
      headers: { authorization: 'secret' },
    });
    expect(allowed.statusCode).toBe(200);

    await app.close();
  });
});
```

## Best Practices

1. **Always decorate guards with `@Injectable()`** - Guards are resolved from the DI container
2. **Keep guards focused** - Each guard should check one specific condition
3. **Use descriptive names** - `AuthGuard`, `RolesGuard`, `OwnershipGuard`
4. **Throw specific exceptions** - Use `UnauthorizedException` (401) for authentication failures, `ForbiddenException` (403) for authorization failures
5. **Cache expensive operations** - If a guard performs database lookups, consider caching results
6. **Order guards intentionally** - Put faster/simpler guards first to fail fast

## API Reference

| Export | Description |
|--------|-------------|
| `CanActivate` | Interface for guard implementation |
| `ExecutionContext` | Interface for accessing request context |
| `ExecutionContextImpl` | Default implementation (useful for testing) |
| `UseGuards(...guards)` | Decorator to apply guards |
| `getGuardsMetadata(target, method?)` | Helper to retrieve guard metadata |
