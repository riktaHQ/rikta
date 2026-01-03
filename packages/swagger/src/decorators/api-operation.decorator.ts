import 'reflect-metadata';
import { API_OPERATION_METADATA } from '../constants.js';
import type { ApiOperationOptions } from '../types.js';

/**
 * @ApiOperation() decorator
 * 
 * Describes a single API operation (endpoint) with summary, description,
 * and other OpenAPI operation metadata.
 * 
 * @param options - Operation options
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/:id')
 *   @ApiOperation({
 *     summary: 'Get user by ID',
 *     description: 'Retrieves a single user by their unique identifier',
 *     operationId: 'getUserById',
 *     deprecated: false,
 *   })
 *   getUser(@Param('id') id: string) { }
 * }
 * ```
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    Reflect.defineMetadata(
      API_OPERATION_METADATA,
      options,
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Get operation metadata from a method
 * @internal
 */
export function getApiOperation(
  target: Function,
  propertyKey: string | symbol
): ApiOperationOptions | undefined {
  return Reflect.getMetadata(API_OPERATION_METADATA, target.prototype, propertyKey);
}
