import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Rikta } from '../src/core/application';
import { Container } from '../src/core/container';
import { Registry } from '../src/core/registry';
import { resetEnvLoaded } from '../src/core/config/env-loader';
import { Controller, Get, Injectable } from '../src/core';

describe('Environment Loading Without Config Provider', () => {
  const testEnvPath = resolve(process.cwd(), '.env');
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Container.reset();
    Registry.reset();
    resetEnvLoaded();
    
    // Clean up test files
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
    
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
    
    // Restore original env
    process.env = { ...originalEnv };
    resetEnvLoaded();
  });

  it('should load .env file during bootstrap without any config provider', async () => {
    // Create a .env file
    writeFileSync(testEnvPath, 'TEST_VAR=loaded_from_env\nTEST_PORT=9999\n');

    @Injectable()
    class TestService {
      getValue() {
        return process.env.TEST_VAR;
      }
      
      getPort() {
        return process.env.TEST_PORT;
      }
    }

    @Controller('/test')
    class TestController {
      constructor(private service: TestService) {}

      @Get('/')
      async test() {
        return {
          value: this.service.getValue(),
          port: this.service.getPort(),
        };
      }
    }

    const app = await Rikta.create({
      port: 0,
      logger: false,
      silent: true,
    });

    // Verify environment variables are loaded
    expect(process.env.TEST_VAR).toBe('loaded_from_env');
    expect(process.env.TEST_PORT).toBe('9999');

    await app.close();
  });

  it('should load environment-specific .env file', async () => {
    process.env.NODE_ENV = 'production';
    const envProdPath = resolve(process.cwd(), '.env.production');

    try {
      // Create base .env
      writeFileSync(testEnvPath, 'TEST_VAR=base_value\n');
      // Create production-specific .env
      writeFileSync(envProdPath, 'TEST_VAR=production_value\nPROD_ONLY=true\n');

      @Injectable()
      class TestService {}

      const app = await Rikta.create({
        port: 0,
        logger: false,
        silent: true,
        controllers: [],
      });

      // Production value should override base value
      expect(process.env.TEST_VAR).toBe('production_value');
      expect(process.env.PROD_ONLY).toBe('true');

      await app.close();
      
      // Clean up
      if (existsSync(envProdPath)) {
        unlinkSync(envProdPath);
      }
    } finally {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
    }
  });

  it('should make env vars available to services before initialization', async () => {
    writeFileSync(testEnvPath, 'SERVICE_CONFIG=test_value\n');

    const initValues: string[] = [];

    @Injectable()
    class TestService {
      constructor() {
        // This should have access to env vars
        initValues.push(process.env.SERVICE_CONFIG || 'undefined');
      }
    }

    const app = await Rikta.create({
      port: 0,
      logger: false,
      silent: true,
      controllers: [],
    });

    // Verify env var was available during service construction
    expect(initValues).toContain('test_value');
    expect(process.env.SERVICE_CONFIG).toBe('test_value');

    await app.close();
  });

  it('should work with manual providers using env vars', async () => {
    writeFileSync(testEnvPath, 'MANUAL_VALUE=from_env_file\n');

    @Injectable()
    class ManualProvider {
      getValue() {
        return process.env.MANUAL_VALUE;
      }
    }

    const app = await Rikta.create({
      port: 0,
      logger: false,
      silent: true,
      controllers: [],
      providers: [ManualProvider],
    });

    const container = app.getContainer();
    const provider = container.resolve(ManualProvider);

    expect(provider.getValue()).toBe('from_env_file');

    await app.close();
  });

  it('should handle missing .env file gracefully', async () => {
    // Don't create any .env file
    
    @Injectable()
    class TestService {
      getVar() {
        return process.env.NON_EXISTENT_VAR;
      }
    }

    const app = await Rikta.create({
      port: 0,
      logger: false,
      silent: true,
      controllers: [],
    });

    // Should not throw, just not have the variable
    expect(process.env.NON_EXISTENT_VAR).toBeUndefined();

    await app.close();
  });
});
