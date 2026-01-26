import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PerformanceProfiler, 
  profiler, 
  setGlobalProfiler, 
  getGlobalProfiler 
} from '../src/core/profiler/performance-profiler';

describe('PerformanceProfiler', () => {
  let testProfiler: PerformanceProfiler;

  beforeEach(() => {
    testProfiler = new PerformanceProfiler();
  });

  describe('Basic Timer Functionality', () => {
    it('should measure operation duration', async () => {
      const end = testProfiler.startTimer('test-operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metric = end();
      
      expect(metric).not.toBeNull();
      expect(metric!.name).toBe('test-operation');
      expect(metric!.duration).toBeGreaterThan(5);
      expect(metric!.startTime).toBeLessThanOrEqual(Date.now());
    });

    it('should include metadata in metric', () => {
      const end = testProfiler.startTimer('test-with-meta');
      const metric = end({ userId: 123, action: 'query' });
      
      expect(metric!.metadata).toEqual({ userId: 123, action: 'query' });
    });

    it('should return null when disabled', () => {
      testProfiler.setEnabled(false);
      const end = testProfiler.startTimer('disabled-test');
      const metric = end();
      
      expect(metric).toBeNull();
    });
  });

  describe('Measure Function', () => {
    it('should measure async function execution', async () => {
      let capturedMetric: any = null;
      testProfiler.onMetric(m => capturedMetric = m);
      
      const result = await testProfiler.measure('async-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'done';
      });
      
      expect(result).toBe('done');
      expect(capturedMetric).not.toBeNull();
      expect(capturedMetric.name).toBe('async-operation');
    });

    it('should measure sync function execution', async () => {
      let capturedMetric: any = null;
      testProfiler.onMetric(m => capturedMetric = m);
      
      const result = await testProfiler.measure('sync-operation', () => {
        return 42;
      });
      
      expect(result).toBe(42);
      expect(capturedMetric.name).toBe('sync-operation');
    });

    it('should track errors in measured function', async () => {
      let capturedMetric: any = null;
      testProfiler.onMetric(m => capturedMetric = m);
      
      await expect(
        testProfiler.measure('error-operation', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      expect(capturedMetric.metadata).toEqual({ error: true });
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners of metrics', () => {
      const listener = vi.fn();
      testProfiler.onMetric(listener);
      
      const end = testProfiler.startTimer('listener-test');
      end();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'listener-test' })
      );
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      testProfiler.onMetric(listener1);
      testProfiler.onMetric(listener2);
      
      const end = testProfiler.startTimer('multi-listener');
      end();
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = testProfiler.onMetric(listener);
      
      testProfiler.startTimer('first')({});
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      testProfiler.startTimer('second')({});
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      
      testProfiler.onMetric(errorListener);
      testProfiler.onMetric(normalListener);
      
      // Should not throw
      const end = testProfiler.startTimer('error-listener-test');
      end();
      
      expect(normalListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bootstrap Metrics', () => {
    it('should record bootstrap phase timings', () => {
      testProfiler.recordBootstrapPhase('discovery', 100);
      testProfiler.recordBootstrapPhase('containerInit', 50);
      testProfiler.recordBootstrapPhase('routeRegistration', 30);
      
      const metrics = testProfiler.getBootstrapMetrics();
      
      expect(metrics.discovery).toBe(100);
      expect(metrics.containerInit).toBe(50);
      expect(metrics.routeRegistration).toBe(30);
    });

    it('should return copy of bootstrap metrics', () => {
      testProfiler.recordBootstrapPhase('total', 200);
      
      const metrics1 = testProfiler.getBootstrapMetrics();
      const metrics2 = testProfiler.getBootstrapMetrics();
      
      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2);
    });
  });

  describe('Route Metrics', () => {
    it('should record route metrics', () => {
      const listener = vi.fn();
      testProfiler.onMetric(listener);
      
      testProfiler.recordRouteMetric({
        name: 'route:GET:/users',
        method: 'GET',
        path: '/users',
        duration: 15,
        statusCode: 200,
        startTime: Date.now(),
      });
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/users',
          statusCode: 200,
        })
      );
    });

    it('should not record when disabled', () => {
      const listener = vi.fn();
      testProfiler.onMetric(listener);
      testProfiler.setEnabled(false);
      
      testProfiler.recordRouteMetric({
        name: 'route:GET:/users',
        method: 'GET',
        path: '/users',
        duration: 15,
        statusCode: 200,
        startTime: Date.now(),
      });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Console Timer', () => {
    it('should create a console logging timer', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const timer = testProfiler.createConsoleTimer('[Test]');
      const end = timer('my-operation');
      end();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Test\] my-operation: [\d.]+ms/)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Global Profiler', () => {
    it('should have a default global profiler', () => {
      expect(profiler).toBeInstanceOf(PerformanceProfiler);
      expect(getGlobalProfiler()).toBe(profiler);
    });

    it('should allow replacing global profiler', () => {
      const originalProfiler = getGlobalProfiler();
      const newProfiler = new PerformanceProfiler({ enabled: false });
      
      setGlobalProfiler(newProfiler);
      expect(getGlobalProfiler()).toBe(newProfiler);
      
      // Restore original
      setGlobalProfiler(originalProfiler);
    });
  });

  describe('Enabled State', () => {
    it('should be enabled by default', () => {
      expect(testProfiler.isEnabled()).toBe(true);
    });

    it('should respect enabled option in constructor', () => {
      const disabledProfiler = new PerformanceProfiler({ enabled: false });
      expect(disabledProfiler.isEnabled()).toBe(false);
    });

    it('should toggle enabled state', () => {
      testProfiler.setEnabled(false);
      expect(testProfiler.isEnabled()).toBe(false);
      
      testProfiler.setEnabled(true);
      expect(testProfiler.isEnabled()).toBe(true);
    });
  });
});
