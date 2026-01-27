/**
 * Passport Example - Main Entry Point
 *
 * Demonstrates authentication with @riktajs/passport:
 * - Local strategy (username/password)
 * - Session-based authentication
 * - Protected routes with @Authenticated
 * - User injection with @CurrentUser
 */

import { Rikta } from '@riktajs/core';
import { registerPassport } from '@riktajs/passport';

async function bootstrap() {
  // Create the Rikta application
  const app = await Rikta.create({
    port: parseInt(process.env.PORT || '3000'),
    logger: true,
  });

  // Register Passport plugin for authentication
  await registerPassport(app.server, {
    // Session encryption secret (min 32 characters)
    // In production, use process.env.SESSION_SECRET
    secret: 'your-super-secret-key-at-least-32-chars',
    
    // Cookie configuration
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    
    // Cookie name
    cookieName: 'rikta_session',
  });

  // Start the server
  await app.listen();
  
  console.log('🚀 Passport Example App Running!');
  console.log(`📍 Server: http://localhost:${process.env.PORT || 3000}`);
  console.log('');
  console.log('📚 Available endpoints:');
  console.log('  POST /auth/login      - Login with username/password');
  console.log('  POST /auth/logout     - Logout current user');
  console.log('  GET  /auth/profile    - Get current user (protected)');
  console.log('  GET  /auth/status     - Check authentication status');
  console.log('  GET  /users           - List all users');
  console.log('  GET  /users/:id       - Get user by ID (protected)');
  console.log('');
  console.log('🔑 Default users:');
  console.log('  admin / admin123');
  console.log('  user / user123');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
