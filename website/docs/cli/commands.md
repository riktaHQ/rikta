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
| `--template` | `-t` | Project template to use | `default` |
| `--skip-install` | - | Skip npm install | `false` |

### Examples

```bash
# Create project in current directory
rikta new my-app

# Skip npm install
rikta new my-app --skip-install

# Use specific template
rikta new my-app --template default
```

### Generated Structure

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
