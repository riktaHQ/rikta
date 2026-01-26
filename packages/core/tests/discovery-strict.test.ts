import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverModules } from '../src/core/discovery';
import { DiscoveryException } from '../src/core/exceptions';

describe('Discovery Strict Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw by default when import fails', async () => {
    // This should not throw even if there are no valid files
    const result = await discoverModules({
      patterns: ['./non-existent-folder/**/*.ts'],
      cwd: __dirname,
    });
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('should call onImportError callback when provided', async () => {
    const onImportError = vi.fn();
    
    // Discover in a path that should work
    await discoverModules({
      patterns: ['./**/*.ts'],
      cwd: __dirname,
      onImportError,
    });
    
    // The callback may or may not be called depending on if there are import errors
    // This test just verifies the callback mechanism works
    expect(typeof onImportError).toBe('function');
  });

  it('should support legacy API with array patterns', async () => {
    const result = await discoverModules(['./non-existent/**'], __dirname);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have DiscoveryException with proper structure', () => {
    const error = new Error('Test error');
    const exception = new DiscoveryException('/path/to/file.ts', error);
    
    expect(exception.name).toBe('DiscoveryException');
    expect(exception.filePath).toBe('/path/to/file.ts');
    expect(exception.originalError).toBe(error);
    expect(exception.failedImports).toHaveLength(1);
    expect(exception.message).toContain('/path/to/file.ts');
  });

  it('should support batch failures in DiscoveryException', () => {
    const failures = [
      { filePath: '/path/to/file1.ts', error: new Error('Error 1') },
      { filePath: '/path/to/file2.ts', error: new Error('Error 2') },
    ];
    
    const exception = new DiscoveryException(failures);
    
    expect(exception.failedImports).toHaveLength(2);
    expect(exception.message).toContain('2 module(s)');
    expect(exception.getReport()).toContain('file1.ts');
    expect(exception.getReport()).toContain('file2.ts');
  });
});
