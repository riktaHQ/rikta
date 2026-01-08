---
sidebar_position: 2
---

# Commands

The Rikta CLI provides commands for project creation and management.

## new

Create a new Rikta project:

```bash
rikta new <project-name> [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--directory` | `-d` | Directory to create project in | Current directory |
| `--skip-install` | - | Skip npm install | `false` |
| `--skip-git` | - | Skip git initialization | `false` |
| `--package-manager` | `-p` | Package manager (npm, yarn, pnpm) | `npm` |

### Examples

```bash
# Create project in current directory
rikta new my-app

# Create in specific directory
rikta new my-app -d ./projects

# Skip npm install
rikta new my-app --skip-install

# Use yarn
rikta new my-app -p yarn

# Use pnpm
rikta new my-app -p pnpm
```

### Generated Structure

```
my-app/
├── src/
│   ├── controllers/
│   │   └── app.controller.ts
│   ├── services/
│   │   └── greeting.service.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## generate

Generate components for your project:

```bash
rikta generate <type> <name> [options]
```

Alias: `rikta g`

### Types

| Type | Alias | Description |
|------|-------|-------------|
| `controller` | `co` | Generate a controller |
| `service` | `s` | Generate a service |
| `provider` | `p` | Generate a configuration provider |
| `guard` | `gu` | Generate a guard |
| `resource` | `res` | Generate controller + service |

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--path` | `-p` | Custom path for generated file |
| `--flat` | - | Generate without creating folder |

### Examples

#### Generate Controller

```bash
rikta generate controller user
# or
rikta g co user
```

Creates `src/controllers/user.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@riktajs/core';

@Controller('/user')
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() data: any) {
    return data;
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() data: any) {
    return { id, ...data };
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return { id };
  }
}
```

#### Generate Service

```bash
rikta generate service user
# or
rikta g s user
```

Creates `src/services/user.service.ts`:

```typescript
import { Injectable } from '@riktajs/core';

@Injectable()
export class UserService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }

  create(data: any) {
    return data;
  }

  update(id: string, data: any) {
    return { id, ...data };
  }

  remove(id: string) {
    return { id };
  }
}
```

#### Generate Resource

```bash
rikta generate resource user
# or
rikta g res user
```

Creates both controller and service with proper wiring:

`src/controllers/user.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Autowired } from '@riktajs/core';
import { UserService } from '../services/user.service';

@Controller('/users')
export class UserController {
  @Autowired()
  private userService!: UserService;

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.userService.update(id, data);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

#### Generate Guard

```bash
rikta generate guard auth
# or
rikta g gu auth
```

Creates `src/guards/auth.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@riktajs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.getRequest();
    // Implement your authentication logic here
    return true;
  }
}
```

#### Generate Provider

```bash
rikta generate provider database-config
# or
rikta g p database-config
```

Creates `src/providers/database-config.provider.ts`:

```typescript
import { AbstractConfigProvider, ConfigProperty, Injectable } from '@riktajs/core';

@Injectable()
export class DatabaseConfigProvider extends AbstractConfigProvider<DatabaseConfig> {
  @ConfigProperty({ env: 'DB_HOST' })
  host: string = 'localhost';

  @ConfigProperty({ env: 'DB_PORT', transform: Number })
  port: number = 5432;

  @ConfigProperty({ env: 'DB_DATABASE' })
  database: string = '';

  @ConfigProperty({ env: 'DB_USERNAME' })
  username: string = '';

  @ConfigProperty({ env: 'DB_PASSWORD' })
  password: string = '';
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}
```

## build

Build the project for production:

```bash
rikta build [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--watch` | Watch for changes |
| `--clean` | Clean output directory before build |

### Example

```bash
# Standard build
rikta build

# Watch mode
rikta build --watch

# Clean build
rikta build --clean
```

## start

Start the application:

```bash
rikta start [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--watch` | Start in watch mode (development) |
| `--port` | Override port |

### Example

```bash
# Production mode
rikta start

# Development mode
rikta start --watch

# Custom port
rikta start --port 8080
```

## dev

Start in development mode (alias for `start --watch`):

```bash
rikta dev
```

## info

Display information about the current project:

```bash
rikta info
```

Output:

```
Rikta CLI Information:
─────────────────────────
CLI Version: 1.0.0
Core Version: 1.0.0
Node Version: 20.10.0
Package Manager: npm
Project Root: /path/to/my-app
```

## help

Display help for any command:

```bash
rikta --help
rikta new --help
rikta generate --help
```
