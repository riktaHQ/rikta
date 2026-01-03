// ============================================================================
// Metadata Keys for Reflect API
// Using Symbol.for() to ensure symbols are shared across packages
// ============================================================================

/**
 * Key for storing controller metadata (prefix, routes)
 */
export const CONTROLLER_METADATA = Symbol.for('rikta:controller:metadata');

/**
 * Key for storing route definitions on a controller
 */
export const ROUTES_METADATA = Symbol.for('rikta:routes:metadata');

/**
 * Key for storing injectable options
 */
export const INJECTABLE_METADATA = Symbol.for('rikta:injectable:metadata');

/**
 * Key for storing parameter injection metadata
 */
export const PARAM_METADATA = Symbol.for('rikta:param:metadata');

/**
 * Key for storing guards
 */
export const GUARDS_METADATA = Symbol.for('rikta:guards:metadata');

/**
 * Key for storing interceptors
 */
export const INTERCEPTORS_METADATA = Symbol.for('rikta:interceptors:metadata');

/**
 * Key for storing middleware
 */
export const MIDDLEWARE_METADATA = Symbol.for('rikta:middleware:metadata');

/**
 * Key for storing response status code
 */
export const HTTP_CODE_METADATA = Symbol.for('rikta:http:code:metadata');

/**
 * Key for storing response headers
 */
export const HEADERS_METADATA = Symbol.for('rikta:headers:metadata');

/**
 * Key for storing @Inject() metadata on constructor parameters
 */
export const INJECT_METADATA = Symbol.for('rikta:inject:metadata');

/**
 * Key for storing Zod validation schema on parameters
 */
export const ZOD_SCHEMA_METADATA = Symbol.for('rikta:zod:schema:metadata');

/**
 * Key for storing @Autowired() property injection metadata
 */
export const AUTOWIRED_METADATA = Symbol.for('rikta:autowired:metadata');

/**
 * Key for storing @Provider() metadata
 */
export const PROVIDER_METADATA = Symbol.for('rikta:provider:metadata');

// ============================================================================
// Configuration Metadata Keys
// ============================================================================

/**
 * Key for storing @Provider() metadata on config provider classes.
 * 
 * This metadata stores the injection token that identifies the config provider,
 * allowing the auto-discovery mechanism to register it with the DI container.
 * 
 * @example
 * ```typescript
 * @Provider('APP_CONFIG')
 * class AppConfigProvider extends AbstractConfigProvider {
 *   // Token 'APP_CONFIG' is stored in metadata
 * }
 * ```
 */
export const CONFIG_PROVIDER_METADATA = Symbol('config:provider:metadata');

/**
 * Key for storing @ConfigProperty() metadata on config class properties.
 * 
 * This metadata maps class properties to environment variable names,
 * supporting both explicit mapping and automatic upper_snake_case conversion.
 * Stored as an array of `{ propertyKey: string, envKey: string }` objects.
 * 
 * @example
 * ```typescript
 * class DatabaseConfig {
 *   @ConfigProperty('DB_HOST')  // explicit mapping
 *   host: string;
 * 
 *   @ConfigProperty()  // auto-mapped to 'DB_PORT'
 *   dbPort: number;
 * }
 * ```
 */
export const CONFIG_PROPERTY_METADATA = Symbol('config:property:metadata');

/**
 * Parameter types for injection
 */
export enum ParamType {
  BODY = 'body',
  QUERY = 'query',
  PARAM = 'param',
  HEADERS = 'headers',
  REQUEST = 'request',
  REPLY = 'reply',
  CONTEXT = 'context',
}

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG = {
  port: 3000,
  host: '0.0.0.0',
  logger: true,
  prefix: '',
} as const;
