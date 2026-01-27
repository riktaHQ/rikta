/**
 * @CurrentUser Decorator
 * 
 * Parameter decorator to inject the current authenticated user.
 * 
 * @packageDocumentation
 */

import type { FastifyRequest } from 'fastify';
import type { SerializableUser } from '../interfaces/strategy.interface.js';

/**
 * Factory for creating param decorators (compatible with Rikta's pattern)
 */
type ParamDecoratorFactory<T> = (
  data?: T,
) => ParameterDecorator;

/**
 * User extractor function type
 */
type UserExtractor<T> = (request: FastifyRequest) => T | undefined;

/**
 * Create a parameter decorator for extracting data from request
 */
function createParamDecorator<T = unknown>(
  extractor: UserExtractor<T>,
): ParamDecoratorFactory<unknown> {
  return () => {
    return (
      target: object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number,
    ): void => {
      if (propertyKey === undefined) return;
      
      const existingParams: Array<{
        index: number;
        extractor: UserExtractor<unknown>;
      }> = Reflect.getMetadata('custom:params', target, propertyKey) || [];
      
      existingParams.push({
        index: parameterIndex,
        extractor: extractor as UserExtractor<unknown>,
      });
      
      Reflect.defineMetadata('custom:params', existingParams, target, propertyKey);
    };
  };
}

/**
 * @CurrentUser Decorator
 * 
 * Injects the currently authenticated user into a route handler parameter.
 * Returns undefined if no user is authenticated.
 * 
 * @example Basic usage
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/me')
 *   @Authenticated()
 *   getMe(@CurrentUser() user: User) {
 *     return user;
 *   }
 * }
 * ```
 * 
 * @example With optional user
 * ```typescript
 * @Get('/greeting')
 * greet(@CurrentUser() user?: User) {
 *   if (user) {
 *     return `Hello, ${user.username}!`;
 *   }
 *   return 'Hello, guest!';
 * }
 * ```
 */
export function CurrentUser(): ParameterDecorator {
  return createParamDecorator<SerializableUser | undefined>(
    (request: FastifyRequest) => request.user as SerializableUser | undefined,
  )();
}

/**
 * @Req Decorator for getting the full request (re-export pattern)
 * Allows access to request.user, request.isAuthenticated(), etc.
 */
export function Req(): ParameterDecorator {
  return createParamDecorator<FastifyRequest>(
    (request: FastifyRequest) => request,
  )();
}
