---
sidebar_position: 6
---

# Performance Profiling

Rikta includes a built-in performance profiling system that helps you measure and monitor your application's performance.

## Overview

The `PerformanceProfiler` class provides:

- **Timer-based measurements** for operations
- **Bootstrap metrics** tracking
- **Route metrics** collection
- **Event-based notifications** for metrics

## Basic Usage

### Measuring Operations

```typescript
import { profiler } from '@riktajs/core';

// Start a timer
const end = profiler.startTimer('database-query');

// Perform the operation
const result = await db.query('SELECT * FROM users');

// Stop the timer and record the metric
end({ table: 'users', rowCount: result.length });
```

### Using measure() for Functions

```typescript
import { profiler } from '@riktajs/core';

// Measure an async function
const users = await profiler.measure('fetch-users', async () => {
  return await userService.findAll();
});

// Measure a sync function
const processed = await profiler.measure('process-data', () => {
  return data.map(transform);
});
```

## Subscribing to Metrics

```typescript
import { profiler, PerformanceMetric } from '@riktajs/core';

// Subscribe to all metrics
const unsubscribe = profiler.onMetric((metric: PerformanceMetric) => {
  console.log(`${metric.name}: ${metric.duration.toFixed(2)}ms`);
  
  // Send to monitoring service
  monitoringService.record({
    name: metric.name,
    duration: metric.duration,
    timestamp: metric.startTime,
    ...metric.metadata,
  });
});

// Later, unsubscribe when done
unsubscribe();
```

## Integration with Services

```typescript
import { Injectable, Autowired, profiler } from '@riktajs/core';

@Injectable()
export class UserService {
  @Autowired(DatabaseService)
  private db!: DatabaseService;

  async findAll(): Promise<User[]> {
    return profiler.measure('UserService.findAll', async () => {
      return this.db.query('SELECT * FROM users');
    });
  }

  async findById(id: number): Promise<User | null> {
    const end = profiler.startTimer('UserService.findById');
    try {
      const user = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
      end({ found: !!user });
      return user;
    } catch (error) {
      end({ error: true });
      throw error;
    }
  }
}
```

## Creating a Custom Profiler

```typescript
import { PerformanceProfiler, setGlobalProfiler } from '@riktajs/core';

// Create a custom profiler
const customProfiler = new PerformanceProfiler({
  enabled: process.env.NODE_ENV !== 'production',
});

// Add custom listeners
customProfiler.onMetric((metric) => {
  if (metric.duration > 100) {
    console.warn(`Slow operation: ${metric.name} took ${metric.duration}ms`);
  }
});

// Replace the global profiler
setGlobalProfiler(customProfiler);
```

## Console Logging Timer

For quick debugging, use the console timer:

```typescript
import { profiler } from '@riktajs/core';

const timer = profiler.createConsoleTimer('[MyApp]');

// This will log: [MyApp] database-connect: 45.23ms
const endConnect = timer('database-connect');
await db.connect();
endConnect();

// This will log: [MyApp] fetch-users: 123.45ms
const endFetch = timer('fetch-users');
await fetchUsers();
endFetch();
```

## Enabling/Disabling Profiling

```typescript
import { profiler } from '@riktajs/core';

// Disable profiling (e.g., in production for performance)
profiler.setEnabled(false);

// Check if profiling is enabled
if (profiler.isEnabled()) {
  // Profiling code
}

// Re-enable profiling
profiler.setEnabled(true);
```

## Bootstrap Metrics

Track your application's startup performance:

```typescript
import { profiler } from '@riktajs/core';

// After app starts, get bootstrap metrics
const bootstrap = profiler.getBootstrapMetrics();

console.log('Bootstrap times:');
console.log(`  Discovery: ${bootstrap.discovery}ms`);
console.log(`  Container Init: ${bootstrap.containerInit}ms`);
console.log(`  Route Registration: ${bootstrap.routeRegistration}ms`);
console.log(`  Lifecycle Hooks: ${bootstrap.lifecycleHooks}ms`);
console.log(`  Total: ${bootstrap.total}ms`);
```

## Route Metrics

Record HTTP route performance:

```typescript
import { profiler, RouteMetric } from '@riktajs/core';

// This is typically done automatically by interceptors
profiler.recordRouteMetric({
  name: 'route:GET:/api/users',
  method: 'GET',
  path: '/api/users',
  duration: 45.5,
  statusCode: 200,
  startTime: Date.now(),
});
```

## Creating a Metrics Interceptor

Combine the profiler with interceptors for automatic route metrics:

```typescript
import { Injectable, Interceptor, ExecutionContext, CallHandler, profiler } from '@riktajs/core';

@Injectable()
export class MetricsInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const end = profiler.startTimer(`route:${request.method}:${request.url}`);
    
    try {
      const result = await next.handle();
      
      const response = context.switchToHttp().getResponse();
      profiler.recordRouteMetric({
        name: `route:${request.method}:${request.url}`,
        method: request.method,
        path: request.url,
        duration: Date.now() - startTime,
        statusCode: response.statusCode || 200,
        startTime,
      });
      
      end({ statusCode: response.statusCode || 200 });
      return result;
    } catch (error) {
      end({ error: true });
      throw error;
    }
  }
}
```

## API Reference

### PerformanceProfiler

```typescript
class PerformanceProfiler {
  constructor(options?: { enabled?: boolean; eventBus?: EventBus });
  
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  
  startTimer(name: string): (metadata?: Record<string, unknown>) => PerformanceMetric | null;
  measure<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
  
  recordRouteMetric(metric: RouteMetric): void;
  recordBootstrapPhase(phase: keyof BootstrapMetrics, duration: number): void;
  getBootstrapMetrics(): Partial<BootstrapMetrics>;
  
  onMetric(listener: (metric: PerformanceMetric) => void): () => void;
  createConsoleTimer(prefix?: string): (name: string) => (metadata?: Record<string, unknown>) => void;
}
```

### Types

```typescript
interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  metadata?: Record<string, unknown>;
}

interface RouteMetric extends PerformanceMetric {
  method: string;
  path: string;
  statusCode: number;
}

interface BootstrapMetrics {
  total: number;
  discovery: number;
  containerInit: number;
  routeRegistration: number;
  lifecycleHooks: number;
}
```
