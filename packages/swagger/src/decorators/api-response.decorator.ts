import 'reflect-metadata';
import { API_RESPONSE_METADATA } from '../constants.js';
import type { ApiResponseOptions } from '../types.js';

/**
 * @ApiResponse() decorator
 * 
 * Documents a possible response for an API operation.
 * Multiple @ApiResponse decorators can be applied to document different response scenarios.
 * 
 * @param options - Response options including status code, description, and schema
 * 
 * @example
 * ```typescript
 * @Get('/:id')
 * @ApiResponse({ status: 200, description: 'User found', schema: UserSchema })
 * @ApiResponse({ status: 404, description: 'User not found' })
 * @ApiResponse({ status: 500, description: 'Internal server error' })
 * getUser(@Param('id') id: string) { }
 * ```
 */
export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const existingResponses: ApiResponseOptions[] =
      Reflect.getMetadata(API_RESPONSE_METADATA, target, propertyKey) ?? [];
    
    Reflect.defineMetadata(
      API_RESPONSE_METADATA,
      [...existingResponses, options],
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * @ApiOkResponse() - Shorthand for 200 OK response
 */
export function ApiOkResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 200 });
}

/**
 * @ApiCreatedResponse() - Shorthand for 201 Created response
 */
export function ApiCreatedResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 201 });
}

/**
 * @ApiAcceptedResponse() - Shorthand for 202 Accepted response
 */
export function ApiAcceptedResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 202 });
}

/**
 * @ApiNoContentResponse() - Shorthand for 204 No Content response
 */
export function ApiNoContentResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 204 });
}

/**
 * @ApiBadRequestResponse() - Shorthand for 400 Bad Request response
 */
export function ApiBadRequestResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 400, description: options.description ?? 'Bad Request' });
}

/**
 * @ApiUnauthorizedResponse() - Shorthand for 401 Unauthorized response
 */
export function ApiUnauthorizedResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 401, description: options.description ?? 'Unauthorized' });
}

/**
 * @ApiForbiddenResponse() - Shorthand for 403 Forbidden response
 */
export function ApiForbiddenResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 403, description: options.description ?? 'Forbidden' });
}

/**
 * @ApiNotFoundResponse() - Shorthand for 404 Not Found response
 */
export function ApiNotFoundResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 404, description: options.description ?? 'Not Found' });
}

/**
 * @ApiConflictResponse() - Shorthand for 409 Conflict response
 */
export function ApiConflictResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 409, description: options.description ?? 'Conflict' });
}

/**
 * @ApiUnprocessableEntityResponse() - Shorthand for 422 Unprocessable Entity response
 */
export function ApiUnprocessableEntityResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 422, description: options.description ?? 'Unprocessable Entity' });
}

/**
 * @ApiInternalServerErrorResponse() - Shorthand for 500 Internal Server Error response
 */
export function ApiInternalServerErrorResponse(
  options: Omit<ApiResponseOptions, 'status'> = {}
): MethodDecorator {
  return ApiResponse({ ...options, status: 500, description: options.description ?? 'Internal Server Error' });
}

/**
 * Get all response metadata from a method
 * @internal
 */
export function getApiResponses(
  target: Function,
  propertyKey: string | symbol
): ApiResponseOptions[] {
  return Reflect.getMetadata(API_RESPONSE_METADATA, target.prototype, propertyKey) ?? [];
}
