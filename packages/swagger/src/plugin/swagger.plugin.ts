import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI, { type FastifySwaggerUiOptions } from '@fastify/swagger-ui';

import { OpenApiGenerator } from '../openapi/generator.js';
import type { SwaggerConfig, OpenApiDocument, OpenApiInfoObject } from '../types.js';
import { registry } from '@riktajs/core';

// Type for any class constructor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = unknown> = new (...args: any[]) => T;

/**
 * Swagger plugin options
 */
export interface SwaggerPluginOptions {
  /**
   * Swagger/OpenAPI configuration
   */
  config?: SwaggerConfig;

  /**
   * API Info (title, version, description, etc.)
   * Can also be provided via config.info
   */
  info?: OpenApiInfoObject;

  /**
   * Controllers to document (optional - will auto-discover from registry if not provided)
   */
  controllers?: Constructor[];

  /**
   * Path to serve the OpenAPI JSON specification
   * @default '/docs/json'
   */
  jsonPath?: string;

  /**
   * Path to serve the Swagger UI
   * @default '/docs'
   */
  uiPath?: string;

  /**
   * Whether to expose the Swagger UI
   * @default true
   */
  exposeUI?: boolean;

  /**
   * Whether to expose the OpenAPI JSON specification
   * @default true
   */
  exposeSpec?: boolean;

  /**
   * Logo configuration for Swagger UI
   */
  logo?: {
    url: string;
    altText?: string;
    backgroundColor?: string;
  };

  /**
   * Swagger UI theme
   * @default 'default'
   */
  theme?: 'default' | 'dark';

  /**
   * Transform the OpenAPI specification before serving
   */
  transform?: (spec: OpenApiDocument) => OpenApiDocument | Promise<OpenApiDocument>;
}

/**
 * Default plugin options
 */
const DEFAULT_OPTIONS: Required<Pick<SwaggerPluginOptions, 'jsonPath' | 'uiPath' | 'exposeUI' | 'exposeSpec'>> = {
  jsonPath: '/docs/json',
  uiPath: '/docs',
  exposeUI: true,
  exposeSpec: true,
};

/**
 * Swagger plugin implementation
 * 
 * Registers @fastify/swagger and @fastify/swagger-ui with automatic
 * OpenAPI specification generation from Rikta controllers.
 */
async function swaggerPluginImpl(
  fastify: FastifyInstance,
  options: SwaggerPluginOptions
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { jsonPath, uiPath, exposeUI, exposeSpec, controllers, config, info, transform } = mergedOptions;

  // Build info object from options or config
  const apiInfo: OpenApiInfoObject = info || config?.info || {
    title: 'API Documentation',
    version: '1.0.0',
  };

  // Create OpenAPI generator
  const generator = new OpenApiGenerator({
    ...config,
    info: apiInfo,
  });

  // Get controllers to document
  const controllersToDocument = controllers || registry.getControllers();
  
  // Add controllers to generator
  for (const controller of controllersToDocument) {
    generator.addController(controller);
  }

  // Add security schemes from config
  if (config?.securitySchemes) {
    for (const [name, scheme] of Object.entries(config.securitySchemes)) {
      generator.addSecurityScheme(name, scheme);
    }
  }

  // Generate OpenAPI specification
  let spec = generator.generate();

  // Apply transform if provided
  if (transform) {
    spec = await transform(spec);
  }

  // Register @fastify/swagger with static specification
  await fastify.register(fastifySwagger, {
    mode: 'static',
    specification: {
      document: spec as never, // Type assertion needed due to fastify-swagger types
    },
  });

  // Register @fastify/swagger-ui if enabled
  if (exposeUI) {
    const uiOptions: FastifySwaggerUiOptions = {
      routePrefix: uiPath,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: mergedOptions.theme === 'dark' ? 'monokai' : 'agate',
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    };

    // Add logo if provided
    if (mergedOptions.logo) {
      uiOptions.logo = {
        type: 'image/png',
        content: mergedOptions.logo.url,
        href: mergedOptions.logo.url,
      };
    }

    await fastify.register(fastifySwaggerUI, uiOptions);
  }

  // Add JSON spec route if enabled
  // @fastify/swagger-ui registers routes at {uiPath}/json when UI is enabled
  // So we only add custom route if:
  // 1. UI is disabled (no swagger-ui default route exists)
  // 2. jsonPath differs from swagger-ui default path
  const defaultSwaggerUIJsonPath = `${uiPath}/json`;
  const shouldRegisterCustomJsonRoute = exposeSpec && (
    !exposeUI || 
    (jsonPath !== defaultSwaggerUIJsonPath && jsonPath !== '/docs/json')
  );
  
  if (shouldRegisterCustomJsonRoute) {
    fastify.get(jsonPath, {
      schema: {
        hide: true,
      },
    }, async () => {
      return spec;
    });
  }

  // Store spec on fastify instance for later access
  fastify.decorate('openApiSpec', spec);
}

// Declaration merging for fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    openApiSpec?: OpenApiDocument;
  }
}

/**
 * Swagger plugin for Fastify/Rikta
 * 
 * Automatically generates OpenAPI documentation from Rikta controllers
 * and serves Swagger UI for interactive API exploration.
 * 
 * @example
 * ```typescript
 * import { RiktaFactory } from '@riktajs/core';
 * import { swaggerPlugin } from '@riktajs/swagger';
 * 
 * const app = await RiktaFactory.create();
 * 
 * await app.register(swaggerPlugin, {
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *     description: 'API documentation for My App',
 *   },
 *   config: {
 *     servers: [
 *       { url: 'http://localhost:3000', description: 'Development' },
 *     ],
 *   },
 * });
 * 
 * // Swagger UI available at /docs
 * // OpenAPI JSON at /docs/json
 * ```
 */
export const swaggerPlugin: FastifyPluginAsync<SwaggerPluginOptions> = fp(
  swaggerPluginImpl,
  {
    fastify: '>=4.0.0',
    name: '@riktajs/swagger',
    dependencies: [],
  }
);

/**
 * Register swagger plugin with a Rikta application
 * 
 * Helper function that provides a simpler API for registering the plugin.
 * 
 * @param app - Fastify instance
 * @param options - Swagger plugin options
 * 
 * @example
 * ```typescript
 * import { RiktaFactory } from '@riktajs/core';
 * import { registerSwagger } from '@riktajs/swagger';
 * 
 * const app = await RiktaFactory.create();
 * 
 * await registerSwagger(app, {
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 * });
 * ```
 */
export async function registerSwagger(
  app: FastifyInstance,
  options: SwaggerPluginOptions = {}
): Promise<void> {
  await app.register(swaggerPlugin, options);
}

/**
 * Create a standalone Swagger configuration for manual use
 * 
 * Use this when you need more control over the Swagger setup,
 * or when integrating with an existing Fastify application.
 * 
 * @param options - Swagger plugin options
 * @returns Object containing swagger and swaggerUI options and specification
 * 
 * @example
 * ```typescript
 * import fastify from 'fastify';
 * import fastifySwagger from '@fastify/swagger';
 * import fastifySwaggerUI from '@fastify/swagger-ui';
 * import { createSwaggerConfig } from '@riktajs/swagger';
 * 
 * const app = fastify();
 * const { swaggerOptions, swaggerUIOptions, specification } = createSwaggerConfig({
 *   info: { title: 'My API', version: '1.0.0' },
 *   controllers: [UserController, ProductController],
 * });
 * 
 * await app.register(fastifySwagger, swaggerOptions);
 * await app.register(fastifySwaggerUI, swaggerUIOptions);
 * ```
 */
export function createSwaggerConfig(options: SwaggerPluginOptions = {}): {
  swaggerOptions: {
    mode: 'static';
    specification: { document: OpenApiDocument };
  };
  swaggerUIOptions: FastifySwaggerUiOptions;
  specification: OpenApiDocument;
} {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { uiPath, controllers, config, info } = mergedOptions;

  // Build info object
  const apiInfo: OpenApiInfoObject = info || config?.info || {
    title: 'API Documentation',
    version: '1.0.0',
  };

  // Create generator
  const generator = new OpenApiGenerator({
    ...config,
    info: apiInfo,
  });

  // Add controllers
  const controllersToDocument = controllers || registry.getControllers();
  for (const controller of controllersToDocument) {
    generator.addController(controller);
  }

  // Add security schemes
  if (config?.securitySchemes) {
    for (const [name, scheme] of Object.entries(config.securitySchemes)) {
      generator.addSecurityScheme(name, scheme);
    }
  }

  const specification = generator.generate();

  return {
    swaggerOptions: {
      mode: 'static',
      specification: { document: specification },
    },
    swaggerUIOptions: {
      routePrefix: uiPath,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
      },
    },
    specification,
  };
}
