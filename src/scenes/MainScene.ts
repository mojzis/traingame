import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { TrainManager } from '../systems/TrainManager';
import { CollisionManager } from '../systems/CollisionManager';
import { TrackSystem } from '../systems/TrackSystem';
import { Train } from '../entities/Train';

export class MainScene extends Phaser.Scene {
  private trainManager!: TrainManager;
  private collisionManager!: CollisionManager;
  private trackSystem!: TrackSystem;
  private scoreText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.setupSystems();
    this.setupUI();
    this.startGame();
  }

  update(): void {
    if (this.isGameOver) return;

    this.trainManager.update();
    this.checkTrainSwitches();
    this.updateScore();
  }

  private setupSystems(): void {
    // Track system with switches
    this.trackSystem = new TrackSystem(this);
    this.trackSystem.drawTracksWithSwitches();

    // Get the generated layout
    const generatedLayout = this.trackSystem.getGeneratedLayout();

    // Set generated stops for trains
    Train.setGeneratedStops(generatedLayout.stops);

    // Train manager with layout awareness
    this.trainManager = new TrainManager(this);
    this.trainManager.setGeneratedLayout(generatedLayout);

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

    // Instructions
    this.add.text(20, 20, 'Click switches to connect tracks!', {
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

    // Debug info
    if (import.meta.env.DEV) {
      this.add.text(10, 120, 'Train Switch Game - Dev Mode', {
        fontSize: '14px',
        color: '#999',
      });
    }

    // Add keyboard input for regeneration
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.restart();
    });
  }

  private startGame(): void {
    this.isGameOver = false;
    this.score = 0;
    this.trainManager.startSpawning(2000); // Faster spawning to compensate for safe spawn filtering
  }

  private updateScore(): void {
    const trains = this.trainManager.getTrains();
    trains.forEach((train) => {
      if (train.x > GAME_CONFIG.width * 0.9 && !train.getData('scored')) {
        train.setData('scored', true);

        // Points for any train reaching the end
        this.score += 10;

        this.scoreText.setText(`Score: ${this.score}`);
      }
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

  private handleGameOver(): void {
    this.isGameOver = true;
    this.trainManager.stopSpawning();
    this.trainManager.stopAllTrains();

    const gameOverText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'CRASH!\nClick to restart',
      {
        fontSize: '48px',
        color: '#e74c3c',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      },
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setInteractive({ cursor: 'pointer' });

    gameOverText.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
