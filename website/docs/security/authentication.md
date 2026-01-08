---
sidebar_position: 1
---

# Authentication

Authentication is the process of verifying the identity of a user or service. Rikta provides flexible mechanisms to implement various authentication strategies.

## Introduction

Rikta doesn't enforce a specific authentication strategy, giving you the freedom to implement:

- **JWT (JSON Web Tokens)** - Stateless authentication
- **Session-based** - Traditional server-side sessions
- **API Keys** - Service-to-service authentication
- **OAuth2** - Third-party authentication

## JWT Authentication

### Overview

JWT is the most common approach for API authentication:

```
┌─────────┐    POST /auth/login    ┌─────────────┐
│ Client  │ ──────────────────────▶│   Server    │
│         │                        │             │
│         │◀────────────────────── │             │
└─────────┘    { token: "..." }    └─────────────┘
     │                                    
     │  GET /api/data                     
     │  Authorization: Bearer <token>     
     ▼                                    
┌─────────────┐    Validate Token    ┌──────────┐
│   Server    │ ───────────────────▶│   Data   │
└─────────────┘                      └──────────┘
```

### Implementation

#### JWT Service

```typescript
import { Injectable } from '@riktajs/core';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private readonly secret = process.env.JWT_SECRET!;
  private readonly expiresIn = '1h';

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }

  decode(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }
}
```

#### Auth Service

```typescript
import { Injectable, Autowired, UnauthorizedException } from '@riktajs/core';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  @Autowired()
  private userService!: UserService;

  @Autowired()
  private jwtService!: JwtService;

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(data: RegisterDto) {
    const existing = await this.userService.findByEmail(data.email);
    
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.userService.create({
      ...data,
      password: hashedPassword,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

#### Auth Controller

```typescript
import { Controller, Post, Body, Get, UseGuards } from '@riktajs/core';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

@Controller('/auth')
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  @Post('/login')
  login(@Body(LoginSchema) data: z.infer<typeof LoginSchema>) {
    return this.authService.login(data.email, data.password);
  }

  @Post('/register')
  register(@Body(RegisterSchema) data: z.infer<typeof RegisterSchema>) {
    return this.authService.register(data);
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  getProfile(@Req() request: FastifyRequest) {
    return request.user;
  }
}
```

### Auth Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Autowired } from '@riktajs/core';

@Injectable()
export class AuthGuard implements CanActivate {
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
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to request
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
  }
}
```

## Refresh Tokens

Implement token refresh for longer sessions:

```typescript
@Injectable()
export class AuthService {
  @Autowired()
  private jwtService!: JwtService;

  @Autowired()
  private refreshTokenService!: RefreshTokenService;

  async login(email: string, password: string) {
    // ... validate credentials
    
    const accessToken = this.jwtService.sign({ sub: user.id }, '15m');
    const refreshToken = await this.refreshTokenService.create(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.refreshTokenService.find(refreshToken);
    
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(stored.userId);
    const accessToken = this.jwtService.sign({ sub: user.id }, '15m');

    // Rotate refresh token
    await this.refreshTokenService.delete(refreshToken);
    const newRefreshToken = await this.refreshTokenService.create(user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
```

## Session-Based Authentication

For traditional web applications:

```typescript
import { Injectable } from '@riktajs/core';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
  private sessions = new Map<string, { userId: string; expiresAt: Date }>();

  create(userId: string): string {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.sessions.set(sessionId, { userId, expiresAt });
    return sessionId;
  }

  get(sessionId: string): { userId: string } | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return { userId: session.userId };
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
```

## API Key Authentication

For service-to-service communication:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  @Autowired()
  private apiKeyService!: ApiKeyService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const keyData = await this.apiKeyService.validate(apiKey);
    
    if (!keyData) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKey = keyData;
    return true;
  }
}

@Injectable()
export class ApiKeyService {
  private keys = new Map<string, { name: string; permissions: string[] }>();

  async validate(key: string): Promise<{ name: string; permissions: string[] } | null> {
    // In production, hash the key and look up in database
    return this.keys.get(key) || null;
  }
}
```

## Password Hashing

Always hash passwords before storing:

```typescript
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

## Best Practices

### 1. Use HTTPS in Production

```typescript
// Always use HTTPS for auth endpoints
const app = await Rikta.create({
  https: {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt'),
  },
});
```

### 2. Rate Limit Auth Endpoints

```typescript
@Controller('/auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  @Post('/login')
  @RateLimit({ max: 5, window: '1m' }) // 5 attempts per minute
  login() {}
}
```

### 3. Don't Leak Information

```typescript
// ✅ Good - generic error
throw new UnauthorizedException('Invalid credentials');

// ❌ Bad - reveals user existence
throw new UnauthorizedException('User not found');
throw new UnauthorizedException('Wrong password');
```

### 4. Secure Token Storage

```typescript
// Client-side best practices:
// - Store tokens in httpOnly cookies when possible
// - Use secure flag in production
// - Never store in localStorage for sensitive apps
```

### 5. Validate Token Claims

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const payload = this.jwtService.verify(token);
  
  // Validate claims
  if (!payload.sub || !payload.email) {
    throw new UnauthorizedException('Invalid token claims');
  }

  // Check if user still exists and is active
  const user = await this.userService.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedException('User not found or inactive');
  }

  return true;
}
```
