---
sidebar_position: 4
---

# Testing

Testing is a crucial part of software development. Rikta's architecture makes testing straightforward thanks to its dependency injection system.

## Introduction

Rikta applications are designed to be testable:

- **Dependency Injection** allows easy mocking
- **No complex module system** simplifies test setup
- **Type safety** catches errors at compile time

## Unit Testing

### Testing Services

Services are plain classes that can be tested in isolation:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create a user', () => {
    const user = userService.create({ name: 'John', email: 'john@example.com' });
    
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
  });

  it('should find a user by id', () => {
    const created = userService.create({ name: 'Jane', email: 'jane@example.com' });
    const found = userService.findById(created.id);
    
    expect(found).toEqual(created);
  });
});
```

### Mocking Dependencies

When a service has dependencies, mock them:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service';
import { DatabaseService } from './database.service';
import { LoggerService } from './logger.service';

describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: DatabaseService;
  let mockLogger: LoggerService;

  beforeEach(() => {
    // Create mocks
    mockDatabase = {
      query: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as DatabaseService;

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
    } as unknown as LoggerService;

    // Create service with mocked dependencies
    userService = new UserService();
    (userService as any).database = mockDatabase;
    (userService as any).logger = mockLogger;
  });

  it('should find user from database', async () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
    (mockDatabase.query as any).mockResolvedValue([mockUser]);

    const user = await userService.findById('1');

    expect(mockDatabase.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = $1',
      ['1']
    );
    expect(user).toEqual(mockUser);
  });

  it('should log when creating user', async () => {
    const userData = { name: 'Jane', email: 'jane@example.com' };
    (mockDatabase.insert as any).mockResolvedValue({ id: '2', ...userData });

    await userService.create(userData);

    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Creating user')
    );
  });
});
```

### Testing Controllers

Controllers can be unit tested similarly:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: UserService;

  beforeEach(() => {
    mockUserService = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserService;

    controller = new UserController();
    (controller as any).userService = mockUserService;
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];
      (mockUserService.findAll as any).mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockUserService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', name: 'John' };
      (mockUserService.findById as any).mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith('1');
    });
  });
});
```

## Integration Testing

### Testing with the Container

Test how components work together:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from '@riktajs/core';
import { UserService } from './user.service';
import { DatabaseService } from './database.service';

describe('UserService Integration', () => {
  beforeEach(async () => {
    // Setup test database
    const database = container.resolve(DatabaseService);
    await database.migrate();
  });

  afterEach(async () => {
    // Cleanup
    const database = container.resolve(DatabaseService);
    await database.truncate('users');
  });

  it('should create and retrieve user', async () => {
    const userService = container.resolve(UserService);
    
    const created = await userService.create({
      name: 'John',
      email: 'john@example.com',
    });
    
    const found = await userService.findById(created.id);
    
    expect(found).toEqual(created);
  });
});
```

### E2E Testing

Test the full HTTP stack:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Rikta } from '@riktajs/core';

describe('API E2E Tests', () => {
  let app: Rikta;
  let baseUrl: string;

  beforeAll(async () => {
    app = await Rikta.create({
      port: 0, // Random port
      autowired: ['./src'],
    });
    await app.listen();
    baseUrl = `http://localhost:${app.getPort()}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return empty array initially', async () => {
      const response = await fetch(`${baseUrl}/users`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('John Doe');
    });

    it('should validate input', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Invalid
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
```

## Testing Utilities

### Creating Test Fixtures

```typescript
// test/fixtures/user.fixture.ts
export function createUserFixture(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    ...overrides,
  };
}

// Usage in tests
const user = createUserFixture({ name: 'Custom Name' });
```

### Mock Factory

```typescript
// test/mocks/index.ts
import { vi } from 'vitest';

export function createMockUserService() {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((data) => ({
      id: crypto.randomUUID(),
      ...data,
    })),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(true),
  };
}

export function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
}
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    },
    setupFiles: ['./test/setup.ts'],
  },
});
```

### Test Setup File

```typescript
// test/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { container } from '@riktajs/core';

beforeAll(async () => {
  // Global test setup
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Reset mocks between tests
  vi.clearAllMocks();
});

afterAll(async () => {
  // Global cleanup
  container.clear();
});
```

## Best Practices

### 1. Test One Thing at a Time

```typescript
// ✅ Good - focused test
it('should return 404 when user not found', async () => {
  mockUserService.findById.mockResolvedValue(null);
  
  await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
});

// ❌ Avoid - testing too much
it('should handle users', async () => {
  // Creates, finds, updates, deletes... too much!
});
```

### 2. Use Descriptive Names

```typescript
// ✅ Good - clear what's being tested
describe('UserService.create', () => {
  it('should hash password before saving', async () => {});
  it('should throw if email already exists', async () => {});
  it('should emit UserCreated event', async () => {});
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update user name', async () => {
  // Arrange
  const user = createUserFixture();
  mockDatabase.query.mockResolvedValue([user]);

  // Act
  const result = await userService.update(user.id, { name: 'New Name' });

  // Assert
  expect(result.name).toBe('New Name');
  expect(mockDatabase.update).toHaveBeenCalled();
});
```

### 4. Don't Test Implementation Details

```typescript
// ✅ Good - tests behavior
it('should return user with hashed password', async () => {
  const user = await userService.create({ password: 'plain' });
  expect(user.password).not.toBe('plain');
});

// ❌ Avoid - tests implementation
it('should call bcrypt.hash with 10 rounds', async () => {
  await userService.create({ password: 'plain' });
  expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
});
```
