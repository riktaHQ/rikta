---
sidebar_position: 1
---

# Validation

Rikta provides powerful validation capabilities through **Zod** integration, allowing you to validate request data with full type safety.

## Introduction

Data validation is crucial for:

- **Security** - Preventing malicious input
- **Data integrity** - Ensuring correct data format
- **Type safety** - Runtime validation matching TypeScript types
- **User feedback** - Clear error messages

## Zod Integration

Rikta has first-class support for [Zod](https://zod.dev), a TypeScript-first schema validation library.

### Basic Usage

Define a schema and use it in your controller:

```typescript
import { Controller, Post, Body } from '@riktajs/core';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive().optional(),
});

type CreateUserDto = z.infer<typeof CreateUserSchema>;

@Controller('/users')
export class UserController {
  @Post()
  create(@Body(CreateUserSchema) data: CreateUserDto) {
    // data is fully typed and validated
    return { message: `Created user ${data.name}` };
  }
}
```

### Validation Decorators

Rikta provides decorators for different parts of the request:

#### Body Validation

```typescript
@Post()
create(@Body(CreateUserSchema) data: CreateUserDto) {
  // Validates request body
}
```

#### Query Parameters

```typescript
const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

@Get()
findAll(@Query(PaginationSchema) pagination: z.infer<typeof PaginationSchema>) {
  // pagination.page and pagination.limit are numbers
}
```

#### Route Parameters

```typescript
const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

@Get('/:id')
findOne(@Param(IdParamSchema) params: z.infer<typeof IdParamSchema>) {
  return this.userService.findById(params.id);
}
```

## Schema Definition

### Basic Types

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  // Strings
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  
  // Numbers
  age: z.number().int().positive(),
  salary: z.number().positive(),
  
  // Booleans
  isActive: z.boolean(),
  
  // Dates
  birthDate: z.coerce.date(),
  
  // Enums
  role: z.enum(['admin', 'user', 'guest']),
  
  // Arrays
  tags: z.array(z.string()),
  
  // Optional fields
  nickname: z.string().optional(),
  bio: z.string().nullable(),
});
```

### Custom Validation

```typescript
const PasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Nested Objects

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
  zipCode: z.string(),
});

const UserWithAddressSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema,
  shippingAddresses: z.array(AddressSchema).optional(),
});
```

### Union Types

```typescript
const NotificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email(),
  }),
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string(),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string(),
  }),
]);
```

## Error Handling

When validation fails, Rikta automatically returns a `400 Bad Request` with error details:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    },
    {
      "path": ["age"],
      "message": "Expected number, received string"
    }
  ]
}
```

### Custom Error Formatting

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  }).min(1, 'Name cannot be empty'),
  
  email: z.string().email({
    message: 'Please provide a valid email address',
  }),
});
```

## Transformation

Zod can transform data during validation:

### Coercion

```typescript
const QuerySchema = z.object({
  // Automatically converts string "123" to number 123
  page: z.coerce.number().int().positive(),
  
  // Converts string to boolean
  active: z.coerce.boolean(),
  
  // Converts string to Date
  since: z.coerce.date(),
});
```

### Custom Transforms

```typescript
const UserSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
  
  name: z.string().transform(name => name.trim()),
  
  tags: z.string().transform(str => str.split(',').map(s => s.trim())),
});
```

### Default Values

```typescript
const ConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(3000),
  debug: z.boolean().default(false),
});
```

## Reusable Schemas

Create reusable validation schemas:

```typescript
// schemas/common.ts
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

// schemas/user.ts
export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const UpdateUserSchema = CreateUserSchema.partial();
```

## DTOs with Zod

Generate TypeScript types from schemas:

```typescript
import { z } from 'zod';

// Define schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  createdAt: z.date(),
});

// Infer the type
export type User = z.infer<typeof UserSchema>;

// Create/Update DTOs
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
```

## Complete Example

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@riktajs/core';
import { z } from 'zod';

// Schemas
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).min(1).max(5),
  published: z.boolean().default(false),
});

const UpdatePostSchema = CreatePostSchema.partial();

const PostIdSchema = z.object({
  id: z.string().uuid(),
});

const PostQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  published: z.coerce.boolean().optional(),
  tag: z.string().optional(),
});

// Types
type CreatePostDto = z.infer<typeof CreatePostSchema>;
type UpdatePostDto = z.infer<typeof UpdatePostSchema>;

@Controller('/posts')
export class PostController {
  @Post()
  create(@Body(CreatePostSchema) data: CreatePostDto) {
    return this.postService.create(data);
  }

  @Get()
  findAll(@Query(PostQuerySchema) query: z.infer<typeof PostQuerySchema>) {
    return this.postService.findAll(query);
  }

  @Get('/:id')
  findOne(@Param(PostIdSchema) params: z.infer<typeof PostIdSchema>) {
    return this.postService.findById(params.id);
  }

  @Put('/:id')
  update(
    @Param(PostIdSchema) params: z.infer<typeof PostIdSchema>,
    @Body(UpdatePostSchema) data: UpdatePostDto,
  ) {
    return this.postService.update(params.id, data);
  }

  @Delete('/:id')
  delete(@Param(PostIdSchema) params: z.infer<typeof PostIdSchema>) {
    return this.postService.delete(params.id);
  }
}
```

## Best Practices

### 1. Validate Early

```typescript
// ✅ Good - validate at the boundary
@Post()
create(@Body(CreateUserSchema) data: CreateUserDto) {
  // data is already validated
  return this.userService.create(data);
}
```

### 2. Use Strict Mode

```typescript
// ✅ Good - rejects unknown properties
const StrictUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).strict();
```

### 3. Provide Clear Error Messages

```typescript
// ✅ Good - helpful messages
const UserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

### 4. Separate Create and Update Schemas

```typescript
// ✅ Good - different requirements
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const UpdateUserSchema = CreateUserSchema.partial(); // All fields optional
```
