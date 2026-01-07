import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TypeOrmConfigProvider, TypeOrmConfigSchema } from '../src/config/typeorm-config.provider.js';
import { AbstractConfigProvider } from '@riktajs/core';

describe('TypeOrmConfigProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Reset the env loaded flag
    (AbstractConfigProvider as any).envLoaded = false;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Schema Validation', () => {
    it('should validate postgres configuration', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
        TYPEORM_HOST: 'localhost',
        TYPEORM_PORT: '5432',
        TYPEORM_USERNAME: 'admin',
        TYPEORM_PASSWORD: 'secret',
        TYPEORM_DATABASE: 'testdb',
      });

      expect(result.TYPEORM_TYPE).toBe('postgres');
      expect(result.TYPEORM_HOST).toBe('localhost');
      expect(result.TYPEORM_PORT).toBe(5432);
      expect(result.TYPEORM_DATABASE).toBe('testdb');
    });

    it('should validate sqlite configuration', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'sqlite',
        TYPEORM_DATABASE: ':memory:',
      });

      expect(result.TYPEORM_TYPE).toBe('sqlite');
      expect(result.TYPEORM_DATABASE).toBe(':memory:');
    });

    it('should coerce port from string to number', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'mysql',
        TYPEORM_PORT: '3306',
      });

      expect(result.TYPEORM_PORT).toBe(3306);
      expect(typeof result.TYPEORM_PORT).toBe('number');
    });

    it('should parse boolean synchronize from string', () => {
      const resultTrue = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
        TYPEORM_SYNCHRONIZE: 'true',
      });
      expect(resultTrue.TYPEORM_SYNCHRONIZE).toBe(true);

      const resultFalse = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
        TYPEORM_SYNCHRONIZE: 'false',
      });
      expect(resultFalse.TYPEORM_SYNCHRONIZE).toBe(false);
    });

    it('should parse boolean logging from "1"', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
        TYPEORM_LOGGING: '1',
      });

      expect(result.TYPEORM_LOGGING).toBe(true);
    });

    it('should default synchronize to false', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
      });

      expect(result.TYPEORM_SYNCHRONIZE).toBe(false);
    });

    it('should default name to "default"', () => {
      const result = TypeOrmConfigSchema.parse({
        TYPEORM_TYPE: 'postgres',
      });

      expect(result.TYPEORM_NAME).toBe('default');
    });

    it('should reject invalid database type', () => {
      expect(() => {
        TypeOrmConfigSchema.parse({
          TYPEORM_TYPE: 'invalid',
        });
      }).toThrow();
    });

    it('should reject port out of range', () => {
      expect(() => {
        TypeOrmConfigSchema.parse({
          TYPEORM_TYPE: 'postgres',
          TYPEORM_PORT: '99999',
        });
      }).toThrow();
    });
  });

  describe('TypeOrmConfigProvider', () => {
    it('should read configuration from environment', () => {
      process.env.TYPEORM_TYPE = 'postgres';
      process.env.TYPEORM_HOST = 'localhost';
      process.env.TYPEORM_PORT = '5432';
      process.env.TYPEORM_USERNAME = 'testuser';
      process.env.TYPEORM_PASSWORD = 'testpass';
      process.env.TYPEORM_DATABASE = 'testdb';
      process.env.TYPEORM_SYNCHRONIZE = 'true';
      process.env.TYPEORM_LOGGING = 'false';

      const config = new TypeOrmConfigProvider();

      expect(config.type).toBe('postgres');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.username).toBe('testuser');
      expect(config.password).toBe('testpass');
      expect(config.database).toBe('testdb');
      expect(config.synchronize).toBe(true);
      expect(config.logging).toBe(false);
    });

    it('should work with SQLite in-memory database', () => {
      process.env.TYPEORM_TYPE = 'sqlite';
      process.env.TYPEORM_DATABASE = ':memory:';

      const config = new TypeOrmConfigProvider();

      expect(config.type).toBe('sqlite');
      expect(config.database).toBe(':memory:');
      expect(config.isFileBased()).toBe(true);
      expect(config.isNetworkBased()).toBe(false);
    });

    it('should convert to TypeOrmConfig object', () => {
      process.env.TYPEORM_TYPE = 'mysql';
      process.env.TYPEORM_HOST = 'db.example.com';
      process.env.TYPEORM_PORT = '3306';
      process.env.TYPEORM_DATABASE = 'mydb';

      const config = new TypeOrmConfigProvider();
      const configObj = config.toConfig();

      expect(configObj).toEqual({
        type: 'mysql',
        host: 'db.example.com',
        port: 3306,
        username: undefined,
        password: undefined,
        database: 'mydb',
        synchronize: false,
        logging: false,
        name: 'default',
      });
    });

    it('should generate connection string for network databases', () => {
      process.env.TYPEORM_TYPE = 'postgres';
      process.env.TYPEORM_HOST = 'localhost';
      process.env.TYPEORM_PORT = '5432';
      process.env.TYPEORM_USERNAME = 'admin';
      process.env.TYPEORM_PASSWORD = 'secret';
      process.env.TYPEORM_DATABASE = 'myapp';

      const config = new TypeOrmConfigProvider();
      const connString = config.getConnectionString();

      expect(connString).toBe('postgres://admin:secret@localhost:5432/myapp');
    });

    it('should return database path for file-based databases', () => {
      process.env.TYPEORM_TYPE = 'sqlite';
      process.env.TYPEORM_DATABASE = '/path/to/db.sqlite';

      const config = new TypeOrmConfigProvider();
      const connString = config.getConnectionString();

      expect(connString).toBe('/path/to/db.sqlite');
    });

    it('should throw on missing required TYPEORM_TYPE', () => {
      // TYPEORM_TYPE is required
      expect(() => {
        new TypeOrmConfigProvider();
      }).toThrow();
    });
  });
});

