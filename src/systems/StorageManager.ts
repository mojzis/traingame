/**
 * StorageManager - Handles localStorage operations for game data
 * Created during Phase 2: Missing Core Features
 */

export class StorageManager {
  private static readonly HIGH_SCORE_KEY = 'traingame_highscore';
  private static readonly SETTINGS_KEY = 'traingame_settings';

  /**
   * Get the current high score from localStorage
   * @returns The high score, or 0 if not set
   */
  static getHighScore(): number {
    try {
      const stored = localStorage.getItem(this.HIGH_SCORE_KEY);
      if (stored === null) {
        return 0;
      }
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.warn('Failed to read high score from localStorage:', error);
      return 0;
    }
  }

  /**
   * Save a new high score to localStorage
   * @param score The score to save
   * @returns True if saved successfully, false otherwise
   */
  static saveHighScore(score: number): boolean {
    try {
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
      return true;
    } catch (error) {
      console.error('Failed to save high score to localStorage:', error);
      // Quota exceeded or localStorage disabled
      return false;
    }
  }

  /**
   * Update high score if the new score is higher
   * @param score The new score to compare
   * @returns True if a new high score was set, false otherwise
   */
  static updateHighScore(score: number): boolean {
    const currentHighScore = this.getHighScore();
    if (score > currentHighScore) {
      return this.saveHighScore(score);
    }
    return false;
  }

  /**
   * Clear all stored game data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(this.HIGH_SCORE_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Check if localStorage is available
   * @returns True if localStorage is available and working
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get game settings from localStorage
   * @returns Settings object or default settings
   */
  static getSettings(): { soundEnabled: boolean } {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored === null) {
        return { soundEnabled: true };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to read settings from localStorage:', error);
      return { soundEnabled: true };
    }
  }

  /**
   * Save game settings to localStorage
   * @param settings Settings object to save
   * @returns True if saved successfully
   */
  static saveSettings(settings: { soundEnabled: boolean }): boolean {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      return false;
    }
  }
}
