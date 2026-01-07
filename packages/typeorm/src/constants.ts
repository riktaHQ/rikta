/**
 * Injection tokens for TypeORM services
 * 
 * These tokens are used with @Autowired to inject TypeORM
 * instances into your services.
 */

import { InjectionToken } from '@riktajs/core';
import type { DataSource, EntityManager } from 'typeorm';

/**
 * Injection token for the default TypeORM DataSource
 * 
 * Use this token with @Autowired to inject the DataSource instance.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   @Autowired(TYPEORM_DATA_SOURCE)
 *   private dataSource!: DataSource;
 * 
 *   async getUsers() {
 *     return this.dataSource.getRepository(User).find();
 *   }
 * }
 * ```
 */
export const TYPEORM_DATA_SOURCE = new InjectionToken<DataSource>('TYPEORM_DATA_SOURCE');

/**
 * Injection token for the default TypeORM EntityManager
 * 
 * Use this token with @Autowired to inject the EntityManager instance.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   @Autowired(TYPEORM_ENTITY_MANAGER)
 *   private entityManager!: EntityManager;
 * 
 *   async createUser(name: string) {
 *     const user = new User();
 *     user.name = name;
 *     return this.entityManager.save(user);
 *   }
 * }
 * ```
 */
export const TYPEORM_ENTITY_MANAGER = new InjectionToken<EntityManager>('TYPEORM_ENTITY_MANAGER');

/**
 * Injection token for TypeORM configuration
 * 
 * This is used internally by the TypeOrmProvider to get configuration.
 */
export const TYPEORM_CONFIG = 'TYPEORM_CONFIG' as const;

// ============================================================================
// Multiple DataSources Support
// ============================================================================

/**
 * Cache for dynamically created tokens
 */
const dataSourceTokenCache = new Map<string, InjectionToken<DataSource>>();
const entityManagerTokenCache = new Map<string, InjectionToken<EntityManager>>();

/**
 * Get or create a DataSource injection token for a named connection
 * 
 * For the default connection, returns TYPEORM_DATA_SOURCE.
 * For named connections, creates a unique token.
 * 
 * @param name - The connection name (default: 'default')
 * @returns InjectionToken for the DataSource
 * 
 * @example
 * ```typescript
 * // Get token for a named connection
 * const ANALYTICS_DS = getDataSourceToken('analytics');
 * 
 * @Injectable()
 * class AnalyticsService {
 *   @Autowired(ANALYTICS_DS)
 *   private dataSource!: DataSource;
 * }
 * ```
 */
export function getDataSourceToken(name: string = 'default'): InjectionToken<DataSource> {
  if (name === 'default') {
    return TYPEORM_DATA_SOURCE;
  }

  if (!dataSourceTokenCache.has(name)) {
    const token = new InjectionToken<DataSource>(`TYPEORM_DATA_SOURCE_${name.toUpperCase()}`);
    dataSourceTokenCache.set(name, token);
  }

  return dataSourceTokenCache.get(name)!;
}

/**
 * Get or create an EntityManager injection token for a named connection
 * 
 * For the default connection, returns TYPEORM_ENTITY_MANAGER.
 * For named connections, creates a unique token.
 * 
 * @param name - The connection name (default: 'default')
 * @returns InjectionToken for the EntityManager
 * 
 * @example
 * ```typescript
 * // Get token for a named connection
 * const ANALYTICS_EM = getEntityManagerToken('analytics');
 * 
 * @Injectable()
 * class AnalyticsService {
 *   @Autowired(ANALYTICS_EM)
 *   private entityManager!: EntityManager;
 * }
 * ```
 */
export function getEntityManagerToken(name: string = 'default'): InjectionToken<EntityManager> {
  if (name === 'default') {
    return TYPEORM_ENTITY_MANAGER;
  }

  if (!entityManagerTokenCache.has(name)) {
    const token = new InjectionToken<EntityManager>(`TYPEORM_ENTITY_MANAGER_${name.toUpperCase()}`);
    entityManagerTokenCache.set(name, token);
  }

  return entityManagerTokenCache.get(name)!;
}

/**
 * Clear the token cache (for testing purposes)
 * @internal
 */
export function clearTokenCache(): void {
  dataSourceTokenCache.clear();
  entityManagerTokenCache.clear();
}
