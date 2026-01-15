---
sidebar_position: 2
---

# Tools

MCP Tools are functions that AI assistants can call to perform actions. They are the primary way for AI to interact with your backend services.

## The @MCPTool Decorator

Use `@MCPTool` to mark a method as an MCP tool:

```typescript
import { Injectable, z } from '@riktajs/core';
import { MCPTool} from '@riktajs/mcp';

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
    // Implementation
    return {
      content: [{
        type: 'text',
        text: `Files in ${params.path}...`,
      }],
    };
  }
}
```

## Tool Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | ✅ | Unique identifier for the tool |
| `description` | `string` | ✅ | Human-readable description |
| `inputSchema` | `ZodSchema` | ❌ | Zod schema for input validation |

## Return Format

Tools must return a `CallToolResult` object:

```typescript
interface CallToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;           // For type: 'text'
    data?: string;           // For type: 'image' (base64)
    mimeType?: string;       // For type: 'image'
    resource?: {             // For type: 'resource'
      uri: string;
      text?: string;
      blob?: string;
      mimeType?: string;
    };
  }>;
  isError?: boolean;  // Set to true if the operation failed
}
```

## Zod Schema Examples

### Basic Types

```typescript
// String with description
z.string().describe('File path to read')

// Optional with default
z.boolean().optional().default(false)

// Number with constraints
z.number().min(1).max(100).describe('Page number')

// Enum
z.enum(['asc', 'desc']).describe('Sort order')
```

### Object Schemas

```typescript
@MCPTool({
  name: 'create_user',
  description: 'Create a new user',
  inputSchema: z.object({
    name: z.string().min(1).describe('User name'),
    email: z.string().email().describe('Email address'),
    age: z.number().optional().describe('User age'),
    role: z.enum(['admin', 'user', 'guest']).default('user'),
  }),
})
async createUser(params: { name: string; email: string; age?: number; role: string }) {
  // ...
}
```

### Array Schemas

```typescript
@MCPTool({
  name: 'bulk_delete',
  description: 'Delete multiple items',
  inputSchema: z.object({
    ids: z.array(z.string()).min(1).describe('IDs to delete'),
    force: z.boolean().optional().default(false),
  }),
})
async bulkDelete(params: { ids: string[]; force?: boolean }) {
  // ...
}
```

## Complete Examples

### File Operations

```typescript
import { Injectable, z } from '@riktajs/core';
import { MCPTool } from '@riktajs/mcp';
import { promises as fs } from 'fs';

@Injectable()
class FileToolsService {
  @MCPTool({
    name: 'read_file',
    description: 'Read the contents of a file',
    inputSchema: z.object({
      path: z.string().describe('Path to the file to read'),
      encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8'),
    }),
  })
  async readFile(params: { path: string; encoding?: string }) {
    try {
      const content = await fs.readFile(params.path, params.encoding as BufferEncoding);
      return {
        content: [{
          type: 'text' as const,
          text: content,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error: ${(error as Error).message}`,
        }],
        isError: true,
      };
    }
  }

  @MCPTool({
    name: 'write_file',
    description: 'Write content to a file',
    inputSchema: z.object({
      path: z.string().describe('Path to write to'),
      content: z.string().describe('Content to write'),
      append: z.boolean().optional().default(false),
    }),
  })
  async writeFile(params: { path: string; content: string; append?: boolean }) {
    try {
      if (params.append) {
        await fs.appendFile(params.path, params.content);
      } else {
        await fs.writeFile(params.path, params.content);
      }
      return {
        content: [{
          type: 'text' as const,
          text: `Successfully wrote to ${params.path}`,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error: ${(error as Error).message}`,
        }],
        isError: true,
      };
    }
  }
}
```

## Error Handling

Always handle errors gracefully and set `isError: true`:

```typescript
@MCPTool({
  name: 'risky_operation',
  description: 'An operation that might fail',
  inputSchema: z.object({
    input: z.string(),
  }),
})
async riskyOperation(params: { input: string }) {
  try {
    const result = await this.performRiskyTask(params.input);
    return {
      content: [{
        type: 'text' as const,
        text: `Success: ${result}`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${(error as Error).message}`,
      }],
      isError: true,
    };
  }
}
```

## Best Practices

1. **Descriptive names** - Use clear, action-oriented names like `create_user`, `search_files`
2. **Helpful descriptions** - Explain what the tool does and when to use it
3. **Schema descriptions** - Add `.describe()` to all schema fields
4. **Error handling** - Always catch errors and return `isError: true`
5. **Reasonable defaults** - Use `.optional().default()` for non-essential parameters
6. **Validation** - Use Zod constraints (`.min()`, `.max()`, `.email()`, etc.)
