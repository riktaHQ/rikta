import { describe, it, expect, beforeEach } from 'vitest';
import { Provider, getConfigProviderMetadata, isConfigProvider } from '../src/core/decorators/provider.decorator';
import { CONFIG_PROVIDER_METADATA } from '../src/core/constants';
import { registry } from '../src/core/registry';
import 'reflect-metadata';

describe('@Provider Decorator', () => {
  beforeEach(() => {
    // Clean up config provider registrations between tests
    registry.clearConfigProviders();
  });

  describe('Token Generation', () => {
    it('should generate token from class name automatically', () => {
      @Provider()
      class AppConfigProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(AppConfigProvider);
      expect(metadata).toBeDefined();
      expect(metadata?.token).toBe('APP_CONFIG');
    });

    it('should generate token for class without Provider suffix', () => {
      @Provider()
      class DatabaseConfig { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(DatabaseConfig);
      expect(metadata?.token).toBe('DATABASE_CONFIG');
    });

    it('should convert camelCase to UPPER_SNAKE_CASE', () => {
      @Provider()
      class MyCustomAppConfigProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(MyCustomAppConfigProvider);
      expect(metadata?.token).toBe('MY_CUSTOM_APP_CONFIG');
    });

    it('should handle single word class names', () => {
      @Provider()
      class ConfigProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(ConfigProvider);
      expect(metadata?.token).toBe('CONFIG');
    });
  });

  describe('Custom Token', () => {
    it('should accept custom token', () => {
      @Provider('CUSTOM_TOKEN')
      class MyConfigProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(MyConfigProvider);
      expect(metadata?.token).toBe('CUSTOM_TOKEN');
    });

    it('should accept token with _CONFIG suffix', () => {
      @Provider('APP_SETTINGS_CONFIG')
      class SettingsProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(SettingsProvider);
      expect(metadata?.token).toBe('APP_SETTINGS_CONFIG');
    });
  });

  describe('Validation', () => {
    it('should throw error for non-uppercase token', () => {
      expect(() => {
        @Provider('lowercase_token')
        class BadConfigProvider { schema() { return {}; } }
      }).toThrow(/must be UPPERCASE/);
    });

    it('should throw error for empty token', () => {
      expect(() => {
        @Provider('')
        class BadConfigProvider { schema() { return {}; } }
      }).toThrow(/must be a non-empty string/);
    });

    it('should throw error for mixed case token', () => {
      expect(() => {
        @Provider('MyConfig')
        class BadConfigProvider { schema() { return {}; } }
      }).toThrow(/must be UPPERCASE/);
    });
  });

  describe('Metadata Storage', () => {
    it('should store metadata using CONFIG_PROVIDER_METADATA key', () => {
      @Provider('TEST_CONFIG')
      class TestProvider { schema() { return {}; } }

      const hasMetadata = Reflect.hasMetadata(CONFIG_PROVIDER_METADATA, TestProvider);
      expect(hasMetadata).toBe(true);
    });

    it('should store correct metadata structure', () => {
      @Provider('MY_CONFIG')
      class MyProvider { schema() { return {}; } }

      const metadata = Reflect.getMetadata(CONFIG_PROVIDER_METADATA, MyProvider);
      expect(metadata).toEqual({
        token: 'MY_CONFIG',
      });
    });
  });

  describe('Helper Functions', () => {
    it('isConfigProvider should return true for decorated class', () => {
      @Provider()
      class ConfigProvider { schema() { return {}; } }

      expect(isConfigProvider(ConfigProvider)).toBe(true);
    });

    it('isConfigProvider should return false for non-decorated class', () => {
      class RegularClass { schema() { return {}; } }

      expect(isConfigProvider(RegularClass)).toBe(false);
    });

    it('getConfigProviderMetadata should return undefined for non-decorated class', () => {
      class RegularClass { schema() { return {}; } }

      expect(getConfigProviderMetadata(RegularClass)).toBeUndefined();
    });

    it('getConfigProviderMetadata should return metadata for decorated class', () => {
      @Provider('DATA_CONFIG')
      class DataProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(DataProvider);
      expect(metadata).toBeDefined();
      expect(metadata?.token).toBe('DATA_CONFIG');
    });
  });

  describe('Multiple Decorations', () => {
    it('should handle multiple classes with different tokens', () => {
      @Provider('CONFIG_A')
      class ProviderA { schema() { return {}; } }

      @Provider('CONFIG_B')
      class ProviderB { schema() { return {}; } }

      const metadataA = getConfigProviderMetadata(ProviderA);
      const metadataB = getConfigProviderMetadata(ProviderB);

      expect(metadataA?.token).toBe('CONFIG_A');
      expect(metadataB?.token).toBe('CONFIG_B');
    });

    it('should handle multiple classes with auto-generated tokens', () => {
      @Provider()
      class AppConfigProvider { schema() { return {}; } }

      @Provider()
      class DatabaseConfigProvider { schema() { return {}; } }

      const metadataApp = getConfigProviderMetadata(AppConfigProvider);
      const metadataDb = getConfigProviderMetadata(DatabaseConfigProvider);

      expect(metadataApp?.token).toBe('APP_CONFIG');
      expect(metadataDb?.token).toBe('DATABASE_CONFIG');
    });
  });

  describe('Type Safety with as const', () => {
    it('should work with exported const tokens', () => {
      const APP_CONFIG = 'APP_CONFIG' as const;

      @Provider(APP_CONFIG)
      class AppProvider { schema() { return {}; } }

      const metadata = getConfigProviderMetadata(AppProvider);
      expect(metadata?.token).toBe(APP_CONFIG);
    });
  });
});
