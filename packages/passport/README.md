# @riktajs/passport

PassportJS authentication integration for Rikta Framework with session management and strategy decorators.

## Features

- 🔐 **PassportJS Integration** - Full PassportJS support via @fastify/passport
- 🍪 **Session Management** - Secure session handling with @fastify/secure-session
- 🎯 **Decorator-based** - Use `@Authenticated` to protect routes
- 🛡️ **Guard System** - `AuthGuard` integrates with Rikta's guard system
- 📦 **Strategy Support** - Built-in LocalStrategy with custom strategy support
- 💉 **DI Integration** - Full dependency injection support for strategies

## Installation

```bash
npm install @riktajs/passport @fastify/passport @fastify/secure-session passport
# For local strategy
npm install passport-local
```

## Quick Start

### 1. Configure Passport Plugin

```typescript
import { Rikta } from '@riktajs/core';
import { passportPlugin, PassportOptions } from '@riktajs/passport';

const app = await Rikta.create({ port: 3000 });

// Register passport plugin
await app.server.register(passportPlugin, {
  secret: 'your-secret-key-min-32-characters-long',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
});
```

### 2. Create an Auth Service

```typescript
import { Injectable } from '@riktajs/core';
import { AuthenticatorService } from '@riktajs/passport';

@Injectable()
export class AuthService implements AuthenticatorService {
  private users = [
    { id: '1', username: 'admin', password: 'admin123' },
  ];

  async validateUser(username: string, password: string) {
    const user = this.users.find(u => u.username === username);
    if (user && user.password === password) {
      return { id: user.id, username: user.username };
    }
    return null;
  }
}
```

### 3. Create a Local Strategy

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { PassportStrategy, LocalStrategyBase } from '@riktajs/passport';
import { AuthService } from './auth.service';

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

### 4. Protect Routes

```typescript
import { Controller, Get, Post, Body } from '@riktajs/core';
import { Authenticated, AuthGuard } from '@riktajs/passport';

@Controller('/auth')
export class AuthController {
  @Post('/login')
  async login(@Req() request: FastifyRequest) {
    // Passport handles authentication
    return { message: 'Logged in', user: request.user };
  }

  @Get('/profile')
  @Authenticated()
  getProfile(@Req() request: FastifyRequest) {
    return { user: request.user };
  }

  @Get('/admin')
  @UseGuards(AuthGuard)
  adminOnly(@Req() request: FastifyRequest) {
    return { message: 'Admin area', user: request.user };
  }
}
```

## API Reference

### Decorators

- `@Authenticated()` - Marks a route as requiring authentication
- `@PassportStrategy(name)` - Registers a class as a Passport strategy
- `@CurrentUser()` - Parameter decorator to inject the current user

### Guards

- `AuthGuard` - Guard that checks if the user is authenticated

### Interfaces

- `PassportOptions` - Configuration options for the passport plugin
- `AuthenticatorService` - Interface for authentication services

## License

MIT
