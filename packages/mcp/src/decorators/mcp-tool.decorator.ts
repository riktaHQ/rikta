/**
 * @MCPTool Decorator
 * 
 * Marks a method as an MCP tool that can be called by AI assistants.
 * 
 * @example
 * ```typescript
 * import { Injectable } from '@riktajs/core';
 * import { MCPTool } from '@riktajs/mcp';
 * import { z } from 'zod';
 * 
 * @Injectable()
 * class FileService {
 *   @MCPTool({
 *     name: 'read_file',
 *     description: 'Read contents of a file',
 *     inputSchema: z.object({
 *       path: z.string().describe('File path to read')
 *     })
 *   })
 *   async readFile(params: { path: string }) {
 *     const content = await fs.readFile(params.path, 'utf-8');
 *     return {
 *       content: [{ type: 'text', text: content }]
 *     };
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { MCP_TOOL_METADATA, MCP_HANDLERS_METADATA } from '../constants.js';
import type { MCPToolOptions } from '../types.js';

/**
 * @MCPTool() decorator
 * 
 * Registers a method as an MCP tool that AI assistants can invoke.
 * 
 * @param options - Tool configuration options
 */
export function MCPTool(options: MCPToolOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    // Store tool metadata on the method
    Reflect.defineMetadata(MCP_TOOL_METADATA, options, target, propertyKey);

    // Add to the class's list of MCP handlers
    const handlers: Array<{ type: 'tool' | 'resource' | 'prompt'; methodName: string | symbol }> = 
      Reflect.getMetadata(MCP_HANDLERS_METADATA, target.constructor) || [];
    
    handlers.push({ type: 'tool', methodName: propertyKey });
    Reflect.defineMetadata(MCP_HANDLERS_METADATA, handlers, target.constructor);

    return descriptor;
  };
}

/**
 * Get tool metadata from a method
 * @internal
 */
export function getMCPToolMetadata(
  target: Function,
  propertyKey: string | symbol
): MCPToolOptions | undefined {
  return Reflect.getMetadata(MCP_TOOL_METADATA, target.prototype, propertyKey);
}
