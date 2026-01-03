import 'reflect-metadata';
import { API_PROPERTY_METADATA } from '../constants.js';
import type { ApiPropertyOptions } from '../types.js';

/**
 * Stored property metadata structure
 */
interface StoredPropertyMetadata {
  propertyKey: string | symbol;
  options: ApiPropertyOptions;
}

/**
 * @ApiProperty() decorator
 * 
 * Documents a property of a DTO class for schema generation.
 * Used when you want to manually define schema properties instead of using Zod.
 * 
 * @param options - Property options including type, description, and validation rules
 * 
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @ApiProperty({
 *     description: 'User email address',
 *     type: 'string',
 *     format: 'email',
 *     example: 'user@example.com',
 *     required: true,
 *   })
 *   email!: string;
 * 
 *   @ApiProperty({
 *     description: 'User age',
 *     type: 'integer',
 *     minimum: 0,
 *     maximum: 150,
 *     required: false,
 *   })
 *   age?: number;
 * 
 *   @ApiProperty({
 *     description: 'User role',
 *     enum: ['admin', 'user', 'guest'],
 *     default: 'user',
 *   })
 *   role!: string;
 * }
 * ```
 */
export function ApiProperty(options: ApiPropertyOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {
    const existingProperties: StoredPropertyMetadata[] =
      Reflect.getMetadata(API_PROPERTY_METADATA, target.constructor) ?? [];
    
    Reflect.defineMetadata(
      API_PROPERTY_METADATA,
      [...existingProperties, { propertyKey, options }],
      target.constructor
    );
  };
}

/**
 * @ApiPropertyOptional() decorator
 * 
 * Shorthand for @ApiProperty({ required: false }).
 * Marks a property as optional in the schema.
 */
export function ApiPropertyOptional(
  options: Omit<ApiPropertyOptions, 'required'> = {}
): PropertyDecorator {
  return ApiProperty({ ...options, required: false });
}

/**
 * @ApiHideProperty() decorator
 * 
 * Excludes a property from the generated schema.
 * Useful for internal properties that shouldn't be documented.
 */
export function ApiHideProperty(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol): void => {
    const existingProperties: StoredPropertyMetadata[] =
      Reflect.getMetadata(API_PROPERTY_METADATA, target.constructor) ?? [];
    
    // Add property with special flag to hide it
    Reflect.defineMetadata(
      API_PROPERTY_METADATA,
      [...existingProperties, { propertyKey, options: { _hidden: true } as ApiPropertyOptions }],
      target.constructor
    );
  };
}

/**
 * Get all property metadata from a class
 * @internal
 */
export function getApiProperties(target: Function): StoredPropertyMetadata[] {
  return Reflect.getMetadata(API_PROPERTY_METADATA, target) ?? [];
}
