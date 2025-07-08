# Phase 4: Game Flow & State Management

## Goals
- Implement game state management
- Add start/pause/game over screens
- Create progressive difficulty system
- Implement high score persistence

## Tasks

### 4.1 Game State Manager
Create `src/systems/GameStateManager.ts`:
```typescript
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface GameStats {
  score: number;
  trainsPasssed: number;
  switchesUsed: number;
  level: number;
  highScore: number;
}

export class GameStateManager {
  private currentState: GameState = 'menu';
  private stats: GameStats = {
    score: 0,
    trainsPasssed: 0,
    switchesUsed: 0,
    level: 1,
    highScore: this.loadHighScore(),
  };

  private stateChangeCallbacks: Map<GameState, () => void> = new Map();

  getState(): GameState {
    return this.currentState;
  }

  setState(newState: GameState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    
    // Execute state change callback
    const callback = this.stateChangeCallbacks.get(newState);
    if (callback) {
      callback();
    }
    
    console.log(`Game state: ${previousState} -> ${newState}`);
  }

  onStateChange(state: GameState, callback: () => void): void {
    this.stateChangeCallbacks.set(state, callback);
  }

  incrementScore(points: number): void {
    this.stats.score += points;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      this.saveHighScore();
    }
  }

  incrementTrainsPassed(): void {
    this.stats.trainsPasssed++;
    
    // Level up every 10 trains
    if (this.stats.trainsPasssed % 10 === 0) {
      this.stats.level++;
    }
  }

  incrementSwitchesUsed(): void {
    this.stats.switchesUsed++;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      score: 0,
      trainsPasssed: 0,
      switchesUsed: 0,
      level: 1,
      highScore: this.stats.highScore,
    };
  }

  private loadHighScore(): number {
    const saved = localStorage.getItem('trainSwitchHighScore');
    return saved ? parseInt(saved, 10) : 0;
  }

  private saveHighScore(): void {
    localStorage.setItem('trainSwitchHighScore', this.stats.highScore.toString());
  }
}
```

### 4.2 Menu Scene
Create `src/scenes/MenuScene.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor('#f0f0f0');
    
    // Title
    const title = this.add.text(
      GAME_CONFIG.width / 2,
      100,
      'Train Switch',
      {
        fontSize: '64px',
        color: '#333',
        fontFamily: 'Comic Sans MS, cursive',
      }
    );
    title.setOrigin(0.5);
    
    // Animated train decoration
    this.createMenuTrain();
    
    // Play button
    const playButton = this.createButton(
      GAME_CONFIG.width / 2,
      250,
      'PLAY',
      () => this.startGame()
    );
    
    // Instructions
    const instructions = this.add.text(
      GAME_CONFIG.width / 2,
      350,
      'Click switches to guide trains safely!',
      {
        fontSize: '20px',
        color: '#666',
        fontFamily: 'Comic Sans MS, cursive',
      }
    );
    instructions.setOrigin(0.5);
    
    // High score
    const highScore = parseInt(localStorage.getItem('trainSwitchHighScore') || '0');
    if (highScore > 0) {
      this.add.text(
        GAME_CONFIG.width / 2,
        400,
        `High Score: ${highScore}`,
        {
          fontSize: '24px',
          color: '#27ae60',
          fontFamily: 'Comic Sans MS, cursive',
        }
      ).setOrigin(0.5);
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 200, 60, 0x3498db);
    bg.setStrokeStyle(3, 0x2980b9);
    bg.setInteractive({ cursor: 'pointer' });
    
    // Button text
    const label = this.add.text(0, 0, text, {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Comic Sans MS, cursive',
    });
    label.setOrigin(0.5);
    
    button.add([bg, label]);
    
    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2980b9);
      button.setScale(1.05);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x3498db);
      button.setScale(1);
    });
    
    bg.on('pointerdown', () => {
      button.setScale(0.95);
      this.time.delayedCall(100, callback);
    });
    
    return button;
  }

  private createMenuTrain(): void {
    const train = this.add.rectangle(-60, 200, 60, 30, 0x4a90e2);
    train.setStrokeStyle(2, 0x000000);
    
    this.tweens.add({
      targets: train,
      x: GAME_CONFIG.width + 60,
      duration: 5000,
      repeat: -1,
      ease: 'Linear',
    });
  }

  private startGame(): void {
    this.scene.start('MainScene');
  }
}
```

### 4.3 Difficulty System
Create `src/systems/DifficultyManager.ts`:
```typescript
export interface DifficultySettings {
  spawnInterval: number;
  trainSpeed: number;
  bonusMultiplier: number;
}

export class DifficultyManager {
  private baseSettings: DifficultySettings = {
    spawnInterval: 3000,
    trainSpeed: 100,
    bonusMultiplier: 1,
  };

  getSettings(level: number): DifficultySettings {
    // Progressive difficulty
    const speedIncrease = Math.min(level * 10, 100); // Max 200 speed
    const intervalDecrease = Math.max(3000 - (level * 200), 1000); // Min 1 second
    const bonusIncrease = 1 + (level * 0.1); // 10% per level
    
    return {
      spawnInterval: intervalDecrease,
      trainSpeed: this.baseSettings.trainSpeed + speedIncrease,
      bonusMultiplier: bonusIncrease,
    };
  }

  getSpawnVariation(level: number): number {
    // Add randomness to spawn timing
    const variation = Math.max(500 - (level * 50), 100);
    return Math.random() * variation - variation / 2;
  }
}
```

### 4.4 Updated Main Scene with State Management
Update `src/scenes/MainScene.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { TrainManager } from '../systems/TrainManager';
import { CollisionManager } from '../systems/CollisionManager';
import { TrackSystem } from '../systems/TrackSystem';
import { GameStateManager } from '../systems/GameStateManager';
import { DifficultyManager } from '../systems/DifficultyManager';

export class MainScene extends Phaser.Scene {
  private trainManager!: TrainManager;
  private collisionManager!: CollisionManager;
  private trackSystem!: TrackSystem;
  private stateManager!: GameStateManager;
  private difficultyManager!: DifficultyManager;
  
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.setupManagers();
    this.setupSystems();
    this.setupUI();
    this.startGame();
  }

  update(): void {
    if (this.stateManager.getState() !== 'playing') return;
    
    this.trainManager.update();
    this.checkTrainSwitches();
    this.updateScore();
  }

  private setupManagers(): void {
    this.stateManager = new GameStateManager();
    this.difficultyManager = new DifficultyManager();
    
    // State change handlers
    this.stateManager.onStateChange('playing', () => {
      this.physics.resume();
    });
    
    this.stateManager.onStateChange('paused', () => {
      this.physics.pause();
      this.showPauseOverlay();
    });
    
    this.stateManager.onStateChange('gameOver', () => {
      this.handleGameOver();
    });
  }

  private setupSystems(): void {
    this.trackSystem = new TrackSystem(this);
    this.trackSystem.drawTracksWithSwitches();
    
    this.trainManager = new TrainManager(this);
    
    this.collisionManager = new CollisionManager(this);
    this.collisionManager.setupCollisions(this.trainManager.getTrainGroup());
    this.collisionManager.onCollision(() => {
      this.stateManager.setState('gameOver');
    });
    
    // Track switch usage
    const switches = this.trackSystem.getSwitches();
    switches.forEach(sw => {
      sw.on('toggle', () => {
        this.stateManager.incrementSwitchesUsed();
      });
    });
  }

  private setupUI(): void {
    // Score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#333',
      fontFamily: 'Comic Sans MS, cursive',
    });
    
    // Level display
    this.levelText = this.add.text(20, 50, 'Level: 1', {
      fontSize: '20px',
      color: '#666',
      fontFamily: 'Comic Sans MS, cursive',
    });
    
    // Pause button
    this.pauseButton = this.add.text(GAME_CONFIG.width - 100, 20, 'PAUSE', {
      fontSize: '20px',
      color: '#3498db',
      fontFamily: 'Comic Sans MS, cursive',
    });
    this.pauseButton.setInteractive({ cursor: 'pointer' });
    this.pauseButton.on('pointerdown', () => this.togglePause());
    
    // Instructions
    this.add.text(GAME_CONFIG.width / 2, 370, 'Click switches to redirect trains!', {
      fontSize: '16px',
      color: '#999',
      fontFamily: 'Comic Sans MS, cursive',
    }).setOrigin(0.5);
  }

  private startGame(): void {
    this.stateManager.resetStats();
    this.stateManager.setState('playing');
    
    const settings = this.difficultyManager.getSettings(1);
    this.trainManager.startSpawning(settings.spawnInterval, settings.trainSpeed);
    
    this.updateUI();
  }

  private updateScore(): void {
    const trains = this.trainManager.getTrains();
    const stats = this.stateManager.getStats();
    
    trains.forEach((train) => {
      if (train.x > GAME_CONFIG.width * 0.9 && !train.getData('scored')) {
        train.setData('scored', true);
        
        // Base score with level multiplier
        const settings = this.difficultyManager.getSettings(stats.level);
        const baseScore = 10;
        const score = Math.round(baseScore * settings.bonusMultiplier);
        
        this.stateManager.incrementScore(score);
        this.stateManager.incrementTrainsPassed();
        
        // Check for level up
        const newStats = this.stateManager.getStats();
        if (newStats.level > stats.level) {
          this.levelUp(newStats.level);
        }
        
        this.updateUI();
      }
    });
  }

  private levelUp(newLevel: number): void {
    // Update difficulty
    const settings = this.difficultyManager.getSettings(newLevel);
    this.trainManager.updateSpawnSettings(settings.spawnInterval, settings.trainSpeed);
    
    // Show level up message
    const levelUpText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      `LEVEL ${newLevel}!`,
      {
        fontSize: '48px',
        color: '#f39c12',
        fontFamily: 'Comic Sans MS, cursive',
      }
    );
    levelUpText.setOrigin(0.5);
    
    this.tweens.add({
      targets: levelUpText,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => levelUpText.destroy(),
    });
  }

  private updateUI(): void {
    const stats = this.stateManager.getStats();
    this.scoreText.setText(`Score: ${stats.score}`);
    this.levelText.setText(`Level: ${stats.level}`);
  }

  private togglePause(): void {
    const currentState = this.stateManager.getState();
    if (currentState === 'playing') {
      this.stateManager.setState('paused');
    } else if (currentState === 'paused') {
      this.stateManager.setState('playing');
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    const overlay = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.5
    );
    overlay.setName('pauseOverlay');
    
    const pauseText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'PAUSED\nClick to resume',
      {
        fontSize: '48px',
        color: '#fff',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      }
    );
    pauseText.setOrigin(0.5);
    pauseText.setName('pauseText');
    pauseText.setInteractive({ cursor: 'pointer' });
    pauseText.on('pointerdown', () => this.togglePause());
  }

  private hidePauseOverlay(): void {
    this.children.getByName('pauseOverlay')?.destroy();
    this.children.getByName('pauseText')?.destroy();
  }

  private handleGameOver(): void {
    this.trainManager.stopSpawning();
    
    const stats = this.stateManager.getStats();
    
    // Game over overlay
    const overlay = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.7
    );
    
    // Game over text
    const gameOverContainer = this.add.container(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);
    
    const title = this.add.text(0, -80, 'GAME OVER', {
      fontSize: '48px',
      color: '#e74c3c',
      fontFamily: 'Comic Sans MS, cursive',
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(0, -20, `Score: ${stats.score}`, {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Comic Sans MS, cursive',
    }).setOrigin(0.5);
    
    const highScoreText = this.add.text(0, 20, `High Score: ${stats.highScore}`, {
      fontSize: '24px',
      color: '#f39c12',
      fontFamily: 'Comic Sans MS, cursive',
    }).setOrigin(0.5);
    
    const playAgainBtn = this.createButton(0, 80, 'Play Again', () => {
      this.scene.restart();
    });
    
    const menuBtn = this.createButton(0, 140, 'Main Menu', () => {
      this.scene.start('MenuScene');
    });
    
    gameOverContainer.add([title, scoreText, highScoreText, playAgainBtn, menuBtn]);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 180, 40, 0x3498db);
    bg.setStrokeStyle(2, 0x2980b9);
    bg.setInteractive({ cursor: 'pointer' });
    
    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#fff',
      fontFamily: 'Comic Sans MS, cursive',
    });
    label.setOrigin(0.5);
    
    button.add([bg, label]);
    
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setFillStyle(0x2980b9));
    bg.on('pointerout', () => bg.setFillStyle(0x3498db));
    
    return button;
  }
}
```

### 4.5 Updated TrainManager with Dynamic Spawning
Update `src/systems/TrainManager.ts` to support dynamic difficulty:
```typescript
// Add these methods to TrainManager class

updateSpawnSettings(interval: number, speed: number): void {
  this.defaultSpeed = speed;
  
  if (this.spawnTimer) {
    this.spawnTimer.destroy();
    this.startSpawning(interval, speed);
  }
}

private spawnTrain(): void {
  const track: TrackPosition = Math.random() > 0.5 ? 'top' : 'bottom';
  const train = new Train(this.scene, -60, track, this.defaultSpeed);
  
  this.trains.push(train);
  this.trainGroup.add(train);
}
```

## Verification Steps

1. Start game from menu
2. Verify pause/resume functionality
3. Check score increases with level multiplier
4. Verify level progression every 10 trains
5. Test difficulty increases (speed/spawn rate)
6. Verify high score persistence
7. Test game over screen and restart

## Success Criteria

- [x] Complete game flow (menu → play → game over)
- [x] Working pause functionality
- [x] Progressive difficulty system
- [x] Score persistence
- [x] Smooth state transitions
- [x] Clear UI feedback

## Next Phase
Phase 5 will add:
- Unit and integration tests
- Performance optimizations
- Build configuration
- Deployment setup