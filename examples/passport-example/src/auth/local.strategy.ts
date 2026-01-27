/**
 * Local Strategy
 *
 * Implements username/password authentication using Passport.
 */

import { Injectable, Autowired } from '@riktajs/core';
import { PassportStrategy, LocalStrategyBase } from '@riktajs/passport';
import { AuthService } from './auth.service.js';
import { User } from '../users/users.service.js';

@Injectable()
@PassportStrategy('local')
export class LocalStrategy extends LocalStrategyBase<User> {
  @Autowired()
  private authService!: AuthService;

  /**
   * Validate user credentials
   * 
   * This method is called by Passport when authenticating.
   * It should return the user object if valid, or throw an error.
   * 
   * @param username - Username from request body
   * @param password - Password from request body
   * @returns User object if credentials are valid
   * @throws Error if credentials are invalid
   */
  async validate(username: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(username, password);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    return user;
  }
}
