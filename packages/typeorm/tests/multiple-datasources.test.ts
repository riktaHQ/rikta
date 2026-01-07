import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container } from '@riktajs/core';
import { 
  createNamedTypeOrmProvider,
  getTypeOrmProvider,
  getAllTypeOrmProviders,
  clearProviderRegistry,
} from '../src/providers/typeorm.provider.js';
import { 
  getDataSourceToken,
  getEntityManagerToken,
  clearTokenCache,
  TYPEORM_DATA_SOURCE,
} from '../src/constants.js';

describe('Multiple DataSources Support', () => {
  beforeEach(() => {
    Container.reset();
    clearProviderRegistry();
    clearTokenCache();
  });

  afterEach(async () => {
    // Clean up all providers
    const providers = getAllTypeOrmProviders();
    for (const [, provider] of providers) {
      if (provider.isConnected()) {
        await provider.onProviderDestroy();
      }
    }
    clearProviderRegistry();
    Container.reset();
  });

  describe('getDataSourceToken', () => {
    it('should return default token for "default" name', () => {
      const token = getDataSourceToken('default');
      expect(token).toBe(TYPEORM_DATA_SOURCE);
    });

    it('should return default token when no name provided', () => {
      const token = getDataSourceToken();
      expect(token).toBe(TYPEORM_DATA_SOURCE);
    });

    it('should create unique token for named connection', () => {
      const token = getDataSourceToken('analytics');
      expect(token).not.toBe(TYPEORM_DATA_SOURCE);
      expect(token.toString()).toContain('ANALYTICS');
    });

    it('should cache and return same token for same name', () => {
      const token1 = getDataSourceToken('reporting');
      const token2 = getDataSourceToken('reporting');
      expect(token1).toBe(token2);
    });

    it('should return different tokens for different names', () => {
      const token1 = getDataSourceToken('db1');
      const token2 = getDataSourceToken('db2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('getEntityManagerToken', () => {
    it('should return unique token for named connection', () => {
      const token = getEntityManagerToken('analytics');
      expect(token.toString()).toContain('ANALYTICS');
    });

    it('should cache entity manager tokens', () => {
      const token1 = getEntityManagerToken('reporting');
      const token2 = getEntityManagerToken('reporting');
      expect(token1).toBe(token2);
    });
  });

  describe('createNamedTypeOrmProvider', () => {
    it('should create a named provider', () => {
      const provider = createNamedTypeOrmProvider('test', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      expect(provider).toBeDefined();
      expect(provider.getName()).toBe('test');
    });

    it('should register provider in registry', () => {
      createNamedTypeOrmProvider('mydb', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      const retrieved = getTypeOrmProvider('mydb');
      expect(retrieved).toBeDefined();
    });

    it('should throw on duplicate name', () => {
      createNamedTypeOrmProvider('duplicate', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      expect(() => {
        createNamedTypeOrmProvider('duplicate', {
          type: 'better-sqlite3',
          database: ':memory:',
        });
      }).toThrow(/already exists/);
    });
  });

  describe('Multiple connections lifecycle', () => {
    it('should initialize multiple datasources', async () => {
      const db1 = createNamedTypeOrmProvider('db1', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      const db2 = createNamedTypeOrmProvider('db2', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await db1.onProviderInit();
      await db2.onProviderInit();

      expect(db1.isConnected()).toBe(true);
      expect(db2.isConnected()).toBe(true);

      // Verify they're registered with different tokens
      const container = Container.getInstance();
      const ds1 = container.resolve(getDataSourceToken('db1'));
      const ds2 = container.resolve(getDataSourceToken('db2'));

      expect(ds1).not.toBe(ds2);

      await db1.onProviderDestroy();
      await db2.onProviderDestroy();
    });

    it('should execute queries on different datasources', async () => {
      const mainDb = createNamedTypeOrmProvider('main', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      const analyticsDb = createNamedTypeOrmProvider('analytics', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await mainDb.onProviderInit();
      await analyticsDb.onProviderInit();

      // Execute queries on both
      const result1 = await mainDb.getDataSource().query('SELECT 1 as db');
      const result2 = await analyticsDb.getDataSource().query('SELECT 2 as db');

      expect(result1[0].db).toBe(1);
      expect(result2[0].db).toBe(2);

      await mainDb.onProviderDestroy();
      await analyticsDb.onProviderDestroy();
    });
  });

  describe('getAllTypeOrmProviders', () => {
    it('should return all registered providers', () => {
      createNamedTypeOrmProvider('a', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      createNamedTypeOrmProvider('b', {
        type: 'better-sqlite3',
        database: ':memory:',
      });

      const all = getAllTypeOrmProviders();
      expect(all.size).toBe(2);
      expect(all.has('a')).toBe(true);
      expect(all.has('b')).toBe(true);
    });
  });
});

