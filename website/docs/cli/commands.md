---
sidebar_position: 2
---

# Commands

The Rikta CLI provides commands for project creation and management.

## new

Create a new Rikta project:

```bash
rikta new <project-name> [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--template` | `-t` | Project template to use (`default`, `mcp-server`) | Interactive selection |
| `--skip-install` | - | Skip npm install | `false` |

### Available Templates

| Template | Description |
|----------|-------------|
| `default` | Standard Rikta REST API with controllers and services |
| `mcp-server` | Minimal MCP server with tool, resource, and prompt examples |

When you run `rikta new` without specifying a template, the CLI will show an interactive prompt to select from available templates.

### Examples

```bash
# Create with interactive template selection
rikta new my-app

# Create with default REST API template
rikta new my-app --template default

# Create an MCP server
rikta new my-mcp-server --template mcp-server

# Skip npm install
rikta new my-app --skip-install
```

### Generated Structure (Default Template)

```
my-app/
├── src/
│   ├── controllers/
│   │   └── app.controller.ts
│   ├── services/
│   │   └── greeting.service.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### Generated Structure (MCP Server Template)

```
my-mcp/
├── src/
│   ├── mcp/
│   │   ├── index.ts
│   │   └── hello.service.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

The MCP template includes examples of:
- **@MCPTool** - A callable tool for AI assistants
- **@MCPResource** - A data resource provider
- **@MCPPrompt** - A prompt template generator

## dev

Start the development server with hot reload:

```bash
rikta dev [options]
```

Alias: `rikta serve`

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port to run the server on | `3000` |
| `--host` | `-H` | Host to bind the server to | `0.0.0.0` |
| `--no-watch` | - | Disable file watching | `false` |

### Examples

```bash
# Start with default settings
rikta dev

# Custom port
rikta dev --port 8080

# Custom host
rikta dev --host 127.0.0.1

# Disable watch mode
rikta dev --no-watch
```

## build

Build the project for production:

```bash
rikta build [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--outDir` | `-o` | Output directory | `dist` |
| `--minify` | - | Remove comments from output | `true` |
| `--sourcemap` | - | Generate source maps | `false` |
| `--clean` | - | Clean output folder before build | `true` |

### Examples

```bash
# Standard build
rikta build

# With source maps
rikta build --sourcemap

# Custom output directory
rikta build --outDir build

# Keep previous build
rikta build --no-clean
```

## Global Options

These options work with all commands:

| Option | Alias | Description |
|--------|-------|-------------|
| `--version` | `-v` | Show CLI version |
| `--verbose` | `-V` | Enable verbose output |
| `--help` | `-h` | Show help information |

### Examples

```bash
# Show version
rikta --version

# Get help for a command
rikta new --help
rikta dev --help
rikta build --help
```
