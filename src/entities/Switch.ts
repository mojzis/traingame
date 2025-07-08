import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { TrackPosition } from '../types';

export type SwitchState = 'straight' | 'connected';

export class Switch extends Phaser.GameObjects.Container {
  private switchState: SwitchState = 'straight';
  private graphics: Phaser.GameObjects.Graphics;
  private hitArea: Phaser.GameObjects.Rectangle;
  private isHovered: boolean = false;
  private sourceTrack: TrackPosition;
  private destinationTrack: TrackPosition;

  constructor(scene: Phaser.Scene, x: number, y: number, sourceTrack: TrackPosition, destinationTrack: TrackPosition) {
    super(scene, x, y);
    
    this.sourceTrack = sourceTrack;
    this.destinationTrack = destinationTrack;
    
    // Create graphics for visual representation
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    
    // Create invisible hit area for click detection
    this.hitArea = scene.add.rectangle(
      0,
      0,
      GAME_CONFIG.graphics.switchSize * 2,
      GAME_CONFIG.graphics.switchSize * 2,
    );
    this.hitArea.setInteractive({ cursor: 'pointer' });
    this.add(this.hitArea);
    
    // Setup interaction events
    this.setupInteraction();
    
    // Draw initial state
    this.draw();
    
    scene.add.existing(this);
  }

  private setupInteraction(): void {
    this.hitArea.on('pointerdown', () => {
      this.toggle();
    });
    
    this.hitArea.on('pointerover', () => {
      this.isHovered = true;
      this.draw();
    });
    
    this.hitArea.on('pointerout', () => {
      this.isHovered = false;
      this.draw();
    });
  }

  toggle(): void {
    this.switchState = this.switchState === 'straight' ? 'connected' : 'straight';
    this.draw();
    
    // Add toggle animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
    });

    // Emit event for tracking
    this.scene.events.emit('switchToggled');
  }

  private draw(): void {
    this.graphics.clear();
    
    const color = this.switchState === 'straight' 
      ? GAME_CONFIG.colors.switch 
      : GAME_CONFIG.colors.switchActive;
    
    const size = GAME_CONFIG.graphics.switchSize;
    
    // Draw switch body (diamond shape for hand-drawn look)
    this.graphics.lineStyle(3, 0x000000);
    this.graphics.fillStyle(color, this.isHovered ? 0.8 : 1);
    
    this.graphics.beginPath();
    this.graphics.moveTo(0, -size);
    this.graphics.lineTo(size, 0);
    this.graphics.lineTo(0, size);
    this.graphics.lineTo(-size, 0);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
    
    // Draw switch direction indicator
    this.graphics.lineStyle(4, 0x333333);
    this.graphics.beginPath();
    
    if (this.switchState === 'straight') {
      // Parallel lines indicating trains continue straight
      this.graphics.moveTo(-size * 0.6, -size * 0.3);
      this.graphics.lineTo(size * 0.6, -size * 0.3);
      this.graphics.moveTo(-size * 0.6, size * 0.3);
      this.graphics.lineTo(size * 0.6, size * 0.3);
    } else {
      // Curved lines indicating tracks are connected
      this.graphics.moveTo(-size * 0.6, -size * 0.3);
      this.graphics.lineTo(size * 0.6, size * 0.3);
      this.graphics.moveTo(-size * 0.6, size * 0.3);
      this.graphics.lineTo(size * 0.6, -size * 0.3);
    }
    
    this.graphics.strokePath();
  }

  getState(): SwitchState {
    return this.switchState;
  }

  setSwitchState(state: SwitchState): void {
    this.switchState = state;
    this.draw();
  }

  getTargetTrack(incomingTrack: TrackPosition): TrackPosition {
    // Only trains on the source track are affected by this switch
    if (incomingTrack !== this.sourceTrack) {
      return incomingTrack; // Train continues on current track
    }
    
    // Unidirectional switch logic: only trains from source track can be diverted
    if (this.switchState === 'straight') {
      return incomingTrack; // Continue on source track
    } else {
      // Divert from source track to destination track
      return this.destinationTrack;
    }
  }
}