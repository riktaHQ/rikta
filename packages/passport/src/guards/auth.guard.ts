/**
 * AuthGuard
 * 
 * Guard that checks if the request is authenticated via Passport.
 * 
 * @packageDocumentation
 */

import type { CanActivate, ExecutionContext } from '@riktajs/core';
import type { FastifyRequest } from 'fastify';
import { PassportNotInitializedError, UnauthorizedError } from '../errors.js';
import { isAuthenticated, getAuthenticatedOptions } from '../decorators/authenticated.decorator.js';

/**
 * AuthGuard
 * 
 * Checks if the current request has an authenticated user.
 * Works with Passport's `request.isAuthenticated()` method.
 * 
 * Can be used globally or on specific routes:
 * - Globally: Checks @Authenticated metadata to decide if auth is needed
 * - Per-route with @UseGuards: Always requires authentication
 * 
 * @example Global guard (respects @Authenticated)
 * ```typescript
 * // In your app bootstrap
 * app.useGlobalGuard(AuthGuard);
 * 
 * // Only protected routes require auth
 * @Controller('/api')
 * class ApiController {
 *   @Get('/public')
 *   publicRoute() {} // No auth needed
 *   
 *   @Get('/private')
 *   @Authenticated()
 *   privateRoute() {} // Auth required
 * }
 * ```
 * 
 * @example Per-route guard
 * ```typescript
 * @Controller('/admin')
 * @UseGuards(AuthGuard)
 * class AdminController {
 *   // All routes require authentication
 * }
 * ```
 */
export class AuthGuard implements CanActivate {
  /**
   * Check if the request can proceed
   * 
   * @param context - Execution context with request/response
   * @returns true if authenticated, throws otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const handler = context.getHandler();
    const controllerClass = context.getClass();
    
    // Check if this route requires authentication
    const requiresAuth = isAuthenticated(controllerClass.prototype, handler);
    
    // If @Authenticated is not present and this is used as a global guard,
    // allow the request through
    if (!requiresAuth) {
      return true;
    }
    
    // Check if passport is initialized
    if (typeof request.isAuthenticated !== 'function') {
      throw new PassportNotInitializedError();
    }
    
    // Check authentication status
    if (!request.isAuthenticated()) {
      const options = getAuthenticatedOptions(controllerClass.prototype, handler);
      const message = options?.message ?? 'Unauthorized';
      
      // If redirect is configured, we could handle it here
      // For now, just throw an error
      throw new UnauthorizedError(message);
    }
    
    return true;
  }
}

/**
 * Strict AuthGuard
 * 
 * Always requires authentication, regardless of @Authenticated decorator.
 * Use this when you want to protect all routes in a controller.
 * 
 * @example
 * ```typescript
 * @Controller('/admin')
 * @UseGuards(StrictAuthGuard)
 * class AdminController {
 *   // All routes require authentication
 * }
 * ```
 */
export class StrictAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    
    // Check if passport is initialized
    if (typeof request.isAuthenticated !== 'function') {
      throw new PassportNotInitializedError();
    }
    
    // Always check authentication
    if (!request.isAuthenticated()) {
      throw new UnauthorizedError('Unauthorized');
    }
    
    return true;
  }
}
