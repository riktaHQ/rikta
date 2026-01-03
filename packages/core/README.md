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

## License

MIT
