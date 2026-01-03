import 'reflect-metadata';
import { API_HEADER_METADATA } from '../constants.js';
import type { ApiHeaderOptions } from '../types.js';

/**
 * @ApiHeader() decorator
 * 
 * Documents a header parameter for an API operation.
 * Multiple @ApiHeader decorators can be applied for routes with multiple headers.
 * 
 * @param options - Header options including name, description, and required flag
 * 
 * @example
 * ```typescript
 * @Get('/')
 * @ApiHeader({ name: 'X-Request-ID', description: 'Unique request identifier', required: true })
 * @ApiHeader({ name: 'X-Correlation-ID', description: 'Correlation ID for tracing' })
 * listUsers() { }
 * ```
 */
export function ApiHeader(options: ApiHeaderOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const existingHeaders: ApiHeaderOptions[] =
      Reflect.getMetadata(API_HEADER_METADATA, target, propertyKey) ?? [];
    
    Reflect.defineMetadata(
      API_HEADER_METADATA,
      [...existingHeaders, options],
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Get all header parameter metadata from a method
 * @internal
 */
export function getApiHeaders(
  target: Function,
  propertyKey: string | symbol
): ApiHeaderOptions[] {
  return Reflect.getMetadata(API_HEADER_METADATA, target.prototype, propertyKey) ?? [];
}
