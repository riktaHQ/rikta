---
sidebar_position: 1
---

# First Steps

## Introduction

Rikta is a framework for building efficient, scalable Node.js server-side applications. It uses progressive TypeScript and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

Under the hood, Rikta uses **Fastify**, providing maximum performance and low overhead.

## Philosophy

Rikta was born from the frustration with complex module systems in existing frameworks. We believe that:

- **Zero configuration should be the default** - No more `imports: []`, `exports: []`, or `providers: []` arrays
- **Performance matters** - Built on Fastify for maximum speed
- **Type safety is essential** - First-class TypeScript support with Zod validation
- **Developer experience is key** - Simple, intuitive APIs

## Prerequisites

Please make sure that [Node.js](https://nodejs.org) (version >= 18) is installed on your operating system.

## Setup

Setting up a new project is quite simple with the **Rikta CLI**. With [npm](https://www.npmjs.com/) installed, you can create a new Rikta project with the following commands:

```bash
$ npx @riktajs/cli new my-app
$ cd my-app
$ npm run dev
```

:::tip
To create a project with strict TypeScript options, pass the `--strict` flag to the `new` command.
:::

The `my-app` directory will be created, node modules installed, and several core files populated:

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
└── README.md
```

Here's a brief overview of those core files:

| File | Description |
|------|-------------|
| `src/index.ts` | The entry file of the application which uses `Rikta.create()` to bootstrap the app |
| `src/controllers/app.controller.ts` | A basic controller with a sample route |
| `src/services/greeting.service.ts` | A basic service with a single method |

The `index.ts` includes an async function that will **bootstrap** our application:

```typescript
import { Rikta } from '@riktajs/core';

async function bootstrap() {
  const app = await Rikta.create({
    port: 3000,
    autowired: ['./src']
  });
  
  await app.listen();
}

bootstrap();
```

To create a Rikta application instance, we use the `Rikta` class. The `create()` method returns an application object that provides methods to control the server lifecycle.

## Running the application

Once the installation is complete, you can run the following command at your OS command prompt to start the application:

```bash
$ npm run dev
```

This command starts the app with hot-reload enabled. Once the server is running, open your browser and navigate to `http://localhost:3000/`. You should see the `Hello World!` message.

To watch for changes in your files, run:

```bash
$ npm run dev
```

This will compile your sources and automatically re-run the server after any code change.

## Linting and formatting

The CLI provides a best-effort to scaffold a reliable development workflow at scale. Thus, a generated Rikta project comes with both a code **linter** and **formatter** preinstalled.

## Next steps

Now that your project is set up and running, explore these core concepts:

- [Controllers](/docs/overview/controllers) - Learn how to handle HTTP requests
- [Providers](/docs/overview/providers) - Understand dependency injection
- [Modules](/docs/overview/modules) - Learn about auto-discovery (Rikta's approach)
