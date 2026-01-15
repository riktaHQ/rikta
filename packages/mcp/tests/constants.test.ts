/**
 * Tests for MCP constants
 */
import { describe, it, expect } from 'vitest';
import {
  MCP_TOOL_METADATA,
  MCP_RESOURCE_METADATA,
  MCP_PROMPT_METADATA,
  MCP_HANDLERS_METADATA,
  MCP_SERVICE_METADATA,
  DEFAULT_MCP_PATH,
  DEFAULT_SERVER_INFO,
} from '../src/constants.js';

describe('MCP Constants', () => {
  describe('Metadata Symbols', () => {
    it('should use Symbol.for() for cross-package sharing', () => {
      // Symbols created with Symbol.for() can be retrieved from global registry
      expect(Symbol.keyFor(MCP_TOOL_METADATA)).toBe('rikta:mcp:tool');
      expect(Symbol.keyFor(MCP_RESOURCE_METADATA)).toBe('rikta:mcp:resource');
      expect(Symbol.keyFor(MCP_PROMPT_METADATA)).toBe('rikta:mcp:prompt');
      expect(Symbol.keyFor(MCP_HANDLERS_METADATA)).toBe('rikta:mcp:handlers');
      expect(Symbol.keyFor(MCP_SERVICE_METADATA)).toBe('rikta:mcp:service');
    });

    it('should have unique symbols', () => {
      const symbols = [
        MCP_TOOL_METADATA,
        MCP_RESOURCE_METADATA,
        MCP_PROMPT_METADATA,
        MCP_HANDLERS_METADATA,
        MCP_SERVICE_METADATA,
      ];

      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });
  });

  describe('Default values', () => {
    it('should have correct default MCP path', () => {
      expect(DEFAULT_MCP_PATH).toBe('/mcp');
    });

    it('should have correct default server info', () => {
      expect(DEFAULT_SERVER_INFO).toEqual({
        name: 'rikta-mcp-server',
        version: '1.0.0',
      });
    });
  });
});
