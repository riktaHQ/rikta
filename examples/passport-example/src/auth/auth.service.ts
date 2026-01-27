/**
 * Auth Service
 *
 * Handles authentication logic.
 */

import { Injectable, Autowired } from '@riktajs/core';
import { UsersService, User } from '../users/users.service.js';

@Injectable()
export class AuthService {
  @Autowired()
  private usersService!: UsersService;

  /**
   * Validate user credentials
   * @returns User object if valid, null otherwise
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    return this.usersService.validateCredentials(username, password);
  }

  /**
   * Find user by ID (for deserialization)
   */
  async findUserById(id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }
}
