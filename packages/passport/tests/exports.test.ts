import { describe, it, expect } from 'vitest';
import 'reflect-metadata';

// Test that all exports are available
import {
  // Constants
  PASSPORT_STRATEGY_METADATA,
  AUTHENTICATED_METADATA,
  STRATEGY_OPTIONS_METADATA,
  AUTHENTICATOR_SERVICE,
  PASSPORT_OPTIONS,
  STRATEGY_REGISTRY,
  
  // Errors
  PassportSetupError,
  MissingPassportSecretError,
  PassportNotInitializedError,
  StrategyRegistrationError,
  AuthenticationError,
  UnauthorizedError,
  
  // Interfaces
  DEFAULT_PASSPORT_OPTIONS,
  
  // Plugin
  passportPlugin,
  registerPassport,
  
  // Decorators
  Authenticated,
  isAuthenticated,
  getAuthenticatedOptions,
  PassportStrategy,
  getStrategyRegistry,
  isPassportStrategy,
  getStrategyMetadata,
  getStrategyOptions,
  CurrentUser,
  Req,
  
  // Guards
  AuthGuard,
  StrictAuthGuard,
  
  // Strategies
  LocalStrategyBase,
} from '../src/index';

describe('Package Exports', () => {
  describe('Constants', () => {
    it('should export all constant symbols', () => {
      expect(PASSPORT_STRATEGY_METADATA).toBeDefined();
      expect(AUTHENTICATED_METADATA).toBeDefined();
      expect(STRATEGY_OPTIONS_METADATA).toBeDefined();
      expect(AUTHENTICATOR_SERVICE).toBeDefined();
      expect(PASSPORT_OPTIONS).toBeDefined();
      expect(STRATEGY_REGISTRY).toBeDefined();
    });
  });
  
  describe('Errors', () => {
    it('should export all error classes', () => {
      expect(PassportSetupError).toBeDefined();
      expect(MissingPassportSecretError).toBeDefined();
      expect(PassportNotInitializedError).toBeDefined();
      expect(StrategyRegistrationError).toBeDefined();
      expect(AuthenticationError).toBeDefined();
      expect(UnauthorizedError).toBeDefined();
    });
    
    it('should create error instances correctly', () => {
      expect(new PassportSetupError('test')).toBeInstanceOf(Error);
      expect(new MissingPassportSecretError()).toBeInstanceOf(PassportSetupError);
      expect(new PassportNotInitializedError()).toBeInstanceOf(Error);
      expect(new StrategyRegistrationError('local')).toBeInstanceOf(PassportSetupError);
      expect(new AuthenticationError()).toBeInstanceOf(Error);
      expect(new UnauthorizedError()).toBeInstanceOf(Error);
    });
    
    it('UnauthorizedError should have statusCode 401', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });
  });
  
  describe('Plugin', () => {
    it('should export passport plugin', () => {
      expect(passportPlugin).toBeDefined();
      expect(typeof passportPlugin).toBe('function');
    });
    
    it('should export registerPassport helper', () => {
      expect(registerPassport).toBeDefined();
      expect(typeof registerPassport).toBe('function');
    });
  });
  
  describe('Decorators', () => {
    it('should export @Authenticated decorator and utilities', () => {
      expect(Authenticated).toBeDefined();
      expect(isAuthenticated).toBeDefined();
      expect(getAuthenticatedOptions).toBeDefined();
    });
    
    it('should export @PassportStrategy decorator and utilities', () => {
      expect(PassportStrategy).toBeDefined();
      expect(getStrategyRegistry).toBeDefined();
      expect(isPassportStrategy).toBeDefined();
      expect(getStrategyMetadata).toBeDefined();
      expect(getStrategyOptions).toBeDefined();
    });
    
    it('should export @CurrentUser and @Req decorators', () => {
      expect(CurrentUser).toBeDefined();
      expect(Req).toBeDefined();
    });
  });
  
  describe('Guards', () => {
    it('should export AuthGuard', () => {
      expect(AuthGuard).toBeDefined();
      const guard = new AuthGuard();
      expect(typeof guard.canActivate).toBe('function');
    });
    
    it('should export StrictAuthGuard', () => {
      expect(StrictAuthGuard).toBeDefined();
      const guard = new StrictAuthGuard();
      expect(typeof guard.canActivate).toBe('function');
    });
  });
  
  describe('Strategies', () => {
    it('should export LocalStrategyBase', () => {
      expect(LocalStrategyBase).toBeDefined();
    });
  });
  
  describe('Interfaces', () => {
    it('should export DEFAULT_PASSPORT_OPTIONS', () => {
      expect(DEFAULT_PASSPORT_OPTIONS).toBeDefined();
      expect(DEFAULT_PASSPORT_OPTIONS.session).toBe(true);
      expect(DEFAULT_PASSPORT_OPTIONS.cookieName).toBe('session');
    });
  });
});
