import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Next function type
 * Call this to pass control to the next middleware/handler
 */
export type NextFunction = () => void | Promise<void>;

/**
 * RiktaMiddleware Interface
 * 
 * Middleware implementing this interface can intercept requests
 * after guards have been executed and before the route handler runs.
 * 
 * Middleware has access to the raw Fastify Request and Reply objects,
 * making it ideal for cross-cutting concerns like logging, request
 * transformation, or adding custom properties to the request.
 * 
 * @example Basic logging middleware
 * ```typescript
 * import { Injectable } from '@riktajs/core';
 * import type { RiktaMiddleware, NextFunction } from '@riktajs/core';
 * import type { FastifyRequest, FastifyReply } from 'fastify';
 * 
 * @Injectable()
 * export class LoggerMiddleware implements RiktaMiddleware {
 *   use(req: FastifyRequest, res: FastifyReply, next: NextFunction): void {
 *     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
 *     next();
 *   }
 * }
 * ```
 * 
 * @example Async middleware with request transformation
 * ```typescript
 * @Injectable()
 * export class RequestIdMiddleware implements RiktaMiddleware {
 *   async use(req: FastifyRequest, res: FastifyReply, next: NextFunction): Promise<void> {
 *     // Add a unique request ID
 *     (req as any).requestId = crypto.randomUUID();
 *     
 *     // Add response header
 *     res.header('X-Request-Id', (req as any).requestId);
 *     
 *     await next();
 *   }
 * }
 * ```
 * 
 * @example Middleware with service injection
 * ```typescript
 * @Injectable()
 * export class AuthMiddleware implements RiktaMiddleware {
 *   constructor(private authService: AuthService) {}
 * 
 *   async use(req: FastifyRequest, res: FastifyReply, next: NextFunction): Promise<void> {
 *     const token = req.headers.authorization?.replace('Bearer ', '');
 *     
 *     if (token) {
 *       try {
 *         (req as any).user = await this.authService.decodeToken(token);
 *       } catch {
 *         // Token invalid, continue without user
 *       }
 *     }
 *     
 *     await next();
 *   }
 * }
 * ```
 */
export interface RiktaMiddleware {
  /**
   * Process the request/response.
   * 
   * @param req - The Fastify request object
   * @param res - The Fastify reply object
   * @param next - Function to call to pass control to the next middleware/handler
   * 
   * IMPORTANT: You MUST call `next()` to continue the request pipeline.
   * If you don't call `next()`, the request will hang.
   * 
   * Can be synchronous or return a Promise for async operations.
   */
  use(
    req: FastifyRequest,
    res: FastifyReply,
    next: NextFunction
  ): void | Promise<void>;
}
