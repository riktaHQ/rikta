import { describe, it, expect } from 'vitest';
import {
  PassportSetupError,
  MissingPassportSecretError,
  PassportNotInitializedError,
  StrategyRegistrationError,
  AuthenticationError,
  UnauthorizedError,
} from '../src/errors';

describe('Errors', () => {
  describe('PassportSetupError', () => {
    it('should create error with message', () => {
      const error = new PassportSetupError('Setup failed');
      expect(error.message).toBe('Setup failed');
      expect(error.name).toBe('PassportSetupError');
    });
    
    it('should capture cause', () => {
      const cause = new Error('Root cause');
      const error = new PassportSetupError('Setup failed', cause);
      expect(error.cause).toBe(cause);
    });
    
    it('should be instanceof Error', () => {
      const error = new PassportSetupError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });
  
  describe('MissingPassportSecretError', () => {
    it('should create error with default message', () => {
      const error = new MissingPassportSecretError();
      expect(error.message).toContain('Passport secret is required');
      expect(error.message).toContain('at least 32 characters');
      expect(error.name).toBe('MissingPassportSecretError');
    });
    
    it('should be instanceof PassportSetupError', () => {
      const error = new MissingPassportSecretError();
      expect(error).toBeInstanceOf(PassportSetupError);
    });
  });
  
  describe('PassportNotInitializedError', () => {
    it('should create error with default message', () => {
      const error = new PassportNotInitializedError();
      expect(error.message).toContain('Passport is not initialized');
      expect(error.message).toContain('passportPlugin');
      expect(error.name).toBe('PassportNotInitializedError');
    });
  });
  
  describe('StrategyRegistrationError', () => {
    it('should create error with strategy name', () => {
      const error = new StrategyRegistrationError('local');
      expect(error.message).toContain('local');
      expect(error.name).toBe('StrategyRegistrationError');
    });
    
    it('should be instanceof PassportSetupError', () => {
      const error = new StrategyRegistrationError('jwt');
      expect(error).toBeInstanceOf(PassportSetupError);
    });
  });
  
  describe('AuthenticationError', () => {
    it('should create error with default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
      expect(error.name).toBe('AuthenticationError');
    });
    
    it('should create error with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });
  });
  
  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('UnauthorizedError');
    });
    
    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Access denied');
      expect(error.message).toBe('Access denied');
    });
    
    it('should have statusCode 401', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });
  });
});
