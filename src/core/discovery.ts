import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

/**
 * Default patterns to exclude from discovery
 */
const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/*.d.ts',
];

/**
 * Get the caller's directory from the stack trace
 * This is used to resolve relative paths from the caller's context,
 * not from where rikta-core is installed (e.g., node_modules)
 */
function getCallerDirectoryFromStack(): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  
  try {
    const err = new Error();
    let callerFile: string | undefined;
    
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = err.stack as unknown as NodeJS.CallSite[];
    
    // Find the first file that's not part of rikta-core
    for (const site of stack) {
      const filename = site.getFileName();
      if (filename && 
          !filename.includes('discovery.ts') && 
          !filename.includes('discovery.js') &&
          !filename.includes('application.ts') &&
          !filename.includes('application.js') &&
          !filename.includes('rikta-core')) {
        callerFile = filename;
        break;
      }
    }
    
    if (callerFile) {
      // Handle file:// URLs (ESM) and regular paths
      const filePath = callerFile.startsWith('file://') 
        ? new URL(callerFile).pathname 
        : callerFile;
      return path.dirname(filePath);
    }
    
    return process.cwd();
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
}

/**
 * Regex patterns to detect Rikta decorators
 */
const DECORATOR_PATTERNS = [
  /@Controller\s*\(/,    // @Controller() or @Controller('/path')
  /@Injectable\s*\(/,    // @Injectable() or @Injectable({ scope: 'singleton' })
  /@Provider\s*\(/,      // @Provider(TOKEN)
];

/**
 * Check if a file contains Rikta decorators (@Controller, @Injectable, or @Provider)
 */
async function containsRiktaDecorators(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return DECORATOR_PATTERNS.some(pattern => pattern.test(content));
  } catch {
    return false;
  }
}

/**
 * Discover and import modules matching the given patterns
 * 
 * Only imports files that contain @Controller, @Injectable, or @Provider decorators.
 * 
 * @param patterns - Glob patterns or directory paths to search for files (default: ['./**'])
 * @param cwd - Base directory for pattern matching. If not provided, it will be
 *              automatically resolved from the caller's location (useful when rikta-core
 *              is used as an external library from node_modules)
 * @returns Promise resolving to list of imported files
 * 
 * @example
 * ```typescript
 * // Scan specific directories (relative paths resolved from caller's location)
 * await discoverModules(['./src/controllers', './src/services']);
 * 
 * // Scan with absolute path
 * await discoverModules(['/absolute/path/to/src']);
 * 
 * // Scan everything (default)
 * await discoverModules();
 * ```
 */
export async function discoverModules(
  patterns: string[] = ['./**/*.{ts,js}'],
  cwd?: string
): Promise<string[]> {
  // If no cwd provided, resolve from caller's directory
  // This is crucial when rikta-core is installed in node_modules
  const baseDir = cwd ?? getCallerDirectoryFromStack();
  
  // Resolve the base directory to absolute if needed
  const absoluteBaseDir = path.isAbsolute(baseDir) 
    ? baseDir 
    : path.resolve(process.cwd(), baseDir);

  // Normalize patterns to include file extensions if not present
  const normalizedPatterns = patterns.map(pattern => {
    // Resolve the pattern if it's an absolute path
    // For absolute paths, we need to make them relative to cwd for fast-glob
    let normalizedPattern = pattern;
    
    if (path.isAbsolute(pattern)) {
      // Convert absolute path to relative from baseDir
      normalizedPattern = path.relative(absoluteBaseDir, pattern);
      if (!normalizedPattern.startsWith('.')) {
        normalizedPattern = './' + normalizedPattern;
      }
    }
    
    // If pattern already has extension, use as-is
    if (/\.\w+$/.test(normalizedPattern) || normalizedPattern.endsWith('*')) {
      return normalizedPattern;
    }
    // Add file extension pattern
    return normalizedPattern.endsWith('/') 
      ? `${normalizedPattern}**/*.{ts,js}` 
      : `${normalizedPattern}/**/*.{ts,js}`;
  });

  // Find all matching files
  const files = await fg(normalizedPatterns, {
    cwd: absoluteBaseDir,
    absolute: true,
    ignore: DEFAULT_IGNORE_PATTERNS,
    onlyFiles: true,
  });

  // Filter files that contain Rikta decorators
  const riktaFiles: string[] = [];
  
  for (const file of files) {
    if (await containsRiktaDecorators(file)) {
      riktaFiles.push(file);
    }
  }

  // Import only files with decorators
  const importedFiles: string[] = [];
  
  for (const file of riktaFiles) {
    try {
      // Convert to proper import path
      const importPath = file.replace(/\.ts$/, '');
      await import(importPath);
      importedFiles.push(file);
    } catch (error) {
      // Log but don't fail - some files might have import errors
      if (process.env.DEBUG) {
        console.warn(`[Rikta] Failed to import ${file}:`, error);
      }
    }
  }

  return importedFiles;
}

/**
 * Get the caller's directory (useful for relative pattern resolution)
 * 
 * This function walks the stack trace to find the first file that is NOT
 * part of rikta-core, making it work correctly when rikta-core is installed
 * as an external library in node_modules.
 * 
 * @returns The directory of the calling file, or process.cwd() if it cannot be determined
 */
export function getCallerDirectory(): string {
  return getCallerDirectoryFromStack();
}
