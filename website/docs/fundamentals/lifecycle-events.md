---
sidebar_position: 3
---

# Lifecycle Events

Rikta provides hooks into key application lifecycle events, allowing you to run initialization logic, cleanup tasks, and respond to application state changes.

## Overview

Understanding the application lifecycle is crucial for:

- **Initializing resources** (database connections, caches)
- **Graceful shutdown** (closing connections, flushing buffers)
- **Health checks** (monitoring readiness and liveness)
- **Logging and metrics** (tracking application state)

## Lifecycle Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Lifecycle                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Rikta.create() called                                   │
│           │                                                 │
│           ▼                                                 │
│  2. Container initialization                                │
│           │                                                 │
│           ▼                                                 │
│  3. Providers registered                                    │
│           │                                                 │
│           ▼                                                 │
│  4. @OnInit() hooks called                                  │
│           │                                                 │
│           ▼                                                 │
│  5. Routes registered                                       │
│           │                                                 │
│           ▼                                                 │
│  6. app.listen() - Server starts                            │
│           │                                                 │
│           ▼                                                 │
│  7. @OnReady() hooks called                                 │
│           │                                                 │
│           ▼                                                 │
│  8. Application running...                                  │
│           │                                                 │
│           ▼                                                 │
│  9. Shutdown signal received                                │
│           │                                                 │
│           ▼                                                 │
│  10. @OnShutdown() hooks called                             │
│           │                                                 │
│           ▼                                                 │
│  11. Application terminated                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Lifecycle Hooks

### @OnInit()

Called when the provider is instantiated and dependencies are injected:

```typescript
import { Injectable, OnInit } from '@riktajs/core';

@Injectable()
export class DatabaseService {
  private connection: Connection;

  @OnInit()
  async initialize() {
    console.log('Initializing database connection...');
    this.connection = await createConnection();
    console.log('Database connected!');
  }
}
```

### @OnReady()

Called when the application is fully started and ready to accept requests:

```typescript
import { Injectable, OnReady } from '@riktajs/core';

@Injectable()
export class MonitoringService {
  @OnReady()
  async onApplicationReady() {
    console.log('Application is ready!');
    await this.registerWithServiceDiscovery();
    await this.startHealthChecks();
  }

  private async registerWithServiceDiscovery() {
    // Register this instance with service discovery
  }

  private async startHealthChecks() {
    // Start periodic health checks
  }
}
```

### @OnShutdown()

Called when the application receives a shutdown signal:

```typescript
import { Injectable, OnShutdown, Autowired } from '@riktajs/core';

@Injectable()
export class CleanupService {
  @Autowired()
  private database!: DatabaseService;

  @Autowired()
  private cache!: CacheService;

  @OnShutdown()
  async cleanup() {
    console.log('Shutting down gracefully...');
    
    // Close database connections
    await this.database.disconnect();
    
    // Flush cache
    await this.cache.flush();
    
    // Deregister from service discovery
    await this.deregisterService();
    
    console.log('Cleanup complete');
  }
}
```

## Async Hooks

All lifecycle hooks support async operations:

```typescript
@Injectable()
export class StartupService {
  @OnInit()
  async init() {
    await this.loadConfiguration();
    await this.warmupCache();
    await this.validateConnections();
  }

  private async loadConfiguration() {
    // Load remote configuration
  }

  private async warmupCache() {
    // Pre-populate cache with common data
  }

  private async validateConnections() {
    // Verify external service connections
  }
}
```

## Order of Execution

Lifecycle hooks are executed in the order providers are registered:

```typescript
@Injectable()
export class ServiceA {
  @OnInit()
  init() {
    console.log('ServiceA initialized'); // Called first
  }
}

@Injectable()
export class ServiceB {
  @Autowired()
  private serviceA!: ServiceA;

  @OnInit()
  init() {
    console.log('ServiceB initialized'); // Called after ServiceA
  }
}
```

## Practical Examples

### Database Connection Manager

```typescript
import { Injectable, OnInit, OnShutdown } from '@riktajs/core';

@Injectable()
export class DatabaseManager {
  private pool: ConnectionPool;

  @OnInit()
  async connect() {
    console.log('Creating database connection pool...');
    this.pool = await createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      max: 20,
    });
    console.log('Database pool created');
  }

  @OnShutdown()
  async disconnect() {
    console.log('Closing database connections...');
    await this.pool.end();
    console.log('Database connections closed');
  }

  getPool(): ConnectionPool {
    return this.pool;
  }
}
```

### Health Check Service

```typescript
import { Injectable, OnReady, Autowired } from '@riktajs/core';

@Injectable()
export class HealthCheckService {
  @Autowired()
  private database!: DatabaseManager;

  private isReady = false;

  @OnReady()
  async onReady() {
    this.isReady = true;
    console.log('Health check: Application ready');
  }

  async checkHealth(): Promise<HealthStatus> {
    const dbHealthy = await this.checkDatabase();
    
    return {
      status: this.isReady && dbHealthy ? 'healthy' : 'unhealthy',
      checks: {
        database: dbHealthy,
        ready: this.isReady,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.database.getPool().query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}
```

### Graceful Shutdown Handler

```typescript
import { Injectable, OnShutdown, Autowired } from '@riktajs/core';

@Injectable()
export class GracefulShutdown {
  private shutdownInProgress = false;

  @Autowired()
  private database!: DatabaseManager;

  @Autowired()
  private messageQueue!: MessageQueueService;

  @OnShutdown()
  async shutdown() {
    if (this.shutdownInProgress) return;
    this.shutdownInProgress = true;

    console.log('Graceful shutdown initiated...');

    // Stop accepting new work
    await this.messageQueue.stopConsuming();

    // Wait for in-flight requests (with timeout)
    await this.waitForInFlightRequests(30000);

    // Flush any pending writes
    await this.messageQueue.flushPending();

    // Close connections
    await this.database.disconnect();

    console.log('Graceful shutdown complete');
  }

  private async waitForInFlightRequests(timeout: number): Promise<void> {
    const start = Date.now();
    while (this.getInFlightCount() > 0 && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private getInFlightCount(): number {
    // Return count of in-flight requests
    return 0;
  }
}
```

## Signal Handling

Rikta automatically handles common shutdown signals:

- `SIGTERM` - Standard termination signal
- `SIGINT` - Interrupt from keyboard (Ctrl+C)

```typescript
// Rikta handles this automatically
process.on('SIGTERM', () => {
  // @OnShutdown() hooks are called
});

process.on('SIGINT', () => {
  // @OnShutdown() hooks are called
});
```

## Best Practices

### 1. Keep Hooks Fast

```typescript
// ✅ Good - quick initialization
@OnInit()
async init() {
  this.config = this.loadConfig();
  await this.validateConfig();
}

// ❌ Avoid - slow startup
@OnInit()
async init() {
  await this.loadAllDataFromDatabase(); // Blocks startup
}
```

### 2. Handle Errors Gracefully

```typescript
@OnInit()
async init() {
  try {
    await this.connect();
  } catch (error) {
    console.error('Failed to initialize:', error);
    throw error; // Prevent app from starting with broken state
  }
}
```

### 3. Set Timeouts for Shutdown

```typescript
@OnShutdown()
async shutdown() {
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout - forcing exit');
    process.exit(1);
  }, 30000);

  await this.cleanup();
  clearTimeout(timeout);
}
```

### 4. Order Dependencies Correctly

```typescript
// Database should initialize before services that use it
@Injectable()
export class DatabaseService {
  @OnInit()
  async init() { /* Connect first */ }
}

@Injectable()
export class UserService {
  @Autowired()
  private database!: DatabaseService; // Depends on database

  @OnInit()
  async init() { /* Database already connected */ }
}
```
