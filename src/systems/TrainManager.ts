import Phaser from 'phaser';
import { Train } from '../entities/Train';
import { TrackPosition } from '../types';
import { GAME_CONFIG, getAvailableTracks } from '../config/game.config';
import type { GeneratedLayout, SwitchConnection, Stop } from '../types/layout';

export class TrainManager {
  private scene: Phaser.Scene;
  private trains: Train[] = [];
  private trainGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private defaultSpeed: number = 100;
  private speedMultiplier: number = 1.0;
  private currentSpawnInterval: number = 2000;
  private generatedLayout: GeneratedLayout | null = null;
  private currentScore: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.trainGroup = this.scene.physics.add.group({
      runChildUpdate: false,
    });
  }

  setGeneratedLayout(layout: GeneratedLayout): void {
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

    // CRITICAL: Check if this track has at least one ULTRA EARLY switch (x < 150)
    // This prevents unsolvable collisions even in very aggressive spawning scenarios
    const ultraEarlySwitches = availableSwitches.filter((sw) => sw.x < 150);
    if (ultraEarlySwitches.length === 0) {
      console.warn(
        `Track ${track} has no ultra early switches - unsafe for spawning`,
      );
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
        // CRITICAL: Verify the selected speed won't create unsolvable collision
        // Filter out speeds that would catch up before reaching a switch
        const guaranteedSafeSpeeds = safeSpeedOptions.filter((speed) => {
          return this.isSpeedSafeForSpawn(
            track,
            speed,
            rightmostTrain,
            availableSwitches,
          );
        });

        if (guaranteedSafeSpeeds.length > 0) {
          const speed =
            guaranteedSafeSpeeds[
              Math.floor(Math.random() * guaranteedSafeSpeeds.length)
            ];
          return { speed };
        } else {
          // If no guaranteed safe speeds, use slowest speed only
          const slowestSpeed = Math.min(...speedVariants);
          if (
            this.isSpeedSafeForSpawn(
              track,
              slowestSpeed,
              rightmostTrain,
              availableSwitches,
            )
          ) {
            return { speed: slowestSpeed };
          }
        }
      }
    } else if (
      hasReachableSwitches &&
      rightmostTrain.x > minSafeDistance * 0.8
    ) {
      // Aggressive spawning: if switches are available and we're close to safe distance
      const speedVariants = GAME_CONFIG.physics.trainSpeedVariants;
      const conservativeSpeed = Math.min(...speedVariants); // Use slowest speed for aggressive spawns

      // CRITICAL: Still verify this won't create unsolvable collision
      if (
        this.isSpeedSafeForSpawn(
          track,
          conservativeSpeed,
          rightmostTrain,
          availableSwitches,
        )
      ) {
        return { speed: conservativeSpeed };
      }
    }

    return null; // Not safe to spawn on this track
  }

  /**
   * CRITICAL: Check if spawning a train at given speed is safe
   * A spawn is safe if the train can reach a switch before colliding with the lead train
   */
  private isSpeedSafeForSpawn(
    track: TrackPosition,
    newSpeed: number,
    leadTrain: Train,
    switches: SwitchConnection[],
  ): boolean {
    const MIN_REACTION_TIME_MS = 2000; // Player needs at least 2 seconds to react

    const leadSpeed = leadTrain.getSpeed();
    const leadX = leadTrain.x;
    const newTrainX = -100; // Spawn position

    // If new train is slower or same speed, no collision will occur
    if (newSpeed <= leadSpeed) {
      return true;
    }

    // Calculate time until collision if both trains stay on same track
    const relativeSpeed = newSpeed - leadSpeed;
    const distance = leadX - newTrainX;
    const timeToCollisionMs = (distance / relativeSpeed) * 1000;

    // If collision time is very far in the future, it's safe (player has time)
    if (timeToCollisionMs > MIN_REACTION_TIME_MS * 3) {
      return true;
    }

    // Find the nearest switch the new train can reach
    const reachableSwitches = switches.filter((sw) => {
      const distanceToSwitch = sw.x - newTrainX;
      const timeToReachSwitchMs = (distanceToSwitch / newSpeed) * 1000;

      // Switch is reachable if we can get there before collision
      // AND the player has time to react and click it
      return (
        timeToReachSwitchMs < timeToCollisionMs &&
        timeToReachSwitchMs > 500 && // Need at least 500ms to react and click
        timeToReachSwitchMs < timeToCollisionMs - MIN_REACTION_TIME_MS
      );
    });

    return reachableSwitches.length > 0;
  }

  private getAvailableSwitchesForTrack(
    track: TrackPosition,
  ): SwitchConnection[] {
    if (!this.generatedLayout) return [];

    return this.generatedLayout.connections.filter(
      (connection: SwitchConnection) => connection.source === track,
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
  ): Stop[] {
    if (!this.generatedLayout) return [];

    return Object.values(this.generatedLayout.stops).filter(
      (stop: Stop) => stop.track === track && stop.x > currentX,
    );
  }

  private calculateMaxSafeSpeed(leadTrain: Train): number {
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
