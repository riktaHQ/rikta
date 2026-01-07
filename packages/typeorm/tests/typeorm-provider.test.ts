import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { Container } from '@riktajs/core';
import { 
  TypeOrmProvider, 
  createTypeOrmProvider 
} from '../src/providers/typeorm.provider.js';
import { 
  TYPEORM_DATA_SOURCE, 
  TYPEORM_ENTITY_MANAGER 
} from '../src/constants.js';

describe('TypeOrmProvider', () => {
  let container: Container;

  beforeEach(() => {
    // Reset container before each test
    Container.reset();
    container = Container.getInstance();
  });

  afterEach(async () => {
    // Clean up any open connections
    Container.reset();
  });

  describe('createTypeOrmProvider', () => {
    it('should create provider with DataSourceOptions', () => {
      const provider = createTypeOrmProvider({
        type: 'sqlite',
        database: ':memory:',
      });

      expect(provider).toBeInstanceOf(TypeOrmProvider);
    });

    it('should create provider with TypeOrmProviderOptions', () => {
      const provider = createTypeOrmProvider({
        dataSourceOptions: {
          type: 'sqlite',
          database: ':memory:',
        },
        retryAttempts: 3,
      });

      expect(provider).toBeInstanceOf(TypeOrmProvider);
    });
  });

  describe('Lifecycle', () => {
    it('should initialize SQLite in-memory database', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
        synchronize: true,
      });

      await provider.onProviderInit();

      expect(provider.isConnected()).toBe(true);
      expect(provider.getDataSource()).toBeInstanceOf(DataSource);
      expect(provider.getDataSource().isInitialized).toBe(true);

      await provider.onProviderDestroy();
      expect(provider.isConnected()).toBe(false);
    });

    it('should register DataSource in container', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await provider.onProviderInit();

      // Check if DataSource is registered
      const dataSource = container.resolve(TYPEORM_DATA_SOURCE);
      expect(dataSource).toBeInstanceOf(DataSource);
      expect((dataSource as DataSource).isInitialized).toBe(true);

      await provider.onProviderDestroy();
    });

    it('should register EntityManager in container', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await provider.onProviderInit();

      // Check if EntityManager is registered
      const entityManager = container.resolve(TYPEORM_ENTITY_MANAGER);
      expect(entityManager).toBeDefined();
      expect(entityManager).toBe(provider.getEntityManager());

      await provider.onProviderDestroy();
    });

    it('should handle destroy when not initialized', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      // Should not throw
      await expect(provider.onProviderDestroy()).resolves.not.toThrow();
    });

    it('should throw when getting DataSource before init', () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      expect(() => provider.getDataSource()).toThrow('not initialized');
    });
  });

  describe('Query execution', () => {
    it('should execute raw queries', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await provider.onProviderInit();

      const result = await provider.getDataSource().query('SELECT 1 as value');
      expect(result).toEqual([{ value: 1 }]);

      await provider.onProviderDestroy();
    });

    it('should work with EntityManager', async () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      await provider.onProviderInit();

      const em = provider.getEntityManager();
      const result = await em.query('SELECT 1 + 1 as sum');
      expect(result).toEqual([{ sum: 2 }]);

      await provider.onProviderDestroy();
    });
  });

  describe('Retry logic', () => {
    it('should accept retry configuration', () => {
      // Test that retry options are accepted
      const provider = createTypeOrmProvider({
        dataSourceOptions: {
          type: 'better-sqlite3',
          database: ':memory:',
        },
        retryAttempts: 3,
        retryDelay: 1000,
      });

      expect(provider).toBeInstanceOf(TypeOrmProvider);
    });

    it('should use default retry values', () => {
      const provider = createTypeOrmProvider({
        type: 'better-sqlite3',
        database: ':memory:',
      });

      // Provider should be created with default values
      expect(provider).toBeInstanceOf(TypeOrmProvider);
    });
  });

  describe('Configuration', () => {
    it('should use custom DataSourceOptions', async () => {
      const provider = createTypeOrmProvider({
        dataSourceOptions: {
          type: 'better-sqlite3',
          database: ':memory:',
          synchronize: true,
          logging: false,
        },
      });

      await provider.onProviderInit();

      const ds = provider.getDataSource();
      expect(ds.options.type).toBe('better-sqlite3');
      expect(ds.options.database).toBe(':memory:');
      expect(ds.options.synchronize).toBe(true);
      expect(ds.options.logging).toBe(false);

      await provider.onProviderDestroy();
    });
  });
});

