import 'reflect-metadata';
import { API_BODY_METADATA } from '../constants.js';
import type { ApiBodyOptions } from '../types.js';

/**
 * @ApiBody() decorator
 * 
 * Documents the request body for an API operation.
 * Supports both Zod schemas and OpenAPI schema objects.
 * 
 * @param options - Body options including schema, description, and examples
 * 
 * @example
 * ```typescript
 * const CreateUserSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 * });
 * 
 * @Post('/')
 * @ApiBody({
 *   description: 'User creation data',
 *   schema: CreateUserSchema,
 *   required: true,
 * })
 * createUser(@Body() data: z.infer<typeof CreateUserSchema>) { }
 * ```
 */
export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    Reflect.defineMetadata(
      API_BODY_METADATA,
      { ...options, required: options.required ?? true },
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Get body metadata from a method
 * @internal
 */
export function getApiBody(
  target: Function,
  propertyKey: string | symbol
): ApiBodyOptions | undefined {
  return Reflect.getMetadata(API_BODY_METADATA, target.prototype, propertyKey);
}
