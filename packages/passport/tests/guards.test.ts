import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { AuthGuard, StrictAuthGuard } from '../src/guards/auth.guard';
import { PassportNotInitializedError, UnauthorizedError } from '../src/errors';
import { Authenticated } from '../src/decorators/authenticated.decorator';
import type { ExecutionContext } from '@riktajs/core';
import type { FastifyRequest } from 'fastify';

// Helper to create mock execution context
function createMockContext(options: {
  isAuthenticated?: boolean;
  hasPassport?: boolean;
  controllerClass?: new () => unknown;
  handlerName?: string;
}): ExecutionContext {
  const {
    isAuthenticated = false,
    hasPassport = true,
    controllerClass = class TestController {},
    handlerName = 'testMethod',
  } = options;
  
  const mockRequest = {
    isAuthenticated: hasPassport 
      ? vi.fn().mockReturnValue(isAuthenticated)
      : undefined,
    user: isAuthenticated ? { id: '1', username: 'testuser' } : undefined,
  } as unknown as FastifyRequest;
  
  const mockReply = {} as unknown as FastifyRequest;
  
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockReply,
    }),
    getRequest: () => mockRequest,
    getReply: () => mockReply,
    getClass: () => controllerClass,
    getHandler: () => handlerName,
    getMetadata: () => undefined,
  } as ExecutionContext;
}

describe('Guards', () => {
  describe('AuthGuard', () => {
    let guard: AuthGuard;
    
    beforeEach(() => {
      guard = new AuthGuard();
    });
    
    it('should allow access when @Authenticated is not present', async () => {
      class PublicController {
        publicMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: PublicController,
        handlerName: 'publicMethod',
        isAuthenticated: false,
      });
      
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
    
    it('should allow authenticated users on @Authenticated routes', async () => {
      class ProtectedController {
        @Authenticated()
        protectedMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: ProtectedController,
        handlerName: 'protectedMethod',
        isAuthenticated: true,
      });
      
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
    
    it('should throw UnauthorizedError for unauthenticated users on @Authenticated routes', async () => {
      class ProtectedController {
        @Authenticated()
        protectedMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: ProtectedController,
        handlerName: 'protectedMethod',
        isAuthenticated: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedError);
    });
    
    it('should throw PassportNotInitializedError when passport is not initialized', async () => {
      class ProtectedController {
        @Authenticated()
        protectedMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: ProtectedController,
        handlerName: 'protectedMethod',
        hasPassport: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow(PassportNotInitializedError);
    });
    
    it('should use custom error message from @Authenticated', async () => {
      class ProtectedController {
        @Authenticated({ message: 'Custom auth required' })
        protectedMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: ProtectedController,
        handlerName: 'protectedMethod',
        isAuthenticated: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow('Custom auth required');
    });
  });
  
  describe('StrictAuthGuard', () => {
    let guard: StrictAuthGuard;
    
    beforeEach(() => {
      guard = new StrictAuthGuard();
    });
    
    it('should allow authenticated users', async () => {
      const context = createMockContext({
        isAuthenticated: true,
      });
      
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
    
    it('should throw UnauthorizedError for unauthenticated users', async () => {
      const context = createMockContext({
        isAuthenticated: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedError);
    });
    
    it('should throw PassportNotInitializedError when passport is not initialized', async () => {
      const context = createMockContext({
        hasPassport: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow(PassportNotInitializedError);
    });
    
    it('should require auth even without @Authenticated decorator', async () => {
      class PublicController {
        publicMethod() {}
      }
      
      const context = createMockContext({
        controllerClass: PublicController,
        handlerName: 'publicMethod',
        isAuthenticated: false,
      });
      
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedError);
    });
  });
});
