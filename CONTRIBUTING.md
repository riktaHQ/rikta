# Contributing to Rikta

Thank you for your interest in contributing to Rikta! We appreciate your effort and passion for improving the framework. This guide will help you get started and ensure that your contributions align with our project standards.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)
- [Questions or Issues?](#questions-or-issues)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. By participating, you agree to:

- Be respectful and considerate in all interactions
- Welcome feedback and constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members
- Report unacceptable behavior to project maintainers

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0
- **npm** >= 10.x
- **Git** installed and configured
- Basic familiarity with TypeScript
- Understanding of async/await and modern JavaScript patterns

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/rikta.git
   cd rikta
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/riktahq/rikta.git
   ```

## Development Setup

### Installation

Install dependencies for all packages in the monorepo:

```bash
npm install
```

This command:
- Installs dependencies for the root workspace
- Sets up all package workspaces (`packages/*`, `examples/*`, `benchmarks`)
- Creates symlinks between local packages
- Prepares the environment for development

### Verify Installation

Run the tests to verify everything is working:

```bash
npm run test
```

Build all packages:

```bash
npm run build
```

## Project Structure

Rikta is organized as a monorepo with the following structure:

```
rikta/
├── packages/              # Published packages
│   ├── core/             # @riktajs/core - Framework core
│   ├── cli/              # @riktajs/cli - Code generator
│   ├── mcp/              # @riktajs/mcp - Model Context Protocol
│   ├── queue/            # @riktajs/queue - Queue system
│   ├── swagger/          # @riktajs/swagger - OpenAPI/Swagger
│   └── typeorm/          # @riktajs/typeorm - TypeORM integration
├── examples/             # Example applications
│   ├── example/          # Basic example
│   └── queue-demo/       # Queue system demo
├── benchmarks/           # Performance benchmarks
├── docs/                 # Documentation source
├── website/              # Docusaurus website
└── scripts/              # Utility scripts
```

### Package Details

- **`@riktajs/core`**: The framework core with decorators, dependency injection, and request handling
- **`@riktajs/cli`**: CLI tool for scaffolding new projects
- **`@riktajs/mcp`**: Model Context Protocol server integration
- **`@riktajs/queue`**: Built-in queue system
- **`@riktajs/swagger`**: OpenAPI/Swagger documentation generator
- **`@riktajs/typeorm`**: TypeORM database integration

## Making Changes

### Create a Branch

Before making changes, create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - for new features (e.g., `feature/add-validation-middleware`)
- `fix/` - for bug fixes (e.g., `fix/null-pointer-exception`)
- `docs/` - for documentation updates (e.g., `docs/update-readme`)
- `refactor/` - for code refactoring (e.g., `refactor/optimize-di-container`)
- `perf/` - for performance improvements (e.g., `perf/reduce-memory-usage`)

### Understand the Monorepo

When working with multiple packages, remember:

1. **Dependencies between packages**: Use relative `*` version specifiers in `package.json`
2. **Building**: Run `npm run build --workspaces` or target specific packages
3. **Testing**: Run tests for affected packages with `npm run test --workspace=@riktajs/PACKAGE`
4. **Imports**: Use package names (e.g., `@riktajs/core`) when importing from other packages

## Code Standards

### TypeScript Guidelines

- **Strict Mode**: All code must be written with TypeScript strict mode enabled
- **Type Annotations**: Explicitly type function parameters and return values
- **Avoid `any`**: Use proper types instead of `any`
- **Use Enums**: Prefer enums or unions over string literals
- **No `!` Assertions**: Avoid non-null assertions; use proper type narrowing instead

Example:
```typescript
// ✅ Good
export function handleRequest(req: FastifyRequest, handler: (data: unknown) => Promise<void>): void {
  // implementation
}

// ❌ Bad
export function handleRequest(req: any, handler: any) {
  // implementation
}
```

### Code Style

- **Formatting**: Code is auto-formatted with Prettier (configured in `package.json`)
- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Line Length**: Maximum 100 characters (soft limit)

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` (for true constants)
- **Private Properties**: Prefix with `#` (ES2022 private fields)
- **Type Interfaces**: Suffix with `Interface` only when distinguishing from class of same name

```typescript
// ✅ Good
class UserService {
  #logger: Logger;
  
  async findUserById(id: string): Promise<User | null> {
    // implementation
  }
}

// ❌ Bad
class user_service {
  logger: Logger;
  
  async find_user_by_id(id: any) {
    // implementation
  }
}
```

### Imports

- Organize imports in groups: external packages, internal packages, relative imports
- Use absolute imports with package names (`@riktajs/*`) when importing from other packages
- Sort imports alphabetically within each group

```typescript
// ✅ Good
import { FastifyRequest } from "fastify";
import type { Server } from "fastify";

import { Container } from "@riktajs/core";
import { Logger } from "@riktajs/core";

import { CONFIG } from "./config.js";
import type { AppState } from "./types.js";
```

### Comments

- Write clear, concise comments explaining the *why*, not the *what*
- Use JSDoc for exported functions and classes
- Avoid obvious comments

```typescript
// ✅ Good
/**
 * Registers a controller and its routes in the framework.
 * @param controller - The controller class with decorated methods
 */
export function registerController(controller: Class): void {
  // Check cache first to avoid redundant processing
  if (cache.has(controller)) return;
  // implementation
}

// ❌ Bad
// Register the controller
registerController(MyController); // Registers MyController

// Assign value to x
const x = 5;
```

## Testing Guidelines

### Writing Tests

- **Framework**: Vitest is used for all unit and integration tests
- **Location**: Place test files adjacent to source files with `.test.ts` or `.spec.ts` suffix
- **Coverage**: Aim for >80% code coverage for new features
- **Isolation**: Each test should be independent and not rely on execution order

### Test Structure

Use the AAA (Arrange, Act, Assert) pattern:

```typescript
import { describe, it, expect } from "vitest";

describe("MyClass", () => {
  it("should perform expected behavior", () => {
    // Arrange
    const input = { id: 1, name: "Test" };
    const service = new MyService();

    // Act
    const result = service.process(input);

    // Assert
    expect(result).toEqual({ processed: true });
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific package tests
npm run test --workspace=@riktajs/core

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- New features should include tests
- Bug fixes should include regression tests
- Maintain or improve overall coverage
- View coverage reports in `coverage/` directories

## Documentation

### Code Documentation

- **JSDoc**: Document all exported functions, classes, and types
- **README**: Update package READMEs if your changes affect public APIs
- **Types**: Keep TypeScript types descriptive and well-organized

### Documentation Files

If your changes affect user-facing features:

1. **Update Guide**: Modify relevant files in `/docs/guide/` if adding a feature
2. **API Reference**: Update `/docs/api/` for public API changes
3. **Examples**: Add or update examples in `/examples/` if demonstrating new functionality
4. **Blog Post**: Consider writing a blog post in `/website/blog/` for major features

Example JSDoc:

```typescript
/**
 * Validates an object against a Zod schema.
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns A promise that resolves to the validated data
 * @throws ZodError if validation fails
 * 
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string() });
 * const result = await validate(schema, { name: "John" });
 * ```
 */
export async function validate<T>(
  schema: ZodSchema<T>,
  data: unknown,
): Promise<T> {
  // implementation
}
```

## Submitting Changes

### Commit Messages

Write clear, descriptive commit messages:

```
feat: Add new validation decorator for request bodies

- Implement @Validate() decorator
- Support Zod schema validation
- Add comprehensive test coverage
- Update documentation

Fixes #123
```

Format guidelines:
- Use imperative mood ("Add" not "Added")
- Limit first line to ~50 characters
- Include references to related issues
- Explain *what* and *why*, not *how*

Conventional Commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (no logic change)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test additions or changes
- `chore:` - Maintenance or tooling changes

### Push and Create Pull Request

1. Keep your branch updated with the latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub with:
   - Clear title summarizing the change
   - Description of what changed and why
   - Reference to related issues (e.g., `Fixes #123`)
   - Screenshot or demo link if applicable

### Pull Request Template

```markdown
## Description
Brief description of the changes.

## Related Issues
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Specific change 1
- Specific change 2

## Testing
- [ ] Tests added/updated
- [ ] Existing tests pass
- [ ] Coverage maintained

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Review Process

### What to Expect

1. **Automated Checks**: GitHub Actions will run:
   - Linting and formatting checks
   - TypeScript compilation
   - Unit and integration tests
   - Coverage analysis

2. **Code Review**: A maintainer will:
   - Review code quality and style
   - Verify tests are adequate
   - Check documentation completeness
   - Ensure alignment with project goals

3. **Feedback**: You may be asked to:
   - Make changes to code style
   - Add or improve tests
   - Update documentation
   - Discuss design decisions

4. **Approval and Merge**: Once approved:
   - The PR will be merged to `main`
   - Your changes will be included in the next release

### Performance Benchmarks

For performance-sensitive changes:

1. Run the existing benchmarks:
   ```bash
   npm run bench
   ```

2. Document any performance impact in the PR description

3. For significant changes, add new benchmarks in `/benchmarks/`

## Questions or Issues?

### Getting Help

- **Bug Reports**: Open an issue with a minimal reproduction
- **Feature Requests**: Describe the use case and expected behavior
- **Questions**: Start a discussion in GitHub Discussions
- **Security Issues**: Email security concerns privately to maintainers

### Useful Resources

- [Framework Documentation](./docs/guide)
- [API Reference](./docs/api)
- [Example Applications](./examples)
- [Architecture Overview](./docs/guide/architecture.md)

### Before Opening an Issue

1. Search existing issues and discussions
2. Check the documentation and FAQ
3. Verify the issue on the latest `main` branch
4. Provide clear reproduction steps
5. Include your Node.js version and environment details

## Recognition

Contributors are valued members of our community! We will:

- Credit major contributors in release notes
- Add significant contributors to the README
- Consider them for maintainer roles over time

Thank you for helping make Rikta better! 🚀
