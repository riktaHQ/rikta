# Quick Summary

## 🏆 Rikta vs Competition

| Metric | vs NestJS | vs Fastify |
|--------|-----------|------------|
| **Startup** | 🟢 **-43% faster** | 🟢 **-13% faster** |
| **Throughput** | 🟢 **+9% faster** | 🟡 **~equivalent** |
| **Request Latency** | 🟢 **~40% faster** | 🟡 **~2-5% overhead** |

## 📊 Key Numbers

```
Startup:    Rikta 2.92ms   | NestJS 5.10ms   | Fastify 3.35ms
Throughput: Rikta 16,018/s | NestJS 14,663/s | Fastify 15,945/s
Latency:    Rikta ~160μs   | NestJS ~271μs   | Fastify ~165μs
```

## ✅ Verdict

**Rikta is ~40% faster than NestJS** while providing a similar developer experience with decorators and dependency injection.

**Rikta is equivalent to vanilla Fastify** - adds minimal overhead (~2-5%) while providing DI, decorators, and structured architecture. This is expected since Rikta uses Fastify as its HTTP engine.

## 🚀 Best Performance Settings

```typescript
const app = await Rikta.create({
  port: 3000,
  silent: true,    // Essential for performance
  logger: false    // Disable request logging
});
```

## 📋 Methodology Note

Benchmarks use **interleaved requests** (F-R-N-F-R-N pattern) to eliminate ordering bias. Results are averaged across 5 rounds for statistical significance.
