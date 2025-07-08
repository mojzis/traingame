# Phase 2: Core Mechanics - Trains & Movement

## Goals
- Implement Train entity class
- Create train movement system
- Add collision detection
- Implement basic train spawning

## Tasks

### 2.1 Train Entity Class
Create `src/entities/Train.ts`:
```typescript
import Phaser from 'phaser';
import { TrackPosition } from '../types';
import { GAME_CONFIG } from '../config/game.config';

export class Train extends Phaser.GameObjects.Rectangle {
  private currentTrack: TrackPosition;
  private speed: number;

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
    
    // Set physics properties
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.speed);
    body.setImmovable(true);
    
    // Add stroke for hand-drawn effect
    this.setStrokeStyle(2, 0x000000);
  }

  getCurrentTrack(): TrackPosition {
    return this.currentTrack;
  }

  setTrack(track: TrackPosition): void {
    this.currentTrack = track;
    const targetY = track === 'top' 
      ? GAME_CONFIG.physics.tracks.top 
      : GAME_CONFIG.physics.tracks.bottom;
    
    // Smooth transition between tracks
    this.scene.tweens.add({
      targets: this,
      y: targetY,
      duration: 200,
      ease: 'Cubic.easeInOut',
    });
  }

  isOffScreen(): boolean {
    return this.x > GAME_CONFIG.width + this.width;
  }

  destroy(): void {
    super.destroy();
  }
}
```

### 2.2 Train Manager System
Create `src/systems/TrainManager.ts`:
```typescript
import Phaser from 'phaser';
import { Train } from '../entities/Train';
import { TrackPosition } from '../types';

export class TrainManager {
  private scene: Phaser.Scene;
  private trains: Train[] = [];
  private trainGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer?: Phaser.Time.TimerEvent;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.trainGroup = this.scene.physics.add.group({
      classType: Train,
      runChildUpdate: false,
    });
  }

  startSpawning(interval: number = 3000): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: interval,
      callback: this.spawnTrain,
      callbackScope: this,
      loop: true,
    });
    
    // Spawn first train immediately
    this.spawnTrain();
  }

  stopSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
  }

  private spawnTrain(): void {
    // Randomly choose track
    const track: TrackPosition = Math.random() > 0.5 ? 'top' : 'bottom';
    
    // Create train off-screen to the left
    const train = new Train(this.scene, -60, track);
    
    this.trains.push(train);
    this.trainGroup.add(train);
  }

  update(): void {
    // Remove trains that have gone off-screen
    this.trains = this.trains.filter((train) => {
      if (train.isOffScreen()) {
        this.trainGroup.remove(train);
        train.destroy();
        return false;
      }
      return true;
    });
  }

  getTrains(): Train[] {
    return this.trains;
  }

  getTrainGroup(): Phaser.Physics.Arcade.Group {
    return this.trainGroup;
  }

  clear(): void {
    this.stopSpawning();
    this.trains.forEach((train) => train.destroy());
    this.trains = [];
    this.trainGroup.clear(true, true);
  }
}
```

### 2.3 Collision Detection System
Create `src/systems/CollisionManager.ts`:
```typescript
import Phaser from 'phaser';
import { Train } from '../entities/Train';

export class CollisionManager {
  private scene: Phaser.Scene;
  private onCollisionCallback?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupCollisions(trainGroup: Phaser.Physics.Arcade.Group): void {
    // Check train-to-train collisions
    this.scene.physics.add.overlap(
      trainGroup,
      trainGroup,
      this.handleTrainCollision,
      this.checkTrainOverlap,
      this,
    );
  }

  private checkTrainOverlap(
    train1: Phaser.GameObjects.GameObject,
    train2: Phaser.GameObjects.GameObject,
  ): boolean {
    if (train1 === train2) return false;
    
    const t1 = train1 as Train;
    const t2 = train2 as Train;
    
    // Only collide if on same track
    return t1.getCurrentTrack() === t2.getCurrentTrack();
  }

  private handleTrainCollision(
    train1: Phaser.GameObjects.GameObject,
    train2: Phaser.GameObjects.GameObject,
  ): void {
    // Visual feedback
    const t1 = train1 as Train;
    const t2 = train2 as Train;
    
    // Flash red
    t1.setFillStyle(0xff0000);
    t2.setFillStyle(0xff0000);
    
    // Trigger collision callback
    if (this.onCollisionCallback) {
      this.onCollisionCallback();
    }
  }

  onCollision(callback: () => void): void {
    this.onCollisionCallback = callback;
  }
}
```

### 2.4 Updated Main Scene
Update `src/scenes/MainScene.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';
import { TrainManager } from '../systems/TrainManager';
import { CollisionManager } from '../systems/CollisionManager';

export class MainScene extends Phaser.Scene {
  private trainManager!: TrainManager;
  private collisionManager!: CollisionManager;
  private scoreText!: Phaser.GameObjects.Text;
  private score: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    this.drawTracks();
    this.setupManagers();
    this.setupUI();
    this.startGame();
  }

  update(): void {
    this.trainManager.update();
    this.updateScore();
  }

  private setupManagers(): void {
    // Initialize managers
    this.trainManager = new TrainManager(this);
    this.collisionManager = new CollisionManager(this);
    
    // Setup collision detection
    this.collisionManager.setupCollisions(this.trainManager.getTrainGroup());
    
    // Handle collision event
    this.collisionManager.onCollision(() => {
      this.handleGameOver();
    });
  }

  private drawTracks(): void {
    const graphics = this.add.graphics();
    
    // Make tracks look hand-drawn with slight waviness
    const drawWavyLine = (y: number) => {
      graphics.lineStyle(GAME_CONFIG.graphics.trackWidth, GAME_CONFIG.colors.track);
      graphics.beginPath();
      
      for (let x = 0; x <= GAME_CONFIG.width; x += 10) {
        const waveY = y + Math.sin(x * 0.02) * 2;
        if (x === 0) {
          graphics.moveTo(x, waveY);
        } else {
          graphics.lineTo(x, waveY);
        }
      }
      
      graphics.strokePath();
    };
    
    drawWavyLine(GAME_CONFIG.physics.tracks.top);
    drawWavyLine(GAME_CONFIG.physics.tracks.bottom);
  }

  private setupUI(): void {
    // Score display
    this.scoreText = this.add.text(GAME_CONFIG.width - 150, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
    });
  }

  private startGame(): void {
    this.score = 0;
    this.trainManager.startSpawning(2500);
  }

  private updateScore(): void {
    // Award points for trains that make it across
    const trains = this.trainManager.getTrains();
    trains.forEach((train) => {
      if (train.x > GAME_CONFIG.width * 0.9 && !train.getData('scored')) {
        train.setData('scored', true);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
      }
    });
  }

  private handleGameOver(): void {
    this.trainManager.stopSpawning();
    
    // Show game over text
    const gameOverText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'COLLISION!\nGame Over',
      {
        fontSize: '48px',
        color: '#e74c3c',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      },
    );
    gameOverText.setOrigin(0.5);
    
    // Restart after delay
    this.time.delayedCall(3000, () => {
      this.scene.restart();
    });
  }
}
```

### 2.5 Enhanced Type Definitions
Update `src/types/index.ts`:
```typescript
export type TrackPosition = 'top' | 'bottom';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface TrainConfig {
  speed?: number;
  color?: number;
}

export interface SpawnConfig {
  interval: number;
  minInterval?: number;
  speedIncrease?: number;
}
```

### 2.6 Testing Utilities
Create `src/utils/debug.ts`:
```typescript
export class DebugUtils {
  static drawCollisionBoxes(scene: Phaser.Scene, enabled: boolean): void {
    if (enabled && scene.physics.world) {
      scene.physics.world.drawDebug = true;
    }
  }

  static logTrainCount(trains: any[]): void {
    console.log(`Active trains: ${trains.length}`);
  }

  static showFPS(scene: Phaser.Scene): void {
    const fpsText = scene.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#00ff00',
    });

    scene.events.on('update', () => {
      fpsText.setText(`FPS: ${Math.round(scene.game.loop.actualFps)}`);
    });
  }
}
```

## Verification Steps

1. Run `npm run dev`
2. Verify trains spawn from the left
3. Check trains move smoothly to the right
4. Verify trains appear on both tracks randomly
5. Test collision detection (trains on same track)
6. Confirm score increases for trains reaching the end
7. Verify game over on collision

## Performance Considerations

- Object pooling for trains (future optimization)
- Limit maximum concurrent trains
- Clean up off-screen objects
- Use arcade physics for simple collision

## Success Criteria

- [x] Trains spawn and move correctly
- [x] Collision detection works
- [x] Score system functional
- [x] Game over state implemented
- [x] No memory leaks (trains cleaned up)
- [x] Smooth 60 FPS performance

## Next Phase
Phase 3 will add:
- Interactive switch component
- Click handling for switches
- Track switching mechanics
- Visual feedback for user actions