import Phaser from 'phaser';
import { Switch } from '../entities/Switch';
import {
  GAME_CONFIG,
  generateBalancedLayout,
  getAvailableTracks,
} from '../config/game.config';
import { TrackPosition } from '../types';

export class TrackSystem {
  private scene: Phaser.Scene;
  private switches: Switch[] = [];
  private generatedLayout: any;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.generatedLayout = generateBalancedLayout();
    console.log('Generated layout:', this.generatedLayout);
  }

  createSwitch(
    x: number,
    y: number,
    sourceTrack: TrackPosition,
    destinationTrack: TrackPosition,
  ): Switch {
    const switchObj = new Switch(
      this.scene,
      x,
      y,
      sourceTrack,
      destinationTrack,
    );

    this.switches.push(switchObj);
    return switchObj;
  }

  drawTracksWithSwitches(score: number = 0): void {
    // Generate layout based on current score/level
    this.generatedLayout = generateBalancedLayout(score);

    const graphics = this.scene.add.graphics();

    // Draw all main tracks (level-aware)
    this.drawMainTracks(graphics, score);
    this.drawSwitchConnections(graphics);
    this.drawStops(graphics);

    // Create switches
    this.createSwitches();
  }

  private drawMainTracks(
    graphics: Phaser.GameObjects.Graphics,
    score: number = 0,
  ): void {
    const availableTracks = getAvailableTracks(score);

    // Draw tracks based on current level
    availableTracks.forEach((track: string) => {
      this.drawTrackSegment(
        graphics,
        0,
        GAME_CONFIG.width,
        track as TrackPosition,
      );
    });
  }

  private drawSwitchConnections(graphics: Phaser.GameObjects.Graphics): void {
    // Draw curved connections based on generated layout
    this.generatedLayout.connections.forEach((connection: any) => {
      this.drawTrackConnection(
        graphics,
        connection.x,
        connection.source as TrackPosition,
        connection.target as TrackPosition,
      );
    });
  }

  private drawTrackConnection(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    track1: TrackPosition,
    track2: TrackPosition,
  ): void {
    const tracks = GAME_CONFIG.physics.tracks;
    const y1 = tracks[track1 as keyof typeof tracks];
    const y2 = tracks[track2 as keyof typeof tracks];

    // Draw curved connection between tracks
    graphics.lineStyle(
      GAME_CONFIG.graphics.trackWidth,
      GAME_CONFIG.colors.track,
    );
    graphics.beginPath();
    graphics.moveTo(x, y1);

    // Smooth curve using line segments
    const segments = 12;
    const curveLength = 80; // Length of the curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const curveX = x + curveLength * t;
      const curveY = y1 + (y2 - y1) * t * t; // Quadratic easing for smooth curve
      graphics.lineTo(curveX, curveY);
    }
    graphics.strokePath();
  }

  private createSwitches(): void {
    const tracks = GAME_CONFIG.physics.tracks;

    // Create switches based on generated layout
    this.generatedLayout.connections.forEach((connection: any) => {
      const sourceTrack = connection.source as TrackPosition;
      const destinationTrack = connection.target as TrackPosition;
      const sourceY = tracks[sourceTrack as keyof typeof tracks];

      this.createSwitch(connection.x, sourceY, sourceTrack, destinationTrack);
    });
  }

  private drawTrackSegment(
    graphics: Phaser.GameObjects.Graphics,
    startX: number,
    endX: number,
    track: TrackPosition,
  ): void {
    const y =
      GAME_CONFIG.physics.tracks[
        track as keyof typeof GAME_CONFIG.physics.tracks
      ];

    // Set line style before drawing
    graphics.lineStyle(
      GAME_CONFIG.graphics.trackWidth,
      GAME_CONFIG.colors.track,
    );

    // Draw track with slight hand-drawn wobble
    graphics.beginPath();
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
    return this.switches.find((sw) => Math.abs(sw.x - x) < tolerance);
  }

  private drawStops(graphics: Phaser.GameObjects.Graphics): void {
    // Draw stops based on generated layout
    Object.values(this.generatedLayout.stops).forEach((stop: any) => {
      const y =
        GAME_CONFIG.physics.tracks[
          stop.track as keyof typeof GAME_CONFIG.physics.tracks
        ];

      // Draw stop indicator (square)
      graphics.fillStyle(GAME_CONFIG.colors.stop);
      graphics.fillRect(stop.x - 8, y - 8, 16, 16);

      // Draw border
      graphics.lineStyle(2, 0x000000);
      graphics.strokeRect(stop.x - 8, y - 8, 16, 16);
    });
  }

  getSwitches(): Switch[] {
    return this.switches;
  }

  getGeneratedStops(): any {
    return this.generatedLayout.stops;
  }

  getGeneratedLayout(): any {
    return this.generatedLayout;
  }
}
