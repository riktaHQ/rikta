/**
 * @riktajs/passport
 * 
 * PassportJS authentication integration for Rikta Framework.
 * 
 * Features:
 * - @Authenticated decorator for protecting routes
 * - @PassportStrategy decorator for registering strategies
 * - AuthGuard for guard-based route protection
 * - LocalStrategyBase for username/password authentication
 * - Session management via @fastify/secure-session
 * 
 * @example Quick Start
 * ```typescript
 * import { Rikta, Controller, Get, Injectable, Autowired } from '@riktajs/core';
 * import {
 *   passportPlugin,
 *   PassportStrategy,
 *   LocalStrategyBase,
 *   Authenticated,
 *   AuthGuard,
 *   CurrentUser,
 * } from '@riktajs/passport';
 * 
 * // 1. Register plugin
 * const app = await Rikta.create({ port: 3000 });
 * await app.server.register(passportPlugin, {
 *   secret: 'your-32-character-secret-key-here',
 * });
 * 
 * // 2. Create strategy
 * @Injectable()
 * @PassportStrategy('local')
 * class LocalStrategy extends LocalStrategyBase {
 *   async validate(username: string, password: string) {
 *     if (username === 'admin' && password === 'admin') {
 *       return { id: '1', username: 'admin' };
 *     }
 *     throw new Error('Invalid credentials');
 *   }
 * }
 * 
 * // 3. Protect routes
 * @Controller('/api')
 * class ApiController {
 *   @Get('/profile')
 *   @Authenticated()
 *   getProfile(@CurrentUser() user: User) {
 *     return { user };
 *   }
 * }
 * ```
 * 
 * @packageDocumentation
 */

// Constants
export * from './constants.js';

// Errors
export * from './errors.js';

// Interfaces
export * from './interfaces/index.js';

// Plugin
export {
  passportPlugin,
  registerPassport,
  type Authenticator,
} from './passport.plugin.js';

// Decorators
export {
  Authenticated,
  isAuthenticated,
  getAuthenticatedOptions,
  type AuthenticatedOptions,
  PassportStrategy,
  getStrategyRegistry,
  isPassportStrategy,
  getStrategyMetadata,
  getStrategyOptions,
  type PassportStrategyOptions,
  CurrentUser,
  Req,
} from './decorators/index.js';

// Guards
export { AuthGuard, StrictAuthGuard } from './guards/index.js';

// Strategies
export { LocalStrategyBase, type LocalStrategyOptions } from './strategies/index.js';
