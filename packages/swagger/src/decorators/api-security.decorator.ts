import 'reflect-metadata';
import { API_SECURITY_METADATA } from '../constants.js';
import type { ApiSecurityOptions } from '../types.js';

/**
 * @ApiSecurity() decorator
 * 
 * Applies a security requirement to a controller or method.
 * The security scheme must be defined in the SwaggerConfig.securitySchemes.
 * 
 * Can be applied to:
 * - Controller classes (applies to all routes)
 * - Individual route methods
 * 
 * @param name - Name of the security scheme
 * @param scopes - Required scopes (for OAuth2)
 * 
 * @example
 * ```typescript
 * @ApiSecurity('bearerAuth')
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   listUsers() { } // Protected by bearerAuth
 *   
 *   @Get('/public')
 *   @ApiSecurity() // Remove security for this endpoint
 *   getPublicInfo() { }
 * }
 * ```
 */
export function ApiSecurity(
  name?: string,
  scopes: string[] = []
): ClassDecorator & MethodDecorator {
  return (
    target: Function | Object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ): void => {
    const security: ApiSecurityOptions | null = name ? { name, scopes } : null;
    
    if (propertyKey !== undefined && descriptor !== undefined) {
      // Method decorator - save on target (prototype)
      Reflect.defineMetadata(
        API_SECURITY_METADATA,
        security,
        target,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(API_SECURITY_METADATA, security, target);
    }
  };
}

/**
 * @ApiBearerAuth() decorator
 * 
 * Shorthand for @ApiSecurity('bearerAuth').
 * Applies Bearer token authentication to a controller or method.
 * 
 * @param name - Name of the bearer auth scheme (default: 'bearerAuth')
 * 
 * @example
 * ```typescript
 * @ApiBearerAuth()
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   listUsers() { } // Requires Bearer token
 * }
 * ```
 */
export function ApiBearerAuth(name: string = 'bearerAuth'): ClassDecorator & MethodDecorator {
  return ApiSecurity(name);
}

/**
 * @ApiBasicAuth() decorator
 * 
 * Shorthand for @ApiSecurity('basicAuth').
 * Applies HTTP Basic authentication to a controller or method.
 * 
 * @param name - Name of the basic auth scheme (default: 'basicAuth')
 */
export function ApiBasicAuth(name: string = 'basicAuth'): ClassDecorator & MethodDecorator {
  return ApiSecurity(name);
}

/**
 * @ApiOAuth2() decorator
 * 
 * Applies OAuth2 authentication with specific scopes.
 * 
 * @param scopes - Required OAuth2 scopes
 * @param name - Name of the OAuth2 scheme (default: 'oauth2')
 * 
 * @example
 * ```typescript
 * @ApiOAuth2(['read:users', 'write:users'])
 * @Controller('/users')
 * class UserController { }
 * ```
 */
export function ApiOAuth2(
  scopes: string[] = [],
  name: string = 'oauth2'
): ClassDecorator & MethodDecorator {
  return ApiSecurity(name, scopes);
}

/**
 * @ApiCookieAuth() decorator
 * 
 * Applies cookie-based authentication.
 * 
 * @param name - Name of the cookie auth scheme (default: 'cookieAuth')
 */
export function ApiCookieAuth(name: string = 'cookieAuth'): ClassDecorator & MethodDecorator {
  return ApiSecurity(name);
}

/**
 * Get security metadata from a class or method
 * @internal
 */
export function getApiSecurity(
  target: Function,
  propertyKey?: string | symbol
): ApiSecurityOptions | null | undefined {
  if (propertyKey !== undefined) {
    // Check if method has explicit security (including null for "no security")
    const methodSecurity = Reflect.getMetadata(API_SECURITY_METADATA, target.prototype, propertyKey);
    if (methodSecurity !== undefined) {
      return methodSecurity;
    }
    // Fall back to class-level security
    return Reflect.getMetadata(API_SECURITY_METADATA, target);
  }
  return Reflect.getMetadata(API_SECURITY_METADATA, target);
}
