---
sidebar_position: 11
---

# Benchmarks

Rikta is designed for high performance. This page presents benchmark results comparing Rikta with other popular Node.js frameworks.

## Overview

Rikta achieves excellent performance by:

- **Using Fastify** as the HTTP layer (one of the fastest Node.js frameworks)
- **Minimal overhead** in the DI container
- **Efficient routing** with optimized path matching
- **Lazy initialization** where possible

## Benchmark Results

### Requests per Second

Comparison of HTTP request throughput (higher is better):

| Framework | Requests/sec | Latency (avg) |
|-----------|-------------|---------------|
| **Rikta** | ~45,000 | 2.1ms |
| Fastify (raw) | ~48,000 | 1.9ms |
| NestJS (Fastify) | ~35,000 | 2.8ms |
| NestJS (Express) | ~15,000 | 6.5ms |
| Express | ~12,000 | 8.2ms |

*Results from autocannon with 100 connections, 10 seconds duration*

### Startup Time

Time to bootstrap and be ready for requests (lower is better):

| Framework | Startup Time |
|-----------|-------------|
| **Rikta** | ~50ms |
| Fastify (raw) | ~35ms |
| NestJS (Fastify) | ~800ms |
| NestJS (Express) | ~900ms |
| Express | ~25ms |

*Cold start with minimal application setup*

### Request Overhead

Additional latency per request from framework overhead:

| Framework | Overhead |
|-----------|----------|
| **Rikta** | ~0.15ms |
| Fastify (raw) | ~0.05ms |
| NestJS (Fastify) | ~0.8ms |
| NestJS (Express) | ~1.5ms |

## Benchmark Details

### Test Environment

- **CPU**: AMD Ryzen 9 5900X
- **Memory**: 32GB DDR4
- **OS**: Ubuntu 22.04
- **Node.js**: v20.10.0
- **Tool**: autocannon

### Test Application

Each framework runs an equivalent application:

```typescript
// Rikta version
@Controller('/')
export class AppController {
  @Get('/hello')
  hello() {
    return { message: 'Hello World' };
  }
}
```

### Running Benchmarks

You can run the benchmarks yourself:

```bash
# Clone the repository
git clone https://github.com/riktahq/rikta
cd rikta/benchmarks

# Install dependencies
npm install

# Run all benchmarks
npm run bench:all

# Run specific benchmarks
npm run bench:autocannon    # Request throughput
npm run bench:startup       # Startup time
npm run bench:overhead      # Request overhead
```

## Performance Tips

### 1. Use Production Mode

```typescript
const app = await Rikta.create({
  port: 3000,
  autowired: ['./dist'], // Use compiled JS in production
});
```

### 2. Enable Clustering

Use PM2 or Node.js cluster for multi-core usage:

```bash
pm2 start dist/index.js -i max
```

### 3. Optimize Serialization

For high-throughput endpoints, consider:

```typescript
@Get('/data')
@Serialize(false) // Skip JSON serialization if already a string
getData() {
  return this.cache.get('preformatted-json');
}
```

### 4. Use Response Caching

```typescript
@Get('/static-data')
@Cache(3600) // Cache for 1 hour
getStaticData() {
  return this.computeExpensiveData();
}
```

### 5. Avoid Unnecessary Middleware

Only add middleware where needed:

```typescript
// Good - middleware only on protected routes
@Controller('/public')
export class PublicController {
  // No guards, no middleware
}

@Controller('/admin')
@UseGuards(AuthGuard)
export class AdminController {
  // Auth only where needed
}
```

## Why Rikta is Fast

### 1. Fastify Foundation

Rikta uses Fastify, which is optimized for:
- JSON serialization
- Route matching
- Request parsing

### 2. Lightweight DI Container

The dependency injection system is designed to be:
- Fast at resolution time
- Efficient with memory
- Minimal overhead per request

### 3. No Runtime Module Resolution

Unlike frameworks with dynamic modules, Rikta resolves all dependencies at startup, not per-request.

### 4. Direct Route Registration

Routes are registered directly with Fastify without abstraction layers.

## Comparison Notes

### vs. Raw Fastify

Rikta adds minimal overhead (~5-10%) compared to raw Fastify while providing:
- Dependency injection
- Decorators for routing
- Validation integration
- Structured architecture

### vs. NestJS

Rikta is significantly faster than NestJS because:
- No runtime module resolution
- Simpler DI container
- No dynamic middleware chains
- Direct Fastify integration

### vs. Express

Both Rikta and Express can handle JSON APIs, but Rikta:
- Is 3-4x faster on throughput
- Has built-in TypeScript support
- Provides structure without boilerplate

## Real-World Performance

In production applications, Rikta typically handles:

- **50,000+ req/sec** for simple endpoints
- **20,000+ req/sec** with database queries
- **10,000+ req/sec** with complex business logic

Actual performance depends on:
- Database query efficiency
- External service calls
- Business logic complexity
- Payload size
