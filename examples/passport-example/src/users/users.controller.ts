/**
 * Users Controller
 *
 * Provides user management endpoints.
 */

import { 
  Controller, 
  Get, 
  Param, 
  Autowired,
  NotFoundException,
} from '@riktajs/core';
import { Authenticated } from '@riktajs/passport';
import { UsersService, User } from './users.service.js';

@Controller('/users')
export class UsersController {
  @Autowired()
  private usersService!: UsersService;

  /**
   * GET /users
   * List all users (public)
   */
  @Get()
  findAll(): User[] {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id
   * Get user by ID (protected)
   */
  @Get('/:id')
  @Authenticated({ message: 'Login required to view user details' })
  findOne(@Param('id') id: string): User {
    const user = this.usersService.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    
    return user;
  }
}
