import { describe, it, expect } from 'vitest';
import {
  generateBalancedLayout,
  getAvailableTracks,
} from '../config/game.config';

describe('Unsolvable Collision Detection', () => {
  /**
   * This test simulates the game spawning logic to ensure that no unsolvable
   * collision situations occur. An unsolvable situation is when:
   * 1. Multiple trains are spawned
   * 2. They are on a collision course
   * 3. The player has insufficient time to react (< 2 seconds before collision)
   */
  it('should not create unsolvable collision situations over 20 iterations', () => {
    const ITERATIONS = 20;
    const MIN_REACTION_TIME_MS = 2000; // Player needs at least 2 seconds to react
    const SIMULATION_SPAWNS = 5; // Simulate 5 train spawns per iteration

    for (let iter = 0; iter < ITERATIONS; iter++) {
      // Test across all game levels
      const testScores = [0, 222, 444]; // Level 0, 1, and 2

      testScores.forEach((score) => {
        const layout = generateBalancedLayout(score);
        const availableTracks = getAvailableTracks(score);

        // Verify every track has at least one switch (basic safety check)
        availableTracks.forEach((track) => {
          const switches = layout.connections.filter(
            (conn: any) => conn.source === track,
          );
          expect(switches.length).toBeGreaterThan(
            0,
            `Iteration ${iter}, Score ${score}: Track ${track} has no switches - guaranteed unsolvable!`,
          );
        });

        // Simulate train spawning
        const spawnedTrains: Array<{
          track: string;
          x: number;
          speed: number;
          spawnTime: number;
        }> = [];

        // Simulate spawns at different times
        for (let spawn = 0; spawn < SIMULATION_SPAWNS; spawn++) {
          const spawnTime = spawn * 1000; // Spawn every 1 second
          const track =
            availableTracks[Math.floor(Math.random() * availableTracks.length)];
          const speed = [80, 100, 120, 140][Math.floor(Math.random() * 4)];

          spawnedTrains.push({
            track,
            x: -100, // Starting position
            speed,
            spawnTime,
          });
        }

        // Check for immediate collision threats (trains on same track)
        const trackGroups: Record<string, typeof spawnedTrains> = {};
        spawnedTrains.forEach((train) => {
          if (!trackGroups[train.track]) {
            trackGroups[train.track] = [];
          }
          trackGroups[train.track].push(train);
        });

        // For each track with multiple trains, check if they will collide before player can react
        Object.entries(trackGroups).forEach(([track, trains]) => {
          if (trains.length < 2) return;

          // Sort by spawn time
          trains.sort((a, b) => a.spawnTime - b.spawnTime);

          for (let i = 0; i < trains.length - 1; i++) {
            const leadTrain = trains[i];
            const followTrain = trains[i + 1];

            // Calculate positions at the time the follow train spawns
            const timeDiff = followTrain.spawnTime - leadTrain.spawnTime;
            const leadTrainX =
              leadTrain.x + (leadTrain.speed * timeDiff) / 1000;
            const followTrainX = followTrain.x;

            const distance = leadTrainX - followTrainX;

            // Calculate time until collision (if both trains stay on same track)
            const relativeSpeed = followTrain.speed - leadTrain.speed;

            if (relativeSpeed > 0) {
              // Follow train is faster, will eventually catch up
              const timeToCollision = (distance / relativeSpeed) * 1000; // Convert to ms

              // Get switches for this track
              const switches = layout.connections.filter(
                (conn: any) => conn.source === track,
              );

              // Calculate minimum time needed to react and switch
              // Player needs to notice the collision threat AND click a switch
              const minReactionTime = MIN_REACTION_TIME_MS;

              // Check if there's a reachable switch before collision
              const hasReachableSwitch = switches.some((sw: any) => {
                const distanceToSwitch = sw.x - followTrainX;
                const timeToReachSwitch =
                  (distanceToSwitch / followTrain.speed) * 1000;
                return timeToReachSwitch < timeToCollision;
              });

              if (timeToCollision < minReactionTime && !hasReachableSwitch) {
                throw new Error(
                  `Iteration ${iter}, Score ${score}: Unsolvable collision detected on ${track}! ` +
                    `Time to collision: ${timeToCollision.toFixed(0)}ms (< ${minReactionTime}ms minimum), ` +
                    `No reachable switch, Lead speed: ${leadTrain.speed}, Follow speed: ${followTrain.speed}, ` +
                    `Distance: ${distance.toFixed(0)}px`,
                );
              }
            }
          }
        });
      });
    }
  });

  /**
   * Test that the layout generator creates enough switches distributed
   * across the game area to allow escape from any position
   */
  it('should generate switches distributed across the play area', () => {
    for (let iter = 0; iter < 10; iter++) {
      const layout = generateBalancedLayout(0);

      // Divide the game area into zones
      const zones = [
        { min: 0, max: 300 },
        { min: 300, max: 600 },
        { min: 600, max: 900 },
        { min: 900, max: 1200 },
      ];

      // Check that each zone has at least one switch
      zones.forEach((zone, idx) => {
        const switchesInZone = layout.connections.filter(
          (conn: any) => conn.x >= zone.min && conn.x < zone.max,
        );

        expect(switchesInZone.length).toBeGreaterThan(
          0,
          `Iteration ${iter}: Zone ${idx} (${zone.min}-${zone.max}) has no switches`,
        );
      });
    }
  });

  /**
   * Test that trains spawned close together have different speeds
   * to avoid immediate rear-end collisions
   */
  it('should handle rapid spawning on same track', () => {
    const layout = generateBalancedLayout(0);
    const availableTracks = getAvailableTracks(0);

    // Simulate rapid spawning (worst case: same track, fast follow train)
    const track = availableTracks[0];
    const switches = layout.connections.filter(
      (conn: any) => conn.source === track,
    );

    expect(switches.length).toBeGreaterThan(
      0,
      'Track must have switches for safe spawning',
    );

    // Simulate spawn sequence: slow train, then fast train 1 second later
    const slowSpeed = 80;
    const fastSpeed = 140;
    const spawnInterval = 1000; // ms

    // Lead train position after spawn interval
    const leadTrainX = -100 + (slowSpeed * spawnInterval) / 1000;
    const followTrainX = -100;
    const distance = leadTrainX - followTrainX;

    // Time until collision
    const relativeSpeed = fastSpeed - slowSpeed;
    const timeToCollision = (distance / relativeSpeed) * 1000;

    // Find first switch on this track
    const firstSwitch = switches.reduce(
      (min: any, sw: any) => (!min || sw.x < min.x ? sw : min),
      null,
    );

    if (firstSwitch) {
      const distanceToSwitch = firstSwitch.x - followTrainX;
      const timeToReachSwitch = (distanceToSwitch / fastSpeed) * 1000;

      // Ensure the follow train can reach the switch before collision
      expect(timeToReachSwitch).toBeLessThan(
        timeToCollision,
        `Fast train cannot reach switch (${firstSwitch.x}) before collision. ` +
          `Distance to switch: ${distanceToSwitch}px, Time to collision: ${timeToCollision}ms`,
      );
    }
  });
});
