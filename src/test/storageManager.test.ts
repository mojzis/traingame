import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../systems/StorageManager';

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('High Score Management', () => {
    it('should return 0 when no high score is stored', () => {
      expect(StorageManager.getHighScore()).toBe(0);
    });

    it('should save and retrieve high score', () => {
      const score = 1234;
      const saved = StorageManager.saveHighScore(score);

      expect(saved).toBe(true);
      expect(StorageManager.getHighScore()).toBe(score);
    });

    it('should update high score when new score is higher', () => {
      StorageManager.saveHighScore(100);
      const updated = StorageManager.updateHighScore(200);

      expect(updated).toBe(true);
      expect(StorageManager.getHighScore()).toBe(200);
    });

    it('should not update high score when new score is lower', () => {
      StorageManager.saveHighScore(200);
      const updated = StorageManager.updateHighScore(100);

      expect(updated).toBe(false);
      expect(StorageManager.getHighScore()).toBe(200);
    });

    it('should handle invalid stored high score gracefully', () => {
      localStorage.setItem('traingame_highscore', 'invalid');
      expect(StorageManager.getHighScore()).toBe(0);
    });

    it('should handle localStorage errors when reading', () => {
      // eslint-disable-next-line no-undef
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(StorageManager.getHighScore()).toBe(0);
    });

    it('should handle localStorage errors when saving', () => {
      // eslint-disable-next-line no-undef
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Quota exceeded');
      });

      const saved = StorageManager.saveHighScore(100);
      expect(saved).toBe(false);
    });
  });

  describe('Settings Management', () => {
    it('should return default settings when none are stored', () => {
      const settings = StorageManager.getSettings();
      expect(settings).toEqual({ soundEnabled: true });
    });

    it('should save and retrieve settings', () => {
      const settings = { soundEnabled: false };
      const saved = StorageManager.saveSettings(settings);

      expect(saved).toBe(true);
      expect(StorageManager.getSettings()).toEqual(settings);
    });

    it('should handle invalid stored settings gracefully', () => {
      localStorage.setItem('traingame_settings', 'invalid json');
      const settings = StorageManager.getSettings();
      expect(settings).toEqual({ soundEnabled: true });
    });

    it('should handle localStorage errors when saving settings', () => {
      // eslint-disable-next-line no-undef
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Quota exceeded');
      });

      const saved = StorageManager.saveSettings({ soundEnabled: false });
      expect(saved).toBe(false);
    });
  });

  describe('Storage Availability', () => {
    it('should detect when localStorage is available', () => {
      expect(StorageManager.isAvailable()).toBe(true);
    });

    it('should detect when localStorage is not available', () => {
      // eslint-disable-next-line no-undef
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage disabled');
      });

      expect(StorageManager.isAvailable()).toBe(false);
    });
  });

  describe('Clear All', () => {
    it('should clear all stored data', () => {
      StorageManager.saveHighScore(100);
      StorageManager.saveSettings({ soundEnabled: false });

      StorageManager.clearAll();

      expect(StorageManager.getHighScore()).toBe(0);
      expect(StorageManager.getSettings()).toEqual({ soundEnabled: true });
    });

    it('should handle errors when clearing', () => {
      // eslint-disable-next-line no-undef
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => StorageManager.clearAll()).not.toThrow();
    });
  });
});
