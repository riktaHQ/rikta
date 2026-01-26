import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container, Registry } from '../src/core';
import { Router } from '../src/core/router/router';
import Fastify from 'fastify';

describe('Router Cache Invalidation', () => {
  let router: Router;
  let container: Container;

  beforeEach(() => {
    Container.reset();
    Registry.reset();
    container = Container.getInstance();
    const server = Fastify();
    router = new Router(server, container, '');
  });

  describe('Guard Cache', () => {
    it('should start with empty guard cache', () => {
      expect(router.getGuardCacheSize()).toBe(0);
    });

    it('should clear guard cache', () => {
      // Access the private cache directly for testing
      (router as any).guardCache.set('TestGuard', { canActivate: () => true });
      expect(router.getGuardCacheSize()).toBe(1);

      router.clearGuardCache();
      
      expect(router.getGuardCacheSize()).toBe(0);
    });
  });

  describe('Middleware Cache', () => {
    it('should start with empty middleware cache', () => {
      expect(router.getMiddlewareCacheSize()).toBe(0);
    });

    it('should clear middleware cache', () => {
      // Access the private cache directly for testing
      (router as any).middlewareCache.set('TestMiddleware', { use: vi.fn() });
      expect(router.getMiddlewareCacheSize()).toBe(1);

      router.clearMiddlewareCache();
      
      expect(router.getMiddlewareCacheSize()).toBe(0);
    });
  });

  describe('Clear All Caches', () => {
    it('should clear both guard and middleware caches', () => {
      // Populate both caches
      (router as any).guardCache.set('TestGuard', { canActivate: () => true });
      (router as any).middlewareCache.set('TestMiddleware', { use: vi.fn() });

      expect(router.getGuardCacheSize()).toBe(1);
      expect(router.getMiddlewareCacheSize()).toBe(1);

      router.clearAllCaches();

      expect(router.getGuardCacheSize()).toBe(0);
      expect(router.getMiddlewareCacheSize()).toBe(0);
    });
  });
});
