# Environment Loading

Rikta automatically loads `.env` files **at the very start** of `Rikta.create()`, making environment variables available immediately in your main script, even before the application is fully initialized.

## Quick Start

Create a `.env` file in your project root:

```env
# .env
APP_NAME=My Application
API_KEY=super-secret-key
DATABASE_URL=postgresql://localhost:5432/mydb
FEATURE_FLAG=true
```

## Example 1: Basic Service Using Environment Variables

```typescript
import { Rikta, Injectable, Controller, Get } from '@riktajs/core';

@Injectable()
class AppService {
  getAppInfo() {
    return {
      name: process.env.APP_NAME,
      apiKey: process.env.API_KEY ? '***' : undefined,
      databaseUrl: process.env.DATABASE_URL,
      featureEnabled: process.env.FEATURE_FLAG === 'true',
    };
  }
}

@Controller('/app')
class AppController {
  constructor(private appService: AppService) {}

  @Get('/info')
  getInfo() {
    return this.appService.getAppInfo();
  }
}

async function bootstrap() {
  // .env files are loaded automatically at the very start of create()
  // This line will load both .env and .env.{NODE_ENV} immediately
  const app = await Rikta.create({ port: 3000 });
  
  await app.listen();
  
  // Environment variables are already available!
  console.log('App Name:', process.env.APP_NAME);
}

bootstrap();
```

## Example 2: Manual Loading (Optional)

If you need environment variables before calling `Rikta.create()`, you can manually load them:

```typescript
import { Rikta, loadEnvFiles } from '@riktajs/core';

// Manually load .env files first (optional, as create() does this automatically)
loadEnvFiles();

// Now env vars are available even before create()
const port = parseInt(process.env.PORT || '3000');
console.log('Starting on port:', port);

async function bootstrap() {
  // create() will skip reloading since it's already done
  const app = await Rikta.create({ port });
  await app.listen();
}

bootstrap();
```

## Example 3: Environment-Specific Configuration

The framework automatically loads environment-specific `.env` files based on `NODE_ENV`:

```bash
# .env (base configuration)
APP_NAME=My App
PORT=3000

# .env.development (overrides for development)
DEBUG=true
LOG_LEVEL=debug

# .env.production (overrides for production)
DEBUG=false
LOG_LEVEL=error
```

```typescript
import { Rikta, Injectable } from '@riktajs/core';

@Injectable()
class ConfigService {
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  getLogLevel() {
    return process.env.LOG_LEVEL || 'info';
  }

  isDebugEnabled() {
    return process.env.DEBUG === 'true';
  }
}

async function bootstrap() {
  // Set environment before creating the app
  process.env.NODE_ENV = 'production';

  // .env and .env.production will be loaded automatically
  // Environment variables are available immediately
  const app = await Rikta.create({ port: 3000 });
  
  await app.listen();
}

bootstrap();
```

## Example 4: No Config Provider Needed

Previously, you needed a config provider to load `.env` files:

```typescript
// ❌ OLD WAY - Required a config provider
@Provider('CONFIG')
class AppConfig extends AbstractConfigProvider {
  schema() {
    return z.object({
      APP_NAME: z.string(),
    });
  }

  @ConfigProperty()
  appName!: string;

  constructor() {
    super();
    this.populate();
  }
}
```

Now, `.env` files are loaded automatically:

```typescript
// ✅ NEW WAY - Just use environment variables directly!
@Injectable()
class AppService {
  getAppName() {
    return process.env.APP_NAME; // Already loaded from .env
  }
}
```

## When to Use Config Providers

Config providers are still useful when you need:

1. **Validation**: Type-safe validation with Zod schemas
2. **Type Safety**: Strongly-typed configuration properties
3. **Defaults**: Automatic default values
4. **Coercion**: Type conversion (string to number, etc.)

```typescript
import { AbstractConfigProvider, Provider, ConfigProperty } from '@riktajs/core';
import { z } from 'zod';

@Provider('APP_CONFIG')
class AppConfig extends AbstractConfigProvider {
  schema() {
    return z.object({
      PORT: z.coerce.number().int().min(1).max(65535).default(3000),
      HOST: z.string().default('localhost'),
      LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    });
  }

  @ConfigProperty()
  port!: number; // Validated and coerced to number

  @ConfigProperty()
  host!: string; // Validated string

  @ConfigProperty('LOG_LEVEL')
  logLevel!: 'debug' | 'info' | 'warn' | 'error'; // Type-safe enum

  constructor() {
    super();
    this.populate();
  }
}
```

## Benefits

- ✅ **Immediate Availability**: `.env` files are loaded at the very start of `Rikta.create()`, before any initialization
- ✅ **Environment-Specific**: Supports `.env.{NODE_ENV}` files with proper override precedence
- ✅ **No Boilerplate**: No need for config providers if you don't need validation
- ✅ **Backward Compatible**: Existing config providers continue to work seamlessly
- ✅ **Idempotent**: `.env` files are loaded only once, even with multiple config providers
- ✅ **Manual Override**: Can call `loadEnvFiles()` manually before `create()` if needed

## Summary

| Scenario | Solution |
|----------|----------|
| Simple env var access | Use `process.env` directly - `.env` auto-loaded |
| Type safety + validation | Use `AbstractConfigProvider` with Zod schema |
| Mix of both | Combine both approaches as needed |
