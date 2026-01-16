/**
 * @riktajs/mcp - MCP Plugin
 * 
 * Main plugin that integrates @platformatic/mcp with Rikta Framework.
 * Provides registerMCPServer function for easy MCP setup.
 */
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import mcpPlugin from '@platformatic/mcp';
import type { UnsafeToolHandler, UnsafeResourceHandler, UnsafePromptHandler, CallToolResult, ReadResourceResult, GetPromptResult } from '@platformatic/mcp';
import { registry } from '@riktajs/core';

import { mcpRegistry } from '../discovery/mcp-registry.js';
import { toMCPSchema } from '../utils/zod-to-schema.js';
import { DEFAULT_MCP_PATH, DEFAULT_SERVER_INFO, MCP_HANDLERS_METADATA } from '../constants.js';
import type {
  MCPServerOptions,
  RiktaApplication,
  MCPCapabilities,
} from '../types.js';

// Re-export types from @platformatic/mcp for module augmentation
import '@platformatic/mcp';

// Type for any class constructor
type Constructor<T = unknown> = new (...args: unknown[]) => T;

// Container interface (minimal for type safety)
interface Container {
  resolve<T>(target: Constructor<T>): T;
}

/**
 * Default options for MCP server
 */
const DEFAULT_OPTIONS: Required<Pick<MCPServerOptions, 'enableSSE' | 'path' | 'heartbeat' | 'heartbeatInterval' | 'sessionTTL'>> = {
  enableSSE: true,
  path: DEFAULT_MCP_PATH,
  heartbeat: true,
  heartbeatInterval: 30000,
  sessionTTL: 3600,
};

/**
 * MCP plugin implementation for Fastify
 * 
 * Registers @platformatic/mcp and auto-discovers MCP handlers from Rikta services.
 */
async function mcpPluginImpl(
  fastify: FastifyInstance,
  options: MCPServerOptions & { container?: Container }
): Promise<void> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const { serverInfo, capabilities, instructions, enableSSE, redis, container } = mergedOptions;

  // Build capabilities based on registered handlers
  const effectiveCapabilities: MCPCapabilities = capabilities || {};
  
  // We'll populate capabilities after scanning

  // Build MCP plugin options
  const mcpOptions: Record<string, unknown> = {
    serverInfo: serverInfo || DEFAULT_SERVER_INFO,
    capabilities: effectiveCapabilities,
    enableSSE,
  };

  // Add instructions if provided
  if (instructions) {
    mcpOptions.instructions = instructions;
  }

  // Add Redis config if provided
  if (redis) {
    mcpOptions.redis = {
      host: redis.host,
      port: redis.port || 6379,
      password: redis.password,
      db: redis.db || 0,
    };
  }

  // Register @platformatic/mcp plugin
  await fastify.register(mcpPlugin, mcpOptions);

  // Scan all providers from Rikta registry for MCP handlers
  if (container) {
    const providers = registry.getProviders();
    
    for (const providerClass of providers) {
      // Check if this provider has MCP handlers
      const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, providerClass);
      if (handlers && handlers.length > 0) {
        // Resolve the provider instance from the container
        const instance = container.resolve(providerClass);
        mcpRegistry.scanClass(providerClass as Constructor, instance);
      }
    }
  }

  // Register all discovered tools
  const tools = mcpRegistry.getTools();
  for (const tool of tools) {
    // Convert Zod schema to JSON Schema for MCP
    const inputSchema = toMCPSchema(tool.inputSchema);
    
    const handler: UnsafeToolHandler = async (params, context) => {
      // Enrich context with request/reply if available
      const enrichedContext = {
        ...context,
        request: (context as any)?.request,
        reply: (context as any)?.reply,
      };
      const result = await tool.handler(params, enrichedContext);
      return result as CallToolResult;
    };
    
    fastify.mcpAddTool(
      {
        name: tool.name,
        description: tool.description,
        inputSchema,
      },
      handler
    );
  }

  // Register all discovered resources
  const resources = mcpRegistry.getResources();
  for (const resource of resources) {
    // Convert Zod schema to JSON Schema for MCP (uriSchema is not needed for resources)
    
    const handler: UnsafeResourceHandler = async (uri, context) => {
      // Enrich context with request/reply if available
      const enrichedContext = {
        ...context,
        request: (context as any)?.request,
        reply: (context as any)?.reply,
      };
      const result = await resource.handler(uri, enrichedContext);
      return result as ReadResourceResult;
    };
    
    fastify.mcpAddResource(
      {
        uriPattern: resource.uriPattern,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      },
      handler
    );
  }

  // Register all discovered prompts
  const prompts = mcpRegistry.getPrompts();
  for (const prompt of prompts) {
    const handler: UnsafePromptHandler = async (name, args, context) => {
      // Enrich context with request/reply if available
      const enrichedContext = {
        ...context,
        request: (context as any)?.request,
        reply: (context as any)?.reply,
      };
      const result = await prompt.handler(args, enrichedContext);
      return result as GetPromptResult;
    };
    
    fastify.mcpAddPrompt(
      {
        name: prompt.name,
        description: prompt.description,
      },
      handler
    );
  }

  // Update capabilities based on what was registered
  if (tools.length > 0) {
    effectiveCapabilities.tools = {};
  }
  if (resources.length > 0) {
    effectiveCapabilities.resources = {};
  }
  if (prompts.length > 0) {
    effectiveCapabilities.prompts = {};
  }

  // Log registration summary
  const stats = mcpRegistry.getStats();
  if (stats.tools > 0 || stats.resources > 0 || stats.prompts > 0) {
    console.log(`\n🤖 MCP Server registered:`);
    console.log(`   📍 Endpoint: ${mergedOptions.path}`);
    if (stats.tools > 0) console.log(`   🔧 Tools: ${stats.tools}`);
    if (stats.resources > 0) console.log(`   📁 Resources: ${stats.resources}`);
    if (stats.prompts > 0) console.log(`   💬 Prompts: ${stats.prompts}`);
    if (redis) console.log(`   📡 Redis: ${redis.host}:${redis.port || 6379}`);
    console.log('');
  }
}

/**
 * Wrapped Fastify plugin with proper encapsulation
 */
export const mcpServerPlugin = fp(mcpPluginImpl, {
  name: '@riktajs/mcp',
  fastify: '5.x',
});

/**
 * Register MCP server with a Rikta application
 * 
 * This is the main entry point for integrating MCP with Rikta.
 * It decorates the Fastify instance with @platformatic/mcp and
 * auto-discovers MCP handlers from @Injectable classes.
 * 
 * @param app - Rikta application instance
 * @param options - MCP server options
 * 
 * @example
 * ```typescript
 * import { Rikta } from '@riktajs/core';
 * import { registerMCPServer } from '@riktajs/mcp';
 * 
 * const app = await Rikta.create({ port: 3000 });
 * 
 * await registerMCPServer(app, {
 *   serverInfo: { name: 'my-mcp-server', version: '1.0.0' },
 *   instructions: 'This server provides file system tools',
 *   enableSSE: true,
 * });
 * 
 * await app.listen();
 * // MCP available at http://localhost:3000/mcp
 * ```
 */
export async function registerMCPServer(
  app: RiktaApplication,
  options: MCPServerOptions = {}
): Promise<void> {
  // Get the container from the app using getContainer method
  const container = 'getContainer' in app 
    ? (app as unknown as { getContainer(): Container }).getContainer()
    : undefined;
  
  await app.server.register(mcpServerPlugin, {
    ...options,
    container,
  });
}

/**
 * Create MCP configuration object
 * 
 * Helper function to create type-safe MCP configuration.
 * 
 * @param options - MCP server options
 * @returns Validated MCP configuration
 * 
 * @example
 * ```typescript
 * const mcpConfig = createMCPConfig({
 *   serverInfo: { name: 'my-server', version: '1.0.0' },
 *   redis: { host: 'localhost', port: 6379 },
 * });
 * ```
 */
export function createMCPConfig(options: MCPServerOptions): MCPServerOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}
