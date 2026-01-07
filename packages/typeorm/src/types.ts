/**
 * TypeORM plugin types
 */

import type { DataSourceOptions } from 'typeorm';

/**
 * Supported database types
 */
export type DatabaseType = 
  | 'postgres' 
  | 'mysql' 
  | 'mariadb' 
  | 'sqlite' 
  | 'better-sqlite3'
  | 'mssql' 
  | 'oracle' 
  | 'mongodb';

/**
 * TypeORM configuration options
 * 
 * This is a simplified version of DataSourceOptions that covers
 * the most common configuration scenarios.
 */
export interface TypeOrmConfig {
  /**
   * Database type
   */
  type: DatabaseType;

  /**
   * Database host
   */
  host?: string;

  /**
   * Database port
   */
  port?: number;

  /**
   * Database username
   */
  username?: string;

  /**
   * Database password
   */
  password?: string;

  /**
   * Database name or path (for SQLite)
   */
  database?: string;

  /**
   * Whether to synchronize database schema on each app launch
   * WARNING: Use only in development!
   */
  synchronize?: boolean;

  /**
   * Enable logging
   */
  logging?: boolean;

  /**
   * Entity classes or paths to entity files
   */
  entities?: DataSourceOptions['entities'];

  /**
   * Migration classes or paths to migration files
   */
  migrations?: DataSourceOptions['migrations'];

  /**
   * Subscriber classes or paths to subscriber files
   */
  subscribers?: DataSourceOptions['subscribers'];

  /**
   * Datasource name (for multiple connections)
   * @default 'default'
   */
  name?: string;
}

/**
 * Options for creating a TypeORM provider
 */
export interface TypeOrmProviderOptions {
  /**
   * Direct DataSourceOptions (takes precedence over config)
   */
  dataSourceOptions?: DataSourceOptions;

  /**
   * Whether to auto-initialize the connection
   * @default true
   */
  autoInitialize?: boolean;

  /**
   * Whether to retry connection on failure
   * @default false
   */
  retryAttempts?: number;

  /**
   * Delay between retry attempts in ms
   * @default 3000
   */
  retryDelay?: number;
}

/**
 * Re-export common TypeORM types for convenience
 */
export type {
  DataSource,
  EntityManager,
  Repository,
  ObjectLiteral,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  EntityTarget,
} from 'typeorm';

