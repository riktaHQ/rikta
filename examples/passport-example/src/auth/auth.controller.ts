/**
 * Auth Controller
 *
 * Handles authentication endpoints: login, logout, profile.
 */

import { 
  Controller, 
  Get, 
  Post, 
  Body,
  HttpCode,
  Autowired,
  BadRequestException,
} from '@riktajs/core';
import { 
  Authenticated, 
  CurrentUser,
  UnauthorizedError,
} from '@riktajs/passport';
import { AuthService } from './auth.service.js';
import { User } from '../users/users.service.js';

/**
 * Login request body
 */
interface LoginDto {
  username: string;
  password: string;
}

@Controller('/auth')
export class AuthController {
  @Autowired()
  private authService!: AuthService;

  /**
   * POST /auth/login
   * Authenticate user with username and password
   */
  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    // We need to use 'any' here due to Fastify's complex typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: any,
  ): Promise<{ message: string; user: User }> {
    // Validate request body
    if (!body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }

    // Validate credentials
    const user = await this.authService.validateUser(body.username, body.password);
    
    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Create session (login)
    return new Promise((resolve, reject) => {
      const req = request.raw || request;
      
      // Use Fastify's logIn method
      if (typeof request.logIn === 'function') {
        request.logIn(user, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              message: 'Login successful',
              user,
            });
          }
        });
      } else {
        // Fallback: just return the user (session might not be set up)
        resolve({
          message: 'Login successful',
          user,
        });
      }
    });
  }

  /**
   * POST /auth/logout
   * End the current session
   */
  @Post('/logout')
  @HttpCode(200)
  @Authenticated()
  async logout(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: any,
  ): Promise<{ message: string }> {
    return new Promise((resolve) => {
      if (typeof request.logOut === 'function') {
        request.logOut(() => {
          resolve({ message: 'Logout successful' });
        });
      } else {
        resolve({ message: 'Logout successful' });
      }
    });
  }

  /**
   * GET /auth/profile
   * Get the current user's profile (protected)
   */
  @Get('/profile')
  @Authenticated({ message: 'Please login to view your profile' })
  getProfile(@CurrentUser() user: User): { user: User } {
    return { user };
  }

  /**
   * GET /auth/status
   * Check authentication status (public)
   */
  @Get('/status')
  getStatus(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: any,
  ): { isAuthenticated: boolean; user: User | null } {
    const isAuthenticated = typeof request.isAuthenticated === 'function' 
      ? request.isAuthenticated() 
      : false;
    
    return {
      isAuthenticated,
      user: isAuthenticated ? request.user : null,
    };
  }
}
