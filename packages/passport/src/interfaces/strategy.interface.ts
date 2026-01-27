/**
 * Strategy Interface
 * 
 * Base interface for Passport strategies in Rikta.
 */

import type { Strategy as PassportStrategy } from 'passport';

/**
 * Base user type - any object with an id
 */
export interface BaseUser {
  id: string | number;
}

/**
 * User type for serialization - allows any additional properties
 */
export interface SerializableUser extends BaseUser {
  [key: string]: unknown;
}

/**
 * Done callback for Passport strategies
 */
export type DoneCallback<TUser = SerializableUser> = (
  error: Error | null,
  user?: TUser | false,
  info?: { message: string } | unknown,
) => void;

/**
 * Strategy interface for custom Passport strategies
 * 
 * @example
 * ```typescript
 * @Injectable()
 * @PassportStrategy('custom')
 * class CustomStrategy implements StrategyInterface<User> {
 *   async validate(token: string): Promise<User> {
 *     // Validate and return user
 *     return user;
 *   }
 * }
 * ```
 */
export interface StrategyInterface<TUser = SerializableUser> {
  /**
   * The name of the strategy
   */
  readonly name?: string;
  
  /**
   * Validate method called during authentication.
   * Should return the user object if valid, throw an error if invalid.
   */
  validate(...args: unknown[]): Promise<TUser> | TUser;
}

/**
 * Authenticator service interface for validating credentials
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class AuthService implements AuthenticatorService {
 *   async validateUser(username: string, password: string) {
 *     const user = await this.userRepo.findByUsername(username);
 *     if (user && await bcrypt.compare(password, user.password)) {
 *       return { id: user.id, username: user.username };
 *     }
 *     return null;
 *   }
 * }
 * ```
 */
export interface AuthenticatorService<TUser = SerializableUser> {
  /**
   * Validate user credentials
   * @returns User object if valid, null if invalid
   */
  validateUser(username: string, password: string): Promise<TUser | null>;
}

/**
 * Strategy metadata stored by @PassportStrategy decorator
 */
export interface StrategyMetadata {
  /**
   * Strategy name for Passport registration
   */
  name: string;
  
  /**
   * Strategy options
   */
  options?: Record<string, unknown>;
}

/**
 * Strategy class type for registration
 */
export type StrategyClass = new (...args: unknown[]) => StrategyInterface | PassportStrategy;
