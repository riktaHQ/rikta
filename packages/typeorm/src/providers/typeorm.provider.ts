/**
 * TypeORM Provider
 * 
 * Manages TypeORM DataSource lifecycle using Rikta's provider system.
 * This provider handles:
 * - Creating and initializing TypeORM DataSource
 * - Registering DataSource and EntityManager in the DI container
 * - Graceful shutdown and connection cleanup
 * 
 * @example
 * ```typescript
 * // The provider is automatically initialized when your app starts.
 * // You can inject DataSource in your services:
 * 
 * @Injectable()
 * class UserRepository {
 *   @Autowired(TYPEORM_DATA_SOURCE)
 *   private dataSource!: DataSource;
 * 
 *   async findAll() {
 *     return this.dataSource.getRepository(User).find();
 *   }
 * }
 * ```
 */

import { DataSource, DataSourceOptions, EntityManager } from 'typeorm';
import { 
  OnProviderInit, 
  OnProviderDestroy,
  Container
} from '@riktajs/core';
import { 
  TYPEORM_DATA_SOURCE, 
  TYPEORM_ENTITY_MANAGER,
  getDataSourceToken,
  getEntityManagerToken,
} from '../constants.js';
import type { TypeOrmProviderOptions } from '../types.js';

/**
 * TypeORM Provider
 * 
 * Manages the lifecycle of TypeORM DataSource instances.
 * Uses Rikta's lifecycle hooks to initialize on app start
 * and cleanup on app shutdown.
 * 
 * Note: This class is NOT decorated with @Injectable because it requires
 * programmatic configuration. Use createTypeOrmProvider() to create and
 * register an instance.
 */
export class TypeOrmProvider implements OnProviderInit, OnProviderDestroy {
  /**
   * The TypeORM DataSource instance
   */
  private dataSource!: DataSource;

  /**
   * Options for the provider
   */
  private options: TypeOrmProviderOptions = {
    autoInitialize: true,
    retryAttempts: 0,
    retryDelay: 3000,
  };

  /**
   * Flag to track if connection was successfully initialized
   */
  private initialized = false;

  /**
   * Connection name for multiple datasources support
   */
  private connectionName: string = 'default';

  /**
   * Configure the provider with options
   * 
   * @param options - Configuration options
   * @returns This instance for chaining
   */
  configure(options: TypeOrmProviderOptions): this {
    this.options = {
      ...this.options,
      ...options,
    };
    
    // Extract connection name from options
    if (options.dataSourceOptions && 'name' in options.dataSourceOptions) {
      this.connectionName = (options.dataSourceOptions as { name?: string }).name || 'default';
    }
    
    return this;
  }
  
  /**
   * Get the connection name
   */
  getName(): string {
    return this.connectionName;
  }

  /**
   * Lifecycle hook: Initialize the database connection
   * 
   * Called by Rikta after the provider is instantiated.
   * Creates the DataSource, initializes it, and registers
   * the DataSource and EntityManager in the DI container.
   */
  async onProviderInit(): Promise<void> {
    console.log('🔌 TypeORM: Initializing database connection...');

    try {
      // Build DataSource options
      const dataSourceOptions = this.buildDataSourceOptions();
      
      // Create DataSource instance
      this.dataSource = new DataSource(dataSourceOptions);

      // Initialize with retry support
      await this.initializeWithRetry();

      // Register in DI container
      this.registerInContainer();

      this.initialized = true;
      console.log(`✅ TypeORM: Connected to ${dataSourceOptions.type} database`);
    } catch (error) {
      console.error('❌ TypeORM: Failed to initialize database connection');
      throw error;
    }
  }

  /**
   * Lifecycle hook: Close the database connection
   * 
   * Called by Rikta during application shutdown.
   * Ensures proper cleanup of database connections.
   */
  async onProviderDestroy(): Promise<void> {
    if (!this.initialized || !this.dataSource?.isInitialized) {
      return;
    }

    console.log('🔌 TypeORM: Closing database connection...');

    try {
      await this.dataSource.destroy();
      this.initialized = false;
      console.log('✅ TypeORM: Database connection closed');
    } catch (error) {
      console.error('❌ TypeORM: Error closing database connection:', error);
      // Don't rethrow - we want shutdown to continue
    }
  }

  /**
   * Get the DataSource instance
   * 
   * @returns The TypeORM DataSource
   * @throws Error if DataSource is not initialized
   */
  getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('TypeORM DataSource is not initialized');
    }
    return this.dataSource;
  }

  /**
   * Get the EntityManager instance
   * 
   * @returns The TypeORM EntityManager
   * @throws Error if DataSource is not initialized
   */
  getEntityManager(): EntityManager {
    return this.getDataSource().manager;
  }

  /**
   * Check if the connection is initialized
   */
  isConnected(): boolean {
    return this.initialized && this.dataSource?.isInitialized;
  }

  /**
   * Build DataSource options from configuration
   */
  private buildDataSourceOptions(): DataSourceOptions {
    if (!this.options.dataSourceOptions) {
      throw new Error(
        'TypeORM DataSourceOptions are required. ' +
        'Please provide dataSourceOptions when creating the TypeOrmProvider.'
      );
    }
    
    return this.options.dataSourceOptions;
  }

  /**
   * Initialize DataSource with retry support
   */
  private async initializeWithRetry(): Promise<void> {
    const { retryAttempts = 0, retryDelay = 3000 } = this.options;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        await this.dataSource.initialize();
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          console.warn(
            `⚠️ TypeORM: Connection attempt ${attempt + 1}/${retryAttempts + 1} failed. ` +
            `Retrying in ${retryDelay}ms...`
          );
          await this.sleep(retryDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Register DataSource and EntityManager in the DI container
   */
  private registerInContainer(): void {
    const container = Container.getInstance();
    
    // Get tokens for this connection name
    const dataSourceToken = getDataSourceToken(this.connectionName);
    const entityManagerToken = getEntityManagerToken(this.connectionName);
    
    // Register DataSource
    container.registerValue(dataSourceToken, this.dataSource);
    
    // Register EntityManager
    container.registerValue(entityManagerToken, this.dataSource.manager);
    
    // Also register with default tokens if this is the default connection
    if (this.connectionName === 'default') {
      container.registerValue(TYPEORM_DATA_SOURCE, this.dataSource);
      container.registerValue(TYPEORM_ENTITY_MANAGER, this.dataSource.manager);
    }
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a TypeORM provider with custom DataSourceOptions
 * 
 * Use this function when you need to provide DataSource options
 * programmatically rather than through environment variables.
 * 
 * After creating the provider, you must:
 * 1. Call `await typeormProvider.onProviderInit()` to connect
 * 2. Register it in the container (or use `initializeTypeOrm` helper)
 * 
 * @param options - DataSource options or provider options
 * @returns A configured TypeOrmProvider instance
 * 
 * @example
 * ```typescript
 * import { Container } from '@riktajs/core';
 * import { createTypeOrmProvider, TYPEORM_DATA_SOURCE, TYPEORM_ENTITY_MANAGER } from '@riktajs/typeorm';
 * 
 * const typeormProvider = createTypeOrmProvider({
 *   dataSourceOptions: {
 *     type: 'sqlite',
 *     database: ':memory:',
 *     entities: [User, Post],
 *     synchronize: true,
 *   },
 * });
 * 
 * // Initialize and register
 * await typeormProvider.onProviderInit();
 * const container = Container.getInstance();
 * container.registerValue(TYPEORM_DATA_SOURCE, typeormProvider.getDataSource());
 * container.registerValue(TYPEORM_ENTITY_MANAGER, typeormProvider.getEntityManager());
 * ```
 */
export function createTypeOrmProvider(
  options: TypeOrmProviderOptions | DataSourceOptions
): TypeOrmProvider {
  const provider = new TypeOrmProvider();
  
  // If it looks like DataSourceOptions, wrap it
  if ('type' in options && typeof options.type === 'string') {
    return provider.configure({
      dataSourceOptions: options as DataSourceOptions,
    });
  }
  
  return provider.configure(options as TypeOrmProviderOptions);
}

/**
 * Initialize TypeORM and register it in the Rikta container
 * 
 * This is a convenience function that:
 * 1. Creates a TypeOrmProvider
 * 2. Initializes the database connection
 * 3. Registers DataSource and EntityManager in the DI container
 * 4. Returns a cleanup function that you should call on app shutdown
 * 
 * Call this BEFORE Rikta.create()
 * 
 * @param options - DataSource options or provider options
 * @returns Object with the provider and an auto-cleanup installer
 * 
 * @example
 * ```typescript
 * import { Rikta } from '@riktajs/core';
 * import { initializeTypeOrm } from '@riktajs/typeorm';
 * import { User } from './entities/user.entity';
 * 
 * async function bootstrap() {
 *   // Initialize TypeORM (must be called before Rikta.create)
 *   const { installCleanup } = await initializeTypeOrm({
 *     type: 'postgres',
 *     host: 'localhost',
 *     port: 5432,
 *     username: 'admin',
 *     password: 'secret',
 *     database: 'myapp',
 *     entities: [User],
 *     synchronize: false,
 *     logging: true,
 *   });
 * 
 *   const app = await Rikta.create({ port: 3000 });
 *   
 *   // Install automatic cleanup on app shutdown
 *   installCleanup(app);
 *   
 *   await app.listen();
 * }
 * 
 * bootstrap();
 * ```
 */
export async function initializeTypeOrm(
  options: TypeOrmProviderOptions | DataSourceOptions
): Promise<{
  provider: TypeOrmProvider;
  installCleanup: (app: { close: (signal?: string) => Promise<void> }) => void;
}> {
  const { Container } = await import('@riktajs/core');
  
  // Create and configure provider
  const provider = createTypeOrmProvider(options);
  
  // Initialize database connection
  await provider.onProviderInit();
  
  // Register in DI container
  const container = Container.getInstance();
  container.registerValue(TYPEORM_DATA_SOURCE, provider.getDataSource());
  container.registerValue(TYPEORM_ENTITY_MANAGER, provider.getEntityManager());
  
  // Return provider and cleanup installer
  return {
    provider,
    installCleanup: (app) => {
      const originalClose = app.close.bind(app);
      app.close = async (signal?: string) => {
        await provider.onProviderDestroy();
        await originalClose(signal);
      };
    },
  };
}

/**
 * Helper type for configuring TypeORM with specific options
 */
export interface TypeOrmModuleOptions extends TypeOrmProviderOptions {
  /**
   * Entity classes to register
   */
  entities?: DataSourceOptions['entities'];

  /**
   * Migration classes to register
   */
  migrations?: DataSourceOptions['migrations'];

  /**
   * Subscriber classes to register
   */
  subscribers?: DataSourceOptions['subscribers'];
}

/**
 * Configure TypeORM with custom options
 * 
 * Returns DataSourceOptions that can be merged with env-based config.
 * 
 * @example
 * ```typescript
 * const options = configureTypeOrm({
 *   entities: [User, Post, Comment],
 *   migrations: ['./migrations/*.ts'],
 * });
 * ```
 */
export function configureTypeOrm(
  options: Partial<DataSourceOptions>
): Partial<DataSourceOptions> {
  return options;
}

// ============================================================================
// Multiple DataSources Support
// ============================================================================

/**
 * Registry of all active TypeORM providers
 */
const providerRegistry = new Map<string, TypeOrmProvider>();

/**
 * Create a named TypeORM provider for multiple database connections
 * 
 * Use this function when you need to connect to multiple databases.
 * Each provider manages its own DataSource and registers it with a unique token.
 * 
 * @param name - The unique name for this connection
 * @param options - DataSource options or provider options
 * @returns A configured TypeOrmProvider instance
 * 
 * @example
 * ```typescript
 * // Create providers for multiple databases
 * const mainDb = createNamedTypeOrmProvider('main', {
 *   type: 'postgres',
 *   host: 'main-db.example.com',
 *   database: 'main',
 *   entities: [User, Post],
 * });
 * 
 * const analyticsDb = createNamedTypeOrmProvider('analytics', {
 *   type: 'postgres',
 *   host: 'analytics-db.example.com',
 *   database: 'analytics',
 *   entities: [Event, Metric],
 * });
 * 
 * // Initialize both
 * await mainDb.onProviderInit();
 * await analyticsDb.onProviderInit();
 * 
 * // Inject using named tokens
 * import { getDataSourceToken } from '@riktajs/typeorm';
 * 
 * @Injectable()
 * class AnalyticsService {
 *   @Autowired(getDataSourceToken('analytics'))
 *   private analyticsDs!: DataSource;
 * }
 * ```
 */
export function createNamedTypeOrmProvider(
  name: string,
  options: TypeOrmProviderOptions | DataSourceOptions
): TypeOrmProvider {
  if (providerRegistry.has(name)) {
    throw new Error(`TypeORM provider with name "${name}" already exists`);
  }

  let providerOptions: TypeOrmProviderOptions;

  // If it looks like DataSourceOptions, wrap it
  if ('type' in options && typeof options.type === 'string') {
    providerOptions = {
      dataSourceOptions: {
        ...(options as DataSourceOptions),
        name, // Add the name to DataSourceOptions
      } as DataSourceOptions,
    };
  } else {
    providerOptions = {
      ...(options as TypeOrmProviderOptions),
      dataSourceOptions: {
        ...(options as TypeOrmProviderOptions).dataSourceOptions,
        name,
      } as DataSourceOptions,
    };
  }

  const provider = new TypeOrmProvider().configure(providerOptions);
  providerRegistry.set(name, provider);
  
  return provider;
}

/**
 * Get a registered TypeORM provider by name
 * 
 * @param name - The connection name
 * @returns The TypeOrmProvider instance, or undefined if not found
 */
export function getTypeOrmProvider(name: string = 'default'): TypeOrmProvider | undefined {
  return providerRegistry.get(name);
}

/**
 * Get all registered TypeORM providers
 * 
 * @returns Map of all registered providers
 */
export function getAllTypeOrmProviders(): Map<string, TypeOrmProvider> {
  return new Map(providerRegistry);
}

/**
 * Clear the provider registry (for testing)
 * @internal
 */
export function clearProviderRegistry(): void {
  providerRegistry.clear();
}

/**
 * Initialize all registered TypeORM providers
 * 
 * Useful when you've created multiple named providers and want to
 * initialize them all at once.
 * 
 * @example
 * ```typescript
 * // Create multiple providers
 * createNamedTypeOrmProvider('main', mainConfig);
 * createNamedTypeOrmProvider('analytics', analyticsConfig);
 * 
 * // Initialize all at once
 * await initializeAllTypeOrmProviders();
 * ```
 */
export async function initializeAllTypeOrmProviders(): Promise<void> {
  const providers = Array.from(providerRegistry.values());
  await Promise.all(providers.map(p => p.onProviderInit()));
}

/**
 * Destroy all registered TypeORM providers
 * 
 * Closes all database connections. Called automatically during app shutdown.
 */
export async function destroyAllTypeOrmProviders(): Promise<void> {
  const providers = Array.from(providerRegistry.values());
  await Promise.allSettled(providers.map(p => p.onProviderDestroy()));
  providerRegistry.clear();
}
