/**
 * @riktajs/mcp - MCP Registry
 * 
 * Discovers and stores MCP handlers (tools, resources, prompts) from decorated classes.
 * Works with Rikta's registry to auto-discover @Injectable classes with MCP decorators.
 */
import 'reflect-metadata';
import {
  MCP_TOOL_METADATA,
  MCP_RESOURCE_METADATA,
  MCP_PROMPT_METADATA,
  MCP_HANDLERS_METADATA,
} from '../constants.js';
import type {
  MCPToolOptions,
  MCPResourceOptions,
  MCPPromptOptions,
  RegisteredMCPTool,
  RegisteredMCPResource,
  RegisteredMCPPrompt,
} from '../types.js';

// Type for any class constructor
type Constructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * Handler type stored in class metadata
 */
interface HandlerEntry {
  type: 'tool' | 'resource' | 'prompt';
  methodName: string | symbol;
}

/**
 * MCP Registry
 * 
 * Central registry for all discovered MCP handlers.
 * Scans @Injectable classes for @MCPTool, @MCPResource, @MCPPrompt decorators.
 */
class MCPRegistryImpl {
  private static instance: MCPRegistryImpl;
  
  /** Registered tools */
  private tools: RegisteredMCPTool[] = [];
  
  /** Registered resources */
  private resources: RegisteredMCPResource[] = [];
  
  /** Registered prompts */
  private prompts: RegisteredMCPPrompt[] = [];

  /** Classes that have been scanned */
  private scannedClasses = new Set<Function>();

  private constructor() {}

  static getInstance(): MCPRegistryImpl {
    if (!MCPRegistryImpl.instance) {
      MCPRegistryImpl.instance = new MCPRegistryImpl();
    }
    return MCPRegistryImpl.instance;
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    const newInstance = new MCPRegistryImpl();
    MCPRegistryImpl.instance = newInstance;
  }

  /**
   * Scan a class for MCP decorators and register found handlers
   * 
   * @param target - Class constructor to scan
   * @param instance - Instance of the class (for binding handlers)
   */
  scanClass(target: Constructor, instance: unknown): void {
    // Skip if already scanned
    if (this.scannedClasses.has(target)) {
      return;
    }
    this.scannedClasses.add(target);

    // Get all MCP handlers registered on this class
    const handlers: HandlerEntry[] = Reflect.getMetadata(MCP_HANDLERS_METADATA, target) || [];

    for (const handler of handlers) {
      const { type, methodName } = handler;

      switch (type) {
        case 'tool':
          this.registerTool(target, instance, methodName);
          break;
        case 'resource':
          this.registerResource(target, instance, methodName);
          break;
        case 'prompt':
          this.registerPrompt(target, instance, methodName);
          break;
      }
    }
  }

  /**
   * Register a tool from a class method
   */
  private registerTool(target: Constructor, instance: unknown, methodName: string | symbol): void {
    const metadata: MCPToolOptions | undefined = Reflect.getMetadata(
      MCP_TOOL_METADATA,
      target.prototype,
      methodName
    );

    if (!metadata) {
      return;
    }

    // Check for duplicate tool names
    if (this.tools.some(t => t.name === metadata.name)) {
      console.warn(`[MCP] Duplicate tool name: ${metadata.name}. Skipping.`);
      return;
    }

    const handler = (instance as Record<string | symbol, Function>)[methodName];
    
    this.tools.push({
      name: metadata.name,
      description: metadata.description,
      inputSchema: metadata.inputSchema,
      handler: handler.bind(instance),
      targetClass: target,
      methodName,
    });
  }

  /**
   * Register a resource from a class method
   */
  private registerResource(target: Constructor, instance: unknown, methodName: string | symbol): void {
    const metadata: MCPResourceOptions | undefined = Reflect.getMetadata(
      MCP_RESOURCE_METADATA,
      target.prototype,
      methodName
    );

    if (!metadata) {
      return;
    }

    // Check for duplicate resource patterns
    if (this.resources.some(r => r.uriPattern === metadata.uriPattern)) {
      console.warn(`[MCP] Duplicate resource URI pattern: ${metadata.uriPattern}. Skipping.`);
      return;
    }

    const handler = (instance as Record<string | symbol, Function>)[methodName];
    
    this.resources.push({
      uriPattern: metadata.uriPattern,
      name: metadata.name,
      description: metadata.description,
      mimeType: metadata.mimeType || 'text/plain',
      uriSchema: metadata.uriSchema,
      handler: handler.bind(instance),
      targetClass: target,
      methodName,
    });
  }

  /**
   * Register a prompt from a class method
   */
  private registerPrompt(target: Constructor, instance: unknown, methodName: string | symbol): void {
    const metadata: MCPPromptOptions | undefined = Reflect.getMetadata(
      MCP_PROMPT_METADATA,
      target.prototype,
      methodName
    );

    if (!metadata) {
      return;
    }

    // Check for duplicate prompt names
    if (this.prompts.some(p => p.name === metadata.name)) {
      console.warn(`[MCP] Duplicate prompt name: ${metadata.name}. Skipping.`);
      return;
    }

    const handler = (instance as Record<string | symbol, Function>)[methodName];
    
    this.prompts.push({
      name: metadata.name,
      description: metadata.description,
      arguments: metadata.arguments,
      handler: handler.bind(instance),
      targetClass: target,
      methodName,
    });
  }

  /**
   * Get all registered tools
   */
  getTools(): RegisteredMCPTool[] {
    return [...this.tools];
  }

  /**
   * Get all registered resources
   */
  getResources(): RegisteredMCPResource[] {
    return [...this.resources];
  }

  /**
   * Get all registered prompts
   */
  getPrompts(): RegisteredMCPPrompt[] {
    return [...this.prompts];
  }

  /**
   * Check if a class has MCP handlers
   */
  hasMCPHandlers(target: Constructor): boolean {
    const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, target);
    return Array.isArray(handlers) && handlers.length > 0;
  }

  /**
   * Get count of all registered handlers
   */
  getStats(): { tools: number; resources: number; prompts: number } {
    return {
      tools: this.tools.length,
      resources: this.resources.length,
      prompts: this.prompts.length,
    };
  }
}

/** Singleton instance of MCP registry */
export const mcpRegistry = MCPRegistryImpl.getInstance();

/** Export class for testing */
export { MCPRegistryImpl };
