/**
 * @riktajs/swagger
 * 
 * Automatic OpenAPI/Swagger documentation generation for Rikta Framework.
 * 
 * This package provides decorators and utilities to automatically generate
 * OpenAPI 3.0/3.1 documentation from your Rikta controllers and routes.
 * 
 * Features:
 * - Automatic route extraction from @Controller, @Get, @Post, etc.
 * - Decorators for enriching API documentation (@ApiTags, @ApiOperation, @ApiResponse, etc.)
 * - Zod schema integration for automatic request/response type documentation
 * - Interactive Swagger UI served via Fastify
 * - Full OpenAPI 3.0/3.1 specification support
 * 
 * @example
 * ```typescript
 * import { Rikta, Controller, Get } from '@riktajs/core';
 * import { swaggerPlugin, ApiTags, ApiOperation, ApiResponse } from '@riktajs/swagger';
 * import { z } from 'zod';
 * 
 * const UserSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 * 
 * @ApiTags('Users')
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   @ApiOperation({ summary: 'List all users' })
 *   @ApiResponse({ status: 200, description: 'Array of users', schema: z.array(UserSchema) })
 *   async listUsers() {
 *     return [];
 *   }
 * }
 * 
 * const app = await Rikta.create({ port: 3000 });
 * 
 * // Register swagger plugin
 * app.server.register(swaggerPlugin, {
 *   title: 'My API',
 *   version: '1.0.0',
 *   description: 'My awesome API documentation',
 * });
 * 
 * await app.listen();
 * // Swagger UI available at http://localhost:3000/docs
 * // OpenAPI JSON available at http://localhost:3000/docs/json
 * ```
 * 
 * @packageDocumentation
 */

// Export swagger-specific constants
export * from './constants.js';

// Re-export core constants needed for metadata reading
// These are imported from @riktajs/core to avoid duplication
export {
  CONTROLLER_METADATA,
  ROUTES_METADATA,
  PARAM_METADATA,
  HTTP_CODE_METADATA,
  GUARDS_METADATA,
  ZOD_SCHEMA_METADATA,
} from '@riktajs/core';

// Export types
export type * from './types.js';

// Export decorators
export * from './decorators/index.js';

// Export OpenAPI generator
export { OpenApiGenerator } from './openapi/generator.js';

// Export Zod-to-OpenAPI utilities
export { zodToOpenApi, toOpenApiSchema, isZodSchema } from './openapi/zod-to-openapi.js';

// Export Fastify plugin
export { swaggerPlugin, registerSwagger, createSwaggerConfig } from './plugin/swagger.plugin.js';
