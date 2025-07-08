# Phase 3: User Interaction & Switch Mechanics

## Goals
- Implement clickable switch component
- Add track switching logic
- Create visual feedback for switch states
- Enable trains to change tracks via switches

## Tasks

### 3.1 Switch Entity Class
Create `src/entities/Switch.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';

export type SwitchState = 'straight' | 'diverge';

export class Switch extends Phaser.GameObjects.Container {
  private state: SwitchState = 'straight';
  private graphics: Phaser.GameObjects.Graphics;
  private hitArea: Phaser.GameObjects.Rectangle;
  private isHovered: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
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
    this.state = this.state === 'straight' ? 'diverge' : 'straight';
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
  }

  private draw(): void {
    this.graphics.clear();
    
    const color = this.state === 'straight' 
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
    
    // Draw track connections
    this.graphics.lineStyle(4, 0x333333);
    
    if (this.state === 'straight') {
      // Straight through
      this.graphics.moveTo(-size * 1.5, 0);
      this.graphics.lineTo(size * 1.5, 0);
    } else {
      // Diverging path
      this.graphics.moveTo(-size * 1.5, -size);
      this.graphics.lineTo(0, 0);
      this.graphics.lineTo(size * 1.5, size);
    }
    
    this.graphics.strokePath();
  }

  getState(): SwitchState {
    return this.state;
  }

  setState(state: SwitchState): void {
    this.state = state;
    this.draw();
  }

  getTrackY(incoming: 'top' | 'bottom'): 'top' | 'bottom' {
    if (this.state === 'straight') {
      return incoming;
    } else {
      return incoming === 'top' ? 'bottom' : 'top';
    }
  }
}
```

### 3.2 Track System with Switches
Create `src/systems/TrackSystem.ts`:
```typescript
import Phaser from 'phaser';
import { Switch } from '../entities/Switch';
import { GAME_CONFIG } from '../config/game.config';

export class TrackSystem {
  private scene: Phaser.Scene;
  private switches: Switch[] = [];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createSwitch(x: number): Switch {
    // Position switch between tracks
    const y = (GAME_CONFIG.physics.tracks.top + GAME_CONFIG.physics.tracks.bottom) / 2;
    const switchObj = new Switch(this.scene, x, y);
    
    this.switches.push(switchObj);
    return switchObj;
  }

  drawTracksWithSwitches(): void {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(GAME_CONFIG.graphics.trackWidth, GAME_CONFIG.colors.track);
    
    // For MVP, single switch in the middle
    const switchX = GAME_CONFIG.width / 2;
    const switchZone = 60; // Width of switch influence area
    
    // Top track segments
    this.drawTrackSegment(graphics, 0, switchX - switchZone, 'top');
    this.drawTrackSegment(graphics, switchX + switchZone, GAME_CONFIG.width, 'top');
    
    // Bottom track segments  
    this.drawTrackSegment(graphics, 0, switchX - switchZone, 'bottom');
    this.drawTrackSegment(graphics, switchX + switchZone, GAME_CONFIG.width, 'bottom');
    
    // Create the switch
    this.createSwitch(switchX);
  }

  private drawTrackSegment(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    endX: number,
    track: 'top' | 'bottom',
  ): void {
    const y = track === 'top' 
      ? GAME_CONFIG.physics.tracks.top 
      : GAME_CONFIG.physics.tracks.bottom;
    
    graphics.beginPath();
    
    // Add slight hand-drawn wobble
    for (let x = startX; x <= endX; x += 5) {
      const wobble = Math.sin(x * 0.05) * 1.5;
      if (x === startX) {
        graphics.moveTo(x, y + wobble);
      } else {
        graphics.lineTo(x, y + wobble);
      }
    }
    
    graphics.strokePath();
  }

  getSwitchAtPosition(x: number): Switch | undefined {
    const tolerance = 60;
    return this.switches.find(
      (sw) => Math.abs(sw.x - x) < tolerance
    );
  }

  getSwitches(): Switch[] {
    return this.switches;
  }
}
```

### 3.3 Updated Train Entity with Switch Interaction
Update `src/entities/Train.ts`:
```typescript
import Phaser from 'phaser';
import { TrackPosition } from '../types';
import { GAME_CONFIG } from '../config/game.config';
import { Switch } from './Switch';

export class Train extends Phaser.GameObjects.Rectangle {
  private currentTrack: TrackPosition;
  private speed: number;
  private hasSwitched: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    track: TrackPosition,
    speed: number = GAME_CONFIG.physics.trainSpeed,
  ) {
    const y = track === 'top' 
      ? GAME_CONFIG.physics.tracks.top 
      : GAME_CONFIG.physics.tracks.bottom;
    
    super(
      scene,
      x,
      y,
      GAME_CONFIG.graphics.trainWidth,
      GAME_CONFIG.graphics.trainHeight,
      GAME_CONFIG.colors.train,
    );

    this.currentTrack = track;
    this.speed = speed;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.speed);
    body.setImmovable(true);
    
    // Hand-drawn style
    this.setStrokeStyle(2, 0x000000);
    
    // Add slight rotation for character
    this.setRotation(Phaser.Math.Between(-2, 2) * Math.PI / 180);
  }

  checkSwitch(switchObj: Switch): void {
    if (this.hasSwitched) return;
    
    const switchRange = 40;
    const distance = Math.abs(this.x - switchObj.x);
    
    if (distance < switchRange) {
      const newTrack = switchObj.getTrackY(this.currentTrack);
      
      if (newTrack !== this.currentTrack) {
        this.setTrack(newTrack);
        this.hasSwitched = true;
        
        // Reset switch flag when train passes
        this.scene.time.delayedCall(500, () => {
          this.hasSwitched = false;
        });
      }
    }
  }

  getCurrentTrack(): TrackPosition {
    return this.currentTrack;
  }

  setTrack(track: TrackPosition): void {
    this.currentTrack = track;
    const targetY = track === 'top' 
      ? GAME_CONFIG.physics.tracks.top 
      : GAME_CONFIG.physics.tracks.bottom;
    
    this.scene.tweens.add({
      targets: this,
      y: targetY,
      duration: 300,
      ease: 'Sine.easeInOut',
    });
  }

  isOffScreen(): boolean {
    return this.x > GAME_CONFIG.width + this.width;
  }
}
```

### 3.4 Updated Main Scene with Switch Integration
Update `src/scenes/MainScene.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { TrainManager } from '../systems/TrainManager';
import { CollisionManager } from '../systems/CollisionManager';
import { TrackSystem } from '../systems/TrackSystem';

export class MainScene extends Phaser.Scene {
  private trainManager!: TrainManager;
  private collisionManager!: CollisionManager;
  private trackSystem!: TrackSystem;
  private scoreText!: Phaser.GameObjects.Text;
  private score: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.setupSystems();
    this.setupUI();
    this.startGame();
  }

  update(): void {
    this.trainManager.update();
    this.checkTrainSwitches();
    this.updateScore();
  }

  private setupSystems(): void {
    // Track system with switches
    this.trackSystem = new TrackSystem(this);
    this.trackSystem.drawTracksWithSwitches();
    
    // Train manager
    this.trainManager = new TrainManager(this);
    
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
    this.add.text(20, 20, 'Click the switch to change tracks!', {
      fontSize: '18px',
      color: '#666',
      fontFamily: 'Comic Sans MS, cursive',
    });
  }

  private startGame(): void {
    this.score = 0;
    this.trainManager.startSpawning(2500);
  }

  private updateScore(): void {
    const trains = this.trainManager.getTrains();
    trains.forEach((train) => {
      if (train.x > GAME_CONFIG.width * 0.9 && !train.getData('scored')) {
        train.setData('scored', true);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Bonus for switching tracks
        if (train.getData('switched')) {
          this.score += 5;
          this.showBonus('+5 Switch Bonus!');
        }
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
      }
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
    this.trainManager.stopSpawning();
    
    const gameOverText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'CRASH!\nClick to restart',
      {
        fontSize: '48px',
        color: '#e74c3c',
        fontFamily: 'Comic Sans MS, cursive',
        align: 'center',
      }
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setInteractive({ cursor: 'pointer' });
    
    gameOverText.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}
```

### 3.5 Input Handler Utility
Create `src/utils/InputHandler.ts`:
```typescript
export class InputHandler {
  static addHoverEffect(
    gameObject: Phaser.GameObjects.GameObject,
    scaleAmount: number = 1.1,
  ): void {
    gameObject.setInteractive();
    
    gameObject.on('pointerover', () => {
      gameObject.setScale(scaleAmount);
    });
    
    gameObject.on('pointerout', () => {
      gameObject.setScale(1);
    });
  }

  static addClickAnimation(
    scene: Phaser.Scene,
    gameObject: Phaser.GameObjects.GameObject,
  ): void {
    gameObject.on('pointerdown', () => {
      scene.tweens.add({
        targets: gameObject,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    });
  }
}
```

## Verification Steps

1. Run `npm run dev`
2. Click on the switch - verify it toggles visually
3. Watch trains change tracks when passing active switch
4. Verify trains stay on track when switch is straight
5. Test collision detection still works
6. Check hover effects on switch
7. Verify score bonus for successful switches

## Accessibility Considerations

- Large click targets (60x60px minimum)
- Visual feedback for all interactions
- Clear contrast between switch states
- Cursor changes on hover

## Success Criteria

- [x] Switch toggles on click
- [x] Visual feedback for switch states
- [x] Trains follow switch direction
- [x] Smooth track transitions
- [x] No collision bugs with switches
- [x] Intuitive user interaction

## Next Phase
Phase 4 will implement:
- Game state management
- Start/pause/restart functionality  
- Progressive difficulty
- High score tracking