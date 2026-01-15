/**
 * @MCPResource Decorator
 * 
 * Marks a method as an MCP resource provider.
 * 
 * @example
 * ```typescript
 * import { Injectable } from '@riktajs/core';
 * import { MCPResource } from '@riktajs/mcp';
 * 
 * @Injectable()
 * class FileService {
 *   @MCPResource({
 *     uriPattern: 'file://read',
 *     name: 'Read File',
 *     description: 'Read file contents by path',
 *     mimeType: 'text/plain'
 *   })
 *   async readFile(uri: string) {
 *     const url = new URL(uri);
 *     const filePath = url.searchParams.get('path');
 *     const content = await fs.readFile(filePath!, 'utf-8');
 *     return {
 *       contents: [{
 *         uri,
 *         text: content,
 *         mimeType: 'text/plain'
 *       }]
 *     };
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { MCP_RESOURCE_METADATA, MCP_HANDLERS_METADATA } from '../constants.js';
import type { MCPResourceOptions } from '../types.js';

/**
 * @MCPResource() decorator
 * 
 * Registers a method as an MCP resource provider.
 * 
 * @param options - Resource configuration options
 */
export function MCPResource(options: MCPResourceOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    // Set default mimeType if not provided
    const optionsWithDefaults: MCPResourceOptions = {
      mimeType: 'text/plain',
      ...options,
    };

    // Store resource metadata on the method
    Reflect.defineMetadata(MCP_RESOURCE_METADATA, optionsWithDefaults, target, propertyKey);

    // Add to the class's list of MCP handlers
    const handlers: Array<{ type: 'tool' | 'resource' | 'prompt'; methodName: string | symbol }> = 
      Reflect.getMetadata(MCP_HANDLERS_METADATA, target.constructor) || [];
    
    handlers.push({ type: 'resource', methodName: propertyKey });
    Reflect.defineMetadata(MCP_HANDLERS_METADATA, handlers, target.constructor);

    return descriptor;
  };
}

/**
 * Get resource metadata from a method
 * @internal
 */
export function getMCPResourceMetadata(
  target: Function,
  propertyKey: string | symbol
): MCPResourceOptions | undefined {
  return Reflect.getMetadata(MCP_RESOURCE_METADATA, target.prototype, propertyKey);
}
