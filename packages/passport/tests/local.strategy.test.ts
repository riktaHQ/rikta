import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { LocalStrategyBase } from '../src/strategies/local.strategy';
import { PassportStrategy } from '../src/decorators/strategy.decorator';
import { AuthenticationError } from '../src/errors';

describe('LocalStrategy', () => {
  describe('LocalStrategyBase', () => {
    it('should create a passport strategy instance', () => {
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          return { id: '1', username };
        }
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      expect(passportStrategy).toBeDefined();
      expect(passportStrategy.name).toBe('local');
    });
    
    it('should call validate method with credentials', async () => {
      const mockValidate = vi.fn().mockResolvedValue({ id: '1', username: 'test' });
      
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        validate = mockValidate;
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      // Simulate passport authentication
      await new Promise<void>((resolve, reject) => {
        (passportStrategy as any)._verify(
          'testuser',
          'testpass',
          (err: Error | null, user: unknown) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      expect(mockValidate).toHaveBeenCalledWith('testuser', 'testpass');
    });
    
    it('should return user when validation succeeds', async () => {
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          return { id: '1', username };
        }
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      const user = await new Promise((resolve, reject) => {
        (passportStrategy as any)._verify(
          'testuser',
          'testpass',
          (err: Error | null, user: unknown) => {
            if (err) reject(err);
            else resolve(user);
          }
        );
      });
      
      expect(user).toEqual({ id: '1', username: 'testuser' });
    });
    
    it('should return false with message when validation returns null', async () => {
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          return null as any;
        }
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      const result = await new Promise<{ user: unknown; info: unknown }>((resolve) => {
        (passportStrategy as any)._verify(
          'testuser',
          'testpass',
          (err: Error | null, user: unknown, info: unknown) => {
            resolve({ user, info });
          }
        );
      });
      
      expect(result.user).toBe(false);
      expect(result.info).toEqual({ message: 'Invalid credentials' });
    });
    
    it('should handle AuthenticationError gracefully', async () => {
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          throw new AuthenticationError('Custom auth error');
        }
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      const result = await new Promise<{ user: unknown; info: unknown }>((resolve) => {
        (passportStrategy as any)._verify(
          'testuser',
          'testpass',
          (err: Error | null, user: unknown, info: unknown) => {
            resolve({ user, info });
          }
        );
      });
      
      expect(result.user).toBe(false);
      expect(result.info).toEqual({ message: 'Custom auth error' });
    });
    
    it('should handle generic errors gracefully', async () => {
      @PassportStrategy('local')
      class TestLocalStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          throw new Error('Database connection failed');
        }
      }
      
      const strategy = new TestLocalStrategy();
      const passportStrategy = strategy.getStrategy();
      
      const result = await new Promise<{ user: unknown; info: unknown }>((resolve) => {
        (passportStrategy as any)._verify(
          'testuser',
          'testpass',
          (err: Error | null, user: unknown, info: unknown) => {
            resolve({ user, info });
          }
        );
      });
      
      expect(result.user).toBe(false);
      expect(result.info).toEqual({ message: 'Database connection failed' });
    });
    
    it('should use custom username field from options', () => {
      @PassportStrategy('local', { usernameField: 'email' })
      class EmailStrategy extends LocalStrategyBase {
        async validate(email: string, password: string) {
          return { id: '1', email };
        }
      }
      
      const strategy = new EmailStrategy();
      const passportStrategy = strategy.getStrategy();
      
      // Check that the strategy was created with custom options
      expect((passportStrategy as any)._usernameField).toBe('email');
    });
    
    it('should use custom password field from options', () => {
      @PassportStrategy('local', { passwordField: 'pass' })
      class CustomPasswordStrategy extends LocalStrategyBase {
        async validate(username: string, pass: string) {
          return { id: '1', username };
        }
      }
      
      const strategy = new CustomPasswordStrategy();
      const passportStrategy = strategy.getStrategy();
      
      // Check that the strategy was created with custom options
      expect((passportStrategy as any)._passwordField).toBe('pass');
    });
    
    it('should reuse strategy instance on multiple calls', () => {
      @PassportStrategy('local')
      class ReuseStrategy extends LocalStrategyBase {
        async validate(username: string, password: string) {
          return { id: '1', username };
        }
      }
      
      const strategy = new ReuseStrategy();
      const first = strategy.getStrategy();
      const second = strategy.getStrategy();
      
      expect(first).toBe(second);
    });
  });
});
