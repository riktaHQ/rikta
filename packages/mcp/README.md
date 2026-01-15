# @riktajs/mcp

Model Context Protocol (MCP) integration for Rikta Framework. Connect AI assistants like Claude and GPT to your Rikta backend with decorator-based APIs.

## Features

- 🤖 **Decorator-based API** - Define MCP tools, resources, and prompts with `@MCPTool`, `@MCPResource`, `@MCPPrompt`
- 🔍 **Auto-discovery** - Automatically discovers MCP handlers from `@Injectable` classes
- 📝 **Zod Integration** - Full Zod support for input schema validation (consistent with Rikta ecosystem)
- 📡 **SSE Support** - Server-Sent Events for real-time notifications
- 🔄 **Horizontal Scaling** - Redis support for multi-instance deployments
- 🔒 **Type Safe** - Complete TypeScript definitions

## Installation

```bash
npm install @riktajs/mcp zod
```

> **Note**: `@platformatic/mcp` is included as a dependency and will be installed automatically.

## Quick Start

```typescript
import { Rikta, Injectable } from '@riktajs/core';
import { registerMCPServer, MCPTool, MCPResource, z } from '@riktajs/mcp';
import { promises as fs } from 'fs';

@Injectable()
class FileService {
  @MCPTool({
    name: 'list_files',
    description: 'List files in a directory',
    inputSchema: z.object({
      path: z.string().describe('Directory path to list'),
      showHidden: z.boolean().optional().default(false),
    }),
  })
  async listFiles(params: { path: string; showHidden?: boolean }) {
    const files = await fs.readdir(params.path);
    const filtered = params.showHidden 
      ? files 
      : files.filter(f => !f.startsWith('.'));
    
    return {
      content: [{
        type: 'text',
        text: filtered.join('\n'),
      }],
    };
  }

  @MCPResource({
    uriPattern: 'file://read',
    name: 'Read File',
    description: 'Read file contents by path',
    mimeType: 'text/plain',
  })
  async readFile(uri: string) {
    const url = new URL(uri);
    const filePath = url.searchParams.get('path')!;
    const content = await fs.readFile(filePath, 'utf-8');
    
    return {
      contents: [{
        uri,
        text: content,
        mimeType: 'text/plain',
      }],
    };
  }
}

// Bootstrap application
const app = await Rikta.create({ port: 3000 });

// Register MCP server
await registerMCPServer(app, {
  serverInfo: { name: 'file-server', version: '1.0.0' },
  instructions: 'A file system server for reading and listing files',
  enableSSE: true,
});

await app.listen();
// MCP available at http://localhost:3000/mcp
```

## Decorators

### @MCPTool

Marks a method as an MCP tool that AI assistants can invoke.

```typescript
@Injectable()
class CalculatorService {
  @MCPTool({
    name: 'calculate',
    description: 'Perform a calculation',
    inputSchema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number(),
    }),
  })
  async calculate(params: { operation: string; a: number; b: number }) {
    let result: number;
    switch (params.operation) {
      case 'add': result = params.a + params.b; break;
      case 'subtract': result = params.a - params.b; break;
      case 'multiply': result = params.a * params.b; break;
      case 'divide': result = params.a / params.b; break;
      default: throw new Error('Unknown operation');
    }
    
    return {
      content: [{ type: 'text', text: `Result: ${result}` }],
    };
  }
}
```

### @MCPResource

Marks a method as an MCP resource provider.

```typescript
@Injectable()
class DatabaseService {
  @MCPResource({
    uriPattern: 'db://users',
    name: 'Users Database',
    description: 'Query users from the database',
    mimeType: 'application/json',
  })
  async getUsers(uri: string) {
    const url = new URL(uri);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const users = await this.userRepository.find({ take: limit });
    
    return {
      contents: [{
        uri,
        text: JSON.stringify(users, null, 2),
        mimeType: 'application/json',
      }],
    };
  }
}
```

### @MCPPrompt

Marks a method as an MCP prompt template.

```typescript
@Injectable()
class PromptService {
  @MCPPrompt({
    name: 'code_review',
    description: 'Generate a code review prompt',
    arguments: [
      { name: 'language', description: 'Programming language', required: true },
      { name: 'code', description: 'Code to review', required: true },
      { name: 'focus', description: 'Specific areas to focus on' },
    ],
  })
  async codeReview(args: { language: string; code: string; focus?: string }) {
    const focusArea = args.focus ? `\nFocus on: ${args.focus}` : '';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review this ${args.language} code:${focusArea}\n\n\`\`\`${args.language}\n${args.code}\n\`\`\``,
          },
        },
      ],
    };
  }
}
```

## Zod Schema Examples

The package uses Zod for schema validation, consistent with the rest of the Rikta ecosystem:

```typescript
import { z } from '@riktajs/mcp'; // Re-exported for convenience

// Simple string with description
const pathSchema = z.string().describe('File path to read');

// Object with optional fields
const optionsSchema = z.object({
  path: z.string().describe('Directory path'),
  recursive: z.boolean().optional().default(false),
  maxDepth: z.number().min(1).max(10).optional(),
});

// Enum for fixed values
const operationSchema = z.enum(['read', 'write', 'delete']);

// Array of objects
const filesSchema = z.array(z.object({
  name: z.string(),
  size: z.number(),
}));
```

## Configuration

### Basic Configuration

```typescript
await registerMCPServer(app, {
  serverInfo: {
    name: 'my-mcp-server',
    version: '1.0.0',
  },
  instructions: 'Instructions for AI assistants on how to use this server',
  enableSSE: true,
  path: '/mcp', // Custom endpoint path
});
```

### Redis Configuration (Horizontal Scaling)

```typescript
await registerMCPServer(app, {
  serverInfo: { name: 'scaled-server', version: '1.0.0' },
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password', // optional
    db: 0, // optional
  },
  sessionTTL: 3600, // Session TTL in seconds
});
```

### Full Configuration Options

```typescript
interface MCPServerOptions {
  // Server identification
  serverInfo?: { name: string; version: string };
  
  // Instructions for AI assistants
  instructions?: string;
  
  // Enable SSE (Server-Sent Events)
  enableSSE?: boolean; // default: true
  
  // Custom endpoint path
  path?: string; // default: '/mcp'
  
  // Redis for horizontal scaling
  redis?: {
    host: string;
    port?: number; // default: 6379
    password?: string;
    db?: number; // default: 0
  };
  
  // Session configuration
  sessionTTL?: number; // default: 3600
  
  // Heartbeat configuration
  heartbeat?: boolean; // default: true
  heartbeatInterval?: number; // default: 30000ms
}
```

## Endpoints

After registering the MCP server, the following endpoints are available:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/mcp` | JSON-RPC endpoint for MCP requests |
| GET | `/mcp` | SSE endpoint for real-time notifications |

## Testing with MCP Inspector

You can test your MCP server using the official MCP Inspector:

```bash
# Start your server
npm run dev

# In another terminal, run the inspector
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

## Testing with curl

```bash
# Initialize connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "clientInfo": { "name": "test", "version": "1.0.0" },
      "capabilities": {}
    }
  }'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_files",
      "arguments": { "path": "." }
    }
  }'

# Read a resource
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "resources/read",
    "params": {
      "uri": "file://read?path=package.json"
    }
  }'
```

## API Reference

### registerMCPServer

Main function to register MCP server with a Rikta application.

```typescript
async function registerMCPServer(
  app: RiktaApplication,
  options?: MCPServerOptions
): Promise<void>
```

### mcpRegistry

Access the MCP registry for advanced use cases.

```typescript
import { mcpRegistry } from '@riktajs/mcp';

// Get all registered handlers
const tools = mcpRegistry.getTools();
const resources = mcpRegistry.getResources();
const prompts = mcpRegistry.getPrompts();

// Get stats
const stats = mcpRegistry.getStats();
// { tools: 5, resources: 2, prompts: 3 }
```

### Zod Re-exports

For convenience, `z` from Zod is re-exported from this package:

```typescript
import { z } from '@riktajs/mcp';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});
```

### Utility Functions

```typescript
import { zodToMCPSchema, isZodSchema } from '@riktajs/mcp';

// Check if a value is a Zod schema
if (isZodSchema(schema)) {
  // Convert to JSON Schema for MCP
  const jsonSchema = zodToMCPSchema(schema);
}
```

## License

MIT
