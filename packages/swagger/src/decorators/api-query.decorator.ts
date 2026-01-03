import 'reflect-metadata';
import { API_QUERY_METADATA } from '../constants.js';
import type { ApiQueryOptions } from '../types.js';

/**
 * @ApiQuery() decorator
 * 
 * Documents a query parameter for an API operation.
 * Multiple @ApiQuery decorators can be applied for routes with multiple query parameters.
 * 
 * @param options - Query parameter options including name, description, and type
 * 
 * @example
 * ```typescript
 * @Get('/')
 * @ApiQuery({ name: 'page', description: 'Page number', type: 'integer', required: false })
 * @ApiQuery({ name: 'limit', description: 'Items per page', type: 'integer', required: false })
 * @ApiQuery({ name: 'sort', description: 'Sort order', enum: ['asc', 'desc'] })
 * listUsers(
 *   @Query('page') page?: number,
 *   @Query('limit') limit?: number,
 *   @Query('sort') sort?: string
 * ) { }
 * ```
 */
export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const existingQueries: ApiQueryOptions[] =
      Reflect.getMetadata(API_QUERY_METADATA, target, propertyKey) ?? [];
    
    Reflect.defineMetadata(
      API_QUERY_METADATA,
      [...existingQueries, { ...options, required: options.required ?? false }],
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Get all query parameter metadata from a method
 * @internal
 */
export function getApiQueries(
  target: Function,
  propertyKey: string | symbol
): ApiQueryOptions[] {
  return Reflect.getMetadata(API_QUERY_METADATA, target.prototype, propertyKey) ?? [];
}
