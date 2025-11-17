import Phaser from 'phaser';

/**
 * Game state enum representing all possible game states
 */
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

/**
 * Event data emitted when state changes
 */
export interface StateChangeEvent {
  from: GameState;
  to: GameState;
}

/**
 * GameStateManager manages game state transitions with validation and event emission.
 * Uses a state machine pattern to ensure valid state transitions.
 */
export class GameStateManager {
  private currentState: GameState;
  private eventEmitter: Phaser.Events.EventEmitter;

  /**
   * Creates a new GameStateManager
   * @param initialState - The initial state (defaults to MENU)
   */
  constructor(initialState: GameState = GameState.MENU) {
    this.currentState = initialState;
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * Gets the current game state (read-only)
   */
  get state(): GameState {
    return this.currentState;
  }

  /**
   * Sets the game state with validation
   * @param newState - The new state to transition to
   * @returns true if transition was successful, false if invalid
   */
  setState(newState: GameState): boolean {
    if (!this.isValidTransition(this.currentState, newState)) {
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;
    this.emitStateChange(oldState, newState);
    return true;
  }

  /**
   * Pauses the game (only from PLAYING state)
   * @returns true if successfully paused, false otherwise
   */
  pause(): boolean {
    if (this.currentState !== GameState.PLAYING) {
      return false;
    }
    return this.setState(GameState.PAUSED);
  }

  /**
   * Resumes the game (only from PAUSED state)
   * @returns true if successfully resumed, false otherwise
   */
  resume(): boolean {
    if (this.currentState !== GameState.PAUSED) {
      return false;
    }
    return this.setState(GameState.PLAYING);
  }

  /**
   * Starts the game (from MENU or GAME_OVER)
   * @returns true if successfully started, false otherwise
   */
  startGame(): boolean {
    if (
      this.currentState !== GameState.MENU &&
      this.currentState !== GameState.GAME_OVER
    ) {
      return false;
    }
    return this.setState(GameState.PLAYING);
  }

  /**
   * Ends the game (only from PLAYING state)
   * @returns true if successfully ended, false otherwise
   */
  endGame(): boolean {
    if (this.currentState !== GameState.PLAYING) {
      return false;
    }
    return this.setState(GameState.GAME_OVER);
  }

  /**
   * Returns to menu (from any state)
   * @returns true if successfully transitioned to menu
   */
  toMenu(): boolean {
    return this.setState(GameState.MENU);
  }

  /**
   * Subscribes to state change events
   * @param callback - Function to call when state changes
   * @returns The EventEmitter for chaining
   */
  on(
    event: 'stateChanged',
    callback: (data: StateChangeEvent) => void,
  ): Phaser.Events.EventEmitter {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Subscribes to state change events (once)
   * @param callback - Function to call when state changes
   * @returns The EventEmitter for chaining
   */
  once(
    event: 'stateChanged',
    callback: (data: StateChangeEvent) => void,
  ): Phaser.Events.EventEmitter {
    return this.eventEmitter.once(event, callback);
  }

  /**
   * Unsubscribes from state change events
   * @param callback - The callback to remove
   * @returns The EventEmitter for chaining
   */
  off(
    event: 'stateChanged',
    callback?: (data: StateChangeEvent) => void,
  ): Phaser.Events.EventEmitter {
    return this.eventEmitter.off(event, callback);
  }

  /**
   * Validates if a state transition is allowed
   * @param from - Current state
   * @param to - Target state
   * @returns true if transition is valid
   */
  private isValidTransition(from: GameState, to: GameState): boolean {
    // Same state is always invalid (no-op)
    if (from === to) {
      return false;
    }

    // Define valid transitions
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.MENU]: [GameState.PLAYING],
      [GameState.PLAYING]: [
        GameState.PAUSED,
        GameState.GAME_OVER,
        GameState.MENU,
      ],
      [GameState.PAUSED]: [GameState.PLAYING, GameState.MENU],
      [GameState.GAME_OVER]: [GameState.PLAYING, GameState.MENU],
    };

    return validTransitions[from].includes(to);
  }

  /**
   * Emits a state change event
   * @param from - Previous state
   * @param to - New state
   */
  private emitStateChange(from: GameState, to: GameState): void {
    this.eventEmitter.emit('stateChanged', { from, to });
  }

  /**
   * Destroys the event emitter and cleans up resources
   */
  destroy(): void {
    this.eventEmitter.removeAllListeners();
  }
}
