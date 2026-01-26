# @riktajs/core

The core package of the Rikta framework.

See the [main repository README](../../README.md) for full documentation.

## Installation

```bash
npm install @riktajs/core
```

## Quick Start

```typescript
import { Rikta, Controller, Injectable, Get, Autowired } from '@riktajs/core';

@Injectable()
class HelloService {
  getMessage() {
    return { message: 'Hello from Rikta!' };
  }
}

@Controller('/api')
class HelloController {
  @Autowired()
  private helloService!: HelloService;

  @Get('/hello')
  getHello() {
    return this.helloService.getMessage();
  }
}

const app = await Rikta.create({ 
  port: 3000, 
  autowired: ['./src']
});
await app.listen();
```

## Features

- 🚀 Zero-Config Autowiring
- ⚡ Fastify Powered
- 🛡️ Type-Safe by Default
- 🔄 Hybrid Lifecycle
- 📦 Built-in Dependency Injection
- ✅ Zod Validation Integration

## Provider Scopes

Rikta supports three provider scopes:

```typescript
// Singleton (default) - shared instance
@Injectable()
class ConfigService {}

// Transient - new instance each time
@Injectable({ scope: 'transient' })
class RequestLogger {}

// Request - one instance per HTTP request
@Injectable({ scope: 'request' })
class RequestContext {}
```

## Strict Discovery Mode

Enable strict discovery to catch import errors early:

```typescript
const app = await Rikta.create({
  strictDiscovery: process.env.NODE_ENV !== 'production',
  onDiscoveryError: (file, error) => {
    console.warn(`Failed to import: ${file}`);
  },
});
```

## EventBus

The EventBus provides pub/sub for lifecycle events:

```typescript
import { Injectable, Autowired, EventBus } from '@riktajs/core';

@Injectable()
class MonitorService {
  @Autowired()
  private events!: EventBus;

  onProviderInit() {
    this.events.on('app:listen', ({ address }) => {
      console.log(`Server at ${address}`);
    });
  }
}
```

## License

MIT
