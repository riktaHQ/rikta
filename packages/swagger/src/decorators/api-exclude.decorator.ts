import 'reflect-metadata';
import { API_EXCLUDE_METADATA, API_DEPRECATED_METADATA } from '../constants.js';

/**
 * @ApiExcludeEndpoint() decorator
 * 
 * Excludes an endpoint from the Swagger documentation.
 * The route will still work but won't appear in the docs.
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   listUsers() { } // Documented
 * 
 *   @Get('/internal')
 *   @ApiExcludeEndpoint()
 *   internalEndpoint() { } // Not documented
 * }
 * ```
 */
export function ApiExcludeEndpoint(): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    Reflect.defineMetadata(
      API_EXCLUDE_METADATA,
      true,
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * @ApiExcludeController() decorator
 * 
 * Excludes an entire controller from the Swagger documentation.
 * All routes in the controller will still work but won't appear in the docs.
 * 
 * @example
 * ```typescript
 * @ApiExcludeController()
 * @Controller('/internal')
 * class InternalController {
 *   @Get('/health')
 *   health() { } // Not documented
 * }
 * ```
 */
export function ApiExcludeController(): ClassDecorator {
  return (target: Function): void => {
    Reflect.defineMetadata(API_EXCLUDE_METADATA, true, target);
  };
}

/**
 * Check if an endpoint is excluded from documentation
 * @internal
 */
export function isApiExcluded(target: Function, propertyKey?: string | symbol): boolean {
  // Check class-level exclusion
  if (Reflect.getMetadata(API_EXCLUDE_METADATA, target) === true) {
    return true;
  }
  // Check method-level exclusion
  if (propertyKey !== undefined) {
    return Reflect.getMetadata(API_EXCLUDE_METADATA, target.prototype, propertyKey) === true;
  }
  return false;
}

/**
 * @ApiDeprecated() decorator
 * 
 * Marks an endpoint as deprecated in the documentation.
 * The endpoint will be styled differently in Swagger UI.
 * 
 * @param message - Optional deprecation message
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/v1')
 *   @ApiDeprecated('Use /v2 instead')
 *   legacyEndpoint() { }
 * }
 * ```
 */
export function ApiDeprecated(message?: string): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    Reflect.defineMetadata(
      API_DEPRECATED_METADATA,
      { deprecated: true, message },
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Check if an endpoint is deprecated
 * @internal
 */
export function getApiDeprecated(
  target: Function,
  propertyKey: string | symbol
): { deprecated: boolean; message?: string } | undefined {
  return Reflect.getMetadata(API_DEPRECATED_METADATA, target.prototype, propertyKey);
}
