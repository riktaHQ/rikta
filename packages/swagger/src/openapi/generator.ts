import 'reflect-metadata';
import {
  ParamType,
  type RouteDefinition,
  type ControllerMetadata,
  type ParamMetadata,
  // Metadata helper functions
  getControllerMetadata,
  getRoutes,
  getParamMetadata as getCoreParamMetadata,
  getHttpCode,
  getClassMetadata,
  getMethodMetadata,
} from '@riktajs/core';

import {
  API_TAGS_METADATA,
  API_OPERATION_METADATA,
  API_RESPONSE_METADATA,
  API_BODY_METADATA,
  API_PARAM_METADATA,
  API_QUERY_METADATA,
  API_HEADER_METADATA,
  API_SECURITY_METADATA,
  API_EXCLUDE_METADATA,
  API_DEPRECATED_METADATA,
} from '../constants.js';

import type {
  SwaggerConfig,
  OpenApiDocument,
  OpenApiPathItem,
  OpenApiOperation,
  OpenApiSchemaObject,
  OpenApiSecurityScheme,
  OpenApiInfoObject,
  ApiOperationOptions,
  ApiResponseOptions,
  ApiBodyOptions,
  ApiParamOptions,
  ApiQueryOptions,
  ApiHeaderOptions,
  ApiSecurityOptions,
} from '../types.js';

import { zodToOpenApi, toOpenApiSchema } from './zod-to-openapi.js';

// Type alias for any class constructor
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = unknown> = new (...args: any[]) => T;

/**
 * Default swagger config values
 */
const DEFAULT_SWAGGER_CONFIG: SwaggerConfig = {
  info: {
    title: 'API Documentation',
    version: '1.0.0',
  },
};

/**
 * Shorthand config options that allow flat title/version/description
 */
interface OpenApiGeneratorConfig extends Omit<SwaggerConfig, 'info'> {
  /** API title (shorthand for info.title) */
  title?: string;
  /** API version (shorthand for info.version) */
  version?: string;
  /** API description (shorthand for info.description) */
  description?: string;
  /** API contact (shorthand for info.contact) */
  contact?: OpenApiInfoObject['contact'];
  /** API license (shorthand for info.license) */
  license?: OpenApiInfoObject['license'];
  /** API terms of service (shorthand for info.termsOfService) */
  termsOfService?: string;
  /** Full info object (takes precedence over shorthand) */
  info?: OpenApiInfoObject;
}

/**
 * OpenAPI Specification Generator
 * 
 * Collects metadata from controllers and generates a complete
 * OpenAPI 3.0.3 specification document.
 * 
 * @example
 * ```typescript
 * const generator = new OpenApiGenerator({
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 * });
 * 
 * // Add controllers to scan
 * generator.addController(UserController);
 * generator.addController(ProductController);
 * 
 * // Generate the specification
 * const spec = generator.generate();
 * ```
 */
export class OpenApiGenerator {
  private config: SwaggerConfig;
  private controllers: Constructor[] = [];
  private globalSecuritySchemes: Map<string, OpenApiSecurityScheme> = new Map();

  constructor(config: OpenApiGeneratorConfig = {}) {
    // Build info object from shorthand or full info
    const info: OpenApiInfoObject = config.info ?? {
      title: config.title ?? DEFAULT_SWAGGER_CONFIG.info?.title ?? 'API Documentation',
      version: config.version ?? DEFAULT_SWAGGER_CONFIG.info?.version ?? '1.0.0',
      description: config.description,
      contact: config.contact,
      license: config.license,
      termsOfService: config.termsOfService,
    };

    // Extract remaining config (excluding shorthand properties)
    const { title, version, description, contact, license, termsOfService, ...restConfig } = config;
    
    this.config = { 
      ...DEFAULT_SWAGGER_CONFIG, 
      ...restConfig,
      info,
    };
  }

  /**
   * Add a controller to be documented
   */
  addController(controller: Constructor): this {
    this.controllers.push(controller);
    return this;
  }

  /**
   * Add multiple controllers
   */
  addControllers(controllers: Constructor[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  /**
   * Add a global security scheme
   */
  addSecurityScheme(name: string, scheme: OpenApiSecurityScheme): this {
    this.globalSecuritySchemes.set(name, scheme);
    return this;
  }

  /**
   * Generate the OpenAPI specification document
   */
  generate(): OpenApiDocument {
    const paths: Record<string, OpenApiPathItem> = {};
    const tags: Array<{ name: string; description?: string }> = [];
    const seenTags = new Set<string>();

    for (const controller of this.controllers) {
      // Check if controller is excluded
      if (this.isControllerExcluded(controller)) {
        continue;
      }

      const controllerMeta = this.getControllerMeta(controller);
      if (!controllerMeta) continue;

      const controllerTags = this.getControllerTags(controller);
      const controllerDeprecated = this.isControllerDeprecated(controller);

      // Add controller tags to the global tags list
      for (const tag of controllerTags) {
        if (!seenTags.has(tag)) {
          seenTags.add(tag);
          tags.push({ name: tag });
        }
      }

      // Process each route
      const routes = this.getControllerRoutes(controller);
      for (const route of routes) {
        // Check if endpoint is excluded
        if (this.isEndpointExcluded(controller, route.handlerName)) {
          continue;
        }

        const fullPath = this.normalizePath(controllerMeta.prefix, route.path);
        const method = route.method.toLowerCase();

        if (!paths[fullPath]) {
          paths[fullPath] = {};
        }

        const operation = this.buildOperation(
          controller,
          route,
          controllerTags,
          controllerDeprecated
        );

        // Assign operation to the path item using method as key
        (paths[fullPath] as Record<string, OpenApiOperation>)[method] = operation;
      }
    }

    // Build security schemes from global and controller-level definitions
    const securitySchemes = this.buildSecuritySchemes();

    const document: OpenApiDocument = {
      openapi: '3.0.3',
      info: this.config.info!,
      paths,
    };

    if (tags.length > 0) {
      document.tags = tags;
    }

    if (this.config.servers && this.config.servers.length > 0) {
      document.servers = this.config.servers;
    }

    if (Object.keys(securitySchemes).length > 0) {
      document.components = {
        ...document.components,
        securitySchemes,
      };
    }

    if (this.config.externalDocs) {
      document.externalDocs = this.config.externalDocs;
    }

    return document;
  }

  // ============================================================================
  // Private: Metadata Getters (using core helpers)
  // ============================================================================

  private getControllerMeta(controller: Constructor): ControllerMetadata | undefined {
    return getControllerMetadata(controller);
  }

  private getControllerRoutes(controller: Constructor): RouteDefinition[] {
    return getRoutes(controller);
  }

  private getControllerTags(controller: Constructor): string[] {
    return getClassMetadata<string[]>(API_TAGS_METADATA, controller) || [];
  }

  private isControllerExcluded(controller: Constructor): boolean {
    return getClassMetadata<boolean>(API_EXCLUDE_METADATA, controller) === true;
  }

  private isControllerDeprecated(controller: Constructor): boolean {
    return getClassMetadata<boolean>(API_DEPRECATED_METADATA, controller) === true;
  }

  private isEndpointExcluded(controller: Constructor, handlerName: string | symbol): boolean {
    return getMethodMetadata<boolean>(API_EXCLUDE_METADATA, controller, handlerName) === true;
  }

  private isEndpointDeprecated(controller: Constructor, handlerName: string | symbol): boolean {
    const controllerLevel = getClassMetadata<{ deprecated: boolean; message?: string }>(API_DEPRECATED_METADATA, controller);
    const methodLevel = getMethodMetadata<{ deprecated: boolean; message?: string }>(API_DEPRECATED_METADATA, controller, handlerName);
    return controllerLevel?.deprecated === true || methodLevel?.deprecated === true;
  }

  private getOperationMetadata(controller: Constructor, handlerName: string | symbol): ApiOperationOptions | undefined {
    return getMethodMetadata<ApiOperationOptions>(API_OPERATION_METADATA, controller, handlerName);
  }

  private getResponseMetadata(controller: Constructor, handlerName: string | symbol): ApiResponseOptions[] {
    return getMethodMetadata<ApiResponseOptions[]>(API_RESPONSE_METADATA, controller, handlerName) || [];
  }

  private getBodyMetadata(controller: Constructor, handlerName: string | symbol): ApiBodyOptions | undefined {
    return getMethodMetadata<ApiBodyOptions>(API_BODY_METADATA, controller, handlerName);
  }

  private getSwaggerParamMetadata(controller: Constructor, handlerName: string | symbol): ApiParamOptions[] {
    return getMethodMetadata<ApiParamOptions[]>(API_PARAM_METADATA, controller, handlerName) || [];
  }

  private getQueryMetadata(controller: Constructor, handlerName: string | symbol): ApiQueryOptions[] {
    return getMethodMetadata<ApiQueryOptions[]>(API_QUERY_METADATA, controller, handlerName) || [];
  }

  private getHeaderMetadata(controller: Constructor, handlerName: string | symbol): ApiHeaderOptions[] {
    return getMethodMetadata<ApiHeaderOptions[]>(API_HEADER_METADATA, controller, handlerName) || [];
  }

  private getSecurityMetadata(controller: Constructor, handlerName: string | symbol): ApiSecurityOptions[] {
    const controllerLevel = getClassMetadata<ApiSecurityOptions | ApiSecurityOptions[]>(API_SECURITY_METADATA, controller);
    const methodLevel = getMethodMetadata<ApiSecurityOptions | ApiSecurityOptions[]>(API_SECURITY_METADATA, controller, handlerName);
    
    const result: ApiSecurityOptions[] = [];
    
    // Controller level can be a single object or null (to remove security)
    if (controllerLevel && typeof controllerLevel === 'object' && 'name' in controllerLevel) {
      result.push(controllerLevel as ApiSecurityOptions);
    } else if (Array.isArray(controllerLevel)) {
      result.push(...controllerLevel);
    }
    
    // Method level can override or add to controller level
    if (methodLevel && typeof methodLevel === 'object' && 'name' in methodLevel) {
      result.push(methodLevel as ApiSecurityOptions);
    } else if (Array.isArray(methodLevel)) {
      result.push(...methodLevel);
    }
    
    return result;
  }

  private getMethodTags(controller: Constructor, handlerName: string | symbol): string[] | undefined {
    const operation = this.getOperationMetadata(controller, handlerName);
    return operation?.tags;
  }

  private getHttpStatusCode(controller: Constructor, handlerName: string | symbol): number | undefined {
    return getHttpCode(controller, handlerName);
  }

  private getCoreParams(controller: Constructor, handlerName: string | symbol): ParamMetadata[] {
    return getCoreParamMetadata(controller, handlerName);
  }

  // ============================================================================
  // Private: Path Utilities
  // ============================================================================

  private normalizePath(prefix: string, path: string): string {
    // Ensure prefix starts with / and path handling
    let fullPath = '';
    
    if (prefix) {
      fullPath = prefix.startsWith('/') ? prefix : `/${prefix}`;
    }
    
    if (path) {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      fullPath = fullPath + cleanPath;
    }
    
    // Handle root path
    if (!fullPath) {
      fullPath = '/';
    }
    
    // Convert :param to {param} (Fastify to OpenAPI format)
    fullPath = fullPath.replace(/:([^/]+)/g, '{$1}');
    
    // Remove trailing slash (except for root)
    if (fullPath !== '/' && fullPath.endsWith('/')) {
      fullPath = fullPath.slice(0, -1);
    }
    
    return fullPath;
  }

  // ============================================================================
  // Private: Operation Builder
  // ============================================================================

  private buildOperation(
    controller: Constructor,
    route: RouteDefinition,
    controllerTags: string[],
    controllerDeprecated: boolean
  ): OpenApiOperation {
    const handlerName = route.handlerName;
    const operationMeta = this.getOperationMetadata(controller, handlerName);
    const methodTags = this.getMethodTags(controller, handlerName);

    const operation: OpenApiOperation = {
      responses: {},
    };

    // Tags (method level overrides controller level)
    const tags = methodTags || controllerTags;
    if (tags.length > 0) {
      operation.tags = tags;
    }

    // Summary and description from @ApiOperation
    if (operationMeta?.summary) {
      operation.summary = operationMeta.summary;
    }
    if (operationMeta?.description) {
      operation.description = operationMeta.description;
    }
    if (operationMeta?.operationId) {
      operation.operationId = operationMeta.operationId;
    }

    // Deprecated flag
    if (controllerDeprecated || operationMeta?.deprecated || this.isEndpointDeprecated(controller, handlerName)) {
      operation.deprecated = true;
    }

    // Parameters (path, query, header)
    const parameters = this.buildParameters(controller, handlerName, route.path);
    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    // Request body (for POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      const requestBody = this.buildRequestBody(controller, handlerName);
      if (requestBody) {
        operation.requestBody = requestBody;
      }
    }

    // Responses
    operation.responses = this.buildResponses(controller, handlerName, route.statusCode);

    // Security
    const security = this.getSecurityMetadata(controller, handlerName);
    if (security.length > 0) {
      operation.security = security.map(s => ({ [s.name]: s.scopes || [] }));
    }

    return operation;
  }

  private buildParameters(
    controller: Constructor,
    handlerName: string | symbol,
    routePath: string
  ): Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    deprecated?: boolean;
    description?: string;
    schema?: OpenApiSchemaObject;
    example?: unknown;
  }> {
    const parameters: Array<{
      name: string;
      in: 'path' | 'query' | 'header' | 'cookie';
      required?: boolean;
      deprecated?: boolean;
      description?: string;
      schema?: OpenApiSchemaObject;
      example?: unknown;
    }> = [];

    // Extract path parameters from route pattern
    const pathParams = this.extractPathParams(routePath);
    const paramDecorators = this.getSwaggerParamMetadata(controller, handlerName);
    const queryDecorators = this.getQueryMetadata(controller, handlerName);
    const headerDecorators = this.getHeaderMetadata(controller, handlerName);
    const coreParams = this.getCoreParams(controller, handlerName);

    // Add path parameters from decorator metadata or extract from path
    const usedPathParams = new Set<string>();
    for (const param of paramDecorators) {
      usedPathParams.add(param.name);
      const baseSchema = toOpenApiSchema(param.schema);
      const fallbackSchema: OpenApiSchemaObject = { 
        type: (param.type as OpenApiSchemaObject['type']) || 'string' 
      };
      if (param.format) {
        fallbackSchema.format = param.format;
      }
      parameters.push({
        name: param.name,
        in: 'path',
        required: true, // Path params are always required
        deprecated: param.deprecated,
        description: param.description,
        schema: baseSchema || fallbackSchema,
        example: param.example,
      });
    }

    // Add any path parameters not covered by decorators
    for (const paramName of pathParams) {
      if (!usedPathParams.has(paramName)) {
        // Check if there's a Zod schema for this parameter
        const coreParam = coreParams.find(p => p.type === ParamType.PARAM && p.key === paramName);
        const schema = coreParam?.zodSchema ? zodToOpenApi(coreParam.zodSchema) : { type: 'string' as const };
        
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema,
        });
      }
    }

    // Add query parameters
    for (const query of queryDecorators) {
      const baseSchema = toOpenApiSchema(query.schema);
      const fallbackSchema: OpenApiSchemaObject = { 
        type: (query.type as OpenApiSchemaObject['type']) || 'string' 
      };
      if (query.format) {
        fallbackSchema.format = query.format;
      }
      parameters.push({
        name: query.name,
        in: 'query',
        required: query.required,
        deprecated: query.deprecated,
        description: query.description,
        schema: baseSchema || fallbackSchema,
        example: query.example,
      });
    }

    // Add header parameters
    for (const header of headerDecorators) {
      parameters.push({
        name: header.name,
        in: 'header',
        required: header.required,
        deprecated: header.deprecated,
        description: header.description,
        schema: toOpenApiSchema(header.schema) || { 
          type: (header.type as OpenApiSchemaObject['type']) || 'string' 
        },
        example: header.example,
      });
    }

    return parameters;
  }

  private extractPathParams(path: string): string[] {
    const params: string[] = [];
    // Match both :param (Fastify) and {param} (OpenAPI) formats
    const regex = /:([^/]+)|{([^}]+)}/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
      const paramName = match[1] ?? match[2];
      if (paramName) {
        params.push(paramName);
      }
    }
    return params;
  }

  private buildRequestBody(
    controller: Constructor,
    handlerName: string | symbol
  ): {
    description?: string;
    required?: boolean;
    content: Record<string, { schema?: OpenApiSchemaObject; example?: unknown }>;
  } | undefined {
    const bodyMeta = this.getBodyMetadata(controller, handlerName);
    const coreParams = this.getCoreParams(controller, handlerName);
    
    // Check for @ApiBody decorator first
    if (bodyMeta) {
      const schema = toOpenApiSchema(bodyMeta.schema);
      return {
        description: bodyMeta.description,
        required: bodyMeta.required ?? true,
        content: {
          [bodyMeta.type || 'application/json']: {
            schema: bodyMeta.isArray && schema ? { type: 'array', items: schema } : schema,
            example: bodyMeta.example,
          },
        },
      };
    }

    // Fallback: check for @Body() decorator with Zod schema
    const bodyParam = coreParams.find(p => p.type === ParamType.BODY);
    if (bodyParam?.zodSchema) {
      return {
        required: true,
        content: {
          'application/json': {
            schema: zodToOpenApi(bodyParam.zodSchema),
          },
        },
      };
    }

    return undefined;
  }

  private buildResponses(
    controller: Constructor,
    handlerName: string | symbol,
    defaultStatusCode?: number
  ): Record<string, {
    description: string;
    content?: Record<string, { schema?: OpenApiSchemaObject; example?: unknown }>;
  }> {
    const responses: Record<string, {
      description: string;
      content?: Record<string, { schema?: OpenApiSchemaObject; example?: unknown }>;
    }> = {};

    const responseMeta = this.getResponseMetadata(controller, handlerName);
    const httpCode = this.getHttpStatusCode(controller, handlerName);

    if (responseMeta.length > 0) {
      for (const response of responseMeta) {
        const statusCode = response.status.toString();
        const schema = toOpenApiSchema(response.schema);

        responses[statusCode] = {
          description: response.description || this.getDefaultStatusDescription(response.status),
        };

        if (schema || response.example) {
          responses[statusCode].content = {
            [response.type || 'application/json']: {
              schema: response.isArray && schema ? { type: 'array', items: schema } : schema,
              example: response.example,
            },
          };
        }
      }
    } else {
      // Add default response based on HTTP code
      const status = (httpCode || defaultStatusCode || 200).toString();
      responses[status] = {
        description: this.getDefaultStatusDescription(Number(status)),
      };
    }

    return responses;
  }

  private getDefaultStatusDescription(status: number): string {
    const descriptions: Record<number, string> = {
      200: 'Successful response',
      201: 'Resource created successfully',
      204: 'No content',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      409: 'Conflict',
      422: 'Unprocessable entity',
      500: 'Internal server error',
    };
    return descriptions[status] || 'Response';
  }

  private buildSecuritySchemes(): Record<string, {
    type: string;
    description?: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: unknown;
  }> {
    const schemes: Record<string, {
      type: string;
      description?: string;
      name?: string;
      in?: string;
      scheme?: string;
      bearerFormat?: string;
      flows?: unknown;
    }> = {};

    for (const [name, options] of this.globalSecuritySchemes) {
      schemes[name] = {
        type: options.type,
        description: options.description,
      };

      if (options.type === 'apiKey') {
        schemes[name].name = options.name;
        schemes[name].in = options.in;
      } else if (options.type === 'http') {
        schemes[name].scheme = options.scheme;
        if (options.bearerFormat) {
          schemes[name].bearerFormat = options.bearerFormat;
        }
      } else if (options.type === 'oauth2' && options.flows) {
        schemes[name].flows = options.flows;
      }
    }

    return schemes;
  }
}

/**
 * Create a new OpenAPI generator instance
 */
export function createOpenApiGenerator(config?: Partial<SwaggerConfig>): OpenApiGenerator {
  return new OpenApiGenerator(config);
}
