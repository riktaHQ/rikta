import 'reflect-metadata';
import { API_PARAM_METADATA } from '../constants.js';
import type { ApiParamOptions } from '../types.js';

/**
 * @ApiParam() decorator
 * 
 * Documents a path parameter for an API operation.
 * Multiple @ApiParam decorators can be applied for routes with multiple parameters.
 * 
 * @param options - Parameter options including name, description, and type
 * 
 * @example
 * ```typescript
 * @Get('/:userId/posts/:postId')
 * @ApiParam({ name: 'userId', description: 'User ID', type: 'string', format: 'uuid' })
 * @ApiParam({ name: 'postId', description: 'Post ID', type: 'integer' })
 * getUserPost(
 *   @Param('userId') userId: string,
 *   @Param('postId') postId: number
 * ) { }
 * ```
 */
export function ApiParam(options: ApiParamOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const existingParams: ApiParamOptions[] =
      Reflect.getMetadata(API_PARAM_METADATA, target, propertyKey) ?? [];
    
    Reflect.defineMetadata(
      API_PARAM_METADATA,
      [...existingParams, { ...options, required: options.required ?? true }],
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Get all path parameter metadata from a method
 * @internal
 */
export function getApiParams(
  target: Function,
  propertyKey: string | symbol
): ApiParamOptions[] {
  return Reflect.getMetadata(API_PARAM_METADATA, target.prototype, propertyKey) ?? [];
}
