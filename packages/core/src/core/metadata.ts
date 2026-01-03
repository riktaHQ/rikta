import 'reflect-metadata';
import {
  CONTROLLER_METADATA,
  ROUTES_METADATA,
  PARAM_METADATA,
  HTTP_CODE_METADATA,
  GUARDS_METADATA,
  ZOD_SCHEMA_METADATA,
} from './constants';
import type { RouteDefinition, ControllerMetadata } from './types';
import type { ParamMetadata } from './decorators/param.decorator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = unknown> = new (...args: any[]) => T;

// ============================================================================
// Controller Metadata
// ============================================================================

/**
 * Get controller metadata (path prefix, etc.)
 */
export function getControllerMetadata(target: Constructor): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA, target);
}

/**
 * Check if a class is a controller
 */
export function isController(target: Constructor): boolean {
  return Reflect.hasMetadata(CONTROLLER_METADATA, target);
}

/**
 * Get controller path prefix
 */
export function getControllerPath(target: Constructor): string {
  const meta = getControllerMetadata(target);
  return meta?.prefix ?? '';
}

// ============================================================================
// Route Metadata
// ============================================================================

/**
 * Get all routes defined on a controller
 */
export function getRoutes(target: Constructor): RouteDefinition[] {
  return Reflect.getMetadata(ROUTES_METADATA, target) || [];
}

/**
 * Check if a controller has any routes
 */
export function hasRoutes(target: Constructor): boolean {
  const routes = getRoutes(target);
  return routes.length > 0;
}

// ============================================================================
// Parameter Metadata
// ============================================================================

/**
 * Get parameter metadata for a specific method
 */
export function getParamMetadata(
  target: Constructor,
  methodName: string | symbol
): ParamMetadata[] {
  return Reflect.getMetadata(PARAM_METADATA, target.prototype, methodName) || [];
}

/**
 * Get parameter metadata by index
 */
export function getParamMetadataByIndex(
  target: Constructor,
  methodName: string | symbol,
  paramIndex: number
): ParamMetadata | undefined {
  const params = getParamMetadata(target, methodName);
  return params.find(p => p.index === paramIndex);
}

// ============================================================================
// HTTP Code Metadata
// ============================================================================

/**
 * Get custom HTTP status code for a method
 */
export function getHttpCode(
  target: Constructor,
  methodName: string | symbol
): number | undefined {
  return Reflect.getMetadata(HTTP_CODE_METADATA, target.prototype, methodName);
}

// ============================================================================
// Guards Metadata
// ============================================================================

/**
 * Get guards for a controller or method
 */
export function getGuards(
  target: Constructor,
  methodName?: string | symbol
): Function[] {
  if (methodName) {
    // Method-level guards
    const methodGuards = Reflect.getMetadata(GUARDS_METADATA, target.prototype, methodName) || [];
    // Controller-level guards
    const controllerGuards = Reflect.getMetadata(GUARDS_METADATA, target) || [];
    return [...controllerGuards, ...methodGuards];
  }
  // Controller-level only
  return Reflect.getMetadata(GUARDS_METADATA, target) || [];
}

// ============================================================================
// Zod Schema Metadata
// ============================================================================

/**
 * Get Zod schema metadata for a method parameter
 */
export function getZodSchema(
  target: Constructor,
  methodName: string | symbol
): unknown {
  return Reflect.getMetadata(ZOD_SCHEMA_METADATA, target.prototype, methodName);
}

// ============================================================================
// Generic Metadata Access
// ============================================================================

/**
 * Get any metadata from a class
 */
export function getClassMetadata<T = unknown>(
  metadataKey: symbol,
  target: Constructor
): T | undefined {
  return Reflect.getMetadata(metadataKey, target);
}

/**
 * Get any metadata from a method
 */
export function getMethodMetadata<T = unknown>(
  metadataKey: symbol,
  target: Constructor,
  methodName: string | symbol
): T | undefined {
  return Reflect.getMetadata(metadataKey, target.prototype, methodName);
}

/**
 * Check if a class has specific metadata
 */
export function hasClassMetadata(
  metadataKey: symbol,
  target: Constructor
): boolean {
  return Reflect.hasMetadata(metadataKey, target);
}

/**
 * Check if a method has specific metadata
 */
export function hasMethodMetadata(
  metadataKey: symbol,
  target: Constructor,
  methodName: string | symbol
): boolean {
  return Reflect.hasMetadata(metadataKey, target.prototype, methodName);
}

/**
 * Get all method names that have a specific metadata key
 */
export function getMethodsWithMetadata(
  metadataKey: symbol,
  target: Constructor
): (string | symbol)[] {
  const methods: (string | symbol)[] = [];
  const prototype = target.prototype;
  
  // Get all property names including symbols
  const propertyNames = Object.getOwnPropertyNames(prototype);
  const propertySymbols = Object.getOwnPropertySymbols(prototype);
  
  for (const name of [...propertyNames, ...propertySymbols]) {
    if (name !== 'constructor' && Reflect.hasMetadata(metadataKey, prototype, name)) {
      methods.push(name);
    }
  }
  
  return methods;
}
