# @riktajs/typeorm

> TypeORM integration for Rikta Framework with lifecycle-based connection management

[![npm version](https://img.shields.io/npm/v/@riktajs/typeorm.svg)](https://www.npmjs.com/package/@riktajs/typeorm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔌 **Automatic Connection Management** - DataSource initializes on app start, closes on shutdown
- 💉 **Dependency Injection** - Inject `DataSource` and `EntityManager` via `@Autowired`
- ⚙️ **Environment Configuration** - Configure via `TYPEORM_*` environment variables
- 🔄 **Lifecycle Hooks** - Uses Rikta's `OnProviderInit` and `OnProviderDestroy`
- 📦 **Re-exported Decorators** - Import TypeORM decorators directly from this package
- 🎯 **Type-safe** - Full TypeScript support with Zod validation

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

### 1. Set Environment Variables

Create a `.env` file in your project root:

```env
TYPEORM_TYPE=postgres
TYPEORM_HOST=localhost
TYPEORM_PORT=5432
TYPEORM_USERNAME=admin
TYPEORM_PASSWORD=secret
TYPEORM_DATABASE=myapp
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=true
```

### 2. Create an Entity

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

### 3. Create a Service

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

### 4. Use in a Controller

```typescript
import { Controller, Get, Post, Body } from '@riktajs/core';
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

### 5. Bootstrap the Application

```typescript
import 'reflect-metadata';
import { Rikta } from '@riktajs/core';

// Import your entities and services
import './entities/user.entity';
import './services/user.service';
import './controllers/user.controller';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
  });

  await app.listen();
}

bootstrap();
```

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TYPEORM_TYPE` | string | *required* | Database type: `postgres`, `mysql`, `sqlite`, `mariadb`, `mssql`, `oracle`, `mongodb` |
| `TYPEORM_HOST` | string | - | Database host |
| `TYPEORM_PORT` | number | - | Database port |
| `TYPEORM_USERNAME` | string | - | Database username |
| `TYPEORM_PASSWORD` | string | - | Database password |
| `TYPEORM_DATABASE` | string | - | Database name or file path (SQLite) |
| `TYPEORM_SYNCHRONIZE` | boolean | `false` | Sync schema on startup (⚠️ dev only!) |
| `TYPEORM_LOGGING` | boolean | `false` | Enable query logging |
| `TYPEORM_NAME` | string | `default` | Connection name (for multiple connections) |
| `TYPEORM_SSL` | boolean | `false` | Enable SSL connection |
| `TYPEORM_POOL_SIZE` | number | - | Connection pool size |

### Programmatic Configuration

You can also configure TypeORM programmatically:

```typescript
import { createTypeOrmProvider } from '@riktajs/typeorm';
import { User } from './entities/user.entity';

const provider = createTypeOrmProvider({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'admin',
  password: 'secret',
  database: 'myapp',
  entities: [User],
  synchronize: true,
  logging: true,
});
```

## Injection Tokens

| Token | Type | Description |
|-------|------|-------------|
| `TYPEORM_DATA_SOURCE` | `DataSource` | The TypeORM DataSource instance |
| `TYPEORM_ENTITY_MANAGER` | `EntityManager` | The EntityManager for the default connection |
| `TYPEORM_CONFIG` | `TypeOrmConfigProvider` | The configuration provider instance |

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
const provider = createTypeOrmProvider({
  dataSourceOptions: {
    type: 'postgres',
    host: 'db.example.com',
    // ...
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
  getEntityManagerToken,
} from '@riktajs/typeorm';

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

// Initialize both
await mainDb.onProviderInit();
await analyticsDb.onProviderInit();
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
3. The `TYPEORM_TYPE` environment variable is set

### Connection Refused

Check your environment variables:

```bash
# Debug: print current config
echo $TYPEORM_HOST $TYPEORM_PORT $TYPEORM_DATABASE
```

### Schema Synchronization Issues

**⚠️ Warning**: Never use `TYPEORM_SYNCHRONIZE=true` in production! Use migrations instead.

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

