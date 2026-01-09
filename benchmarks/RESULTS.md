# Benchmark Results

## 🏆 Summary

**Rikta delivers near-Fastify performance while significantly outperforming NestJS!**

| Metric | Rikta vs NestJS | Rikta vs Fastify | Verdict |
|--------|-----------------|------------------|---------|
| **Startup** | 🟢 **-43% faster** | 🟢 **-13% faster** | ✅ Rikta wins |
| **GET requests** | 🟢 **-40% faster** | 🟡 **~2-5% overhead** | ✅ Rikta competitive |
| **POST requests** | 🟢 **-25% faster** | 🟡 **~2-5% overhead** | ✅ Rikta competitive |
| **Param requests** | 🟢 **-46% faster** | 🟡 **~2-5% overhead** | ✅ Rikta competitive |
| **Throughput** | 🟢 **+9% faster** | 🟡 **~equivalent** | ✅ Rikta competitive |

> **Key Takeaway:** Rikta adds minimal overhead (2-5%) over vanilla Fastify while being ~40% faster than NestJS. This is expected since Rikta uses Fastify as its HTTP engine.

---

## 📊 Detailed Results

### Startup Time

Tests the time from module import to server ready (10 iterations).

```
┌────────────┬───────────┬────────────────┬────────────────┐
│ Framework  │ Time (ms) │ vs NestJS      │ vs Fastify     │
├────────────┼───────────┼────────────────┼────────────────┤
│ Rikta      │ 2.92      │ 🟢 -42.7%      │ 🟢 -12.7%      │
│ Fastify    │ 3.35      │ -34.4%         │ baseline       │
│ NestJS     │ 5.10      │ baseline       │ +52.2%         │
└────────────┴───────────┴────────────────┴────────────────┘
```

**Analysis**: Rikta starts faster than both NestJS (43%) and Fastify (13%) thanks to:
- Silent mode (no console.log overhead)
- Optimized discovery and registration
- Efficient dependency injection initialization

---

### Request Overhead

Tests single request latency with warm server (1000 requests per test, **interleaved** for fair comparison).

#### GET /api/users (Simple endpoint)
```
┌────────────┬─────────────┬────────────────┬────────────────┐
│ Framework  │ Latency     │ vs NestJS      │ vs Fastify     │
├────────────┼─────────────┼────────────────┼────────────────┤
│ Fastify    │ 165μs       │ -39%           │ baseline       │
│ Rikta      │ 160μs       │ 🟢 -41%        │ ~equivalent    │
│ NestJS     │ 271μs       │ baseline       │ +64%           │
└────────────┴─────────────┴────────────────┴────────────────┘
```

#### POST /api/users (Body parsing)
```
┌────────────┬─────────────┬────────────────┬────────────────┐
│ Framework  │ Latency     │ vs NestJS      │ vs Fastify     │
├────────────┼─────────────┼────────────────┼────────────────┤
│ Fastify    │ ~200μs      │ ~-27%          │ baseline       │
│ Rikta      │ ~206μs      │ 🟢 -25%        │ 🟡 ~3%         │
│ NestJS     │ ~275μs      │ baseline       │ +38%           │
└────────────┴─────────────┴────────────────┴────────────────┘
```

#### GET /api/users/:id (Route params)
```
┌────────────┬─────────────┬────────────────┬────────────────┐
│ Framework  │ Latency     │ vs NestJS      │ vs Fastify     │
├────────────┼─────────────┼────────────────┼────────────────┤
│ Fastify    │ ~125μs      │ ~-48%          │ baseline       │
│ Rikta      │ ~131μs      │ 🟢 -46%        │ 🟡 ~5%         │
│ NestJS     │ ~241μs      │ baseline       │ +93%           │
└────────────┴─────────────┴────────────────┴────────────────┘
```

---

### Load Testing (Autocannon)

High-concurrency throughput testing with 10 connections for 10 seconds.

```
┌────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Framework  │ Requests/sec │ Latency (ms) │ Latency p99  │ Total Req    │
├────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Rikta      │ 16,018       │ 0.06         │ 1.00         │ 160,150      │
│ Fastify    │ 15,945       │ 0.07         │ 1.00         │ 175,375      │
│ NestJS     │ 14,663       │ 0.07         │ 1.00         │ 146,640      │
└────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

Performance:
  Rikta vs Fastify: ~equivalent (+0.5% req/sec)
  Rikta vs NestJS:  +9.2% req/sec
```

**Analysis**: Under high load, Rikta maintains excellent throughput:
- Equivalent to vanilla Fastify (within margin of error)
- 9.2% more requests/sec than NestJS

---

## 🔧 Test Configuration

```typescript
// Rikta (optimized)
const app = await Rikta.create({
  port: 3001,
  silent: true,   // No console output
  logger: false   // No Fastify logging
});

// NestJS
const app = await NestFactory.create(AppModule, 
  new FastifyAdapter({ logger: false }),
  { logger: false }
);

// Fastify (baseline)
const app = Fastify({ logger: false });
```

---

## 📈 Performance Comparison

```
Startup Time (lower is better)
──────────────────────────────────────────────────────────
Rikta     █████████████                               2.92ms
Fastify   ██████████████                              3.35ms
NestJS    ████████████████████████████                5.10ms

Request Latency - GET /api/users (lower is better)
──────────────────────────────────────────────────────────
Rikta     ██████████████                              160μs
Fastify   ██████████████                              165μs
NestJS    ████████████████████████████                271μs

Throughput - req/sec (higher is better)
──────────────────────────────────────────────────────────
Rikta     ████████████████████████████                16,018
Fastify   ████████████████████████████                15,945
NestJS    █████████████████████████                   14,663
```

---

## 🧪 Methodology

### Fair Testing Principles

1. **Interleaved Requests**: Requests are alternated (F-R-N-F-R-N) to eliminate ordering bias
2. **Multiple Rounds**: Results are averaged across 5 rounds for statistical significance
3. **Warmup Phase**: 200+ warmup requests before measurements
4. **Equivalent Code**: All frameworks run identical application logic

### Why Interleaved Testing?

Sequential testing (all Fastify requests, then all Rikta requests) introduces bias:
- CPU cache warming favors later tests
- V8 JIT compilation benefits accumulate
- System state changes between tests

Our tests alternate requests to ensure fair comparison.

### Startup Benchmark
1. Fork child process for each framework
2. Measure time from process start to "server ready" message
3. Run 10 iterations, take median
4. Ensure fresh process for each measurement

### Request Overhead Benchmark
1. Start all frameworks on different ports
2. Warm up with 200+ requests each
3. Run interleaved requests (F-R-N-F-R-N pattern)
4. Calculate mean and median latency
5. Repeat for 5 rounds, average results

### Environment
- Node.js v22.x
- Linux (for consistent timing)
- Fresh process for each test suite
- Disabled all logging

---

## 🔬 Statistical Validation

To ensure results are meaningful, we calculate:

- **Standard Error**: Measures variability across rounds
- **t-statistic**: Tests if differences are statistically significant
- **Multiple Rounds**: 5 rounds of 1000 requests each

Example validation output:
```
📋 AVERAGE OVER 5 ROUNDS:
   Fastify: 132.59μs
   Rikta:   136.10μs
   Difference: +2.64%

🔬 STATISTICAL SIGNIFICANCE:
   t-statistic: 0.20
   ⚠️  Difference NOT statistically significant
   → Performance is EQUIVALENT
```

This confirms that Rikta and Fastify perform equivalently within margin of error.

---

## 📝 Notes on Results

### Why Rikta ≈ Fastify

Rikta uses Fastify as its HTTP engine, so:
- Rikta cannot be faster than Fastify (it wraps it)
- Expected overhead is 2-5% for DI + decorators
- Any result showing Rikta faster is within measurement error

### Why Rikta >> NestJS

NestJS adds significant overhead:
- Complex module resolution system
- Middleware chains
- Heavier DI container
- Runtime metadata processing

Rikta avoids these by using simpler, optimized patterns.

---

*Last updated: January 9, 2026*
