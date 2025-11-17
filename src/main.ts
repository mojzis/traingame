import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { MenuScene } from './scenes/MenuScene';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  parent: 'game-container',
  scene: [MenuScene, MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: import.meta.env.DEV,
    },
  },
};

new Phaser.Game(config);