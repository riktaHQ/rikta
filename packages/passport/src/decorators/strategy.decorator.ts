/**
 * @PassportStrategy Decorator
 * 
 * Registers a class as a Passport strategy.
 * 
 * @packageDocumentation
 */

import 'reflect-metadata';
import { PASSPORT_STRATEGY_METADATA, STRATEGY_OPTIONS_METADATA } from '../constants.js';
import type { StrategyMetadata } from '../interfaces/strategy.interface.js';

/**
 * Options for passport strategy registration
 */
export interface PassportStrategyOptions {
  /**
   * Override the default username field
   * @default 'username'
   */
  usernameField?: string;
  
  /**
   * Override the default password field
   * @default 'password'
   */
  passwordField?: string;
  
  /**
   * Pass request to validate callback
   * @default false
   */
  passReqToCallback?: boolean;
  
  /**
   * Additional strategy-specific options
   */
  [key: string]: unknown;
}

/**
 * @PassportStrategy Decorator
 * 
 * Marks a class as a Passport strategy and registers it with the given name.
 * The class should implement a `validate` method that returns the authenticated user.
 * 
 * @param name - Strategy name (e.g., 'local', 'jwt', 'google')
 * @param options - Strategy-specific options
 * 
 * @example Local Strategy
 * ```typescript
 * @Injectable()
 * @PassportStrategy('local')
 * class LocalStrategy {
 *   constructor(private authService: AuthService) {}
 *   
 *   async validate(username: string, password: string) {
 *     const user = await this.authService.validateUser(username, password);
 *     if (!user) throw new UnauthorizedError('Invalid credentials');
 *     return user;
 *   }
 * }
 * ```
 * 
 * @example With custom fields
 * ```typescript
 * @PassportStrategy('local', {
 *   usernameField: 'email',
 *   passwordField: 'pass',
 * })
 * class EmailStrategy {
 *   async validate(email: string, pass: string) {
 *     // ...
 *   }
 * }
 * ```
 */
export function PassportStrategy(
  name: string,
  options?: PassportStrategyOptions,
): ClassDecorator {
  return (target: object): void => {
    const metadata: StrategyMetadata = {
      name,
      options,
    };
    
    Reflect.defineMetadata(PASSPORT_STRATEGY_METADATA, metadata, target);
    
    if (options) {
      Reflect.defineMetadata(STRATEGY_OPTIONS_METADATA, options, target);
    }
    
    // Register the strategy class in a global registry for auto-discovery
    const registry = getStrategyRegistry();
    registry.set(name, target as new (...args: unknown[]) => unknown);
  };
}

/**
 * Global strategy registry for auto-discovery
 */
const strategyRegistry = new Map<string, new (...args: unknown[]) => unknown>();

/**
 * Get the global strategy registry
 */
export function getStrategyRegistry(): Map<string, new (...args: unknown[]) => unknown> {
  return strategyRegistry;
}

/**
 * Check if a class is a passport strategy
 */
export function isPassportStrategy(target: object): boolean {
  return Reflect.hasMetadata(PASSPORT_STRATEGY_METADATA, target);
}

/**
 * Get strategy metadata from a class
 */
export function getStrategyMetadata(target: object): StrategyMetadata | undefined {
  return Reflect.getMetadata(PASSPORT_STRATEGY_METADATA, target);
}

/**
 * Get strategy options from a class
 */
export function getStrategyOptions(target: object): PassportStrategyOptions | undefined {
  return Reflect.getMetadata(STRATEGY_OPTIONS_METADATA, target);
}
