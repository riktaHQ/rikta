# Authentication

This guide covers authentication in Rikta using the `@riktajs/passport` package, which integrates [PassportJS](https://www.passportjs.org/) with Fastify via [@fastify/passport](https://github.com/fastify/fastify-passport).

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Local Strategy](#local-strategy)
- [Protecting Routes](#protecting-routes)
- [Guards](#guards)
- [Custom Strategies](#custom-strategies)
- [Session Management](#session-management)
- [Best Practices](#best-practices)

## Overview

`@riktajs/passport` provides:

- **Decorator-based authentication** - Use `@Authenticated()` to protect routes
- **Strategy decorators** - Register Passport strategies with `@PassportStrategy()`
- **Guard integration** - `AuthGuard` works with Rikta's guard system
- **Session management** - Secure sessions via `@fastify/secure-session`
- **Type safety** - Full TypeScript support with proper types

## Installation

```bash
# Using npm
npm install @riktajs/passport @fastify/passport @fastify/secure-session passport

# Using pnpm
pnpm add @riktajs/passport @fastify/passport @fastify/secure-session passport

# For local (username/password) authentication
npm install passport-local
```

## Quick Start

### 1. Register the Passport Plugin

```typescript
import { Rikta } from '@riktajs/core';
import { passportPlugin } from '@riktajs/passport';

async function bootstrap() {
  const app = await Rikta.create({ port: 3000 });

  // Register passport plugin with session support
  await app.server.register(passportPlugin, {
    secret: 'your-secret-key-must-be-at-least-32-characters',
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  });

  await app.listen();
}

bootstrap();
```

### 2. Create an Authentication Service

```typescript
import { Injectable } from '@riktajs/core';

export interface User {
  id: string;
  username: string;
  email?: string;
}

@Injectable()
export class AuthService {
  // In production, use a database
  private users = [
    { id: '1', username: 'admin', password: 'admin123', email: 'admin@example.com' },
    { id: '2', username: 'user', password: 'user123', email: 'user@example.com' },
  ];

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username);
    
    if (user && user.password === password) {
      // Don't return the password
      const { password: _, ...result } = user;
      return result;
    }
    
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
```

### 3. Implement a Local Strategy

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { PassportStrategy, LocalStrategyBase } from '@riktajs/passport';
import { AuthService, User } from './auth.service';

@Injectable()
@PassportStrategy('local')
export class LocalStrategy extends LocalStrategyBase<User> {
  @Autowired()
  private authService!: AuthService;

  async validate(username: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(username, password);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    return user;
  }
}
```

### 4. Create an Authentication Controller

```typescript
import { Controller, Post, Get, Body, Req, HttpCode } from '@riktajs/core';
import { Authenticated, CurrentUser, AuthGuard } from '@riktajs/passport';
import type { FastifyRequest, FastifyReply } from 'fastify';

interface LoginDto {
  username: string;
  password: string;
}

@Controller('/auth')
export class AuthController {
  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() request: FastifyRequest,
  ) {
    // Passport authenticates and sets request.user
    return new Promise((resolve, reject) => {
      (request as any).logIn(body, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            message: 'Login successful',
            user: request.user,
          });
        }
      });
    });
  }

  @Post('/logout')
  @HttpCode(200)
  async logout(@Req() request: FastifyRequest) {
    return new Promise((resolve) => {
      request.logOut(() => {
        resolve({ message: 'Logout successful' });
      });
    });
  }

  @Get('/profile')
  @Authenticated()
  getProfile(@CurrentUser() user: User) {
    return { user };
  }

  @Get('/me')
  @Authenticated({ message: 'Please log in to view your profile' })
  me(@Req() request: FastifyRequest) {
    return {
      user: request.user,
      isAuthenticated: request.isAuthenticated(),
    };
  }
}
```

## Configuration

### PassportOptions

```typescript
interface PassportOptions {
  // Required: Secret for session encryption (min 32 characters)
  secret: string;
  
  // Optional: Salt for key derivation (must be exactly 16 bytes)
  salt?: string;
  
  // Cookie configuration
  cookie?: {
    path?: string;        // Default: '/'
    httpOnly?: boolean;   // Default: true
    secure?: boolean;     // Default: false (set true in production)
    sameSite?: 'strict' | 'lax' | 'none';  // Default: 'lax'
    maxAge?: number;      // Session duration in seconds
    domain?: string;      // Cookie domain
  };
  
  // Cookie name (Default: 'session')
  cookieName?: string;
  
  // Enable sessions (Default: true)
  session?: boolean;
  
  // Session storage key (Default: 'passport')
  sessionKey?: string;
}
```

### Example Configuration

```typescript
await app.server.register(passportPlugin, {
  secret: process.env.SESSION_SECRET!,
  cookieName: 'rikta_session',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});
```

## Local Strategy

The `LocalStrategyBase` provides a foundation for username/password authentication:

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { PassportStrategy, LocalStrategyBase } from '@riktajs/passport';

@Injectable()
@PassportStrategy('local')
export class LocalStrategy extends LocalStrategyBase {
  @Autowired()
  private authService!: AuthService;

  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }
}
```

### Custom Field Names

Use email instead of username:

```typescript
@Injectable()
@PassportStrategy('local', { usernameField: 'email' })
export class EmailStrategy extends LocalStrategyBase {
  async validate(email: string, password: string) {
    // email is received as the first argument
    return this.authService.validateByEmail(email, password);
  }
}
```

## Protecting Routes

### Using @Authenticated Decorator

```typescript
@Controller('/api')
export class ApiController {
  // Public route - no authentication required
  @Get('/status')
  getStatus() {
    return { status: 'ok' };
  }

  // Protected route - requires authentication
  @Get('/data')
  @Authenticated()
  getData() {
    return { secret: 'data' };
  }

  // Protected with custom message
  @Get('/admin')
  @Authenticated({ message: 'Admin access required' })
  getAdminData() {
    return { admin: 'data' };
  }
}
```

### Class-Level Authentication

```typescript
@Controller('/secure')
@Authenticated() // All routes require authentication
export class SecureController {
  @Get('/resource1')
  getResource1() {
    return { data: 'resource1' };
  }

  @Get('/resource2')
  getResource2() {
    return { data: 'resource2' };
  }
}
```

## Guards

### AuthGuard

The `AuthGuard` respects the `@Authenticated()` decorator:

```typescript
import { UseGuards } from '@riktajs/core';
import { AuthGuard } from '@riktajs/passport';

@Controller('/api')
@UseGuards(AuthGuard)
export class ApiController {
  // AuthGuard only enforces auth if @Authenticated is present
  
  @Get('/public')
  publicRoute() {} // Allowed without auth
  
  @Get('/private')
  @Authenticated()
  privateRoute() {} // Requires auth
}
```

### StrictAuthGuard

The `StrictAuthGuard` always requires authentication:

```typescript
import { UseGuards } from '@riktajs/core';
import { StrictAuthGuard } from '@riktajs/passport';

@Controller('/admin')
@UseGuards(StrictAuthGuard) // All routes require auth
export class AdminController {
  @Get('/dashboard')
  getDashboard() {
    return { dashboard: 'data' };
  }
}
```

## Custom Strategies

Create custom strategies for OAuth, JWT, API keys, etc.:

```typescript
import { Injectable } from '@riktajs/core';
import { PassportStrategy } from '@riktajs/passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

@Injectable()
@PassportStrategy('jwt', {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
})
export class JwtAuthStrategy {
  async validate(payload: { sub: string; username: string }) {
    return { id: payload.sub, username: payload.username };
  }
}
```

## Session Management

### Login

```typescript
@Post('/login')
async login(@Body() credentials: LoginDto, @Req() request: FastifyRequest) {
  // After validating credentials
  const user = await this.authService.validateUser(
    credentials.username,
    credentials.password
  );
  
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Log the user in (creates session)
  await new Promise<void>((resolve, reject) => {
    request.logIn(user, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  return { message: 'Logged in', user };
}
```

### Logout

```typescript
@Post('/logout')
async logout(@Req() request: FastifyRequest) {
  await new Promise<void>((resolve) => {
    request.logOut(() => resolve());
  });
  
  return { message: 'Logged out' };
}
```

### Check Authentication Status

```typescript
@Get('/status')
checkAuth(@Req() request: FastifyRequest) {
  return {
    isAuthenticated: request.isAuthenticated(),
    user: request.user || null,
  };
}
```

## Best Practices

### 1. Secure Your Secret

```typescript
// ❌ Bad - hardcoded secret
secret: 'my-secret-key'

// ✅ Good - environment variable
secret: process.env.SESSION_SECRET!
```

### 2. Enable Secure Cookies in Production

```typescript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
}
```

### 3. Hash Passwords

```typescript
import bcrypt from 'bcrypt';

async validateUser(username: string, password: string) {
  const user = await this.userRepo.findByUsername(username);
  
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const { passwordHash, ...result } = user;
    return result;
  }
  
  return null;
}
```

### 4. Use Type-Safe User Objects

```typescript
// Define your user type
interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

// Extend LocalStrategyBase with the type
class LocalStrategy extends LocalStrategyBase<User> {
  async validate(username: string, password: string): Promise<User> {
    // ...
  }
}
```

### 5. Handle Errors Gracefully

```typescript
@Post('/login')
async login(@Body() body: LoginDto, @Req() request: FastifyRequest) {
  try {
    const user = await this.authService.validateUser(body.username, body.password);
    
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }
    
    await new Promise<void>((resolve, reject) => {
      request.logIn(user, (err) => err ? reject(err) : resolve());
    });
    
    return { user };
  } catch (error) {
    // Log the error for debugging
    this.logger.error('Login failed', error);
    
    // Return generic message to client
    throw new HttpException('Authentication failed', 401);
  }
}
```

## Next Steps

- Check out the [passport-example](/examples/passport-example) for a complete working example
- Learn about [Guards](/docs/fundamentals/guards) for advanced route protection
- Explore [Middleware](/docs/fundamentals/middleware) for request preprocessing
