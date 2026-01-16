/**
 * @riktajs/mcp
 * 
 * Model Context Protocol (MCP) integration for Rikta Framework.
 * Connect AI assistants like Claude and GPT to your Rikta backend.
 * 
 * This package provides decorators and utilities to expose your services
 * as MCP tools, resources, and prompts that AI assistants can use.
 * 
 * Features:
 * - Decorator-based API (@MCPTool, @MCPResource, @MCPPrompt)
 * - Auto-discovery of MCP handlers from @Injectable classes
 * - Zod schema integration for input validation
 * - SSE (Server-Sent Events) support for real-time notifications
 * - Redis support for horizontal scaling
 * - Full TypeScript support
 * 
 * @example
 * ```typescript
 * import { Rikta, Injectable } from '@riktajs/core';
 * import { registerMCPServer, MCPTool, MCPResource } from '@riktajs/mcp';
 * import { z } from 'zod';
 * 
 * @Injectable()
 * class FileService {
 *   @MCPTool({
 *     name: 'list_files',
 *     description: 'List files in a directory',
 *     inputSchema: z.object({
 *       path: z.string().describe('Directory path')
 *     })
 *   })
 *   async listFiles(params: { path: string }) {
 *     const files = await fs.readdir(params.path);
 *     return {
 *       content: [{ type: 'text', text: files.join('\n') }]
 *     };
 *   }
 * 
 *   @MCPResource({
 *     uriPattern: 'file://read',
 *     name: 'Read File',
 *     description: 'Read file contents'
 *   })
 *   async readFile(uri: string) {
 *     const url = new URL(uri);
 *     const content = await fs.readFile(url.searchParams.get('path')!, 'utf-8');
 *     return {
 *       contents: [{ uri, text: content, mimeType: 'text/plain' }]
 *     };
 *   }
 * }
 * 
 * const app = await Rikta.create({ port: 3000 });
 * 
 * await registerMCPServer(app, {
 *   serverInfo: { name: 'file-server', version: '1.0.0' },
 *   instructions: 'A file system server for reading and listing files',
 * });
 * 
 * await app.listen();
 * // MCP available at http://localhost:3000/mcp
 * // - POST /mcp for JSON-RPC requests
 * // - GET /mcp for SSE connections
 * ```
 * 
 * @packageDocumentation
 */

// Export constants
export * from './constants.js';

// Export types
export type * from './types.js';

// Export decorators
export * from './decorators/index.js';

// Export discovery/registry
export { mcpRegistry } from './discovery/index.js';

// Export utilities
export { zodToMCPSchema, toMCPSchema, isZodSchema } from './utils/index.js';

// Export plugin
export { registerMCPServer, createMCPConfig, mcpServerPlugin } from './plugin/index.js';
