import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Train } from '../entities/Train';

describe('Train Entity', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = {
      add: {
        existing: vi.fn(),
      },
      physics: {
        add: {
          existing: vi.fn(),
        },
      },
      time: {
        delayedCall: vi.fn(),
      },
    };
  });

  it('should create train with correct properties', () => {
    const train = new Train(mockScene, 100, 'track1', 120);
    
    expect(train.x).toBe(100);
    expect(train.getCurrentTrack()).toBe('track1');
    expect(train.getSpeed()).toBe(120);
  });

  it('should set correct color based on speed', () => {
    // Test slow train (gray)
    const slowTrain = new Train(mockScene, 0, 'track1', 80);
    expect(slowTrain.fillColor).toBe(0x95a5a6); // trainSlow color
    
    // Test normal train (blue) 
    const normalTrain = new Train(mockScene, 0, 'track1', 100);
    expect(normalTrain.fillColor).toBe(0x4a90e2); // train color
    
    // Test fast train (red)
    const fastTrain = new Train(mockScene, 0, 'track1', 120);
    expect(fastTrain.fillColor).toBe(0xe74c3c); // trainFast color
    
    // Test very fast train (purple)
    const veryFastTrain = new Train(mockScene, 0, 'track1', 140);
    expect(veryFastTrain.fillColor).toBe(0x8e44ad); // trainVeryFast color
  });

  it('should detect when train is off screen', () => {
    const train = new Train(mockScene, 1300, 'track1', 100);
    expect(train.isOffScreen()).toBe(true);
    
    const onScreenTrain = new Train(mockScene, 500, 'track1', 100);
    expect(onScreenTrain.isOffScreen()).toBe(false);
  });

  it('should track current track position', () => {
    const train = new Train(mockScene, 0, 'track2', 100);
    expect(train.getCurrentTrack()).toBe('track2');
    
    train.setTrack('track4');
    expect(train.getCurrentTrack()).toBe('track4');
  });

  it('should set generated stops correctly', () => {
    const mockStops = {
      stop1: { x: 400, track: 'track1', duration: 2000 },
      stop2: { x: 800, track: 'track2', duration: 1500 },
    };
    
    Train.setGeneratedStops(mockStops);
    
    // This is a static method test - we can't easily test the private checkStops method
    // but we can verify the static method works
    expect(Train.generatedStops).toBe(mockStops);
  });
});