/**
 * @MCPPrompt Decorator
 * 
 * Marks a method as an MCP prompt template.
 * 
 * @example
 * ```typescript
 * import { Injectable } from '@riktajs/core';
 * import { MCPPrompt } from '@riktajs/mcp';
 * 
 * @Injectable()
 * class PromptService {
 *   @MCPPrompt({
 *     name: 'code_review',
 *     description: 'Generate a code review prompt',
 *     arguments: [
 *       { name: 'language', description: 'Programming language', required: true },
 *       { name: 'code', description: 'Code to review', required: true }
 *     ]
 *   })
 *   async codeReview(args: { language: string; code: string }) {
 *     return {
 *       messages: [
 *         {
 *           role: 'user',
 *           content: {
 *             type: 'text',
 *             text: `Please review this ${args.language} code:\n\n${args.code}`
 *           }
 *         }
 *       ]
 *     };
 *   }
 * }
 * ```
 */
import 'reflect-metadata';
import { MCP_PROMPT_METADATA, MCP_HANDLERS_METADATA } from '../constants.js';
import type { MCPPromptOptions } from '../types.js';

/**
 * @MCPPrompt() decorator
 * 
 * Registers a method as an MCP prompt template.
 * 
 * @param options - Prompt configuration options
 */
export function MCPPrompt(options: MCPPromptOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    // Store prompt metadata on the method
    Reflect.defineMetadata(MCP_PROMPT_METADATA, options, target, propertyKey);

    // Add to the class's list of MCP handlers
    const handlers: Array<{ type: 'tool' | 'resource' | 'prompt'; methodName: string | symbol }> = 
      Reflect.getMetadata(MCP_HANDLERS_METADATA, target.constructor) || [];
    
    handlers.push({ type: 'prompt', methodName: propertyKey });
    Reflect.defineMetadata(MCP_HANDLERS_METADATA, handlers, target.constructor);

    return descriptor;
  };
}

/**
 * Get prompt metadata from a method
 * @internal
 */
export function getMCPPromptMetadata(
  target: Function,
  propertyKey: string | symbol
): MCPPromptOptions | undefined {
  return Reflect.getMetadata(MCP_PROMPT_METADATA, target.prototype, propertyKey);
}
