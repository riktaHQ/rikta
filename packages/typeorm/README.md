# @riktajs/typeorm

> TypeORM integration for Rikta Framework with lifecycle-based connection management

[![npm version](https://img.shields.io/npm/v/@riktajs/typeorm.svg)](https://www.npmjs.com/package/@riktajs/typeorm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔌 **Automatic Connection Management** - DataSource initializes on app start, closes on shutdown
- 💉 **Dependency Injection** - Inject `DataSource` and `EntityManager` via `@Autowired`
- ⚙️ **Programmatic Configuration** - Configure via `createTypeOrmProvider()` function
- 🔄 **Lifecycle Hooks** - Uses Rikta's `OnProviderInit` and `OnProviderDestroy`
- 📦 **Re-exported Decorators** - Import TypeORM decorators directly from this package
- 🎯 **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @riktajs/typeorm typeorm
```

You'll also need a database driver:

```bash
# PostgreSQL
npm install pg

# MySQL / MariaDB
npm install mysql2

# SQLite
npm install better-sqlite3

# Microsoft SQL Server
npm install mssql
```

## Peer Dependencies

- `@riktajs/core` >= 0.4.2
- `typeorm` >= 0.3.0
- `reflect-metadata` >= 0.2.0

## Quick Start

### 1. Create an Entity

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from '@riktajs/typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: true })
  isActive!: boolean;
}
```

### 2. Create a Service

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { TYPEORM_DATA_SOURCE } from '@riktajs/typeorm';
import type { DataSource } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  @Autowired(TYPEORM_DATA_SOURCE)
  private dataSource!: DataSource;

  async findAll(): Promise<User[]> {
    return this.dataSource.getRepository(User).find();
  }

  async findById(id: number): Promise<User | null> {
    return this.dataSource.getRepository(User).findOneBy({ id });
  }

  async create(name: string, email: string): Promise<User> {
    const user = new User();
    user.name = name;
    user.email = email;
    return this.dataSource.getRepository(User).save(user);
  }
}
```

### 3. Use in a Controller

```typescript
import { Controller, Get, Post, Body, Autowired } from '@riktajs/core';
import { UserService } from './user.service';

@Controller('/users')
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Get('/')
  async listUsers() {
    return this.userService.findAll();
  }

  @Post('/')
  async createUser(@Body() body: { name: string; email: string }) {
    return this.userService.create(body.name, body.email);
  }
}
```

### 4. Bootstrap the Application

```typescript
import 'reflect-metadata';
import { Rikta } from '@riktajs/core';
import { initializeTypeOrm } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

async function bootstrap() {
  // Initialize TypeORM (automatically connects and registers in DI container)
  const { installCleanup } = await initializeTypeOrm({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'admin',
    password: 'secret',
    database: 'myapp',
    entities: [User], // Register your entities
    synchronize: false, // Set to true only in development
    logging: true,
  });

  const app = await Rikta.create({
    port: 3000,
  });

  // Install automatic cleanup on app shutdown
  installCleanup(app);

  await app.listen();
}

bootstrap();
```

The `installCleanup(app)` call ensures that TypeORM connections are automatically closed when `app.close()` is called or when the process terminates gracefully.

<details>
<summary>Alternative: Manual initialization</summary>

If you need more control, you can initialize manually:

```typescript
import 'reflect-metadata';
import { Rikta, Container } from '@riktajs/core';
import { createTypeOrmProvider, TYPEORM_DATA_SOURCE, TYPEORM_ENTITY_MANAGER } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

async function bootstrap() {
  // Create and configure the TypeORM provider
  const typeormProvider = createTypeOrmProvider({
    dataSourceOptions: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'secret',
      database: 'myapp',
      entities: [User], // Register your entities
      synchronize: false, // Set to true only in development
      logging: true,
    },
  });

  // Initialize the provider (connects to database)
  await typeormProvider.onProviderInit();

  // Register DataSource in the container so services can inject it
  const container = Container.getInstance();
  container.registerValue(TYPEORM_DATA_SOURCE, typeormProvider.getDataSource());
  container.registerValue(TYPEORM_ENTITY_MANAGER, typeormProvider.getEntityManager());

  const app = await Rikta.create({
    port: 3000,
  });

  await app.listen();
  
  // Cleanup on shutdown
  process.on('SIGTERM', async () => {
    await typeormProvider.onProviderDestroy();
    await app.close();
  });
}

bootstrap();
```
</details>

## Configuration

All configuration must be provided programmatically through `initializeTypeOrm()` or `createTypeOrmProvider()`. 
This ensures type safety and makes it explicit which entities and options are being used.

### Basic Configuration

```typescript
import { initializeTypeOrm } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

const { installCleanup } = await initializeTypeOrm({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'secret',
  database: 'myapp',
  entities: [User], // Always required
  synchronize: false, // Set to true only in development!
  logging: true,
});

// Don't forget to call installCleanup(app) after creating your Rikta app
```

### Using Environment Variables

You can still use environment variables by reading them in your bootstrap code:

```typescript
const { installCleanup } = await initializeTypeOrm({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Post, Comment],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  },
});
```

### Multiple Entities

Use an array to register multiple entities:

```typescript
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';

await initializeTypeOrm({
  // ... other options
  entities: [User, Post, Comment],
});
```

### Entity Auto-Discovery with Glob Patterns

For larger projects, use glob patterns to auto-discover entities:

```typescript
const typeormProvider = createTypeOrmProvider({
  dataSourceOptions: {
    // ... other options
    entities: ['src/entities/**/*.entity.{ts,js}'],
    // In production build:
    // entities: ['dist/entities/**/*.entity.js'],
  },
});
```

## Injection Tokens

| Token | Type | Description |
|-------|------|-------------|
| `TYPEORM_DATA_SOURCE` | `DataSource` | The TypeORM DataSource instance |
| `TYPEORM_ENTITY_MANAGER` | `EntityManager` | The EntityManager for the default connection |

### Using EntityManager

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { TYPEORM_ENTITY_MANAGER } from '@riktajs/typeorm';
import type { EntityManager } from '@riktajs/typeorm';

@Injectable()
export class TransactionService {
  @Autowired(TYPEORM_ENTITY_MANAGER)
  private entityManager!: EntityManager;

  async transferFunds(fromId: number, toId: number, amount: number) {
    await this.entityManager.transaction(async (manager) => {
      // All operations here run in a transaction
      await manager.decrement(Account, { id: fromId }, 'balance', amount);
      await manager.increment(Account, { id: toId }, 'balance', amount);
    });
  }
}
```

## Lifecycle

The `TypeOrmProvider` integrates with Rikta's lifecycle system:

```
Rikta.create()
│
├─ Initialize providers (sorted by priority)
│   └─ TypeOrmProvider (priority: 100)
│       ├─ Build DataSourceOptions
│       ├─ Create DataSource
│       ├─ Call dataSource.initialize()
│       └─ Register in DI container
│
├─ ... other providers ...
│
app.close()
│
└─ Destroy providers (reverse order)
    └─ TypeOrmProvider
        └─ Call dataSource.destroy()
```

### Priority

`TypeOrmProvider` has a priority of `100`, ensuring the database connection is established before other services that depend on it.

## Re-exported Decorators

For convenience, this package re-exports commonly used TypeORM decorators:

```typescript
import {
  // Entity
  Entity,
  ViewEntity,
  
  // Columns
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  
  // Relations
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  
  // Indexes
  Index,
  Unique,
  
  // Subscribers
  EventSubscriber,
  BeforeInsert,
  AfterInsert,
  BeforeUpdate,
  AfterUpdate,
} from '@riktajs/typeorm';
```

## Advanced Usage

### Custom Repository Pattern

```typescript
import { Injectable } from '@riktajs/core';
import { TYPEORM_DATA_SOURCE } from '@riktajs/typeorm';
import type { DataSource, Repository } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  private repository!: Repository<User>;

  @Autowired(TYPEORM_DATA_SOURCE)
  set dataSource(ds: DataSource) {
    this.repository = ds.getRepository(User);
  }

  async findActive(): Promise<User[]> {
    return this.repository.find({
      where: { isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }
}
```

### Query Builder

```typescript
@Injectable()
export class ReportService {
  @Autowired(TYPEORM_DATA_SOURCE)
  private dataSource!: DataSource;

  async getUserStats() {
    return this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .select('user.isActive', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.isActive')
      .getRawMany();
  }
}
```

### Retry Configuration

For unstable connections, configure retry behavior:

```typescript
const typeormProvider = createTypeOrmProvider({
  dataSourceOptions: {
    type: 'postgres',
    host: 'db.example.com',
    port: 5432,
    username: 'admin',
    password: 'secret',
    database: 'myapp',
    entities: [User],
  },
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
});
```

### Multiple DataSources

Connect to multiple databases using named providers:

```typescript
import { 
  createNamedTypeOrmProvider, 
  getDataSourceToken,
} from '@riktajs/typeorm';
import { User, Post } from './entities/main';
import { Event, Metric } from './entities/analytics';

// Create providers for each database
const mainDb = createNamedTypeOrmProvider('main', {
  type: 'postgres',
  host: 'main-db.example.com',
  database: 'main',
  entities: [User, Post],
});

const analyticsDb = createNamedTypeOrmProvider('analytics', {
  type: 'postgres',
  host: 'analytics-db.example.com',
  database: 'analytics',
  entities: [Event, Metric],
});

// Use both providers in Rikta
const app = await Rikta.create({
  port: 3000,
  providers: [mainDb, analyticsDb],
});
```

Inject named datasources in your services:

```typescript
import { Injectable, Autowired } from '@riktajs/core';
import { getDataSourceToken } from '@riktajs/typeorm';
import type { DataSource } from '@riktajs/typeorm';

// Get tokens for named connections
const MAIN_DS = getDataSourceToken('main');
const ANALYTICS_DS = getDataSourceToken('analytics');

@Injectable()
class AnalyticsService {
  @Autowired(ANALYTICS_DS)
  private analyticsDs!: DataSource;

  @Autowired(MAIN_DS)
  private mainDs!: DataSource;

  async trackEvent(userId: number, event: string) {
    // Get user from main database
    const user = await this.mainDs.getRepository(User).findOneBy({ id: userId });
    
    // Store event in analytics database
    await this.analyticsDs.getRepository(Event).save({
      userId: user?.id,
      event,
      timestamp: new Date(),
    });
  }
}
```

Available functions for managing multiple datasources:

| Function | Description |
|----------|-------------|
| `createNamedTypeOrmProvider(name, options)` | Create a named provider |
| `getDataSourceToken(name)` | Get injection token for a named DataSource |
| `getEntityManagerToken(name)` | Get injection token for a named EntityManager |
| `getTypeOrmProvider(name)` | Get a registered provider by name |
| `getAllTypeOrmProviders()` | Get all registered providers |
| `initializeAllTypeOrmProviders()` | Initialize all registered providers |
| `destroyAllTypeOrmProviders()` | Close all connections |

## Testing

### Using SQLite for Tests

```typescript
import { createTypeOrmProvider } from '@riktajs/typeorm';

const testProvider = createTypeOrmProvider({
  type: 'better-sqlite3',
  database: ':memory:',
  synchronize: true,
  entities: [User, Post],
});

beforeAll(async () => {
  await testProvider.onProviderInit();
});

afterAll(async () => {
  await testProvider.onProviderDestroy();
});
```

## Troubleshooting

### "DataSource is not initialized"

This error occurs when you try to use the DataSource before it's been initialized. Make sure:

1. Your service is decorated with `@Injectable()`
2. You're using `@Autowired(TYPEORM_DATA_SOURCE)` to inject the DataSource
3. You've provided `dataSourceOptions` when creating the TypeORM provider
4. The TypeORM provider is included in the `providers` array when creating your Rikta app

### "No metadata for Entity was found"

This error means TypeORM doesn't know about your entity. Make sure:

1. You've registered the entity in the `entities` array of `dataSourceOptions`
2. You're importing the entity file before using it
3. The entity class is decorated with `@Entity()`

```typescript
// ✅ Correct
const typeormProvider = createTypeOrmProvider({
  dataSourceOptions: {
    type: 'postgres',
    // ... other options
    entities: [User, Post, Comment], // Register your entities here
  },
});
```

### Connection Refused

Check your database configuration:

```typescript
// Verify your connection details
const typeormProvider = createTypeOrmProvider({
  dataSourceOptions: {
    type: 'postgres',
    host: 'localhost', // Is this correct?
    port: 5432,        // Is the port correct?
    username: 'admin', // Valid credentials?
    password: 'secret',
    database: 'myapp', // Does this database exist?
  },
});
```

### Schema Synchronization Issues

**⚠️ Warning**: Never use `synchronize: true` in production! Use migrations instead.

```bash
# Generate a migration
npx typeorm migration:generate -d ./data-source.ts ./migrations/CreateUsers

# Run migrations
npx typeorm migration:run -d ./data-source.ts
```

## API Reference

### TypeOrmProvider

| Method | Description |
|--------|-------------|
| `onProviderInit()` | Lifecycle hook - initializes the DataSource |
| `onProviderDestroy()` | Lifecycle hook - closes the DataSource |
| `getDataSource()` | Returns the initialized DataSource |
| `getEntityManager()` | Returns the EntityManager |
| `isConnected()` | Returns `true` if connected |

### TypeOrmConfigProvider

| Property | Type | Description |
|----------|------|-------------|
| `type` | `DatabaseType` | Database type |
| `host` | `string?` | Database host |
| `port` | `number?` | Database port |
| `username` | `string?` | Username |
| `password` | `string?` | Password |
| `database` | `string?` | Database name |
| `synchronize` | `boolean` | Schema sync |
| `logging` | `boolean` | Query logging |

| Method | Description |
|--------|-------------|
| `toConfig()` | Returns a `TypeOrmConfig` object |
| `isFileBased()` | Returns `true` for SQLite |
| `getConnectionString()` | Returns connection URL |

## License

MIT

