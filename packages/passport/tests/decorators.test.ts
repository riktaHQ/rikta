import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import {
  Authenticated,
  isAuthenticated,
  getAuthenticatedOptions,
} from '../src/decorators/authenticated.decorator';
import {
  PassportStrategy,
  isPassportStrategy,
  getStrategyMetadata,
  getStrategyOptions,
  getStrategyRegistry,
} from '../src/decorators/strategy.decorator';

describe('Decorators', () => {
  beforeEach(() => {
    // Clear the strategy registry
    getStrategyRegistry().clear();
  });
  
  describe('@Authenticated', () => {
    it('should mark a method as requiring authentication', () => {
      class TestController {
        @Authenticated()
        protectedMethod() {}
      }
      
      const instance = new TestController();
      expect(isAuthenticated(instance, 'protectedMethod')).toBe(true);
    });
    
    it('should mark a class as requiring authentication', () => {
      @Authenticated()
      class TestController {
        publicMethod() {}
      }
      
      expect(isAuthenticated(TestController)).toBe(true);
    });
    
    it('should return false for non-authenticated methods', () => {
      class TestController {
        publicMethod() {}
      }
      
      const instance = new TestController();
      expect(isAuthenticated(instance, 'publicMethod')).toBe(false);
    });
    
    it('should store custom message in options', () => {
      class TestController {
        @Authenticated({ message: 'Custom error message' })
        protectedMethod() {}
      }
      
      const instance = new TestController();
      const options = getAuthenticatedOptions(instance, 'protectedMethod');
      expect(options?.message).toBe('Custom error message');
    });
    
    it('should store redirect URL in options', () => {
      class TestController {
        @Authenticated({ redirectTo: '/login' })
        protectedMethod() {}
      }
      
      const instance = new TestController();
      const options = getAuthenticatedOptions(instance, 'protectedMethod');
      expect(options?.redirectTo).toBe('/login');
    });
    
    it('should inherit class-level authentication for methods', () => {
      @Authenticated()
      class TestController {
        inheritedMethod() {}
      }
      
      const instance = new TestController();
      expect(isAuthenticated(instance, 'inheritedMethod')).toBe(true);
    });
    
    it('should allow method-level override of class-level auth', () => {
      @Authenticated({ message: 'Class message' })
      class TestController {
        @Authenticated({ message: 'Method message' })
        overriddenMethod() {}
      }
      
      const instance = new TestController();
      const options = getAuthenticatedOptions(instance, 'overriddenMethod');
      expect(options?.message).toBe('Method message');
    });
  });
  
  describe('@PassportStrategy', () => {
    it('should mark a class as a passport strategy', () => {
      @PassportStrategy('test')
      class TestStrategy {
        validate() { return {}; }
      }
      
      expect(isPassportStrategy(TestStrategy)).toBe(true);
    });
    
    it('should store strategy name in metadata', () => {
      @PassportStrategy('local')
      class LocalStrategy {
        validate() { return {}; }
      }
      
      const metadata = getStrategyMetadata(LocalStrategy);
      expect(metadata?.name).toBe('local');
    });
    
    it('should store strategy options', () => {
      @PassportStrategy('local', { usernameField: 'email' })
      class EmailStrategy {
        validate() { return {}; }
      }
      
      const options = getStrategyOptions(EmailStrategy);
      expect(options?.usernameField).toBe('email');
    });
    
    it('should register strategy in global registry', () => {
      @PassportStrategy('unique-test-strategy')
      class UniqueStrategy {
        validate() { return {}; }
      }
      
      const registry = getStrategyRegistry();
      expect(registry.get('unique-test-strategy')).toBe(UniqueStrategy);
    });
    
    it('should return false for non-strategy classes', () => {
      class RegularClass {}
      
      expect(isPassportStrategy(RegularClass)).toBe(false);
    });
    
    it('should return undefined metadata for non-strategy classes', () => {
      class RegularClass {}
      
      expect(getStrategyMetadata(RegularClass)).toBeUndefined();
    });
  });
});
