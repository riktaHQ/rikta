# Monorepo Migration Guide

This document describes the migration from a single-package repository to a monorepo structure.

## What Changed

### Directory Structure

**Before:**
```
rikta/
├── src/              # Framework core
├── tests/            # Core tests
├── example/          # Example app
├── benchmarks/       # Benchmarks
├── docs/             # Documentation
├── package.json      # Single package.json
└── tsconfig.json     # Single tsconfig.json
```

**After:**
```
rikta/
├── packages/
│   └── core/         # @riktajs/core - Framework core
│       ├── src/      # Source code
│       ├── tests/    # Tests
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── example/          # Example application (workspace)
├── benchmarks/       # Performance benchmarks (workspace)
├── docs/             # Documentation
├── package.json      # Root workspace config
└── .npmrc            # NPM workspace config
```

## Changes Made

### 1. Package Structure

- Moved `src/`, `tests/`, `tsconfig.json`, and `vitest.config.ts` into `packages/core/`
- Created a new `package.json` for the core package
- Updated root `package.json` to configure workspaces

### 2. Workspace Configuration

The root [package.json](package.json) now defines three workspaces:
- `packages/*` - Core packages (currently only `@riktajs/core`)
- `example` - Example application
- `benchmarks` - Performance benchmarks

### 3. Dependency Updates

#### Example
Changed from `"@riktajs/core": "file:.."` to `"@riktajs/core": "*"` to use workspace resolution.

#### Benchmarks
- Added `"@riktajs/core": "*"` dependency
- Updated all imports from `../../src/...` to `@riktajs/core`

### 4. Scripts Update

Root package.json scripts now delegate to workspaces:
```json
{
  "build": "npm run build --workspaces --if-present",
  "test": "npm run test --workspace=@riktajs/core",
  "example": "npm run dev --workspace=example",
  "bench": "npm run bench --workspace=benchmarks"
}
```

## Development Workflow

### Installation
```bash
npm install
```
This installs dependencies for all workspaces and sets up symlinks.

### Building
```bash
# Build all packages
npm run build

# Build only core
npm run build --workspace=@riktajs/core
```

### Testing
```bash
# Run core tests
npm run test

# Run with coverage
npm run test:coverage
```

### Running Example
```bash
npm run example
```

### Running Benchmarks
```bash
npm run bench
```

## Benefits

1. **Better Organization**: Clear separation between core framework and applications
2. **Easier Development**: Changes to core are immediately available to example and benchmarks
3. **Scalability**: Easy to add more packages (e.g., plugins, adapters)
4. **Consistent Dependencies**: Shared dependencies are hoisted to root
5. **Independent Versioning**: Each package can be versioned independently

## Publishing

To publish the core package:
```bash
cd packages/core
npm publish
```

The example and benchmarks are marked as `private: true` and won't be published.

## Migration Checklist

- [x] Move core code to `packages/core/`
- [x] Create package.json for core package
- [x] Configure workspaces in root package.json
- [x] Update example to use workspace dependency
- [x] Update benchmarks imports to use @riktajs/core
- [x] Update all scripts to use workspace commands
- [x] Update README.md with monorepo structure
- [x] Create .npmrc for workspace configuration
- [x] Test build process
- [x] Test example application
- [x] Verify tests run correctly

## Notes

- The test `config-example-integration.test.ts` path was updated from `../example/` to `../../example/` to account for the new directory structure
- All imports in benchmark fixtures now use `@riktajs/core` instead of relative paths
- The root tsconfig.json was removed as each workspace has its own configuration
