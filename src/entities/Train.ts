import Phaser from 'phaser';
import { TrackPosition } from '../types';
import { GAME_CONFIG } from '../config/game.config';
import { Switch } from './Switch';

export class Train extends Phaser.GameObjects.Rectangle {
  private currentTrack: TrackPosition;
  private speed: number;
  private originalSpeed: number;
  private hasSwitched: boolean = false;
  private isSwitching: boolean = false;
  private switchStartX: number = 0;
  private switchStartY: number = 0;
  private switchTargetY: number = 0;
  private isStopped: boolean = false;
  private hasVisitedStops: Set<string> = new Set();
  private static generatedStops: any = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    track: TrackPosition,
    speed: number = GAME_CONFIG.physics.trainSpeed,
  ) {
    const y = GAME_CONFIG.physics.tracks[track];

    // Choose color based on speed
    let color: number = GAME_CONFIG.colors.train;
    if (speed <= 80) color = GAME_CONFIG.colors.trainSlow;
    else if (speed >= 120 && speed < 140) color = GAME_CONFIG.colors.trainFast;
    else if (speed >= 140) color = GAME_CONFIG.colors.trainVeryFast;

    super(
      scene,
      x,
      y,
      GAME_CONFIG.graphics.trainWidth,
      GAME_CONFIG.graphics.trainHeight,
      color,
    );

    this.currentTrack = track;
    this.speed = speed;
    this.originalSpeed = speed;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set velocity after a small delay to ensure physics body is ready
    scene.time.delayedCall(10, () => {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(this.speed);
    });

    // Hand-drawn style
    this.setStrokeStyle(2, 0x000000);

    // Add slight rotation for character
    this.setRotation((Phaser.Math.Between(-2, 2) * Math.PI) / 180);
  }

  update(): void {
    if (this.isSwitching) {
      this.updateSwitchMovement();
    }
    this.checkStops();
  }

  checkSwitch(switchObj: Switch): void {
    if (this.hasSwitched) return;

    const switchRange = 40;
    const distance = Math.abs(this.x - switchObj.x);

    if (distance < switchRange) {
      const newTrack = switchObj.getTargetTrack(this.currentTrack);

      if (newTrack !== this.currentTrack) {
        this.setTrack(newTrack);
        this.hasSwitched = true;
        this.setData('switched', true);

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
    const targetY = GAME_CONFIG.physics.tracks[track];

    // Start realistic curved switching movement
    this.isSwitching = true;
    this.switchStartX = this.x;
    this.switchStartY = this.y;
    this.switchTargetY = targetY;
  }

  private updateSwitchMovement(): void {
    const curveLength = 80; // Same as track connection curve length
    const progress = (this.x - this.switchStartX) / curveLength;

    if (progress >= 1) {
      // Switching complete
      this.isSwitching = false;
      this.y = this.switchTargetY;
      return;
    }

    // Follow the same quadratic curve as the track connections
    const t = Math.max(0, Math.min(1, progress));
    this.y =
      this.switchStartY + (this.switchTargetY - this.switchStartY) * t * t;
  }

  static setGeneratedStops(stops: any): void {
    Train.generatedStops = stops;
  }

  private checkStops(): void {
    if (this.isStopped) return;

    const stops = Train.generatedStops || GAME_CONFIG.physics.stops;
    Object.entries(stops).forEach(([stopId, stop]: [string, any]) => {
      if (this.hasVisitedStops.has(stopId)) return;

      const stopRange = 30;
      const isAtStop =
        Math.abs(this.x - stop.x) < stopRange &&
        this.currentTrack === stop.track;

      if (isAtStop) {
        this.stopAtStation(stopId, stop.duration);
      }
    });
  }

  private stopAtStation(stopId: string, duration: number): void {
    this.isStopped = true;
    this.hasVisitedStops.add(stopId);

    // Stop the train
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    // Visual indication that train is stopped
    this.setAlpha(0.7);

    // Resume after duration
    this.scene.time.delayedCall(duration, () => {
      this.isStopped = false;
      body.setVelocityX(this.speed);
      this.setAlpha(1);
    });
  }

  isOffScreen(): boolean {
    return this.x > GAME_CONFIG.width + this.width;
  }

  getSpeed(): number {
    return this.originalSpeed;
  }
}
