---
sidebar_position: 2
---

# Controllers

Controllers are responsible for handling incoming **requests** and returning **responses** to the client.

```
┌──────────────────────────────────────────────────────────────┐
│                          Rikta                               │
│  ┌─────────┐    ┌────────────┐    ┌───────────────────────┐  │
│  │ Request │───▶│ Controller │───▶│ Response (JSON, etc.) │  │
│  └─────────┘    └────────────┘    └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

A controller's purpose is to receive specific requests for the application. The **routing** mechanism controls which controller receives which requests. Frequently, each controller has more than one route, and different routes can perform different actions.

In order to create a basic controller, we use classes and **decorators**. Decorators associate classes with required metadata and enable Rikta to create a routing map.

## Routing

In the following example we'll use the `@Controller()` decorator, which is **required** to define a basic controller. We'll specify a route path prefix of `cats`. Using a path prefix in a `@Controller()` decorator allows us to easily group a set of related routes.

```typescript
import { Controller, Get } from '@riktajs/core';

@Controller('/cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
```

:::info Auto-Discovery
In Rikta, controllers are **automatically discovered** when you decorate them with `@Controller()`. No manual registration is required!
:::

The `@Get()` HTTP request method decorator before the `findAll()` method tells Rikta to create a handler for a specific endpoint for HTTP requests. The endpoint corresponds to the HTTP request method (GET in this case) and the route path.

What is the route path for a handler? The route path is determined by concatenating the (optional) prefix declared for the controller, and any path specified in the method's decorator. Since we've declared a prefix for every route (`cats`), and haven't added any path information in the decorator, Rikta will map `GET /cats` requests to this handler.

When a GET request is made to this endpoint, Rikta will return the string "This action returns all cats".

## Request object

Handlers often need access to the client **request** details. Rikta provides access to the [Fastify request object](https://www.fastify.io/docs/latest/Request/). We can access the request object by instructing Rikta to inject it by adding the `@Req()` decorator to the handler's signature.

```typescript
import { Controller, Get, Req } from '@riktajs/core';
import { FastifyRequest } from 'fastify';

@Controller('/cats')
export class CatsController {
  @Get()
  findAll(@Req() request: FastifyRequest): string {
    return 'This action returns all cats';
  }
}
```

Rikta provides decorators for all of the standard HTTP endpoints:

| Decorator | Description |
|-----------|-------------|
| `@Get()` | GET request |
| `@Post()` | POST request |
| `@Put()` | PUT request |
| `@Patch()` | PATCH request |
| `@Delete()` | DELETE request |
| `@Options()` | OPTIONS request |
| `@Head()` | HEAD request |

## Resources

Below is an example that makes use of several of the available decorators to create a basic controller:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from '@riktajs/core';
import { CreateCatDto, UpdateCatDto } from './dto';

@Controller('/cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll() {
    return 'This action returns all cats';
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
```

## Route wildcards

Pattern based routes are supported as well:

```typescript
@Get('/ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
```

## Status code

The response **status code** is always **200** by default, except for POST requests which use **201**. We can easily change this behavior by adding the `@HttpCode()` decorator at a handler level.

```typescript
import { HttpCode, Post } from '@riktajs/core';

@Post()
@HttpCode(201)
create() {
  return 'This action adds a new cat';
}
```

## Headers

To specify a custom response header, you can either use a `@Res()` decorator, or access the Fastify reply object directly:

```typescript
import { Get, Res } from '@riktajs/core';
import { FastifyReply } from 'fastify';

@Get()
findAll(@Res() reply: FastifyReply) {
  reply.header('X-Custom-Header', 'Custom Value');
  return 'This action returns all cats';
}
```

## Route parameters

Routes with static paths won't work when you need to accept **dynamic data** as part of the request (e.g., `GET /cats/1` to get cat with id `1`). In order to define routes with parameters, we can add route parameter **tokens** in the path of the route to capture the dynamic value at that position in the request URL.

```typescript
@Get('/:id')
findOne(@Param('id') id: string): string {
  return `This action returns a #${id} cat`;
}
```

## Request payloads

Our previous example of the POST route handler didn't accept any client params. Let's fix this by adding the `@Body()` decorator here.

First, we need to determine the **DTO** (Data Transfer Object) schema. A DTO is an object that defines how the data will be sent over the network. We recommend using **Zod schemas** for validation:

```typescript
import { z } from 'zod';

export const CreateCatSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  breed: z.string(),
});

export type CreateCatDto = z.infer<typeof CreateCatSchema>;
```

We can then use the schema in our controller:

```typescript
import { Controller, Post, Body } from '@riktajs/core';
import { CreateCatSchema, CreateCatDto } from './dto';

@Controller('/cats')
export class CatsController {
  @Post()
  create(@Body(CreateCatSchema) createCatDto: CreateCatDto) {
    return createCatDto;
  }
}
```

## Full resource sample

Below is an example that makes use of several of the available decorators to create a complete controller:

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpCode,
  Autowired 
} from '@riktajs/core';
import { z } from 'zod';

const CreateCatSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  breed: z.string(),
});

type CreateCatDto = z.infer<typeof CreateCatSchema>;

@Controller('/cats')
export class CatsController {
  @Autowired()
  private catsService!: CatsService;

  @Post()
  @HttpCode(201)
  create(@Body(CreateCatSchema) createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }

  @Get()
  findAll() {
    return this.catsService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.catsService.findOne(id);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() updateCatDto: Partial<CreateCatDto>) {
    return this.catsService.update(id, updateCatDto);
  }

  @Delete('/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.catsService.remove(id);
  }
}
```

## Getting up and running

With the above controller fully defined, Rikta still doesn't know that `CatsController` exists and as a result won't create an instance of this class.

**Just kidding!** In Rikta, controllers are **auto-discovered**. Simply decorate your class with `@Controller()` and Rikta will find it automatically. No module registration required!

```typescript
// main.ts
import { Rikta } from '@riktajs/core';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
    autowired: ['./src'] // Rikta scans this folder for controllers
  });
  
  await app.listen();
}

bootstrap();
```
