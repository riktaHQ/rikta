import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../src/core/lifecycle/event-bus';

describe('EventBus Owner Tracking', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should track listeners by owner', () => {
    eventBus.on('test:event', () => {}, 'TestService');
    eventBus.on('test:event', () => {}, 'TestService');
    eventBus.on('test:event', () => {}, 'OtherService');

    expect(eventBus.listenerCountByOwner('TestService')).toBe(2);
    expect(eventBus.listenerCountByOwner('OtherService')).toBe(1);
  });

  it('should remove all listeners by owner', () => {
    const callback1 = () => {};
    const callback2 = () => {};
    const callback3 = () => {};

    eventBus.on('test:event', callback1, 'TestService');
    eventBus.on('test:event', callback2, 'TestService');
    eventBus.on('test:event', callback3, 'OtherService');

    expect(eventBus.listenerCount('test:event')).toBe(3);

    eventBus.removeByOwner('TestService');

    expect(eventBus.listenerCount('test:event')).toBe(1);
    expect(eventBus.listenerCountByOwner('TestService')).toBe(0);
  });

  it('should track once listeners by owner', () => {
    eventBus.once('test:event', () => {}, 'TestService');

    expect(eventBus.listenerCountByOwner('TestService')).toBe(1);
    
    eventBus.removeByOwner('TestService');
    
    expect(eventBus.listenerCount('test:event')).toBe(0);
  });

  it('should return total listener count', () => {
    eventBus.on('event1', () => {});
    eventBus.on('event2', () => {});
    eventBus.once('event3', () => {});

    expect(eventBus.totalListenerCount()).toBe(3);
  });

  it('should return list of all owners', () => {
    eventBus.on('test', () => {}, 'ServiceA');
    eventBus.on('test', () => {}, 'ServiceB');
    eventBus.on('test', () => {}, 'ServiceA');

    const owners = eventBus.getOwners();
    expect(owners).toContain('ServiceA');
    expect(owners).toContain('ServiceB');
    expect(owners).toHaveLength(2);
  });

  it('should clear all listeners including owner tracking', () => {
    eventBus.on('test', () => {}, 'ServiceA');
    eventBus.on('test', () => {}, 'ServiceB');

    eventBus.clear();

    expect(eventBus.totalListenerCount()).toBe(0);
    expect(eventBus.getOwners()).toHaveLength(0);
  });

  it('should properly unsubscribe and update owner tracking', () => {
    const unsubscribe = eventBus.on('test', () => {}, 'TestService');

    expect(eventBus.listenerCountByOwner('TestService')).toBe(1);

    unsubscribe();

    expect(eventBus.listenerCountByOwner('TestService')).toBe(0);
    expect(eventBus.listenerCount('test')).toBe(0);
  });

  it('should work without owner (backward compatible)', () => {
    const callback = () => {};
    
    const unsubscribe = eventBus.on('test', callback);
    
    expect(eventBus.listenerCount('test')).toBe(1);
    
    unsubscribe();
    
    expect(eventBus.listenerCount('test')).toBe(0);
  });

  it('should still emit events correctly with owner tracking', async () => {
    const results: string[] = [];

    eventBus.on('test', () => results.push('a'), 'ServiceA');
    eventBus.on('test', () => results.push('b'), 'ServiceB');

    await eventBus.emit('test', {});

    expect(results).toEqual(['a', 'b']);
  });
});
