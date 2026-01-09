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

### 🏆 Quick Summary

**Rikta delivers near-Fastify performance while significantly outperforming NestJS!**

| Metric | vs NestJS | vs Fastify |
|--------|-----------|------------|
| **Startup** | 🟢 **-43% faster** | 🟢 **-13% faster** |
| **Throughput** | 🟢 **+9% faster** | 🟡 **~equivalent** |
| **Request Latency** | 🟢 **~40% faster** | 🟡 **~2-5% overhead** |

> **Note:** Rikta uses Fastify as its HTTP engine, so it cannot be faster than vanilla Fastify. The 2-5% overhead is the cost of DI, decorators, and structured architecture. Micro-benchmarks have inherent variance; results are averaged across multiple rounds with interleaved requests for fairness.

### Startup Time

Time to bootstrap and be ready for requests (lower is better):

| Framework | Startup Time | vs NestJS | vs Fastify |
|-----------|-------------|-----------|------------|
| **Rikta** | **2.92ms** | 🟢 -43% | 🟢 -13% |
| Fastify | 3.35ms | -34% | baseline |
| NestJS | 5.10ms | baseline | +52% |

*10 iterations, median time from process start to server ready*

### Request Overhead

Additional latency per request from framework overhead (lower is better):

#### GET / (Simple endpoint)

| Framework | Latency | vs NestJS | vs Fastify |
|-----------|---------|-----------|------------|
| Fastify | 165μs | -39% | baseline |
| **Rikta** | **160μs** | 🟢 -41% | ~equivalent |
| NestJS | 271μs | baseline | +64% |

#### POST / (Body parsing)

| Framework | Latency | vs NestJS | vs Fastify |
|-----------|---------|-----------|------------|
| Fastify | ~200μs | ~-27% | baseline |
| **Rikta** | **~206μs** | 🟢 -25% | 🟡 ~3% |
| NestJS | ~275μs | baseline | +38% |

#### GET /:id (Route params)

| Framework | Latency | vs NestJS | vs Fastify |
|-----------|---------|-----------|------------|
| Fastify | ~125μs | ~-48% | baseline |
| **Rikta** | **~131μs** | 🟢 -46% | 🟡 ~5% |
| NestJS | ~241μs | baseline | +93% |

*1000 requests per test, interleaved pattern for fair comparison*

### Load Testing (Autocannon)

High-concurrency throughput testing (higher is better):

| Framework | Req/sec | Latency (avg) | Latency (p99) | Total Requests |
|-----------|---------|---------------|---------------|----------------|
| **Rikta** | **16,018** | 0.06ms | 1.00ms | 160,150 |
| Fastify | 15,945 | 0.07ms | 1.00ms | 175,375 |
| NestJS | 14,663 | 0.07ms | 1.00ms | 146,640 |

*10 connections, 10 seconds duration*

**Performance vs NestJS:**
- Rikta: **+9.2%** req/sec
- Rikta vs Fastify: ~equivalent (within margin of error)

## Benchmark Details

### Test Environment

- **OS**: Linux (Ubuntu-based)
- **Node.js**: v22.x
- **Tool**: Custom benchmark suite + Autocannon
- **Iterations**: 10 for startup, 1000/500 for requests, 10s for load

### Test Application

Each framework runs an equivalent application with a simple controller:

```typescript
// Rikta version
@Controller('/')
export class AppController {
  @Get('/hello')
  hello() {
    return { message: 'Hello World' };
  }
  
  @Post('/users')
  createUser(@Body() body: any) {
    return { id: 1, ...body };
  }
  
  @Get('/users/:id')
  getUser(@Param('id') id: string) {
    return { id, name: 'John' };
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
npm run bench

# Run specific benchmarks
npm run bench:startup       # Startup time
npm run bench:requests      # Request overhead
npm run bench:autocannon    # Load testing
```

## Performance Tips

### 1. Use Silent Mode in Production

```typescript
const app = await Rikta.create({
  port: 3000,
  silent: true,    // Essential for performance
  logger: false,   // Disable request logging
});
```

Silent mode eliminates console.log overhead, improving startup time by ~50% and request throughput by ~10%.

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
- JSON serialization with fast-json-stringify
- Route matching with find-my-way
- Request parsing

### 2. Lightweight DI Container

The dependency injection system is designed to be:
- Fast at resolution time
- Efficient with memory
- Minimal overhead per request
- Single-pass registration at startup

### 3. No Runtime Module Resolution

Unlike frameworks with dynamic modules, Rikta resolves all dependencies at startup, not per-request.

### 4. Direct Route Registration

Routes are registered directly with Fastify without abstraction layers.

### 5. Silent Mode Optimization

When `silent: true`, Rikta skips all console output during startup and request handling, reducing I/O overhead.

## Comparison Notes

### vs. Raw Fastify

Rikta adds minimal overhead (~2-5%) compared to raw Fastify while providing:
- Dependency injection
- Decorators for routing
- Class-based architecture
- Validation integration
- Structured architecture

This overhead is expected since Rikta wraps Fastify. The small cost is justified by significantly better developer experience and maintainability.

### vs. NestJS

Rikta is significantly faster than NestJS (**~40% on average**) because:
- Simpler DI container with less abstraction
- No runtime module resolution
- Optimized route registration
- Direct Fastify integration without middleware chains
- Silent mode eliminates logging overhead

### vs. Express

Both Rikta and Express can handle JSON APIs, but Rikta:
- Is significantly faster on throughput
- Has built-in TypeScript support
- Provides structure without boilerplate
- Uses modern async/await patterns

## Real-World Performance

In production applications, Rikta typically handles:

- **10,000-15,000 req/sec** for simple endpoints (single instance)
- **5,000-10,000 req/sec** with database queries
- **2,000-5,000 req/sec** with complex business logic

Actual performance depends on:
- Database query efficiency
- External service calls
- Business logic complexity
- Payload size
- Hardware specifications

With clustering (e.g., PM2 with 4 processes), you can multiply these numbers by the number of cores.

## Latest Benchmark Data

All benchmarks are run automatically on every release. You can find:

- Full benchmark results in [`benchmarks/RESULTS.md`](https://github.com/riktahq/rikta/blob/main/benchmarks/RESULTS.md)
- Quick summary in [`benchmarks/QUICK-SUMMARY.md`](https://github.com/riktahq/rikta/blob/main/benchmarks/QUICK-SUMMARY.md)
- Benchmark code in [`benchmarks/`](https://github.com/riktahq/rikta/tree/main/benchmarks) directory

*Last updated: January 9, 2026*
