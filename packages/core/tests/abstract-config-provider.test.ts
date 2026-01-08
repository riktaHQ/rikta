import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { AbstractConfigProvider, ConfigValidationException } from '../src/core/config/abstract-config-provider';
import { resetEnvLoaded } from '../src/core/config/env-loader';
import { Provider } from '../src/core/decorators/provider.decorator';
import { ConfigProperty } from '../src/core/decorators/config-property.decorator';
import { registry } from '../src/core/registry';

describe('AbstractConfigProvider', () => {
  const testEnvPath = resolve(process.cwd(), '.env.test-config');
  const baseEnvPath = resolve(process.cwd(), '.env');
  
  // Store original env
  const originalEnv = { ...process.env };
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clean up config provider registrations
    registry.clearConfigProviders();
    
    // Clean up any test files
    [testEnvPath, baseEnvPath, `${baseEnvPath}.development`, `${baseEnvPath}.production`].forEach(path => {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    });
    
    // Reset env loaded flag
    resetEnvLoaded();
    
    // Clear process.env (keep only essentials)
    Object.keys(process.env).forEach(key => {
      if (!key.startsWith('npm_') && !key.startsWith('NODE_')) {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    process.env.NODE_ENV = originalNodeEnv;
    
    // Clean up test files
    [testEnvPath, baseEnvPath, `${baseEnvPath}.development`, `${baseEnvPath}.production`].forEach(path => {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    });
    
    resetEnvLoaded();
  });

  describe('Schema validation', () => {
    it('should validate and populate properties correctly', () => {
      // Set env vars directly
      process.env.TEST_PORT = '3000';
      process.env.TEST_HOST = 'localhost';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            TEST_PORT: z.coerce.number().int(),
            TEST_HOST: z.string(),
          });
        }

        @ConfigProperty()
        testPort!: number;

        @ConfigProperty()
        testHost!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.testPort).toBe(3000);
      expect(config.testHost).toBe('localhost');
    });

    it('should throw ConfigValidationException on validation failure', () => {
      process.env.INVALID_PORT = 'not-a-number';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            INVALID_PORT: z.coerce.number().int(),
          });
        }

        constructor() {
          super();
          this.populate();
        }
      }

      expect(() => new TestConfig()).toThrow(ConfigValidationException);
    });

    it('should include detailed error messages in validation exception', () => {
      process.env.REQUIRED_FIELD = '';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            REQUIRED_FIELD: z.string().min(1),
            MISSING_FIELD: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }
      }

      try {
        new TestConfig();
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Configuration validation failed');
        expect(error.message).toContain('TestConfig');
      }
    });

    it('should apply default values from schema', () => {
      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            WITH_DEFAULT: z.string().default('default-value'),
            PORT: z.coerce.number().int().default(8080),
          });
        }

        @ConfigProperty()
        withDefault!: string;

        @ConfigProperty()
        port!: number;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.withDefault).toBe('default-value');
      expect(config.port).toBe(8080);
    });

    it('should coerce types correctly', () => {
      process.env.STRING_NUMBER = '42';
      process.env.STRING_BOOLEAN = 'true';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            STRING_NUMBER: z.coerce.number(),
            STRING_BOOLEAN: z.coerce.boolean(),
          });
        }

        @ConfigProperty()
        stringNumber!: number;

        @ConfigProperty()
        stringBoolean!: boolean;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.stringNumber).toBe(42);
      expect(typeof config.stringNumber).toBe('number');
      expect(config.stringBoolean).toBe(true);
      expect(typeof config.stringBoolean).toBe('boolean');
    });
  });

  describe('.env file loading', () => {
    it('should load base .env file', () => {
      writeFileSync(baseEnvPath, 'BASE_VAR=from-base\n');

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            BASE_VAR: z.string(),
          });
        }

        @ConfigProperty()
        baseVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.baseVar).toBe('from-base');
    });

    it('should load environment-specific .env file', () => {
      process.env.NODE_ENV = 'production';
      writeFileSync(`${baseEnvPath}.production`, 'PROD_VAR=from-production\n');

      resetEnvLoaded();

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            PROD_VAR: z.string(),
          });
        }

        @ConfigProperty()
        prodVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.prodVar).toBe('from-production');
    });

    it('should prioritize environment-specific over base .env', () => {
      process.env.NODE_ENV = 'development';
      writeFileSync(baseEnvPath, 'OVERRIDE_VAR=from-base\n');
      writeFileSync(`${baseEnvPath}.development`, 'OVERRIDE_VAR=from-dev\n');

      resetEnvLoaded();

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            OVERRIDE_VAR: z.string(),
          });
        }

        @ConfigProperty()
        overrideVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.overrideVar).toBe('from-dev');
    });

    it('should handle missing .env files gracefully', () => {
      process.env.DIRECT_VAR = 'from-process-env';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            DIRECT_VAR: z.string(),
          });
        }

        @ConfigProperty()
        directVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const config = new TestConfig();
      expect(config.directVar).toBe('from-process-env');
    });
  });

  describe('Caching behavior', () => {
    it('should cache validated config', () => {
      process.env.CACHED_VAR = 'original';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            CACHED_VAR: z.string(),
          });
        }

        @ConfigProperty()
        cachedVar!: string;

        constructor() {
          super();
          this.populate();
        }

        getConfigTwice() {
          const first = this['getConfig']();
          process.env.CACHED_VAR = 'changed'; // Try to change
          const second = this['getConfig']();
          return { first, second };
        }
      }

      const config = new TestConfig();
      const { first, second } = config.getConfigTwice();
      
      // Both should return the same cached object
      expect(first).toBe(second);
      expect(first.CACHED_VAR).toBe('original');
    });

    it('should freeze cached config to prevent mutations', () => {
      process.env.FROZEN_VAR = 'value';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            FROZEN_VAR: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }

        tryToMutate() {
          const config = this['getConfig']();
          return Object.isFrozen(config);
        }
      }

      const config = new TestConfig();
      expect(config.tryToMutate()).toBe(true);
    });
  });

  describe('Helper methods', () => {
    it('getConfig should return validated config object', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = 'value2';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            VAR1: z.string(),
            VAR2: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }

        getFullConfig() {
          return this['getConfig']();
        }
      }

      const config = new TestConfig();
      const fullConfig = config.getFullConfig();
      
      expect(fullConfig).toHaveProperty('VAR1', 'value1');
      expect(fullConfig).toHaveProperty('VAR2', 'value2');
    });

    it('get should return specific config value', () => {
      process.env.SPECIFIC_KEY = 'specific-value';

      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            SPECIFIC_KEY: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }

        getValue() {
          return this['get']<string>('SPECIFIC_KEY');
        }
      }

      const config = new TestConfig();
      expect(config.getValue()).toBe('specific-value');
    });

    it('get should return undefined for non-existent key', () => {
      @Provider()
      class TestConfig extends AbstractConfigProvider {
        schema() {
          return z.object({
            EXISTING: z.string().default('exists'),
          });
        }

        constructor() {
          super();
          this.populate();
        }

        getMissing() {
          return this['get']('NON_EXISTENT');
        }
      }

      const config = new TestConfig();
      expect(config.getMissing()).toBeUndefined();
    });
  });

  describe('Multiple instances', () => {
    it('should share env loading across instances', () => {
      writeFileSync(baseEnvPath, 'SHARED_VAR=shared-value\n');

      resetEnvLoaded();

      @Provider()
      class Config1 extends AbstractConfigProvider {
        schema() {
          return z.object({
            SHARED_VAR: z.string(),
          });
        }

        @ConfigProperty()
        sharedVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      @Provider()
      class Config2 extends AbstractConfigProvider {
        schema() {
          return z.object({
            SHARED_VAR: z.string(),
          });
        }

        @ConfigProperty()
        sharedVar!: string;

        constructor() {
          super();
          this.populate();
        }
      }

      const instance1 = new Config1();
      const instance2 = new Config2();

      expect(instance1.sharedVar).toBe('shared-value');
      expect(instance2.sharedVar).toBe('shared-value');
    });

    it('should have separate caches per instance', () => {
      process.env.VAR_A = 'value-a';
      process.env.VAR_B = 'value-b';

      @Provider()
      class ConfigA extends AbstractConfigProvider {
        schema() {
          return z.object({
            VAR_A: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }
      }

      @Provider()
      class ConfigB extends AbstractConfigProvider {
        schema() {
          return z.object({
            VAR_B: z.string(),
          });
        }

        constructor() {
          super();
          this.populate();
        }
      }

      const configA = new ConfigA();
      const configB = new ConfigB();

      // Each should have its own cached config based on its schema
      expect(configA['_cache']).toBeDefined();
      expect(configB['_cache']).toBeDefined();
      expect(configA['_cache']).not.toBe(configB['_cache']);
    });
  });
});
