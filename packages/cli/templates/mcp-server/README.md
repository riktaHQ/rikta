# My Rikta MCP Server

A minimal Model Context Protocol (MCP) server built with [Rikta](https://github.com/riktahq/rikta).

This template provides a starting point for creating AI-connected services that can be used by AI assistants like Claude, GPT, and others that support the MCP protocol.

## Features

- 🤖 **MCP Tool** - A hello world tool that AI assistants can invoke
- 📦 **MCP Resource** - A hello world resource that provides data to AI assistants
- 💬 **MCP Prompt** - A hello world prompt template for AI interactions

## Getting Started

### Setup

```bash
# Copy environment variables
cp .env.example .env

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

This will start the MCP server with hot reload at `http://localhost:3000`.

The MCP endpoint is available at:
- `POST http://localhost:3000/mcp` - JSON-RPC endpoint
- `GET http://localhost:3000/mcp` - SSE endpoint for real-time updates

### Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Start Production Server

```bash
npm start
```

## Project Structure

```
├── src/
│   ├── mcp/                    # MCP components
│   │   ├── index.ts            # MCP exports
│   │   └── hello.service.ts    # Hello world MCP service
│   └── index.ts                # Application entry point
├── dist/                       # Compiled output
├── .env.example                # Environment variables template
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore patterns
├── package.json                # Project configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## MCP Components

### Tool: `say_hello`

A simple tool that greets the user.

```typescript
// Example invocation by AI assistant
await tool.call('say_hello', { name: 'World' });
// Returns: "Hello, World! Welcome to Rikta MCP."
```

### Resource: `hello://greeting`

A resource that provides a greeting message.

```typescript
// Example resource read
await resource.read('hello://greeting');
// Returns greeting data
```

### Prompt: `hello_prompt`

A prompt template for generating greetings.

```typescript
// Example prompt usage
await prompt.get('hello_prompt', { name: 'User' });
// Returns formatted prompt messages
```

## Connecting AI Assistants

### Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### VS Code with Copilot

Configure in your VS Code settings or MCP configuration file.

## Learn More

- [Rikta Documentation](https://riktajs.dev)
- [Rikta MCP Package](https://www.npmjs.com/package/@riktajs/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## License

MIT
