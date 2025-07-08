import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainManager } from '../systems/TrainManager';

describe('TrainManager', () => {
  let mockScene: any;
  let trainManager: TrainManager;

  beforeEach(() => {
    mockScene = {
      physics: {
        add: {
          group: vi.fn().mockReturnValue({
            add: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
          }),
        },
      },
      time: {
        addEvent: vi.fn(),
      },
    };
    
    trainManager = new TrainManager(mockScene);
  });

  it('should initialize with empty train array', () => {
    expect(trainManager.getTrains()).toHaveLength(0);
  });

  it('should set generated layout', () => {
    const mockLayout = {
      switches: { switch1: 200 },
      stops: { stop1: { x: 400, track: 'track1', duration: 2000 } },
      connections: [{ id: 'switch1', source: 'track1', target: 'track2', x: 200 }],
    };
    
    trainManager.setGeneratedLayout(mockLayout);
    expect(trainManager.generatedLayout).toBe(mockLayout);
  });

  it('should start spawning with timer', () => {
    trainManager.startSpawning(2000, 100);
    
    expect(mockScene.time.addEvent).toHaveBeenCalledWith({
      delay: 2000,
      callback: expect.any(Function),
      callbackScope: trainManager,
      loop: true,
    });
  });

  it('should stop spawning and clear timer', () => {
    const mockTimer = { destroy: vi.fn() };
    trainManager.spawnTimer = mockTimer;
    
    trainManager.stopSpawning();
    expect(mockTimer.destroy).toHaveBeenCalled();
  });

  it('should stop all trains', () => {
    // Mock some trains with physics bodies
    const mockTrain1 = {
      body: { setVelocityX: vi.fn() },
    };
    const mockTrain2 = {
      body: { setVelocityX: vi.fn() },
    };
    
    trainManager.trains = [mockTrain1, mockTrain2] as any;
    trainManager.stopAllTrains();
    
    expect(mockTrain1.body.setVelocityX).toHaveBeenCalledWith(0);
    expect(mockTrain2.body.setVelocityX).toHaveBeenCalledWith(0);
  });

  it('should filter trains based on layout switches', () => {
    const mockLayout = {
      connections: [
        { source: 'track1', target: 'track2', x: 200 },
        { source: 'track2', target: 'track3', x: 400 },
      ],
    };
    
    trainManager.setGeneratedLayout(mockLayout);
    
    const track1Switches = trainManager.getAvailableSwitchesForTrack('track1');
    const track3Switches = trainManager.getAvailableSwitchesForTrack('track3');
    
    expect(track1Switches).toHaveLength(1);
    expect(track1Switches[0].target).toBe('track2');
    expect(track3Switches).toHaveLength(0);
  });

  it('should calculate safe distance based on available switches', () => {
    const mockLayout = {
      connections: [{ source: 'track1', target: 'track2', x: 300 }],
    };
    
    trainManager.setGeneratedLayout(mockLayout);
    
    const safeDistanceWithSwitches = trainManager.calculateSafeDistanceForTrack('track1');
    const safeDistanceWithoutSwitches = trainManager.calculateSafeDistanceForTrack('track5');
    
    expect(safeDistanceWithSwitches).toBeGreaterThan(200);
    expect(safeDistanceWithoutSwitches).toBe(400); // 2x base distance for tracks with no switches
  });
});