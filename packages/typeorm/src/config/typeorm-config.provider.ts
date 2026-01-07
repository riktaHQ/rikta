/**
 * TypeORM Configuration Provider
 * 
 * Provides environment-based configuration for TypeORM DataSource.
 * Reads TYPEORM_* environment variables and validates them with Zod.
 * 
 * @example
 * ```typescript
 * // In your .env file:
 * TYPEORM_TYPE=postgres
 * TYPEORM_HOST=localhost
 * TYPEORM_PORT=5432
 * TYPEORM_USERNAME=admin
 * TYPEORM_PASSWORD=secret
 * TYPEORM_DATABASE=myapp
 * TYPEORM_SYNCHRONIZE=false
 * TYPEORM_LOGGING=true
 * ```
 */

import { z } from 'zod';
import { 
  AbstractConfigProvider, 
  Provider, 
  ConfigProperty 
} from '@riktajs/core';
import { TYPEORM_CONFIG } from '../constants.js';
import type { DatabaseType, TypeOrmConfig } from '../types.js';

/**
 * Zod schema for TypeORM configuration
 * 
 * All fields except `type` are optional to support different database configurations.
 * SQLite for example only needs `type` and `database` (file path).
 */
export const TypeOrmConfigSchema = z.object({
  /**
   * Database type (required)
   */
  TYPEORM_TYPE: z.enum([
    'postgres', 
    'mysql', 
    'mariadb', 
    'sqlite', 
    'better-sqlite3',
    'mssql', 
    'oracle', 
    'mongodb'
  ]),

  /**
   * Database host
   */
  TYPEORM_HOST: z.string().optional(),

  /**
   * Database port
   */
  TYPEORM_PORT: z.coerce.number().int().min(1).max(65535).optional(),

  /**
   * Database username
   */
  TYPEORM_USERNAME: z.string().optional(),

  /**
   * Database password
   */
  TYPEORM_PASSWORD: z.string().optional(),

  /**
   * Database name or file path (for SQLite)
   */
  TYPEORM_DATABASE: z.string().optional(),

  /**
   * Synchronize schema on startup (use only in development!)
   */
  TYPEORM_SYNCHRONIZE: z.preprocess(
    (val) => val === 'true' || val === '1' || val === true,
    z.boolean()
  ).optional().default(false),

  /**
   * Enable query logging
   */
  TYPEORM_LOGGING: z.preprocess(
    (val) => val === 'true' || val === '1' || val === true,
    z.boolean()
  ).optional().default(false),

  /**
   * Connection name (for multiple datasources)
   */
  TYPEORM_NAME: z.string().optional().default('default'),

  /**
   * SSL mode for database connection
   */
  TYPEORM_SSL: z.preprocess(
    (val) => val === 'true' || val === '1' || val === true,
    z.boolean()
  ).optional().default(false),

  /**
   * Extra connection pool settings - max connections
   */
  TYPEORM_POOL_SIZE: z.coerce.number().int().min(1).max(1000).optional(),
});

/**
 * TypeORM Configuration Provider
 * 
 * Extends AbstractConfigProvider to provide type-safe configuration
 * from environment variables for TypeORM DataSource.
 * 
 * This provider is automatically discovered and registered by Rikta
 * when you import `@riktajs/typeorm`.
 * 
 * @example
 * ```typescript
 * // The config provider is auto-registered with token TYPEORM_CONFIG
 * // You can inject it in services if needed:
 * 
 * @Injectable()
 * class DatabaseService {
 *   @Autowired(TYPEORM_CONFIG)
 *   private config!: TypeOrmConfigProvider;
 * 
 *   getConnectionInfo() {
 *     return {
 *       host: this.config.host,
 *       port: this.config.port,
 *       database: this.config.database,
 *     };
 *   }
 * }
 * ```
 */
@Provider(TYPEORM_CONFIG)
export class TypeOrmConfigProvider extends AbstractConfigProvider {
  /**
   * Database type (postgres, mysql, sqlite, etc.)
   */
  @ConfigProperty('TYPEORM_TYPE')
  type!: DatabaseType;

  /**
   * Database host
   */
  @ConfigProperty('TYPEORM_HOST')
  host?: string;

  /**
   * Database port
   */
  @ConfigProperty('TYPEORM_PORT')
  port?: number;

  /**
   * Database username
   */
  @ConfigProperty('TYPEORM_USERNAME')
  username?: string;

  /**
   * Database password
   */
  @ConfigProperty('TYPEORM_PASSWORD')
  password?: string;

  /**
   * Database name or file path
   */
  @ConfigProperty('TYPEORM_DATABASE')
  database?: string;

  /**
   * Whether to synchronize database schema
   * WARNING: Set to false in production!
   */
  @ConfigProperty('TYPEORM_SYNCHRONIZE')
  synchronize!: boolean;

  /**
   * Whether to enable query logging
   */
  @ConfigProperty('TYPEORM_LOGGING')
  logging!: boolean;

  /**
   * Connection name for multiple datasources
   */
  @ConfigProperty('TYPEORM_NAME')
  name!: string;

  /**
   * Whether to use SSL
   */
  @ConfigProperty('TYPEORM_SSL')
  ssl!: boolean;

  /**
   * Connection pool size
   */
  @ConfigProperty('TYPEORM_POOL_SIZE')
  poolSize?: number;

  /**
   * Zod schema for validation
   */
  protected schema() {
    return TypeOrmConfigSchema;
  }

  constructor() {
    super();
    this.populate();
  }

  /**
   * Convert to TypeOrmConfig object
   * 
   * Returns a plain object suitable for passing to TypeORM DataSource.
   */
  toConfig(): TypeOrmConfig {
    return {
      type: this.type,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      synchronize: this.synchronize,
      logging: this.logging,
      name: this.name,
    };
  }

  /**
   * Check if this is a file-based database (SQLite)
   */
  isFileBased(): boolean {
    return this.type === 'sqlite' || this.type === 'better-sqlite3';
  }

  /**
   * Check if this is a network-based database
   */
  isNetworkBased(): boolean {
    return !this.isFileBased();
  }

  /**
   * Get connection string (for supported databases)
   */
  getConnectionString(): string | undefined {
    if (this.isFileBased()) {
      return this.database;
    }

    if (!this.host || !this.database) {
      return undefined;
    }

    const auth = this.username 
      ? `${this.username}${this.password ? `:${this.password}` : ''}@`
      : '';
    
    const port = this.port ? `:${this.port}` : '';
    
    return `${this.type}://${auth}${this.host}${port}/${this.database}`;
  }
}
