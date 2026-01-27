/**
 * @Authenticated Decorator
 * 
 * Marks a route handler as requiring authentication.
 * Use with AuthGuard to protect routes.
 * 
 * @packageDocumentation
 */

import 'reflect-metadata';
import { AUTHENTICATED_METADATA } from '../constants.js';

/**
 * Options for the @Authenticated decorator
 */
export interface AuthenticatedOptions {
  /**
   * Custom error message when not authenticated
   */
  message?: string;
  
  /**
   * Redirect URL instead of 401 error
   */
  redirectTo?: string;
}

/**
 * @Authenticated Decorator
 * 
 * Marks a route as requiring authentication.
 * The AuthGuard reads this metadata to determine if authentication is needed.
 * 
 * @param options - Optional configuration
 * 
 * @example Basic usage
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/profile')
 *   @Authenticated()
 *   getProfile(@Req() req: FastifyRequest) {
 *     return { user: req.user };
 *   }
 * }
 * ```
 * 
 * @example With custom message
 * ```typescript
 * @Get('/admin')
 * @Authenticated({ message: 'Admin access required' })
 * getAdminData() {
 *   return { secret: 'data' };
 * }
 * ```
 * 
 * @example Class-level (all routes)
 * ```typescript
 * @Controller('/api')
 * @Authenticated()
 * class SecureController {
 *   // All routes require authentication
 * }
 * ```
 */
export function Authenticated(options?: AuthenticatedOptions): ClassDecorator & MethodDecorator {
  return (
    target: object,
    propertyKey?: string | symbol,
  ): void => {
    const metadata = {
      required: true,
      ...options,
    };
    
    if (propertyKey !== undefined) {
      // Method decorator - target is the prototype
      // Store on the prototype directly with the property key
      Reflect.defineMetadata(
        AUTHENTICATED_METADATA,
        metadata,
        target,
        propertyKey,
      );
    } else {
      // Class decorator - target is the constructor
      Reflect.defineMetadata(
        AUTHENTICATED_METADATA,
        metadata,
        target,
      );
    }
  };
}

/**
 * Get the constructor from an instance or class
 */
function getConstructor(target: object): Function {
  if (typeof target === 'function') {
    return target;
  }
  return target.constructor;
}

/**
 * Check if a handler or class requires authentication
 */
export function isAuthenticated(
  target: object,
  propertyKey?: string | symbol,
): boolean {
  if (propertyKey !== undefined) {
    // For method checks, target can be:
    // - A class constructor (function): use .prototype
    // - An object (instance or prototype): use directly (both work for metadata lookup)
    
    const prototype = typeof target === 'function' ? target.prototype : target;
    
    // Check method first - metadata is on the prototype
    const methodMeta = Reflect.getMetadata(AUTHENTICATED_METADATA, prototype, propertyKey);
    if (methodMeta) return methodMeta.required;
    
    // Fall back to class - metadata is on the constructor
    const constructor = prototype.constructor;
    const classMeta = Reflect.getMetadata(AUTHENTICATED_METADATA, constructor);
    return classMeta?.required ?? false;
  }
  
  // Class-level check
  const constructor = getConstructor(target);
  const classMeta = Reflect.getMetadata(AUTHENTICATED_METADATA, constructor);
  return classMeta?.required ?? false;
}

/**
 * Get authentication options for a handler
 */
export function getAuthenticatedOptions(
  target: object,
  propertyKey?: string | symbol,
): AuthenticatedOptions | undefined {
  if (propertyKey !== undefined) {
    // Same logic as isAuthenticated
    const prototype = typeof target === 'function' ? target.prototype : target;
    
    // Check method first
    const methodMeta = Reflect.getMetadata(AUTHENTICATED_METADATA, prototype, propertyKey);
    if (methodMeta) return methodMeta;
    
    // Fall back to class
    const constructor = prototype.constructor;
    return Reflect.getMetadata(AUTHENTICATED_METADATA, constructor);
  }
  
  const constructor = getConstructor(target);
  return Reflect.getMetadata(AUTHENTICATED_METADATA, constructor);
}
