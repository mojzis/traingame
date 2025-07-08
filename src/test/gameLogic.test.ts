import { describe, it, expect } from 'vitest';

// Test pure game logic functions without Phaser dependencies

describe('Game Logic', () => {
  describe('Train Speed Classification', () => {
    it('should classify train speeds correctly', () => {
      const classifySpeed = (speed: number): string => {
        if (speed <= 80) return 'slow';
        if (speed >= 120 && speed < 140) return 'fast';
        if (speed >= 140) return 'very-fast';
        return 'normal';
      };

      expect(classifySpeed(80)).toBe('slow');
      expect(classifySpeed(100)).toBe('normal');
      expect(classifySpeed(120)).toBe('fast');
      expect(classifySpeed(140)).toBe('very-fast');
    });
  });

  describe('Safe Distance Calculation', () => {
    it('should calculate safe spawning distance', () => {
      const calculateSafeDistance = (
        trainSpeed: number,
        reactionTime: number = 3000,
      ): number => {
        const baseSafeDistance = 200;
        const pixelsPerMs = trainSpeed / 1000;
        return baseSafeDistance + reactionTime * pixelsPerMs;
      };

      expect(calculateSafeDistance(100)).toBe(500); // 200 + (3000 * 0.1)
      expect(calculateSafeDistance(140)).toBe(620); // 200 + (3000 * 0.14)
      expect(calculateSafeDistance(80)).toBe(440); // 200 + (3000 * 0.08)
    });
  });

  describe('Track Position Validation', () => {
    it('should validate track positions', () => {
      const validTracks = ['track1', 'track2', 'track3', 'track4', 'track5'];

      const isValidTrack = (track: string): boolean => {
        return validTracks.includes(track);
      };

      expect(isValidTrack('track1')).toBe(true);
      expect(isValidTrack('track5')).toBe(true);
      expect(isValidTrack('track6')).toBe(false);
      expect(isValidTrack('invalid')).toBe(false);
    });
  });

  describe('Switch Logic', () => {
    it('should determine switch behavior correctly', () => {
      interface SwitchConfig {
        source: string;
        target: string;
        state: 'straight' | 'connected';
      }

      const getTargetTrack = (
        switchConfig: SwitchConfig,
        incomingTrack: string,
      ): string => {
        // Only trains on source track are affected
        if (incomingTrack !== switchConfig.source) {
          return incomingTrack;
        }

        // Unidirectional switch logic
        if (switchConfig.state === 'straight') {
          return incomingTrack; // Continue on source track
        } else {
          return switchConfig.target; // Divert to target track
        }
      };

      const switch1: SwitchConfig = {
        source: 'track1',
        target: 'track2',
        state: 'straight',
      };
      const switch2: SwitchConfig = {
        source: 'track1',
        target: 'track2',
        state: 'connected',
      };

      // Straight switch - no diversion
      expect(getTargetTrack(switch1, 'track1')).toBe('track1');
      expect(getTargetTrack(switch1, 'track2')).toBe('track2');
      expect(getTargetTrack(switch1, 'track3')).toBe('track3');

      // Connected switch - diverts from source to target
      expect(getTargetTrack(switch2, 'track1')).toBe('track2'); // Diverted
      expect(getTargetTrack(switch2, 'track2')).toBe('track2'); // Not affected
      expect(getTargetTrack(switch2, 'track3')).toBe('track3'); // Not affected
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score correctly', () => {
      const calculateScore = (trainsCompleted: number): number => {
        return trainsCompleted * 10;
      };

      expect(calculateScore(0)).toBe(0);
      expect(calculateScore(5)).toBe(50);
      expect(calculateScore(12)).toBe(120);
    });
  });

  describe('Game State Validation', () => {
    it('should validate train positions for off-screen detection', () => {
      const gameWidth = 1200;

      const isOffScreen = (
        trainX: number,
        trainWidth: number = 60,
      ): boolean => {
        return trainX > gameWidth + trainWidth;
      };

      expect(isOffScreen(500)).toBe(false);
      expect(isOffScreen(1200)).toBe(false);
      expect(isOffScreen(1261)).toBe(true); // 1200 + 60 + 1
    });

    it('should detect train scoring position', () => {
      const gameWidth = 1200;

      const isInScoringZone = (trainX: number): boolean => {
        return trainX > gameWidth * 0.9; // 90% across screen
      };

      expect(isInScoringZone(1000)).toBe(false);
      expect(isInScoringZone(1080)).toBe(false);
      expect(isInScoringZone(1081)).toBe(true); // > 1080 (90% of 1200)
    });
  });
});
