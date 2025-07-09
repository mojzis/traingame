import { describe, it, expect } from 'vitest';
import {
  GAME_CONFIG,
  generateBalancedLayout,
  calculateSpeedMultiplier,
  calculateSpawnInterval,
  getSpeedLevel,
  getGameLevel,
  getAvailableTracks,
} from '../config/game.config';

describe('Game Configuration', () => {
  it('should have valid game dimensions', () => {
    expect(GAME_CONFIG.width).toBeGreaterThan(0);
    expect(GAME_CONFIG.height).toBeGreaterThan(0);
    expect(GAME_CONFIG.width).toBe(1200);
    expect(GAME_CONFIG.height).toBe(600);
  });

  it('should have 6 tracks defined (including level 2)', () => {
    expect(Object.keys(GAME_CONFIG.physics.tracks)).toHaveLength(6);
    expect(GAME_CONFIG.physics.tracks.track1).toBe(100);
    expect(GAME_CONFIG.physics.tracks.track5).toBe(500);
    expect(GAME_CONFIG.physics.tracks.track6).toBe(580);
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

  it('should have speed progression configuration', () => {
    expect(GAME_CONFIG.physics.speedProgression).toBeDefined();
    expect(GAME_CONFIG.physics.speedProgression.pointsPerSpeedIncrease).toBe(
      50,
    );
    expect(GAME_CONFIG.physics.speedProgression.maxSpeedMultiplier).toBe(2.5);
    expect(GAME_CONFIG.physics.speedProgression.spawnIntervalDecrease).toBe(
      0.8,
    );
    expect(GAME_CONFIG.physics.speedProgression.minSpawnInterval).toBe(800);
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

  it('should prevent switch overlaps and maintain minimum spacing', () => {
    const layout = generateBalancedLayout();
    const minSpacing = GAME_CONFIG.graphics.switchSize * 2;
    const connections = layout.connections;

    // Check no switches are too close to each other
    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const switch1 = connections[i];
        const switch2 = connections[j];
        const distance = Math.abs(switch1.x - switch2.x);

        // If switches are close in x position, they should have sufficient spacing
        if (distance < minSpacing) {
          // They should be on different tracks or have more spacing
          expect(switch1.source !== switch2.source).toBe(true);
        }
      }
    }
  });

  it('should not create bidirectional switches at same position', () => {
    const layout = generateBalancedLayout();
    const connections = layout.connections;

    // Group connections by x position (allowing small variations)
    const positionGroups: { [key: number]: typeof connections } = {};
    const tolerance = 25; // Allow 25px tolerance for position grouping

    connections.forEach((conn) => {
      const roundedX = Math.round(conn.x / tolerance) * tolerance;
      if (!positionGroups[roundedX]) {
        positionGroups[roundedX] = [];
      }
      positionGroups[roundedX].push(conn);
    });

    // Check each position group for bidirectional conflicts
    Object.values(positionGroups).forEach((group) => {
      if (group.length > 1) {
        // Check if we have conflicting bidirectional switches
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const sw1 = group[i];
            const sw2 = group[j];

            // Should not have switches where track A->B and track B->A at same position
            const isBidirectional =
              sw1.source === sw2.target && sw1.target === sw2.source;

            expect(isBidirectional).toBe(false);
          }
        }
      }
    });
  });
});

describe('Speed Progression', () => {
  it('should calculate correct speed multiplier for different scores', () => {
    // Level 0: 0-49 points
    expect(calculateSpeedMultiplier(0)).toBe(1.0);
    expect(calculateSpeedMultiplier(25)).toBe(1.0);
    expect(calculateSpeedMultiplier(49)).toBe(1.0);

    // Level 1: 50-99 points
    expect(calculateSpeedMultiplier(50)).toBe(1.15);
    expect(calculateSpeedMultiplier(75)).toBe(1.15);
    expect(calculateSpeedMultiplier(99)).toBe(1.15);

    // Level 2: 100-149 points
    expect(calculateSpeedMultiplier(100)).toBe(1.3);
    expect(calculateSpeedMultiplier(149)).toBe(1.3);

    // Level 5: 250+ points
    expect(calculateSpeedMultiplier(250)).toBe(1.75);
  });

  it('should cap speed multiplier at maximum', () => {
    // Very high score should not exceed max multiplier
    expect(calculateSpeedMultiplier(1000)).toBe(2.5);
    expect(calculateSpeedMultiplier(5000)).toBe(2.5);
  });

  it('should calculate correct spawn intervals', () => {
    const baseInterval = 2000;

    // Level 0: no change
    expect(calculateSpawnInterval(0, baseInterval)).toBe(2000);

    // Level 1: 20% decrease (80% of original)
    expect(calculateSpawnInterval(50, baseInterval)).toBe(1600);

    // Level 2: 36% decrease (80% of 80%)
    expect(calculateSpawnInterval(100, baseInterval)).toBe(1280);

    // Level 3: 48.8% decrease
    expect(Math.round(calculateSpawnInterval(150, baseInterval))).toBe(1024);
  });

  it('should respect minimum spawn interval', () => {
    const baseInterval = 2000;
    // Very high score should not go below minimum
    expect(calculateSpawnInterval(1000, baseInterval)).toBe(800);
    expect(calculateSpawnInterval(5000, baseInterval)).toBe(800);
  });

  it('should calculate correct speed levels', () => {
    expect(getSpeedLevel(0)).toBe(0);
    expect(getSpeedLevel(25)).toBe(0);
    expect(getSpeedLevel(49)).toBe(0);
    expect(getSpeedLevel(50)).toBe(1);
    expect(getSpeedLevel(99)).toBe(1);
    expect(getSpeedLevel(100)).toBe(2);
    expect(getSpeedLevel(250)).toBe(5);
  });

  it('should have progressive difficulty increase', () => {
    // Each level should be harder than the previous
    for (let level = 0; level < 10; level++) {
      const currentScore = level * 50;
      const nextScore = (level + 1) * 50;

      const currentSpeed = calculateSpeedMultiplier(currentScore);
      const nextSpeed = calculateSpeedMultiplier(nextScore);

      const currentInterval = calculateSpawnInterval(currentScore, 2000);
      const nextInterval = calculateSpawnInterval(nextScore, 2000);

      // Speed should increase (unless at max)
      if (nextSpeed <= 2.5) {
        expect(nextSpeed).toBeGreaterThanOrEqual(currentSpeed);
      }

      // Spawn interval should decrease (unless at min)
      if (nextInterval >= 800) {
        expect(nextInterval).toBeLessThanOrEqual(currentInterval);
      }
    }
  });
});

describe('Level Progression', () => {
  it('should correctly determine game level based on score', () => {
    // Level 0: 0-221 points
    expect(getGameLevel(0)).toBe(0);
    expect(getGameLevel(100)).toBe(0);
    expect(getGameLevel(221)).toBe(0);

    // Level 1: 222-443 points
    expect(getGameLevel(222)).toBe(1);
    expect(getGameLevel(300)).toBe(1);
    expect(getGameLevel(443)).toBe(1);

    // Level 2: 444+ points
    expect(getGameLevel(444)).toBe(2);
    expect(getGameLevel(500)).toBe(2);
    expect(getGameLevel(1000)).toBe(2);
  });

  it('should return correct available tracks for each level', () => {
    // Level 0: Only 3 tracks (middle tracks)
    const level0Tracks = getAvailableTracks(0);
    expect(level0Tracks).toEqual(['track2', 'track3', 'track4']);
    expect(level0Tracks.length).toBe(3);

    // Level 1: 5 tracks
    const level1Tracks = getAvailableTracks(222);
    expect(level1Tracks).toEqual([
      'track1',
      'track2',
      'track3',
      'track4',
      'track5',
    ]);
    expect(level1Tracks.length).toBe(5);

    // Level 2: All 6 tracks
    const level2Tracks = getAvailableTracks(444);
    expect(level2Tracks).toEqual([
      'track1',
      'track2',
      'track3',
      'track4',
      'track5',
      'track6',
    ]);
    expect(level2Tracks.length).toBe(6);
  });

  it('should generate layouts with appropriate tracks for each level', () => {
    // Level 0 layout
    const level0Layout = generateBalancedLayout(0);
    level0Layout.connections.forEach((conn: any) => {
      expect(['track2', 'track3', 'track4']).toContain(conn.source);
      expect(['track2', 'track3', 'track4']).toContain(conn.target);
    });

    // Level 1 layout
    const level1Layout = generateBalancedLayout(222);
    level1Layout.connections.forEach((conn: any) => {
      expect(['track1', 'track2', 'track3', 'track4', 'track5']).toContain(
        conn.source,
      );
      expect(['track1', 'track2', 'track3', 'track4', 'track5']).toContain(
        conn.target,
      );
    });
  });

  it('should have proper level configuration values', () => {
    expect(GAME_CONFIG.physics.levelProgression.level0Tracks).toBe(3);
    expect(GAME_CONFIG.physics.levelProgression.level1Points).toBe(222);
    expect(GAME_CONFIG.physics.levelProgression.level2Points).toBe(444);
  });
});
