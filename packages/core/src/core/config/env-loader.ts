import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Global flag to track if .env files have been loaded
 * This ensures .env files are loaded only once across the entire application
 */
let envLoaded = false;

/**
 * Load .env files with environment-specific precedence
 * 
 * This function is called automatically at the start of Rikta.create(),
 * ensuring environment variables are available immediately in your main
 * script and before any config providers are initialized.
 * 
 * You can also call this function manually before Rikta.create() if needed.
 * 
 * Loading order (later files override earlier):
 * 1. .env (base configuration)
 * 2. .env.{NODE_ENV} (environment-specific)
 * 
 * @internal
 */
export function loadEnvFiles(): void {
  if (envLoaded) {
    return;
  }

  const env = process.env.NODE_ENV || 'development';
  const cwd = process.cwd();

  // Load base .env file
  const baseEnvPath = resolve(cwd, '.env');
  if (existsSync(baseEnvPath)) {
    loadEnv({ path: baseEnvPath, override: false });
  }

  // Load environment-specific .env file (overrides base)
  const envSpecificPath = resolve(cwd, `.env.${env}`);
  if (existsSync(envSpecificPath)) {
    loadEnv({ path: envSpecificPath, override: true });
  }

  envLoaded = true;
}

/**
 * Check if .env files have been loaded
 * @internal
 */
export function isEnvLoaded(): boolean {
  return envLoaded;
}

/**
 * Reset the env loaded flag (for testing)
 * @internal
 */
export function resetEnvLoaded(): void {
  envLoaded = false;
}
