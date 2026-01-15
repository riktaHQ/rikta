/**
 * Tests for MCP decorators
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPTool, getMCPToolMetadata } from '../src/decorators/mcp-tool.decorator.js';
import { MCPResource, getMCPResourceMetadata } from '../src/decorators/mcp-resource.decorator.js';
import { MCPPrompt, getMCPPromptMetadata } from '../src/decorators/mcp-prompt.decorator.js';
import { MCP_HANDLERS_METADATA } from '../src/constants.js';
import { z } from 'zod';

describe('MCP Decorators', () => {
  describe('@MCPTool', () => {
    it('should store tool metadata on method', () => {
      class TestService {
        @MCPTool({
          name: 'test_tool',
          description: 'A test tool',
        })
        async testMethod() {
          return { content: [{ type: 'text', text: 'test' }] };
        }
      }

      const metadata = getMCPToolMetadata(TestService, 'testMethod');
      
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('test_tool');
      expect(metadata?.description).toBe('A test tool');
    });

    it('should store tool metadata with Zod schema', () => {
      const inputSchema = z.object({
        path: z.string(),
        encoding: z.string().optional(),
      });

      class TestService {
        @MCPTool({
          name: 'read_file',
          description: 'Read a file',
          inputSchema,
        })
        async readFile(params: { path: string; encoding?: string }) {
          return { content: [{ type: 'text', text: 'content' }] };
        }
      }

      const metadata = getMCPToolMetadata(TestService, 'readFile');
      
      expect(metadata).toBeDefined();
      expect(metadata?.inputSchema).toBe(inputSchema);
    });

    it('should register handler in class metadata', () => {
      class TestService {
        @MCPTool({
          name: 'tool1',
          description: 'Tool 1',
        })
        async tool1() {
          return { content: [] };
        }

        @MCPTool({
          name: 'tool2',
          description: 'Tool 2',
        })
        async tool2() {
          return { content: [] };
        }
      }

      const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, TestService);
      
      expect(handlers).toHaveLength(2);
      expect(handlers[0]).toEqual({ type: 'tool', methodName: 'tool1' });
      expect(handlers[1]).toEqual({ type: 'tool', methodName: 'tool2' });
    });
  });

  describe('@MCPResource', () => {
    it('should store resource metadata on method', () => {
      class TestService {
        @MCPResource({
          uriPattern: 'file://read',
          name: 'Read File',
          description: 'Read a file by path',
        })
        async readFile(uri: string) {
          return { contents: [{ uri, text: 'content', mimeType: 'text/plain' }] };
        }
      }

      const metadata = getMCPResourceMetadata(TestService, 'readFile');
      
      expect(metadata).toBeDefined();
      expect(metadata?.uriPattern).toBe('file://read');
      expect(metadata?.name).toBe('Read File');
      expect(metadata?.mimeType).toBe('text/plain'); // default value
    });

    it('should use custom mimeType when provided', () => {
      class TestService {
        @MCPResource({
          uriPattern: 'data://json',
          name: 'JSON Data',
          description: 'Get JSON data',
          mimeType: 'application/json',
        })
        async getData(uri: string) {
          return { contents: [{ uri, text: '{}', mimeType: 'application/json' }] };
        }
      }

      const metadata = getMCPResourceMetadata(TestService, 'getData');
      
      expect(metadata?.mimeType).toBe('application/json');
    });

    it('should register handler in class metadata', () => {
      class TestService {
        @MCPResource({
          uriPattern: 'file://read',
          name: 'Read',
          description: 'Read file',
        })
        async read(uri: string) {
          return { contents: [] };
        }
      }

      const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, TestService);
      
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toEqual({ type: 'resource', methodName: 'read' });
    });
  });

  describe('@MCPPrompt', () => {
    it('should store prompt metadata on method', () => {
      class TestService {
        @MCPPrompt({
          name: 'code_review',
          description: 'Generate a code review prompt',
          arguments: [
            { name: 'language', description: 'Programming language', required: true },
            { name: 'code', description: 'Code to review', required: true },
          ],
        })
        async codeReview(args: { language: string; code: string }) {
          return {
            messages: [
              {
                role: 'user' as const,
                content: { type: 'text' as const, text: `Review this ${args.language} code` },
              },
            ],
          };
        }
      }

      const metadata = getMCPPromptMetadata(TestService, 'codeReview');
      
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('code_review');
      expect(metadata?.arguments).toHaveLength(2);
      expect(metadata?.arguments?.[0].name).toBe('language');
      expect(metadata?.arguments?.[0].required).toBe(true);
    });

    it('should work without arguments', () => {
      class TestService {
        @MCPPrompt({
          name: 'greeting',
          description: 'A simple greeting prompt',
        })
        async greeting() {
          return {
            messages: [
              {
                role: 'user' as const,
                content: { type: 'text' as const, text: 'Hello!' },
              },
            ],
          };
        }
      }

      const metadata = getMCPPromptMetadata(TestService, 'greeting');
      
      expect(metadata).toBeDefined();
      expect(metadata?.arguments).toBeUndefined();
    });

    it('should register handler in class metadata', () => {
      class TestService {
        @MCPPrompt({
          name: 'prompt1',
          description: 'Prompt 1',
        })
        async prompt1() {
          return { messages: [] };
        }
      }

      const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, TestService);
      
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toEqual({ type: 'prompt', methodName: 'prompt1' });
    });
  });

  describe('Mixed decorators', () => {
    it('should support multiple decorator types on same class', () => {
      class TestService {
        @MCPTool({
          name: 'tool',
          description: 'A tool',
        })
        async tool() {
          return { content: [] };
        }

        @MCPResource({
          uriPattern: 'data://test',
          name: 'Resource',
          description: 'A resource',
        })
        async resource(uri: string) {
          return { contents: [] };
        }

        @MCPPrompt({
          name: 'prompt',
          description: 'A prompt',
        })
        async prompt() {
          return { messages: [] };
        }
      }

      const handlers = Reflect.getMetadata(MCP_HANDLERS_METADATA, TestService);
      
      expect(handlers).toHaveLength(3);
      expect(handlers.map((h: { type: string }) => h.type)).toEqual(['tool', 'resource', 'prompt']);
    });
  });
});
