/**
 * Local Strategy Base
 * 
 * Base class for implementing local (username/password) authentication.
 * 
 * @packageDocumentation
 */

import { Strategy as PassportLocalStrategy } from 'passport-local';
import type { BaseUser, DoneCallback } from '../interfaces/strategy.interface.js';
import { AuthenticationError } from '../errors.js';
import { getStrategyOptions, type PassportStrategyOptions } from '../decorators/strategy.decorator.js';

/**
 * Local strategy options
 */
export interface LocalStrategyOptions extends PassportStrategyOptions {
  /**
   * Field name for username in request body
   * @default 'username'
   */
  usernameField?: string;
  
  /**
   * Field name for password in request body
   * @default 'password'
   */
  passwordField?: string;
}

/**
 * LocalStrategyBase
 * 
 * Abstract base class for local (username/password) authentication strategies.
 * Extend this class and implement the `validate` method.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * @PassportStrategy('local')
 * class LocalStrategy extends LocalStrategyBase {
 *   @Autowired()
 *   private authService!: AuthService;
 *   
 *   async validate(username: string, password: string) {
 *     const user = await this.authService.validateUser(username, password);
 *     if (!user) {
 *       throw new Error('Invalid credentials');
 *     }
 *     return user;
 *   }
 * }
 * ```
 * 
 * @example With email instead of username
 * ```typescript
 * @Injectable()
 * @PassportStrategy('local', { usernameField: 'email' })
 * class EmailStrategy extends LocalStrategyBase {
 *   async validate(email: string, password: string) {
 *     // email is passed as the first argument
 *     return this.authService.validateByEmail(email, password);
 *   }
 * }
 * ```
 */
export abstract class LocalStrategyBase<TUser extends BaseUser = BaseUser> {
  /**
   * The underlying Passport strategy instance
   */
  private _strategy: PassportLocalStrategy | null = null;
  
  /**
   * Get the Passport strategy instance
   * Creates it lazily on first access
   */
  getStrategy(): PassportLocalStrategy {
    if (!this._strategy) {
      this._strategy = this.createStrategy();
    }
    return this._strategy;
  }
  
  /**
   * Create the Passport strategy instance
   */
  private createStrategy(): PassportLocalStrategy {
    // Get options from decorator
    const decoratorOptions = getStrategyOptions(this.constructor) as LocalStrategyOptions | undefined;
    
    const usernameField = decoratorOptions?.usernameField ?? 'username';
    const passwordField = decoratorOptions?.passwordField ?? 'password';
    
    // Create strategy with proper typing - cast callback to avoid complex overload issues
    const strategy = new PassportLocalStrategy(
      {
        usernameField,
        passwordField,
      },
      (username: string, password: string, done) => {
        this.validateCallback(username, password, done as DoneCallback<TUser>);
      },
    );
    
    return strategy;
  }
  
  /**
   * Internal callback that wraps the validate method
   */
  private async validateCallback(
    username: string,
    password: string,
    done: DoneCallback<TUser>,
  ): Promise<void> {
    try {
      const user = await this.validate(username, password);
      
      if (!user) {
        done(null, false, { message: 'Invalid credentials' });
        return;
      }
      
      done(null, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        done(null, false, { message: error.message });
        return;
      }
      
      if (error instanceof Error) {
        done(null, false, { message: error.message });
        return;
      }
      
      done(new Error('Authentication failed'), false);
    }
  }
  
  /**
   * Validate user credentials
   * 
   * Override this method to implement your authentication logic.
   * Return the user object if credentials are valid, or throw an error.
   * 
   * @param username - Username from request
   * @param password - Password from request
   * @returns User object if valid
   * @throws Error if invalid
   */
  abstract validate(username: string, password: string): Promise<TUser> | TUser;
}
