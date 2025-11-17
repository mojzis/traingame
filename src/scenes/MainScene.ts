import Phaser from 'phaser';
import {
  GAME_CONFIG,
  calculateSpeedMultiplier,
  calculateLevelSpawnInterval,
  getSpeedLevel,
  getGameLevel,
} from '../config/game.config';
import { TrainManager } from '../systems/TrainManager';
import { CollisionManager } from '../systems/CollisionManager';
import { TrackSystem } from '../systems/TrackSystem';
import { Train } from '../entities/Train';
import { StorageManager } from '../systems/StorageManager';
import { GameStateManager, GameState } from '../systems/GameStateManager';
import type { GameObjectWithData } from '../types/layout';

export class MainScene extends Phaser.Scene {
  private trainManager!: TrainManager;
  private collisionManager!: CollisionManager;
  private trackSystem!: TrackSystem;
  private gameStateManager!: GameStateManager;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private highScore: number = 0;
  private currentSpeedLevel: number = 0;
  private currentGameLevel: number = 0; // Start at level 0 (beginner)
  private baseSpawnInterval: number = 1200; // Increased frequency from 2000ms to 1200ms

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // Load high score from storage
    this.highScore = StorageManager.getHighScore();

    // Initialize game state manager
    this.gameStateManager = new GameStateManager(GameState.PLAYING);

    this.setupSystems();
    this.setupUI();
    this.startGame();
  }

  update(): void {
    if (this.gameStateManager.state === GameState.GAME_OVER) return;

    if (this.gameStateManager.state === GameState.PLAYING) {
      this.trainManager.update();
      this.checkTrainSwitches();
      this.updateScore();
    }
  }

  private setupSystems(): void {
    // Track system with switches (pass current score for level-aware generation)
    this.trackSystem = new TrackSystem(this);
    this.trackSystem.drawTracksWithSwitches(this.score);

    // Get the generated layout
    const generatedLayout = this.trackSystem.getGeneratedLayout();

    // Set generated stops for trains
    Train.setGeneratedStops(generatedLayout.stops);

    // Train manager with layout awareness
    this.trainManager = new TrainManager(this);
    this.trainManager.setGeneratedLayout(generatedLayout);
    this.trainManager.setCurrentScore(this.score);

    // Collision system
    this.collisionManager = new CollisionManager(this);
    this.collisionManager.setupCollisions(this.trainManager.getTrainGroup());
    this.collisionManager.onCollision(() => {
      this.handleGameOver();
    });
  }

  private checkTrainSwitches(): void {
    const trains = this.trainManager.getTrains();
    const switches = this.trackSystem.getSwitches();

    trains.forEach((train) => {
      switches.forEach((switchObj) => {
        train.checkSwitch(switchObj);
      });
    });
  }

  private setupUI(): void {
    // Score
    this.scoreText = this.add.text(GAME_CONFIG.width - 150, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#333',
      fontFamily: 'Comic Sans MS, cursive',
    });

    // High Score
    this.highScoreText = this.add.text(
      GAME_CONFIG.width - 150,
      50,
      `Best: ${this.highScore}`,
      {
        fontSize: '18px',
        color: '#888',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );

    // Speed level indicator
    this.speedText = this.add.text(GAME_CONFIG.width - 150, 80, 'Speed: 1.0x', {
      fontSize: '18px',
      color: '#666',
      fontFamily: 'Comic Sans MS, cursive',
    });

    // Level indicator
    this.levelText = this.add.text(
      GAME_CONFIG.width - 150,
      110,
      'Level: 0 (Beginner)',
      {
        fontSize: '18px',
        color: '#9b59b6',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );

    // Instructions
    // Show level-appropriate instructions
    const instructionText =
      this.currentGameLevel === 0
        ? 'Level 0: Learn the basics with 3 tracks!'
        : 'Click switches to connect tracks!';

    this.add.text(20, 20, instructionText, {
      fontSize: '16px',
      color: '#666',
      fontFamily: 'Comic Sans MS, cursive',
    });

    this.add.text(20, 40, 'Red = straight, Green = connected', {
      fontSize: '14px',
      color: '#999',
      fontFamily: 'Comic Sans MS, cursive',
    });

    this.add.text(
      20,
      60,
      'Train colors: Gray=slow, Blue=normal, Red=fast, Purple=very fast',
      {
        fontSize: '12px',
        color: '#999',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );

    this.add.text(20, 80, 'Orange squares = stops (trains pause)', {
      fontSize: '12px',
      color: '#999',
      fontFamily: 'Comic Sans MS, cursive',
    });

    this.add.text(20, 100, 'Press R to regenerate layout', {
      fontSize: '12px',
      color: '#999',
      fontFamily: 'Comic Sans MS, cursive',
    });

    this.add.text(20, 120, 'Press SPACE to pause/unpause', {
      fontSize: '12px',
      color: '#999',
      fontFamily: 'Comic Sans MS, cursive',
    });

    // Debug info
    if (import.meta.env.DEV) {
      this.add.text(10, 140, 'Train Switch Game - Dev Mode', {
        fontSize: '14px',
        color: '#999',
      });
    }

    // Add keyboard input for regeneration and pause
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.restart();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.togglePause();
    });
  }

  private startGame(): void {
    // State already set to PLAYING in create(), no need to reset here
    this.score = 0;
    this.currentSpeedLevel = 0;
    this.currentGameLevel = getGameLevel(this.score);
    this.trainManager.startSpawning(this.baseSpawnInterval);
  }

  private updateScore(): void {
    const trains = this.trainManager.getTrains();
    trains.forEach((train) => {
      if (train.x > GAME_CONFIG.width * 0.9 && !train.getData('scored')) {
        train.setData('scored', true);

        // Points for any train reaching the end
        this.score += 10;

        this.scoreText.setText(`Score: ${this.score}`);
        this.trainManager.setCurrentScore(this.score);
        this.updateGameSpeed();
        this.checkLevelProgression();
      }
    });
  }

  private updateGameSpeed(): void {
    const newSpeedLevel = getSpeedLevel(this.score);

    if (newSpeedLevel > this.currentSpeedLevel) {
      this.currentSpeedLevel = newSpeedLevel;
      const speedMultiplier = calculateSpeedMultiplier(this.score);

      // Update UI
      this.speedText.setText(`Speed: ${speedMultiplier.toFixed(1)}x`);

      // Update train manager with new spawn interval (using level-aware calculation)
      const levelAwareInterval = calculateLevelSpawnInterval(
        this.score,
        this.baseSpawnInterval,
      );
      this.trainManager.updateSpawnInterval(levelAwareInterval);

      // Update all existing trains with new speed multiplier
      this.trainManager.updateSpeedMultiplier(speedMultiplier);

      // Show speed level up notification
      this.showSpeedBonus(`SPEED UP! Level ${newSpeedLevel + 1}`);
    }
  }

  private checkLevelProgression(): void {
    const newGameLevel = getGameLevel(this.score);

    if (newGameLevel > this.currentGameLevel) {
      this.currentGameLevel = newGameLevel;

      if (newGameLevel === 1) {
        this.levelText.setText('Level: 1 (Basic)');
        this.showLevelUpNotification(
          'LEVEL 1!\nNow with 5 tracks!\nGood luck!',
        );

        // Regenerate layout with new tracks
        this.scene.restart();
      } else if (newGameLevel === 2) {
        this.levelText.setText(`Level: ${newGameLevel} (Advanced)`);
        this.showLevelUpNotification(
          'LEVEL 2!\nMore tracks, longer stops, more trains!',
        );

        // Regenerate layout with new tracks
        this.scene.restart();
      }
    }
  }

  private showLevelUpNotification(text: string): void {
    const notification = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 150,
      text,
      {
        fontSize: '36px',
        color: '#9b59b6',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      },
    );
    notification.setOrigin(0.5);

    this.tweens.add({
      targets: notification,
      y: notification.y - 60,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => notification.destroy(),
    });
  }

  private showBonus(text: string): void {
    const bonus = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 50,
      text,
      {
        fontSize: '32px',
        color: '#27ae60',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );
    bonus.setOrigin(0.5);

    this.tweens.add({
      targets: bonus,
      y: bonus.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => bonus.destroy(),
    });
  }

  private showSpeedBonus(text: string): void {
    const bonus = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 100,
      text,
      {
        fontSize: '28px',
        color: '#e67e22',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );
    bonus.setOrigin(0.5);

    this.tweens.add({
      targets: bonus,
      y: bonus.y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => bonus.destroy(),
    });
  }

  private togglePause(): void {
    if (this.gameStateManager.state === GameState.GAME_OVER) return;

    if (this.gameStateManager.state === GameState.PLAYING) {
      this.gameStateManager.pause();
      this.trainManager.pauseSpawning();
      this.trainManager.pauseAllTrains();
      this.showPauseOverlay();
    } else if (this.gameStateManager.state === GameState.PAUSED) {
      this.gameStateManager.resume();
      this.trainManager.resumeSpawning();
      this.trainManager.resumeAllTrains();
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    const pauseOverlay = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.5,
    );
    pauseOverlay.setDepth(1000);
    pauseOverlay.setData('pauseOverlay', true);

    const pauseText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'PAUSED\nPress SPACE to continue',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      },
    );
    pauseText.setOrigin(0.5);
    pauseText.setDepth(1001);
    pauseText.setData('pauseText', true);
  }

  private hidePauseOverlay(): void {
    // Remove pause overlay and text
    this.children.list
      .filter(
        (child): child is GameObjectWithData =>
          'getData' in child &&
          typeof child.getData === 'function' &&
          child.getData('pauseOverlay'),
      )
      .forEach((child) => child.destroy());
    this.children.list
      .filter(
        (child): child is GameObjectWithData =>
          'getData' in child &&
          typeof child.getData === 'function' &&
          child.getData('pauseText'),
      )
      .forEach((child) => child.destroy());
  }

  private handleGameOver(): void {
    this.gameStateManager.endGame();
    this.trainManager.stopSpawning();
    this.trainManager.stopAllTrains();

    // Check and update high score
    const isNewHighScore = StorageManager.updateHighScore(this.score);
    if (isNewHighScore) {
      this.highScore = this.score;
      this.highScoreText.setText(`Best: ${this.highScore}`);
    }

    // Game over message
    const gameOverMessage = isNewHighScore
      ? 'NEW HIGH SCORE!\nCRASH!\nClick to restart'
      : 'CRASH!\nClick to restart';

    const gameOverText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 30,
      gameOverMessage,
      {
        fontSize: '48px',
        color: '#e74c3c',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      },
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setInteractive({ cursor: 'pointer' });

    // Display final score
    const scoreDisplay = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 + 80,
      `Score: ${this.score}${isNewHighScore ? '' : `\nBest: ${this.highScore}`}`,
      {
        fontSize: '24px',
        color: '#333',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      },
    );
    scoreDisplay.setOrigin(0.5);

    gameOverText.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
