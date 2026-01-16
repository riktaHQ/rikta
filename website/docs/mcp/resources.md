---
sidebar_position: 3
---

# Resources

MCP Resources expose data sources that AI assistants can read from. They are ideal for providing context, documentation, or structured data to AI.

## The @MCPResource Decorator

Use `@MCPResource` to mark a method as an MCP resource provider:

```typescript
import { Injectable } from '@riktajs/core';
import { MCPResource } from '@riktajs/mcp';

@Injectable()
class DocumentService {
  @MCPResource({
    uriPattern: 'docs://readme',
    name: 'README',
    description: 'Project README documentation',
    mimeType: 'text/markdown',
  })
  async getReadme(uri: string) {
    const content = await fs.readFile('README.md', 'utf-8');
    return {
      contents: [{
        uri,
        text: content,
        mimeType: 'text/markdown',
      }],
    };
  }
}
```

## Resource Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `uriPattern` | `string` | ✅ | URI pattern for the resource |
| `name` | `string` | ✅ | Human-readable name |
| `description` | `string` | ✅ | Description of the resource |
| `mimeType` | `string` | ❌ | MIME type of the content |

## Return Format

Resources must return a `ReadResourceResult` object:

```typescript
interface ReadResourceResult {
  contents: Array<{
    uri: string;              // The resource URI
    text?: string;            // Text content
    blob?: string;            // Base64 binary content
    mimeType?: string;        // Content MIME type
  }>;
}
```

## URI Patterns

Resources use URI patterns to identify them. The pattern can include query parameters:

```typescript
// Simple URI
@MCPResource({ uriPattern: 'config://app', ... })

// URI with query parameters
@MCPResource({ uriPattern: 'file://read', ... })
// Access via: file://read?path=/etc/hosts

// Dynamic segments  
@MCPResource({ uriPattern: 'user://profile', ... })
// Access via: user://profile?id=123
```

## HTTP Context

Resources can access the HTTP context to customize responses based on headers, authentication, or other request properties:

```typescript
import { Injectable } from '@riktajs/core';
import { MCPResource, MCPHandlerContext } from '@riktajs/mcp';

@Injectable()
class ProtectedResourceService {
  @MCPResource({
    uriPattern: 'secure://data',
    name: 'Secure Data',
    description: 'Access protected data resources',
    mimeType: 'application/json',
  })
  async getSecureData(
    uri: string,
    context?: MCPHandlerContext  // Optional context parameter
  ) {
    // Check authentication
    const token = context?.request?.headers.authorization;
    
    if (!token) {
      return {
        contents: [{
          uri,
          text: JSON.stringify({ error: 'Unauthorized' }),
          mimeType: 'application/json',
        }],
      };
    }
    
    // Parse URI parameters
    const url = new URL(uri);
    const dataId = url.searchParams.get('id');
    
    // Log access
    context?.request?.log.info({ dataId, token: token.substring(0, 10) }, 'Accessing secure data');
    
    // Set cache headers
    if (context?.reply) {
      context.reply.header('Cache-Control', 'private, max-age=300');
      context.reply.header('X-Content-Version', '1.0');
    }
    
    const data = await this.fetchSecureData(dataId, token);
    
    return {
      contents: [{
        uri,
        text: JSON.stringify(data),
        mimeType: 'application/json',
      }],
    };
  }
}
```

### Context Properties

- **`context.request`** - Access HTTP request details
  - `headers` - Read request headers
  - `query` - Get query parameters
  - `ip` - Client IP address
  - `log` - Logger instance

- **`context.reply`** - Customize HTTP response
  - `header(name, value)` - Set response headers (e.g., `Cache-Control`)
  - `status(code)` - Set HTTP status

## Complete Examples

### File Reader

```typescript
import { Injectable } from '@riktajs/core';
import { MCPResource } from '@riktajs/mcp';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
class FileResourceService {
  @MCPResource({
    uriPattern: 'file://read',
    name: 'Read File',
    description: 'Read file contents. Use ?path=<filepath> query parameter.',
    mimeType: 'text/plain',
  })
  async readFile(uri: string) {
    const url = new URL(uri);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      return {
        contents: [{
          uri,
          text: 'Error: No path specified. Use ?path=<filepath>',
          mimeType: 'text/plain',
        }],
      };
    }

    try {
      const fullPath = join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      // Detect MIME type
      let mimeType = 'text/plain';
      if (filePath.endsWith('.json')) mimeType = 'application/json';
      if (filePath.endsWith('.md')) mimeType = 'text/markdown';
      if (filePath.endsWith('.ts')) mimeType = 'text/typescript';
      if (filePath.endsWith('.js')) mimeType = 'text/javascript';

      return {
        contents: [{
          uri,
          text: content,
          mimeType,
        }],
      };
    } catch (error) {
      return {
        contents: [{
          uri,
          text: `Error reading file: ${(error as Error).message}`,
          mimeType: 'text/plain',
        }],
      };
    }
  }
}
```

## Reading Resources from AI

AI assistants read resources using the `resources/read` method:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/read",
    "params": {
      "uri": "file://read?path=package.json"
    }
  }'
```

## Best Practices

1. **Meaningful URIs** - Use descriptive URI patterns like `db://users`, `config://app`
2. **Query parameters** - Use query params for filtering and pagination
3. **Proper MIME types** - Set correct MIME types for content
4. **Error handling** - Return error messages in the content, not exceptions
5. **Security** - Never expose sensitive data like passwords or API keys
6. **Documentation** - Describe how to use query parameters in the description
