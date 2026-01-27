/**
 * User Service
 *
 * Provides user data access.
 * In production, replace with database queries.
 */

import { Injectable } from '@riktajs/core';

/**
 * User entity
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

/**
 * Internal user with password (never expose to client)
 */
interface InternalUser extends User {
  password: string;
}

@Injectable()
export class UsersService {
  /**
   * In-memory user store
   * In production, use a database
   */
  private readonly users: InternalUser[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123', // In production, hash with bcrypt
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
      role: 'user',
      createdAt: new Date('2024-01-15'),
    },
  ];

  /**
   * Find all users (without passwords)
   */
  findAll(): User[] {
    return this.users.map(({ password: _, ...user }) => user);
  }

  /**
   * Find user by ID (without password)
   */
  findById(id: string): User | null {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Find user by username (with password for authentication)
   * @internal
   */
  findByUsernameWithPassword(username: string): InternalUser | null {
    return this.users.find(u => u.username === username) || null;
  }

  /**
   * Validate user credentials
   * Returns user without password if valid, null otherwise
   */
  async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = this.findByUsernameWithPassword(username);
    
    if (!user) {
      return null;
    }
    
    // In production, use bcrypt.compare(password, user.passwordHash)
    if (user.password !== password) {
      return null;
    }
    
    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }
}
