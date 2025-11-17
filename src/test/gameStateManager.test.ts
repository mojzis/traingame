import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager, GameState } from '../systems/GameStateManager';
import type { StateChangeEvent } from '../systems/GameStateManager';

describe('GameStateManager', () => {
  let stateManager: GameStateManager;

  beforeEach(() => {
    stateManager = new GameStateManager();
  });

  describe('Initialization', () => {
    it('should start in MENU state by default', () => {
      expect(stateManager.state).toBe(GameState.MENU);
    });

    it('should allow custom initial state', () => {
      const customStateManager = new GameStateManager(GameState.PLAYING);
      expect(customStateManager.state).toBe(GameState.PLAYING);
    });
  });

  describe('State Transitions', () => {
    describe('Valid transitions', () => {
      it('should transition from MENU to PLAYING', () => {
        const result = stateManager.setState(GameState.PLAYING);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should transition from PLAYING to PAUSED', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.setState(GameState.PAUSED);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });

      it('should transition from PLAYING to GAME_OVER', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.setState(GameState.GAME_OVER);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });

      it('should transition from PLAYING to MENU', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.setState(GameState.MENU);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should transition from PAUSED to PLAYING', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.PAUSED);
        const result = stateManager.setState(GameState.PLAYING);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should transition from PAUSED to MENU', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.PAUSED);
        const result = stateManager.setState(GameState.MENU);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should transition from GAME_OVER to PLAYING', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.setState(GameState.PLAYING);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should transition from GAME_OVER to MENU', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.setState(GameState.MENU);
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });
    });

    describe('Invalid transitions', () => {
      it('should prevent transition to same state', () => {
        const result = stateManager.setState(GameState.MENU);
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should prevent transition from MENU to PAUSED', () => {
        const result = stateManager.setState(GameState.PAUSED);
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should prevent transition from MENU to GAME_OVER', () => {
        const result = stateManager.setState(GameState.GAME_OVER);
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should prevent transition from PAUSED to GAME_OVER', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.PAUSED);
        const result = stateManager.setState(GameState.GAME_OVER);
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });

      it('should prevent transition from GAME_OVER to PAUSED', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.setState(GameState.PAUSED);
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });
    });
  });

  describe('Convenience Methods', () => {
    describe('pause()', () => {
      it('should pause the game from PLAYING state', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.pause();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });

      it('should fail to pause from MENU state', () => {
        const result = stateManager.pause();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should fail to pause from PAUSED state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.pause();
        const result = stateManager.pause();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });

      it('should fail to pause from GAME_OVER state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.pause();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });
    });

    describe('resume()', () => {
      it('should resume the game from PAUSED state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.pause();
        const result = stateManager.resume();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should fail to resume from MENU state', () => {
        const result = stateManager.resume();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should fail to resume from PLAYING state', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.resume();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should fail to resume from GAME_OVER state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.resume();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });
    });

    describe('startGame()', () => {
      it('should start game from MENU state', () => {
        const result = stateManager.startGame();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should start game from GAME_OVER state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.startGame();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should fail to start game from PLAYING state', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.startGame();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PLAYING);
      });

      it('should fail to start game from PAUSED state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.pause();
        const result = stateManager.startGame();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });
    });

    describe('endGame()', () => {
      it('should end game from PLAYING state', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.endGame();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });

      it('should fail to end game from MENU state', () => {
        const result = stateManager.endGame();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should fail to end game from PAUSED state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.pause();
        const result = stateManager.endGame();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.PAUSED);
      });

      it('should fail to end game from GAME_OVER state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.endGame();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.GAME_OVER);
      });
    });

    describe('toMenu()', () => {
      it('should go to menu from MENU state (returns false for same state)', () => {
        const result = stateManager.toMenu();
        expect(result).toBe(false);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should go to menu from PLAYING state', () => {
        stateManager.setState(GameState.PLAYING);
        const result = stateManager.toMenu();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should go to menu from PAUSED state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.pause();
        const result = stateManager.toMenu();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });

      it('should go to menu from GAME_OVER state', () => {
        stateManager.setState(GameState.PLAYING);
        stateManager.setState(GameState.GAME_OVER);
        const result = stateManager.toMenu();
        expect(result).toBe(true);
        expect(stateManager.state).toBe(GameState.MENU);
      });
    });
  });

  describe('Event System', () => {
    it('should emit stateChanged event on valid transition', () => {
      const callback = vi.fn();
      stateManager.on('stateChanged', callback);

      stateManager.setState(GameState.PLAYING);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        from: GameState.MENU,
        to: GameState.PLAYING,
      });
    });

    it('should not emit event on invalid transition', () => {
      const callback = vi.fn();
      stateManager.on('stateChanged', callback);

      stateManager.setState(GameState.MENU); // Same state

      expect(callback).not.toHaveBeenCalled();
    });

    it('should emit events for multiple transitions', () => {
      const callback = vi.fn();
      stateManager.on('stateChanged', callback);

      stateManager.setState(GameState.PLAYING);
      stateManager.pause();
      stateManager.resume();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, {
        from: GameState.MENU,
        to: GameState.PLAYING,
      });
      expect(callback).toHaveBeenNthCalledWith(2, {
        from: GameState.PLAYING,
        to: GameState.PAUSED,
      });
      expect(callback).toHaveBeenNthCalledWith(3, {
        from: GameState.PAUSED,
        to: GameState.PLAYING,
      });
    });

    it('should support multiple listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      stateManager.on('stateChanged', callback1);
      stateManager.on('stateChanged', callback2);

      stateManager.setState(GameState.PLAYING);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should support once() for single-use listeners', () => {
      const callback = vi.fn();
      stateManager.once('stateChanged', callback);

      stateManager.setState(GameState.PLAYING);
      stateManager.pause();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        from: GameState.MENU,
        to: GameState.PLAYING,
      });
    });

    it('should support removing listeners with off()', () => {
      const callback = vi.fn();
      stateManager.on('stateChanged', callback);

      stateManager.setState(GameState.PLAYING);
      expect(callback).toHaveBeenCalledTimes(1);

      stateManager.off('stateChanged', callback);
      stateManager.pause();

      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should support removing all listeners with off()', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      stateManager.on('stateChanged', callback1);
      stateManager.on('stateChanged', callback2);

      stateManager.setState(GameState.PLAYING);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      stateManager.off('stateChanged');
      stateManager.pause();

      expect(callback1).toHaveBeenCalledTimes(1); // Not called again
      expect(callback2).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state transitions', () => {
      stateManager.setState(GameState.PLAYING);
      stateManager.pause();
      stateManager.resume();
      stateManager.pause();
      stateManager.resume();

      expect(stateManager.state).toBe(GameState.PLAYING);
    });

    it('should maintain state consistency through invalid attempts', () => {
      stateManager.setState(GameState.PLAYING);

      stateManager.setState(GameState.PLAYING); // Invalid (same)
      stateManager.pause();
      stateManager.pause(); // Invalid (already paused)

      expect(stateManager.state).toBe(GameState.PAUSED);
    });

    it('should handle destroy() cleanup', () => {
      const callback = vi.fn();
      stateManager.on('stateChanged', callback);

      stateManager.destroy();
      stateManager.setState(GameState.PLAYING);

      // After destroy, no events should be emitted
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Complex State Flows', () => {
    it('should handle a complete game flow: menu -> play -> pause -> resume -> game over -> menu', () => {
      const events: StateChangeEvent[] = [];
      stateManager.on('stateChanged', (data) => events.push(data));

      // Start at MENU
      expect(stateManager.state).toBe(GameState.MENU);

      // Start game
      stateManager.startGame();
      expect(stateManager.state).toBe(GameState.PLAYING);

      // Pause
      stateManager.pause();
      expect(stateManager.state).toBe(GameState.PAUSED);

      // Resume
      stateManager.resume();
      expect(stateManager.state).toBe(GameState.PLAYING);

      // Game over
      stateManager.endGame();
      expect(stateManager.state).toBe(GameState.GAME_OVER);

      // Back to menu
      stateManager.toMenu();
      expect(stateManager.state).toBe(GameState.MENU);

      // Verify all events
      expect(events).toEqual([
        { from: GameState.MENU, to: GameState.PLAYING },
        { from: GameState.PLAYING, to: GameState.PAUSED },
        { from: GameState.PAUSED, to: GameState.PLAYING },
        { from: GameState.PLAYING, to: GameState.GAME_OVER },
        { from: GameState.GAME_OVER, to: GameState.MENU },
      ]);
    });

    it('should handle restart from game over', () => {
      stateManager.startGame();
      stateManager.endGame();

      expect(stateManager.state).toBe(GameState.GAME_OVER);

      // Restart
      stateManager.startGame();
      expect(stateManager.state).toBe(GameState.PLAYING);
    });

    it('should prevent invalid pause-resume patterns', () => {
      // Can't resume without pausing first
      stateManager.setState(GameState.PLAYING);
      const resumeResult = stateManager.resume();
      expect(resumeResult).toBe(false);
      expect(stateManager.state).toBe(GameState.PLAYING);

      // Can't pause from game over
      stateManager.endGame();
      const pauseResult = stateManager.pause();
      expect(pauseResult).toBe(false);
      expect(stateManager.state).toBe(GameState.GAME_OVER);
    });
  });
});
