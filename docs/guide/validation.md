# ✅ Validation

Rikta provides first-class support for **Zod** validation. You can pass Zod schemas directly to parameter decorators to validate incoming data and infer types automatically.

## Overview

Validation is performed automatically when you pass a Zod schema to decorators like `@Body`, `@Query`, `@Param`, or `@Headers`.

If validation fails, Rikta automatically throws a `BadRequestException` (400) with detailed error messages.

## Basic Usage

### Body Validation

Pass a Zod schema to the `@Body()` decorator:

```typescript
import { z } from 'zod';
import { Controller, Post, Body } from '@rikta/core';

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18).optional()
});

// Infer type (optional but recommended)
type CreateUserDto = z.infer<typeof CreateUserSchema>;

@Controller('/users')
export class UserController {
  
  @Post()
  create(@Body(CreateUserSchema) data: CreateUserDto) {
    // 'data' is fully typed and validated here!
    console.log(data.email); 
    return { id: 1, ...data };
  }
}
```

### Query Parameters

Validate and transform query strings:

```typescript
const SearchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().default(1),  // Auto-convert string to number
  limit: z.coerce.number().max(100).default(10)
});

@Get('/search')
search(@Query(SearchSchema) query: z.infer<typeof SearchSchema>) {
  // query.page is a number
  return this.service.search(query.q, query.page, query.limit);
}
```

### Route Parameters

Validate path parameters (e.g., ensure IDs are numbers or UUIDs):

```typescript
const IdSchema = z.object({
  id: z.coerce.number().int().positive()
});

@Get('/:id')
findOne(@Param(IdSchema) params: z.infer<typeof IdSchema>) {
  return this.service.findById(params.id);
}
```

## Validation Errors

When validation fails, the client receives a 400 response with details:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "code": "invalid_string",
      "validation": "email",
      "message": "Invalid email",
      "path": ["email"]
    }
  ]
}
```

## Advanced Patterns

### Reusable Schemas

You can share schemas between frontend and backend if you are using a monorepo.

```typescript
// shared/schemas.ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string()
});

// backend/controller.ts
@Post()
update(@Body(UserSchema) user: z.infer<typeof UserSchema>) { ... }
```

### Custom Error Messages

Zod allows custom error messages which Rikta will return to the client:

```typescript
const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});
```

### Transformations

Use Zod's transformation features to sanitize data:

```typescript
const TrimmedString = z.string().transform(val => val.trim());

const SignupSchema = z.object({
  username: TrimmedString,
  email: z.string().email().toLowerCase() // Auto-lowercase
});
```
