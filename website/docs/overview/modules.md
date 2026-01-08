---
sidebar_position: 4
---

# Modules (Auto-Discovery)

Unlike other frameworks, Rikta uses **auto-discovery** instead of manual module registration. This means you don't need to create module files or manage imports/exports arrays.

## The Rikta Approach

In frameworks like NestJS, you organize code into modules with explicit imports and exports:

```typescript
// ❌ NestJS approach - NOT needed in Rikta
@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

In Rikta, you simply decorate your classes and they're automatically discovered:

```typescript
// ✅ Rikta approach - just decorate!
@Controller('/cats')
export class CatsController {
  @Autowired()
  private catsService!: CatsService;
}

@Injectable()
export class CatsService {
  // ...
}
```

## How Auto-Discovery Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Rikta.create()                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Registry   │───▶│  Container   │───▶│    Router    │   │
│  │ (Discovery)  │    │     (DI)     │    │   (Fastify)  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ @Controller  │    │ @Injectable  │    │  @Get, etc.  │   │
│  │ @Provider    │    │   Providers  │    │    Routes    │   │
│  │ auto-register│    │ Config Provs │    │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

1. **Decoration Phase**: When you use `@Controller`, `@Injectable`, or `@Provider`, the class is automatically registered in a global registry
2. **Bootstrap Phase**: When you call `Rikta.create()`, all registered classes are discovered
3. **Resolution Phase**: The DI container resolves all dependencies automatically
4. **Route Registration**: Controllers are scanned for route decorators and routes are registered with Fastify

## Configuration

Specify where Rikta should look for your code:

```typescript
const app = await Rikta.create({
  port: 3000,
  autowired: ['./src']  // Directories to scan
});
```

### Path Resolution

Paths are resolved relative to your calling code:

```typescript
// main.ts (in your project root)
const app = await Rikta.create({
  autowired: [
    './src/controllers',  // Resolved from main.ts location
    './src/services',
    './src/providers',
  ]
});
```

### Exclusions

Rikta automatically excludes:
- `node_modules` directories
- `dist` / build output directories
- Test files (`*.test.ts`, `*.spec.ts`)

## Organizing Code

Even without modules, you should still organize your code logically:

```
src/
├── controllers/
│   ├── app.controller.ts
│   ├── user.controller.ts
│   └── product.controller.ts
├── services/
│   ├── user.service.ts
│   ├── product.service.ts
│   └── email.service.ts
├── providers/
│   ├── app-config.provider.ts
│   └── database-config.provider.ts
├── guards/
│   ├── auth.guard.ts
│   └── roles.guard.ts
└── index.ts
```

## Feature-Based Organization

For larger applications, organize by feature:

```
src/
├── users/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── products/
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.entity.ts
├── shared/
│   ├── guards/
│   ├── filters/
│   └── decorators/
└── index.ts
```

## Benefits of Auto-Discovery

### 1. Less Boilerplate

No need to create module files or manage import/export arrays:

```typescript
// ❌ Not needed in Rikta
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// ✅ Just create your classes
@Controller('/users')
export class UserController {}

@Injectable()
export class UserService {}
```

### 2. No Circular Dependency Issues

Module-level circular dependencies are eliminated since there are no modules to create cycles between.

### 3. Simpler Refactoring

Move files anywhere in your `src` directory without updating module imports.

### 4. Faster Development

Start coding immediately without module setup:

```typescript
// Create a new feature in seconds
@Controller('/orders')
export class OrderController {
  @Autowired()
  private orderService!: OrderService;
}

@Injectable()
export class OrderService {
  // Ready to use!
}
```

## Global Providers

All providers in Rikta are effectively "global" - they can be injected anywhere without explicit exports:

```typescript
// AuthService can be injected into any controller or service
@Injectable()
export class AuthService {
  validateToken(token: string): boolean {
    // ...
  }
}

// Use it anywhere
@Controller('/protected')
export class ProtectedController {
  @Autowired()
  private auth!: AuthService;  // Just works!
}
```

## Migrating from NestJS

If you're coming from NestJS, the transition is simple:

1. **Remove all `@Module()` decorators** - They're not needed
2. **Keep your controllers and services** - Just ensure they have `@Controller()` and `@Injectable()`
3. **Remove module imports** - Replace with `autowired` paths
4. **Keep your decorators** - Most decorators work the same way

```typescript
// Before (NestJS)
@Module({
  imports: [UserModule, ProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// After (Rikta)
const app = await Rikta.create({
  port: 3000,
  autowired: ['./src']  // That's it!
});
```
