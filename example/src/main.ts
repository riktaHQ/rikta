/**
 * Rikta Framework - Example Application
 *
 * A complete example demonstrating:
 * - Auto-discovery of controllers, services, and providers
 * - Configuration management with @Provider and @ConfigProperty
 * - Dependency injection with @Autowired
 * - REST API with full CRUD operations
 *
 * No manual provider registration needed - everything is auto-discovered!
 */

import { Rikta } from '@riktajs/core';

async function bootstrap() {
  // Create the application with auto-discovery
  // All @Controller, @Injectable, @Provider classes are found automatically!
  const app = await Rikta.create({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    logger: false,
  });

  console.log('🚀 Rikta Example App Starting...');

  await app.listen();
}

bootstrap().catch(console.error);
