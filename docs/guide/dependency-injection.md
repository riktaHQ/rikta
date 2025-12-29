# 💉 Dependency Injection Container

The Rikta DI container with full autowiring support.

## Overview

- **Automatic resolution** via TypeScript metadata
- **Single decorator**: `@Autowired()` for everything
- **Token-based injection** for interfaces
- **Zero configuration** - just decorate!

## @Autowired() - The Universal Decorator

`@Autowired()` works for both property and constructor injection.

### Property Injection (Recommended)

```typescript
@Controller('/users')
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Autowired()
  private logger!: LoggerService;

  @Get('/')
  findAll() {
    this.logger.log('Getting users');
    return this.userService.findAll();
  }
}
```

### Constructor Injection

```typescript
@Injectable()
class UserService {
  constructor(
    @Autowired() private db: DatabaseService,
    @Autowired() private cache: CacheService
  ) {}
}
```

## Injection Tokens

For non-class dependencies (interfaces, config, primitives):

### Define Tokens

```typescript
import { InjectionToken } from '@riktajs/core';

interface DatabaseConfig {
  host: string;
  port: number;
}

export const DB_CONFIG = new InjectionToken<DatabaseConfig>('db.config');

interface Logger {
  log(msg: string): void;
}

export const LOGGER = new InjectionToken<Logger>('logger');
```

### Register Values

```typescript
import { container } from '@riktajs/core';

// Before Rikta.create()
container.registerValue(DB_CONFIG, {
  host: 'localhost',
  port: 5432,
});

container.registerFactory(LOGGER, () => ({
  log: (msg) => console.log(`[LOG] ${msg}`),
}));
```

### Inject with Token

```typescript
@Injectable()
class DatabaseService {
  constructor(
    @Autowired(DB_CONFIG) private config: DatabaseConfig,
    @Autowired(LOGGER) private logger: Logger
  ) {
    this.logger.log(`Connecting to ${config.host}`);
  }
}

// Or property injection
@Controller()
export class AppController {
  @Autowired(DB_CONFIG)
  private config!: DatabaseConfig;

  @Autowired(LOGGER)
  private logger!: Logger;
}
```

## Optional Dependencies

```typescript
const ANALYTICS = new InjectionToken<Analytics>('analytics');

@Injectable()
class TrackingService {
  constructor(
    @Optional() @Autowired(ANALYTICS) private analytics?: Analytics
  ) {}

  track(event: string) {
    this.analytics?.send(event);  // Safe - may be undefined
  }
}

// Property injection
@Controller()
export class AppController {
  @Optional()
  @Autowired()
  private metrics?: MetricsService;
}
```

## Provider Types

### Value Provider

```typescript
container.registerValue(TOKEN, value);
```

### Factory Provider

```typescript
container.registerFactory(TOKEN, () => createSomething());

// With dependencies
container.registerProvider({
  provide: DB_CONNECTION,
  useFactory: (config) => createConnection(config),
  inject: [DB_CONFIG],
});
```

### Class Provider

```typescript
container.registerProvider({
  provide: AbstractLogger,
  useClass: ConsoleLogger,
});
```

### @Provider Decorator (Recommended)

The cleanest way to create providers - **auto-discovered!**

```typescript
import { Provider, InjectionToken, Autowired } from '@riktajs/core';

const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

@Provider(APP_CONFIG)
export class AppConfigProvider {
  provide(): AppConfig {
    return {
      name: 'My App',
      version: '1.0.0',
    };
  }
}

// Providers can inject dependencies
const LOGGER = new InjectionToken<Logger>('logger');

@Provider(LOGGER)
export class LoggerProvider {
  @Autowired(APP_CONFIG)
  private config!: AppConfig;

  provide(): Logger {
    return createLogger({ appName: this.config.name });
  }
}
```

📖 [Full @Provider Documentation](../api/decorators.md#providertoken)

## Scopes

### Singleton (Default)

```typescript
@Injectable()  // One instance for entire app
class ConfigService { }
```

### Transient

```typescript
@Injectable({ scope: 'transient' })  // New instance each time
class RequestLogger { }
```

## API Reference

| Method | Description |
|--------|-------------|
| `container.registerValue(token, value)` | Register static value |
| `container.registerFactory(token, fn)` | Register factory |
| `container.registerProvider(provider)` | Register custom provider |
| `container.resolve(token)` | Get instance |
| `container.resolveOptional(token)` | Get instance or undefined |
