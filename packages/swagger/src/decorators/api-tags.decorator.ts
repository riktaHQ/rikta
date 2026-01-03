import 'reflect-metadata';
import { API_TAGS_METADATA } from '../constants.js';

/**
 * @ApiTags() decorator
 * 
 * Groups endpoints under one or more tags in the Swagger UI.
 * Tags are used to organize operations in the documentation.
 * 
 * Can be applied to:
 * - Controller classes (applies to all routes in the controller)
 * - Individual route methods (overrides or adds to controller tags)
 * 
 * @param tags - One or more tag names
 * 
 * @example
 * ```typescript
 * @ApiTags('Users', 'Authentication')
 * @Controller('/users')
 * class UserController {
 *   @Get('/')
 *   @ApiTags('Admin') // Adds 'Admin' tag to this specific route
 *   listUsers() { }
 * }
 * ```
 */
export function ApiTags(...tags: string[]): ClassDecorator & MethodDecorator {
  return (
    target: Function | Object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ): void => {
    if (propertyKey !== undefined && descriptor !== undefined) {
      // Method decorator - save on target (prototype)
      const existingTags: string[] = 
        Reflect.getMetadata(API_TAGS_METADATA, target, propertyKey) ?? [];
      Reflect.defineMetadata(
        API_TAGS_METADATA,
        [...existingTags, ...tags],
        target,
        propertyKey
      );
    } else {
      // Class decorator
      const existingTags: string[] = 
        Reflect.getMetadata(API_TAGS_METADATA, target) ?? [];
      Reflect.defineMetadata(
        API_TAGS_METADATA,
        [...existingTags, ...tags],
        target
      );
    }
  };
}

/**
 * Get tags metadata from a class or method
 * @internal
 */
export function getApiTags(target: Function, propertyKey?: string | symbol): string[] {
  if (propertyKey !== undefined) {
    const methodTags: string[] = 
      Reflect.getMetadata(API_TAGS_METADATA, target.prototype, propertyKey) ?? [];
    const classTags: string[] = 
      Reflect.getMetadata(API_TAGS_METADATA, target) ?? [];
    return [...new Set([...classTags, ...methodTags])];
  }
  return Reflect.getMetadata(API_TAGS_METADATA, target) ?? [];
}
