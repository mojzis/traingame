import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Switch } from '../entities/Switch';

describe('Switch Entity', () => {
  let mockScene: any;
  let mockGraphics: any;
  let mockRectangle: any;

  beforeEach(() => {
    // Create mock graphics with method chaining (all methods return graphics object)
    mockGraphics = {
      clear: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      fillStyle: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
    };

    // Create mock rectangle with event handling
    const eventHandlers: Record<string, (...args: any[]) => void> = {};
    mockRectangle = {
      setInteractive: vi.fn().mockReturnValue(mockRectangle),
      on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        eventHandlers[event] = handler;
        return mockRectangle;
      }),
      emit: vi.fn((event: string, ...args: any[]) => {
        if (eventHandlers[event]) {
          eventHandlers[event](...args);
        }
        return mockRectangle;
      }),
    };

    mockScene = {
      add: {
        graphics: vi.fn(() => mockGraphics),
        rectangle: vi.fn(() => mockRectangle),
        existing: vi.fn((obj) => obj),
      },
      tweens: {
        add: vi.fn(),
      },
      events: {
        emit: vi.fn(),
      },
    };
  });

  it('should create switch with correct initial state', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track1', 'track2');

    expect(switchObj.x).toBe(200);
    expect(switchObj.y).toBe(100);
    expect(switchObj.getState()).toBe('straight');
  });

  it('should toggle between straight and connected states', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track1', 'track2');

    expect(switchObj.getState()).toBe('straight');

    switchObj.toggle();
    expect(switchObj.getState()).toBe('connected');

    switchObj.toggle();
    expect(switchObj.getState()).toBe('straight');
  });

  it('should return correct target track for unidirectional switching', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track1', 'track2');

    // Test straight state (no diversion)
    expect(switchObj.getTargetTrack('track1')).toBe('track1');
    expect(switchObj.getTargetTrack('track2')).toBe('track2');
    expect(switchObj.getTargetTrack('track3')).toBe('track3');

    // Test connected state (diversion only from source track)
    switchObj.toggle(); // Set to connected
    expect(switchObj.getTargetTrack('track1')).toBe('track2'); // Diverted
    expect(switchObj.getTargetTrack('track2')).toBe('track2'); // Not diverted (not source track)
    expect(switchObj.getTargetTrack('track3')).toBe('track3'); // Not affected
  });

  it('should only affect trains on source track', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track2', 'track4');
    switchObj.toggle(); // Set to connected

    // Only track2 (source) should be diverted to track4 (destination)
    expect(switchObj.getTargetTrack('track1')).toBe('track1');
    expect(switchObj.getTargetTrack('track2')).toBe('track4'); // Diverted
    expect(switchObj.getTargetTrack('track3')).toBe('track3');
    expect(switchObj.getTargetTrack('track4')).toBe('track4');
    expect(switchObj.getTargetTrack('track5')).toBe('track5');
  });

  it('should emit toggle event when switched', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track1', 'track2');

    switchObj.toggle();

    expect(mockScene.events.emit).toHaveBeenCalledWith('switchToggled');
  });

  it('should set switch state programmatically', () => {
    const switchObj = new Switch(mockScene, 200, 100, 'track1', 'track2');

    switchObj.setSwitchState('connected');
    expect(switchObj.getState()).toBe('connected');

    switchObj.setSwitchState('straight');
    expect(switchObj.getState()).toBe('straight');
  });
});
