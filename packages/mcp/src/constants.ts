/**
 * @riktajs/mcp - Constants
 * 
 * Metadata keys for MCP decorators using Symbol.for() for cross-package sharing.
 */

/** Metadata key for @MCPTool decorator */
export const MCP_TOOL_METADATA = Symbol.for('rikta:mcp:tool');

/** Metadata key for @MCPResource decorator */
export const MCP_RESOURCE_METADATA = Symbol.for('rikta:mcp:resource');

/** Metadata key for @MCPPrompt decorator */
export const MCP_PROMPT_METADATA = Symbol.for('rikta:mcp:prompt');

/** Metadata key for storing all MCP handler methods on a class */
export const MCP_HANDLERS_METADATA = Symbol.for('rikta:mcp:handlers');

/** Metadata key to mark a class as an MCP service */
export const MCP_SERVICE_METADATA = Symbol.for('rikta:mcp:service');

/** Default MCP endpoint path */
export const DEFAULT_MCP_PATH = '/mcp';

/** Default server info */
export const DEFAULT_SERVER_INFO = {
  name: 'rikta-mcp-server',
  version: '1.0.0',
} as const;
