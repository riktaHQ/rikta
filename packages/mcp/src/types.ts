/**
 * @riktajs/mcp - Type Definitions
 * 
 * TypeScript interfaces and types for MCP integration.
 */

// ============================================================================
// Zod Schema Type
// ============================================================================

/**
 * Generic Zod schema type - accepts any Zod schema
 */
export type ZodSchema = any;

// ============================================================================
// MCP Tool Types
// ============================================================================

/**
 * Options for @MCPTool decorator
 */
export interface MCPToolOptions {
  /**
   * Unique name for the tool
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   */
  description: string;

  /**
   * Zod schema for input validation (optional)
   * If not provided, the tool accepts no arguments
   */
  inputSchema?: ZodSchema;
}

/**
 * MCP Tool handler function signature
 */
export type MCPToolHandler<TParams = unknown> = (
  params: TParams,
  context?: MCPHandlerContext
) => Promise<MCPToolResult> | MCPToolResult;

/**
 * Result returned from an MCP tool
 */
export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

// ============================================================================
// MCP Resource Types
// ============================================================================

/**
 * Options for @MCPResource decorator
 */
export interface MCPResourceOptions {
  /**
   * URI pattern for the resource (e.g., 'file://read', 'db://users')
   */
  uriPattern: string;

  /**
   * Human-readable name for the resource
   */
  name: string;

  /**
   * Description of the resource
   */
  description: string;

  /**
   * MIME type of the resource content
   * @default 'text/plain'
   */
  mimeType?: string;

  /**
   * Zod schema for URI validation (optional)
   */
  uriSchema?: ZodSchema;
}

/**
 * MCP Resource handler function signature
 */
export type MCPResourceHandler = (
  uri: string,
  context?: MCPHandlerContext
) => Promise<MCPResourceResult> | MCPResourceResult;

/**
 * Result returned from an MCP resource
 */
export interface MCPResourceResult {
  contents: MCPResourceContent[];
}

/**
 * Content item in a resource result
 */
export interface MCPResourceContent {
  uri: string;
  text?: string;
  blob?: string;
  mimeType: string;
}

// ============================================================================
// MCP Prompt Types
// ============================================================================

/**
 * Options for @MCPPrompt decorator
 */
export interface MCPPromptOptions {
  /**
   * Unique name for the prompt
   */
  name: string;

  /**
   * Human-readable description of the prompt
   */
  description: string;

  /**
   * Arguments the prompt accepts
   */
  arguments?: MCPPromptArgument[];
}

/**
 * Prompt argument definition
 */
export interface MCPPromptArgument {
  /**
   * Argument name
   */
  name: string;

  /**
   * Argument description
   */
  description?: string;

  /**
   * Whether the argument is required
   * @default false
   */
  required?: boolean;
}

/**
 * MCP Prompt handler function signature
 */
export type MCPPromptHandler<TArgs = Record<string, string>> = (
  args: TArgs,
  context?: MCPHandlerContext
) => Promise<MCPPromptResult> | MCPPromptResult;

/**
 * Result returned from an MCP prompt
 */
export interface MCPPromptResult {
  messages: MCPPromptMessage[];
  description?: string;
}

/**
 * Message in a prompt result
 */
export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

// ============================================================================
// Shared MCP Types
// ============================================================================

/**
 * Content types supported by MCP
 */
export type MCPContent = MCPTextContent | MCPImageContent | MCPAudioContent | MCPEmbeddedResource;

/**
 * Text content
 */
export interface MCPTextContent {
  type: 'text';
  text: string;
}

/**
 * Image content
 */
export interface MCPImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

/**
 * Audio content
 */
export interface MCPAudioContent {
  type: 'audio';
  data: string;
  mimeType: string;
}

/**
 * Embedded resource content
 */
export interface MCPEmbeddedResource {
  type: 'resource';
  resource: {
    uri: string;
    text?: string;
    blob?: string;
    mimeType?: string;
  };
}

/**
 * Context passed to MCP handlers
 */
export interface MCPHandlerContext {
  /**
   * Session ID for SSE connections
   */
  sessionId?: string;

  /**
   * Send a notification to the current session
   */
  sendNotification?: (method: string, params: unknown) => void;

  /**
   * Fastify request object (when available)
   * Provides access to HTTP request details like headers, params, query, etc.
   */
  request?: any;

  /**
   * Fastify reply object (when available)
   * Provides access to HTTP response methods and properties
   */
  reply?: any;
}

// ============================================================================
// MCP Server Configuration Types
// ============================================================================

/**
 * Redis configuration for horizontal scaling
 */
export interface MCPRedisConfig {
  /**
   * Redis host
   */
  host: string;

  /**
   * Redis port
   * @default 6379
   */
  port?: number;

  /**
   * Redis password (optional)
   */
  password?: string;

  /**
   * Redis database number
   * @default 0
   */
  db?: number;
}

/**
 * Server info for MCP protocol
 */
export interface MCPServerInfo {
  /**
   * Server name
   */
  name: string;

  /**
   * Server version
   */
  version: string;
}

/**
 * MCP server capabilities
 */
export interface MCPCapabilities {
  /**
   * Enable tools capability
   */
  tools?: Record<string, unknown>;

  /**
   * Enable resources capability
   */
  resources?: Record<string, unknown>;

  /**
   * Enable prompts capability
   */
  prompts?: Record<string, unknown>;

  /**
   * Enable logging capability
   */
  logging?: Record<string, unknown>;
}

/**
 * Options for registerMCPServer function
 */
export interface MCPServerOptions {
  /**
   * Server info for MCP protocol
   */
  serverInfo?: MCPServerInfo;

  /**
   * Server capabilities
   */
  capabilities?: MCPCapabilities;

  /**
   * Instructions for AI assistants
   */
  instructions?: string;

  /**
   * Enable SSE (Server-Sent Events) transport
   * @default true
   */
  enableSSE?: boolean;

  /**
   * Redis configuration for horizontal scaling
   * When provided, enables cross-instance session management
   */
  redis?: MCPRedisConfig;

  /**
   * Custom MCP endpoint path
   * @default '/mcp'
   */
  path?: string;

  /**
   * Session TTL in seconds
   * @default 3600
   */
  sessionTTL?: number;

  /**
   * Enable heartbeat for SSE connections
   * @default true
   */
  heartbeat?: boolean;

  /**
   * Heartbeat interval in milliseconds
   * @default 30000
   */
  heartbeatInterval?: number;
}

// ============================================================================
// Internal Registry Types
// ============================================================================

/**
 * Registered MCP tool metadata
 */
export interface RegisteredMCPTool {
  name: string;
  description: string;
  inputSchema?: ZodSchema;
  handler: MCPToolHandler;
  targetClass: Function;
  methodName: string | symbol;
}

/**
 * Registered MCP resource metadata
 */
export interface RegisteredMCPResource {
  uriPattern: string;
  name: string;
  description: string;
  mimeType: string;
  uriSchema?: ZodSchema;
  handler: MCPResourceHandler;
  targetClass: Function;
  methodName: string | symbol;
}

/**
 * Registered MCP prompt metadata
 */
export interface RegisteredMCPPrompt {
  name: string;
  description: string;
  arguments?: MCPPromptArgument[];
  handler: MCPPromptHandler;
  targetClass: Function;
  methodName: string | symbol;
}

// ============================================================================
// Rikta Application Extension
// ============================================================================

/**
 * Rikta Application type (minimal interface for type safety)
 * Uses a generic server type to avoid strict FastifyInstance compatibility issues
 * between different packages that may extend FastifyInstance differently.
 */
export interface RiktaApplication {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: any;
}
