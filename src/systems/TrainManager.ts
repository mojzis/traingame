import Phaser from 'phaser';
import { Train } from '../entities/Train';
import { TrackPosition } from '../types';
import { GAME_CONFIG, getAvailableTracks } from '../config/game.config';

export class TrainManager {
  private scene: Phaser.Scene;
  private trains: Train[] = [];
  private trainGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private defaultSpeed: number = 100;
  private speedMultiplier: number = 1.0;
  private currentSpawnInterval: number = 2000;
  private generatedLayout: any = null;
  private currentScore: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.trainGroup = this.scene.physics.add.group({
      runChildUpdate: false,
    });
  }

  setGeneratedLayout(layout: any): void {
    this.generatedLayout = layout;
  }

  setCurrentScore(score: number): void {
    this.currentScore = score;
  }

  startSpawning(interval: number = 3000, speed: number = 100): void {
    this.defaultSpeed = speed;
    this.currentSpawnInterval = interval;
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

  pauseSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = true;
    }
  }

  resumeSpawning(): void {
    if (this.spawnTimer) {
      this.spawnTimer.paused = false;
    }
  }

  updateSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;

    // Update all existing trains
    this.trains.forEach((train) => {
      train.updateSpeedMultiplier(multiplier);
    });
  }

  updateSpawnInterval(interval: number): void {
    if (this.currentSpawnInterval !== interval) {
      this.currentSpawnInterval = interval;

      // Restart the spawn timer with new interval
      if (this.spawnTimer) {
        this.spawnTimer.destroy();
        this.spawnTimer = this.scene.time.addEvent({
          delay: interval,
          callback: this.spawnTrain,
          callbackScope: this,
          loop: true,
        });
      }
    }
  }

  private spawnTrain(): void {
    // Use stored current score to determine available tracks
    const availableTracks = getAvailableTracks(
      this.currentScore,
    ) as TrackPosition[];

    // Validate that collision prevention is possible
    if (!this.canPreventCollisions(availableTracks)) {
      // Occasionally allow spawning even with limited switches for more action
      if (Math.random() > 0.7) {
        console.log('Limited switches - proceeding with cautious spawn');
      } else {
        return;
      }
    }

    // Try each track to find a safe spawn
    const shuffledTracks = [...availableTracks].sort(() => Math.random() - 0.5);

    for (const track of shuffledTracks) {
      const safeSpawn = this.findSafeSpawnForTrack(track);
      if (safeSpawn) {
        const finalSpeed = safeSpawn.speed * this.speedMultiplier;
        const train = new Train(this.scene, -100, track, finalSpeed);
        this.trains.push(train);
        this.trainGroup.add(train);
        return;
      }
    }

    // If no safe spawn found, don't spawn this time (reduced logging)
  }

  private canPreventCollisions(tracks: TrackPosition[]): boolean {
    // Check if we have enough switches to prevent collisions
    let totalSwitches = 0;
    let tracksWithSwitches = 0;

    tracks.forEach((track) => {
      const switches = this.getAvailableSwitchesForTrack(track);
      if (switches.length > 0) {
        tracksWithSwitches++;
        totalSwitches += switches.length;
      }
    });

    // Relaxed: as long as most tracks have switches, allow spawning
    const switchCoverage = tracksWithSwitches / tracks.length;
    return (
      switchCoverage >= 0.8 && totalSwitches >= Math.floor(tracks.length * 0.8)
    );
  }

  private findSafeSpawnForTrack(
    track: TrackPosition,
  ): { speed: number } | null {
    if (!this.generatedLayout) {
      // Fallback to simple logic if no layout available
      const speedVariants = GAME_CONFIG.physics.trainSpeedVariants;
      const speed =
        speedVariants[Math.floor(Math.random() * speedVariants.length)];
      return { speed };
    }

    // First check if this track has any switches at all
    const availableSwitches = this.getAvailableSwitchesForTrack(track);
    if (availableSwitches.length === 0) {
      // NO SWITCHES = NO SPAWNING (prevents unavoidable collisions)
      // Reduced logging for performance
      return null;
    }

    // Find the rightmost (most recent) train on this track
    const trainsOnTrack = this.trains.filter(
      (train) => train.getCurrentTrack() === track,
    );
    if (trainsOnTrack.length === 0) {
      // No trains on this track, safe to spawn any speed
      const speedVariants = GAME_CONFIG.physics.trainSpeedVariants;
      const speed =
        speedVariants[Math.floor(Math.random() * speedVariants.length)];
      return { speed };
    }

    // Find the rightmost train (closest to spawn point)
    const rightmostTrain = trainsOnTrack.reduce((rightmost, train) =>
      train.x > rightmost.x ? train : rightmost,
    );

    // Find reachable switches ahead of the lead train (relaxed requirement)
    const reachableSwitches = availableSwitches.filter(
      (sw) => sw.x > rightmostTrain.x + 50, // Reduced buffer - switch just needs to be ahead
    );

    // Allow spawning even if no switches ahead, but be more careful about distance
    const hasReachableSwitches = reachableSwitches.length > 0;
    if (!hasReachableSwitches) {
      console.log(
        `No switches immediately ahead on ${track} - using extra caution`,
      );
    }

    // Calculate safe spawning parameters with layout awareness
    const minSafeDistance = this.calculateSafeDistanceForTrack(track);
    // Reduced reaction time for more aggressive spawning
    const reactionTime = hasReachableSwitches ? 2000 : 3000; // 2s if switches available, 3s if not
    const pixelsPerMs = rightmostTrain.getSpeed() / 1000;

    // Consider upcoming stops that might slow down the lead train
    const upcomingStops = this.getUpcomingStopsForTrack(
      track,
      rightmostTrain.x,
    );
    let adjustedReactionTime = reactionTime;
    if (upcomingStops.length > 0) {
      // If there's a stop ahead, we have more time as the lead train will pause
      adjustedReactionTime = reactionTime * 1.5;
    }

    const requiredDistance =
      minSafeDistance + adjustedReactionTime * pixelsPerMs;

    if (rightmostTrain.x > requiredDistance) {
      // Safe to spawn - choose appropriate speed
      const maxSafeSpeed = this.calculateMaxSafeSpeed(rightmostTrain);
      const speedVariants = GAME_CONFIG.physics.trainSpeedVariants;
      const safeSpeedOptions = speedVariants.filter(
        (speed) => speed <= maxSafeSpeed,
      );

      if (safeSpeedOptions.length > 0) {
        const speed =
          safeSpeedOptions[Math.floor(Math.random() * safeSpeedOptions.length)];
        return { speed };
      }
    } else if (
      hasReachableSwitches &&
      rightmostTrain.x > minSafeDistance * 0.8
    ) {
      // Aggressive spawning: if switches are available and we're close to safe distance
      const speedVariants = GAME_CONFIG.physics.trainSpeedVariants;
      const conservativeSpeed = Math.min(...speedVariants); // Use slowest speed for aggressive spawns
      return { speed: conservativeSpeed };
    }

    return null; // Not safe to spawn on this track
  }

  private getAvailableSwitchesForTrack(track: TrackPosition): any[] {
    if (!this.generatedLayout) return [];

    return this.generatedLayout.connections.filter(
      (connection: any) => connection.source === track,
    );
  }

  private calculateSafeDistanceForTrack(track: TrackPosition): number {
    const baseSafeDistance = 200; // Reduced from 250 for more aggressive spawning
    const availableSwitches = this.getAvailableSwitchesForTrack(track);

    if (availableSwitches.length === 0) {
      // No escape routes, should never happen with new generation
      return baseSafeDistance * 3; // Reduced from 4x
    }

    // Find the closest switch that could provide an escape route
    const sortedSwitches = [...availableSwitches].sort((a, b) => a.x - b.x);
    const firstSwitch = sortedSwitches[0];

    // Reduced buffers for more aggressive spawning
    const reactionDistance = 100; // Reduced from 150
    const switchBuffer = 75; // Reduced from 100

    return Math.max(
      baseSafeDistance,
      firstSwitch.x + reactionDistance + switchBuffer,
    );
  }

  private getUpcomingStopsForTrack(
    track: TrackPosition,
    currentX: number,
  ): any[] {
    if (!this.generatedLayout) return [];

    return Object.values(this.generatedLayout.stops).filter(
      (stop: any) => stop.track === track && stop.x > currentX,
    );
  }

  private calculateMaxSafeSpeed(leadTrain: any): number {
    // Calculate maximum speed that would still allow time to react
    const safetyBuffer = 1.5; // 50% safety margin
    const leadTrainSpeed = leadTrain.getSpeed();
    const maxSafeSpeed = leadTrainSpeed * safetyBuffer;

    // Don't exceed the fastest available speed
    const maxAvailableSpeed = Math.max(
      ...GAME_CONFIG.physics.trainSpeedVariants,
    );
    return Math.min(maxSafeSpeed, maxAvailableSpeed);
  }

  update(): void {
    // Update each train's movement (for curved switching)
    this.trains.forEach((train) => train.update());

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

  updateSpawnSettings(interval: number, speed: number): void {
    this.defaultSpeed = speed;

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.startSpawning(interval, speed);
    }
  }

  stopAllTrains(): void {
    this.trains.forEach((train) => {
      const body = train.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
    });
  }

  pauseAllTrains(): void {
    this.trains.forEach((train) => {
      train.pause();
    });
  }

  resumeAllTrains(): void {
    this.trains.forEach((train) => {
      train.resume();
    });
  }

  clear(): void {
    this.stopSpawning();
    this.trains.forEach((train) => train.destroy());
    this.trains = [];
    this.trainGroup.clear(true, true);
  }
}
