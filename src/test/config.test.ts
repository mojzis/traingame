import { describe, it, expect } from 'vitest';
import { GAME_CONFIG, generateBalancedLayout } from '../config/game.config';

describe('Game Configuration', () => {
  it('should have valid game dimensions', () => {
    expect(GAME_CONFIG.width).toBeGreaterThan(0);
    expect(GAME_CONFIG.height).toBeGreaterThan(0);
    expect(GAME_CONFIG.width).toBe(1200);
    expect(GAME_CONFIG.height).toBe(600);
  });

  it('should have 5 tracks defined', () => {
    expect(Object.keys(GAME_CONFIG.physics.tracks)).toHaveLength(5);
    expect(GAME_CONFIG.physics.tracks.track1).toBe(100);
    expect(GAME_CONFIG.physics.tracks.track5).toBe(500);
  });

  it('should have train speed variants', () => {
    expect(GAME_CONFIG.physics.trainSpeedVariants).toEqual([80, 100, 120, 140]);
    expect(GAME_CONFIG.physics.trainSpeedVariants.length).toBe(4);
  });

  it('should have valid colors defined', () => {
    expect(typeof GAME_CONFIG.colors.train).toBe('number');
    expect(typeof GAME_CONFIG.colors.trainSlow).toBe('number');
    expect(typeof GAME_CONFIG.colors.switch).toBe('number');
    expect(typeof GAME_CONFIG.colors.stop).toBe('number');
  });
});

describe('Layout Generator', () => {
  it('should generate valid layout structure', () => {
    const layout = generateBalancedLayout();

    expect(layout).toHaveProperty('switches');
    expect(layout).toHaveProperty('stops');
    expect(layout).toHaveProperty('connections');

    expect(typeof layout.switches).toBe('object');
    expect(typeof layout.stops).toBe('object');
    expect(Array.isArray(layout.connections)).toBe(true);
  });

  it('should generate stops with required properties', () => {
    const layout = generateBalancedLayout();

    Object.values(layout.stops).forEach((stop: any) => {
      expect(stop).toHaveProperty('x');
      expect(stop).toHaveProperty('track');
      expect(stop).toHaveProperty('duration');
      expect(typeof stop.x).toBe('number');
      expect(typeof stop.track).toBe('string');
      expect(typeof stop.duration).toBe('number');
      expect(stop.duration).toBeGreaterThan(0);
    });
  });

  it('should generate switch connections with valid properties', () => {
    const layout = generateBalancedLayout();

    layout.connections.forEach((connection: any) => {
      expect(connection).toHaveProperty('id');
      expect(connection).toHaveProperty('source');
      expect(connection).toHaveProperty('target');
      expect(connection).toHaveProperty('x');
      expect(typeof connection.x).toBe('number');
      expect(connection.x).toBeGreaterThan(0);
      expect(connection.x).toBeLessThan(GAME_CONFIG.width);
    });
  });

  it('should generate at least 3 stops', () => {
    const layout = generateBalancedLayout();
    expect(Object.keys(layout.stops).length).toBeGreaterThanOrEqual(3);
  });

  it('should generate some switches', () => {
    const layout = generateBalancedLayout();
    expect(Object.keys(layout.switches).length).toBeGreaterThan(0);
    expect(layout.connections.length).toBeGreaterThan(0);
  });
});
