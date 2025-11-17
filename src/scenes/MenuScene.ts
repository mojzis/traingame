import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { StorageManager } from '../systems/StorageManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = GAME_CONFIG;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.add.rectangle(0, 0, width, height, 0xf0f0f0).setOrigin(0);

    // Title
    const title = this.add.text(centerX, centerY - 150, 'TRAIN GAME', {
      fontSize: '64px',
      color: '#2c3e50',
      fontFamily: 'Comic Sans MS, cursive',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(
      centerX,
      centerY - 80,
      'Prevent train collisions!',
      {
        fontSize: '24px',
        color: '#7f8c8d',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );
    subtitle.setOrigin(0.5);

    // High Score Display
    const highScore = StorageManager.getHighScore();
    if (highScore > 0) {
      const highScoreText = this.add.text(
        centerX,
        centerY - 30,
        `High Score: ${highScore}`,
        {
          fontSize: '28px',
          color: '#e67e22',
          fontFamily: 'Comic Sans MS, cursive',
        },
      );
      highScoreText.setOrigin(0.5);
    }

    // Start Button
    const startButton = this.add.rectangle(
      centerX,
      centerY + 40,
      250,
      70,
      0x27ae60,
    );
    startButton.setInteractive({ cursor: 'pointer' });

    const startText = this.add.text(centerX, centerY + 40, 'START GAME', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Comic Sans MS, cursive',
      fontStyle: 'bold',
    });
    startText.setOrigin(0.5);

    // Button hover effect
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x2ecc71);
    });

    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x27ae60);
    });

    startButton.on('pointerdown', () => {
      this.scene.start('MainScene');
    });

    // Instructions
    const instructions = [
      'Click switches to change tracks',
      'Red = straight, Green = connected',
      'Press SPACE to pause',
      '',
      'Train Colors:',
      'Gray = Slow | Blue = Normal',
      'Red = Fast | Purple = Very Fast',
    ];

    instructions.forEach((text, index) => {
      const instructionText = this.add.text(
        centerX,
        centerY + 140 + index * 22,
        text,
        {
          fontSize: text === '' ? '8px' : '16px',
          color: '#95a5a6',
          fontFamily: 'Comic Sans MS, cursive',
          align: 'center',
        },
      );
      instructionText.setOrigin(0.5);
    });

    // Credits
    const credits = this.add.text(
      width - 10,
      height - 10,
      'Made with Phaser 3',
      {
        fontSize: '12px',
        color: '#bdc3c7',
        fontFamily: 'Comic Sans MS, cursive',
      },
    );
    credits.setOrigin(1);
  }
}
