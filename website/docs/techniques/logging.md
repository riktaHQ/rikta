---
sidebar_position: 4
---

# Logging

Effective logging is essential for debugging, monitoring, and understanding your application's behavior in production.

## Introduction

Rikta doesn't prescribe a specific logging solution, giving you the flexibility to use your preferred logging library. This guide covers best practices and common patterns.

## Basic Logging

### Console Logging

For simple applications:

```typescript
import { Injectable } from '@riktajs/core';

@Injectable()
export class AppService {
  doSomething() {
    console.log('Something happened');
    console.error('An error occurred');
    console.warn('Warning message');
  }
}
```

### Custom Logger Service

Create a structured logger:

```typescript
import { Injectable } from '@riktajs/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

@Injectable()
export class LoggerService {
  private context: string = 'Application';

  setContext(context: string) {
    this.context = context;
    return this;
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      data,
    };

    const output = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }
}
```

## Using the Logger

### In Services

```typescript
import { Injectable, Autowired } from '@riktajs/core';

@Injectable()
export class UserService {
  @Autowired()
  private logger!: LoggerService;

  async createUser(data: CreateUserDto) {
    this.logger.setContext('UserService');
    this.logger.info('Creating user', { email: data.email });

    try {
      const user = await this.database.insert(data);
      this.logger.info('User created', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', { error, data });
      throw error;
    }
  }
}
```

### In Controllers

```typescript
@Controller('/users')
export class UserController {
  @Autowired()
  private logger!: LoggerService;

  @Post()
  async create(@Body() data: CreateUserDto, @Req() request: FastifyRequest) {
    this.logger.info('Create user request', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    
    return this.userService.create(data);
  }
}
```

## Using Pino

[Pino](https://getpino.io) is a fast logger that works great with Fastify.

### Setup

```bash
npm install pino pino-pretty
```

### Logger Service with Pino

```typescript
import { Injectable } from '@riktajs/core';
import pino, { Logger } from 'pino';

@Injectable()
export class PinoLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    });
  }

  child(bindings: Record<string, unknown>) {
    return this.logger.child(bindings);
  }

  info(msg: string, data?: object) {
    this.logger.info(data, msg);
  }

  error(msg: string, data?: object) {
    this.logger.error(data, msg);
  }

  warn(msg: string, data?: object) {
    this.logger.warn(data, msg);
  }

  debug(msg: string, data?: object) {
    this.logger.debug(data, msg);
  }
}
```

### Fastify Integration

```typescript
import { Rikta } from '@riktajs/core';
import pino from 'pino';

async function bootstrap() {
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
  });

  const app = await Rikta.create({
    port: 3000,
    autowired: ['./src'],
    fastifyOptions: {
      logger, // Fastify uses pino natively
    },
  });

  await app.listen();
}
```

## Request Logging

### Request Logger Middleware

```typescript
import { Injectable } from '@riktajs/core';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class RequestLoggerService {
  @Autowired()
  private logger!: LoggerService;

  logRequest(request: FastifyRequest, reply: FastifyReply, done: () => void) {
    const start = Date.now();
    
    reply.addHook('onSend', (req, rep, payload, done) => {
      const duration = Date.now() - start;
      
      this.logger.info('Request completed', {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      
      done();
    });
    
    done();
  }
}
```

### Correlation IDs

Track requests across services:

```typescript
import { Injectable } from '@riktajs/core';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationService {
  private correlationId: string = '';

  setCorrelationId(id?: string) {
    this.correlationId = id || randomUUID();
  }

  getCorrelationId(): string {
    return this.correlationId;
  }
}

// In your request handling
@Injectable()
export class LoggerService {
  @Autowired()
  private correlation!: CorrelationService;

  info(message: string, data?: object) {
    console.log(JSON.stringify({
      correlationId: this.correlation.getCorrelationId(),
      message,
      ...data,
    }));
  }
}
```

## Log Levels

Configure different log levels per environment:

```typescript
import { Injectable, AbstractConfigProvider, ConfigProperty } from '@riktajs/core';

export class LogConfig extends AbstractConfigProvider<{ level: string }> {
  @ConfigProperty({ env: 'LOG_LEVEL' })
  level: 'debug' | 'info' | 'warn' | 'error' = 'info';
}

@Injectable()
export class LoggerService {
  @Autowired()
  private config!: LogConfig;

  private levels = ['debug', 'info', 'warn', 'error'];

  private shouldLog(level: string): boolean {
    return this.levels.indexOf(level) >= this.levels.indexOf(this.config.level);
  }

  debug(message: string, data?: object) {
    if (this.shouldLog('debug')) {
      this.output('debug', message, data);
    }
  }

  info(message: string, data?: object) {
    if (this.shouldLog('info')) {
      this.output('info', message, data);
    }
  }

  // ... etc
}
```

## Structured Logging

Output logs as JSON for easy parsing:

```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  environment: string;
  correlationId?: string;
  message: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class StructuredLogger {
  @Autowired()
  private config!: AppConfigProvider;

  error(message: string, error?: Error, data?: object) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service: this.config.serviceName,
      environment: this.config.environment,
      message,
      data,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    console.error(JSON.stringify(entry));
  }
}
```

## Sensitive Data

### Redacting Secrets

```typescript
@Injectable()
export class SafeLogger {
  private sensitiveFields = ['password', 'token', 'secret', 'authorization'];

  log(message: string, data?: object) {
    const safeData = this.redact(data);
    console.log(JSON.stringify({ message, data: safeData }));
  }

  private redact(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveFields.some(f => key.toLowerCase().includes(f))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = this.redact(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}
```

## Best Practices

### 1. Use Structured Logging

```typescript
// ✅ Good - structured, parseable
this.logger.info('User created', { userId: user.id, email: user.email });

// ❌ Avoid - hard to parse
this.logger.info(`User ${user.id} with email ${user.email} created`);
```

### 2. Include Context

```typescript
// ✅ Good - enough context to debug
this.logger.error('Database query failed', {
  query: 'SELECT * FROM users WHERE id = ?',
  params: [userId],
  error: error.message,
  duration: '150ms',
});

// ❌ Avoid - not enough context
this.logger.error('Query failed');
```

### 3. Use Appropriate Levels

```typescript
this.logger.debug('Entering method X');        // Development only
this.logger.info('User logged in', { userId }); // Normal operations
this.logger.warn('Rate limit approaching');     // Potential issues
this.logger.error('Payment failed', { error }); // Errors
```

### 4. Don't Log Sensitive Data

```typescript
// ✅ Good - password not logged
this.logger.info('Login attempt', { email: user.email });

// ❌ Bad - logging password
this.logger.info('Login attempt', { email, password });
```

### 5. Log at Boundaries

```typescript
// Log at entry and exit of important operations
async processPayment(orderId: string) {
  this.logger.info('Processing payment', { orderId });
  
  try {
    const result = await this.paymentService.charge(orderId);
    this.logger.info('Payment successful', { orderId, transactionId: result.id });
    return result;
  } catch (error) {
    this.logger.error('Payment failed', { orderId, error });
    throw error;
  }
}
```
