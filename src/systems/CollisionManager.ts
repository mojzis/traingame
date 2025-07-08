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
    train1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    train2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): boolean {
    if (train1 === train2) return false;
    
    // Type guards to ensure we have Train objects
    if (!(train1 instanceof Train) || !(train2 instanceof Train)) {
      return false;
    }
    
    // Only collide if on same track
    return train1.getCurrentTrack() === train2.getCurrentTrack();
  }

  private handleTrainCollision(
    train1: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    train2: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    // Type guards to ensure we have Train objects
    if (!(train1 instanceof Train) || !(train2 instanceof Train)) {
      return;
    }
    
    // Visual feedback - change border color instead of fill
    train1.setStrokeStyle(6, 0xff0000); // Thick red border
    train2.setStrokeStyle(6, 0xff0000); // Thick red border
    
    // Trigger collision callback
    if (this.onCollisionCallback) {
      this.onCollisionCallback();
    }
  }

  onCollision(callback: () => void): void {
    this.onCollisionCallback = callback;
  }
}