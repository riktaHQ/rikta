/**
 * @riktajs/mcp - Decorators
 * 
 * Export all MCP decorators from a single entry point.
 */

// Tool decorator
export { MCPTool, getMCPToolMetadata } from './mcp-tool.decorator.js';

// Resource decorator
export { MCPResource, getMCPResourceMetadata } from './mcp-resource.decorator.js';

// Prompt decorator
export { MCPPrompt, getMCPPromptMetadata } from './mcp-prompt.decorator.js';
