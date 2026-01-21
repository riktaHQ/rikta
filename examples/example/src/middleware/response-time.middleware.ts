/**
 * Request Timing Middleware
 * 
 * Adds response timing headers to all requests.
 * Useful for performance monitoring and debugging.
 */
import { Middleware, RiktaMiddleware, NextFunction, FastifyRequest, FastifyReply } from '@riktajs/core';

@Middleware()
export class ResponseTimeMiddleware implements RiktaMiddleware {
  use(_req: FastifyRequest, res: FastifyReply, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    
    res.raw.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationNs = endTime - startTime;
      const durationMs = Number(durationNs) / 1_000_000;
      
      // Note: Headers are already sent by this point in Fastify,
      // but we can still log the timing
      if (!res.raw.headersSent) {
        res.header('X-Response-Time', `${durationMs.toFixed(2)}ms`);
      }
    });
    
    // Set the header before response is sent
    const originalSend = res.send.bind(res);
    let startTracked = false;
    
    res.send = function(payload?: unknown) {
      if (!startTracked) {
        const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        res.header('X-Response-Time', `${duration.toFixed(2)}ms`);
        startTracked = true;
      }
      return originalSend(payload);
    };
    
    next();
  }
}
