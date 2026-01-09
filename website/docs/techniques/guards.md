---
sidebar_position: 3
---

# Guards

Guards are a powerful mechanism for implementing authorization and access control in your Rikta application.

## Introduction

Guards determine whether a request should be handled by the route handler:

- **Authorization** - Check if user has required permissions
- **Role-based access** - Restrict routes to specific roles
- **Rate limiting** - Prevent abuse
- **Feature flags** - Enable/disable features

```
Request ──▶ Guard ──▶ Route Handler
              │
              │ ❌ Unauthorized
              ▼
           Exception
```

## Creating Guards

A guard implements the `CanActivate` interface:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@riktajs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const token = request.headers.authorization;
    
    if (!token) {
      return false; // Request blocked
    }
    
    return this.validateToken(token);
  }

  private validateToken(token: string): boolean {
    // Validate JWT or session token
    return true;
  }
}
```

## Using Guards

### Controller-Level Guards

Apply a guard to all routes in a controller:

```typescript
import { Controller, Get, UseGuards } from '@riktajs/core';

@Controller('/admin')
@UseGuards(AuthGuard)
export class AdminController {
  @Get('/dashboard')
  getDashboard() {
    return { data: 'Admin dashboard' };
  }

  @Get('/users')
  getUsers() {
    return { data: 'User list' };
  }
}
```

### Route-Level Guards

Apply a guard to specific routes:

```typescript
@Controller('/posts')
export class PostController {
  @Get()
  findAll() {
    // Public - no guard
    return this.postService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: CreatePostDto) {
    // Protected - requires authentication
    return this.postService.create(data);
  }
}
```

### Multiple Guards

Apply multiple guards that execute in order:

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  // AuthGuard runs first, then RolesGuard
}
```

## Execution Context

Guards receive an `ExecutionContext` providing request details:

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getReply<FastifyReply>();
    
    // Access request properties
    const headers = request.headers;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const params = request.params;
    const query = request.query;
    
    return true;
  }
}
```

## Role-Based Access Control

### Roles Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@riktajs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const user = request.user; // Attached by AuthGuard
    
    if (!user) {
      return false;
    }

    const requiredRoles = context.getMetadata<string[]>('roles');
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific roles required
    }

    return requiredRoles.some(role => user.roles.includes(role));
  }
}
```

### Roles Decorator

Create a custom decorator to specify required roles:

```typescript
import 'reflect-metadata';

const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator => {
  return (target: any, propertyKey?: string | symbol) => {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target.constructor, propertyKey);
    } else {
      // Class decorator
      Reflect.defineMetadata(ROLES_KEY, roles, target);
    }
  };
};
```

### Usage

```typescript
@Controller('/admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get('/dashboard')
  @Roles('admin')
  getDashboard() {
    return { data: 'Admin only' };
  }

  @Get('/reports')
  @Roles('admin', 'manager')
  getReports() {
    return { data: 'Admin or Manager' };
  }
}
```

## Authentication Guard

Complete authentication guard example:

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@riktajs/core';
import { Autowired } from '@riktajs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  @Autowired()
  private jwtService!: JwtService;

  @Autowired()
  private userService!: UserService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to request for later use
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

## API Key Guard

For service-to-service authentication:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  @Autowired()
  private config!: ConfigService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const validKeys = this.config.get<string[]>('api.keys');
    if (!validKeys.includes(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

## Rate Limiting Guard

```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<string, number[]>();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const ip = request.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    // Get existing timestamps for this IP
    const timestamps = this.requests.get(ip) || [];
    
    // Remove timestamps outside the window
    const recentTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (recentTimestamps.length >= maxRequests) {
      throw new HttpException(429, 'Too many requests');
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.requests.set(ip, recentTimestamps);

    return true;
  }
}
```

## Combining Guards

Guards execute in order and all must return `true`:

```typescript
@Controller('/api')
@UseGuards(
  RateLimitGuard,    // First: rate limiting
  ApiKeyGuard,       // Second: API key validation
  JwtAuthGuard,      // Third: JWT authentication
  RolesGuard         // Fourth: role check
)
export class SecureApiController {
  @Get('/data')
  @Roles('admin')
  getData() {
    return { data: 'sensitive data' };
  }
}
```

## Skipping Guards

Use a decorator to skip guards for specific routes:

```typescript
import { SetMetadata } from '@riktajs/core';

export const Public = () => SetMetadata('isPublic', true);

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = context.getMetadata<boolean>('isPublic');
    if (isPublic) {
      return true; // Skip auth for public routes
    }

    // Normal auth logic...
    return this.validateToken(context);
  }
}
```

Usage:

```typescript
@Controller('/api')
@UseGuards(AuthGuard)
export class ApiController {
  @Get('/public')
  @Public() // Skips AuthGuard
  getPublicData() {
    return { data: 'public' };
  }

  @Get('/private')
  getPrivateData() {
    return { data: 'requires auth' };
  }
}
```

## Best Practices

### 1. Return Boolean or Throw

```typescript
// ✅ Good - clear outcomes
async canActivate(context: ExecutionContext): Promise<boolean> {
  if (!token) {
    throw new UnauthorizedException('Token required');
  }
  return true;
}

// ❌ Avoid - unclear failure reason
async canActivate(context: ExecutionContext): Promise<boolean> {
  return !!token; // Why did it fail?
}
```

### 2. Keep Guards Focused

```typescript
// ✅ Good - single responsibility
@Injectable()
export class AuthGuard implements CanActivate { /* auth only */ }

@Injectable()
export class RolesGuard implements CanActivate { /* roles only */ }

// ❌ Avoid - doing too much
@Injectable()
export class SuperGuard implements CanActivate {
  // Auth, roles, rate limiting, logging, etc.
}
```

### 3. Make Guards Injectable

```typescript
// ✅ Good - can use DI
@Injectable()
export class AuthGuard implements CanActivate {
  @Autowired()
  private jwtService!: JwtService;
}
```

### 4. Use Metadata for Configuration

```typescript
// ✅ Good - configurable via decorators
const requiredRoles = context.getMetadata<string[]>('roles');

// Usage
@Roles('admin', 'manager')
@Get('/data')
getData() {}
```
