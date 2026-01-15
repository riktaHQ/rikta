/**
 * Tests for MCP Registry
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPRegistryImpl } from '../src/discovery/mcp-registry.js';
import { MCPTool } from '../src/decorators/mcp-tool.decorator.js';
import { MCPResource } from '../src/decorators/mcp-resource.decorator.js';
import { MCPPrompt } from '../src/decorators/mcp-prompt.decorator.js';
import { z } from 'zod';

describe('MCP Registry', () => {
  let registry: MCPRegistryImpl;

  beforeEach(() => {
    MCPRegistryImpl.reset();
    registry = MCPRegistryImpl.getInstance();
  });

  describe('scanClass', () => {
    it('should discover and register tools', () => {
      class FileService {
        @MCPTool({
          name: 'read_file',
          description: 'Read a file',
          inputSchema: z.object({ path: z.string() }),
        })
        async readFile(params: { path: string }) {
          return { content: [{ type: 'text' as const, text: 'content' }] };
        }
      }

      const instance = new FileService();
      registry.scanClass(FileService, instance);

      const tools = registry.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('read_file');
      expect(tools[0].description).toBe('Read a file');
      expect(tools[0].inputSchema).toBeDefined();
    });

    it('should discover and register resources', () => {
      class DataService {
        @MCPResource({
          uriPattern: 'data://users',
          name: 'Users Data',
          description: 'Get user data',
          mimeType: 'application/json',
        })
        async getUsers(uri: string) {
          return { contents: [{ uri, text: '[]', mimeType: 'application/json' }] };
        }
      }

      const instance = new DataService();
      registry.scanClass(DataService, instance);

      const resources = registry.getResources();
      expect(resources).toHaveLength(1);
      expect(resources[0].uriPattern).toBe('data://users');
      expect(resources[0].mimeType).toBe('application/json');
    });

    it('should discover and register prompts', () => {
      class PromptService {
        @MCPPrompt({
          name: 'code_review',
          description: 'Code review prompt',
          arguments: [
            { name: 'code', required: true },
          ],
        })
        async codeReview(args: { code: string }) {
          return {
            messages: [{
              role: 'user' as const,
              content: { type: 'text' as const, text: args.code },
            }],
          };
        }
      }

      const instance = new PromptService();
      registry.scanClass(PromptService, instance);

      const prompts = registry.getPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].name).toBe('code_review');
      expect(prompts[0].arguments).toHaveLength(1);
    });

    it('should skip duplicate tool names', () => {
      class Service1 {
        @MCPTool({ name: 'duplicate', description: 'First' })
        async method1() {
          return { content: [] };
        }
      }

      class Service2 {
        @MCPTool({ name: 'duplicate', description: 'Second' })
        async method2() {
          return { content: [] };
        }
      }

      registry.scanClass(Service1, new Service1());
      registry.scanClass(Service2, new Service2());

      const tools = registry.getTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].description).toBe('First');
    });

    it('should not re-scan the same class', () => {
      class TestService {
        @MCPTool({ name: 'test', description: 'Test' })
        async test() {
          return { content: [] };
        }
      }

      const instance = new TestService();
      registry.scanClass(TestService, instance);
      registry.scanClass(TestService, instance);

      const tools = registry.getTools();
      expect(tools).toHaveLength(1);
    });

    it('should bind handlers to instance', async () => {
      class ContextService {
        private prefix = 'Hello';

        @MCPTool({ name: 'greet', description: 'Greet someone' })
        async greet(params: { name: string }) {
          return {
            content: [{ type: 'text' as const, text: `${this.prefix}, ${params.name}!` }],
          };
        }
      }

      const instance = new ContextService();
      registry.scanClass(ContextService, instance);

      const tools = registry.getTools();
      const result = await tools[0].handler({ name: 'World' });
      
      expect(result.content[0]).toEqual({ type: 'text', text: 'Hello, World!' });
    });
  });

  describe('hasMCPHandlers', () => {
    it('should return true for class with MCP decorators', () => {
      class WithHandlers {
        @MCPTool({ name: 'test', description: 'Test' })
        async test() {
          return { content: [] };
        }
      }

      expect(registry.hasMCPHandlers(WithHandlers)).toBe(true);
    });

    it('should return false for class without MCP decorators', () => {
      class WithoutHandlers {
        async regularMethod() {
          return 'hello';
        }
      }

      expect(registry.hasMCPHandlers(WithoutHandlers)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct counts', () => {
      class MixedService {
        @MCPTool({ name: 'tool1', description: 'Tool 1' })
        async tool1() { return { content: [] }; }

        @MCPTool({ name: 'tool2', description: 'Tool 2' })
        async tool2() { return { content: [] }; }

        @MCPResource({ uriPattern: 'test://1', name: 'Res', description: 'Resource' })
        async resource(uri: string) { return { contents: [] }; }

        @MCPPrompt({ name: 'prompt', description: 'Prompt' })
        async prompt() { return { messages: [] }; }
      }

      registry.scanClass(MixedService, new MixedService());

      const stats = registry.getStats();
      expect(stats).toEqual({
        tools: 2,
        resources: 1,
        prompts: 1,
      });
    });
  });
});
