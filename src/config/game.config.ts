export const GAME_CONFIG = {
  width: 1200,
  height: 600,
  backgroundColor: '#ffffff',

  physics: {
    tracks: {
      track1: 100, // Top main track
      track2: 200, // Upper middle track
      track3: 300, // Lower middle track
      track4: 400, // Bottom main track
      track5: 500, // New bottom track
      track6: 580, // Level 2 extra track (closer spacing)
    },
    trainSpeed: 100, // base pixels per second
    trainSpeedVariants: [80, 100, 120, 140], // Different speed options
    speedProgression: {
      pointsPerSpeedIncrease: 50, // Every 50 points, increase speed
      maxSpeedMultiplier: 2.5, // Maximum 2.5x speed
      spawnIntervalDecrease: 0.8, // Each level reduces spawn interval by 20%
      minSpawnInterval: 800, // Minimum spawn interval (ms)
    },
    levelProgression: {
      level0Tracks: 3, // Number of tracks in beginner level
      level1Points: 222, // Points needed to progress from level 0 to level 1
      level2Points: 444, // Points needed for level 2
      level2StopMultiplier: 1.8, // Stops 80% longer in level 2
      level2SpawnMultiplier: 0.6, // 40% more frequent spawning in level 2
    },
  },

  graphics: {
    trackWidth: 4,
    trainWidth: 60,
    trainHeight: 30,
    switchSize: 25,
  },

  colors: {
    track: 0x333333,
    train: 0x4a90e2,
    trainSlow: 0x95a5a6, // Gray for slow trains
    trainFast: 0xe74c3c, // Red for fast trains
    trainVeryFast: 0x8e44ad, // Purple for very fast trains
    switch: 0xe74c3c,
    switchActive: 0x27ae60,
    stop: 0xf39c12, // Orange for stops
  },
} as const;

import { TrackPosition } from '../types';

// Layout generator for balanced switch and stop placement
export function generateBalancedLayout(score: number = 0) {
  const availableTrackNames = getAvailableTracks(score);
  const trackNames = availableTrackNames as TrackPosition[];
  const gameWidth = GAME_CONFIG.width;
  const switchSize = GAME_CONFIG.graphics.switchSize;
  const minSwitchSpacing = switchSize * 2; // Minimum spacing between switches

  // Generate evenly distributed switch positions across zones
  // CRITICAL: Ensure switches exist in ALL zones for escape routes
  const switchPositions: number[] = [];
  const numSwitchColumns = 10; // More columns for better distribution

  // Define zones to ensure coverage across entire play area
  const zones = [
    { min: 150, max: 300 }, // Early zone - CRITICAL for initial spawns
    { min: 300, max: 500 }, // Early-mid zone
    { min: 500, max: 700 }, // Mid zone
    { min: 700, max: 900 }, // Mid-late zone
    { min: 900, max: 1100 }, // Late zone
  ];

  // Add at least 2 positions per zone
  zones.forEach((zone) => {
    const zoneWidth = zone.max - zone.min;
    switchPositions.push(Math.round(zone.min + zoneWidth * 0.33));
    switchPositions.push(Math.round(zone.min + zoneWidth * 0.67));
  });

  // Generate balanced switches - ensure each track gets roughly equal switches
  const switches: Record<string, number> = {};
  const switchConnections: Array<{
    id: string;
    source: string;
    target: string;
    x: number;
  }> = [];
  let switchId = 1;

  // Track occupied positions to prevent overlaps
  const occupiedPositions: Array<{ x: number; track: string }> = [];

  // Helper function to check if a position is available
  function isPositionAvailable(x: number, track: string): boolean {
    return !occupiedPositions.some(
      (pos) =>
        Math.abs(pos.x - x) < minSwitchSpacing ||
        (pos.track === track && Math.abs(pos.x - x) < minSwitchSpacing * 1.5),
    );
  }

  // Helper function to find available position
  function findAvailablePosition(
    track: string,
    preferredPositions: number[],
  ): number | null {
    // Shuffle positions for randomness
    const shuffled = [...preferredPositions].sort(() => Math.random() - 0.5);

    for (const x of shuffled) {
      if (isPositionAvailable(x, track)) {
        return x;
      }
    }

    // If no preferred position works, try to find any available position
    for (let x = 150; x < gameWidth - 150; x += 50) {
      if (isPositionAvailable(x, track)) {
        return x;
      }
    }

    return null;
  }

  // CRITICAL: Ensure EVERY track has at least one switch for safe gameplay
  const trackSwitchCount: Record<string, number> = {};
  trackNames.forEach((track) => {
    trackSwitchCount[track] = 0;
  });

  // CRITICAL: Add one ULTRA EARLY switch per track pair first (x < 150)
  // This guarantees even very aggressive rapid spawning scenarios are always solvable
  // Trains spawn at x=-100, so switches at 50-120 are reachable within ~1.5 seconds
  for (let i = 0; i < trackNames.length - 1; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 1];

    // Force an ultra early switch (40-80) for emergency scenarios
    // Maximum position calculation: For worst case (80 vs 140 speed, 1s spawn interval)
    // Collision at ~87px, so switch must be at <85px to be reachable
    let added = false;
    for (let attempt = 0; attempt < 30 && !added; attempt++) {
      const x = 40 + Math.random() * 40; // Ultra early: 40-80
      // For ultra early switches, reduce spacing requirements if needed
      const relaxedSpacing =
        attempt > 15 ? minSwitchSpacing * 0.5 : minSwitchSpacing;
      const isAvailable = !occupiedPositions.some(
        (pos) =>
          Math.abs(pos.x - x) < relaxedSpacing ||
          (pos.track === sourceTrack &&
            Math.abs(pos.x - x) < relaxedSpacing * 1.2),
      );

      if (isAvailable) {
        const id = `switch${switchId++}`;
        switches[id] = Math.round(x);
        switchConnections.push({
          id,
          source: sourceTrack,
          target: targetTrack,
          x: Math.round(x),
        });
        occupiedPositions.push({ x: Math.round(x), track: sourceTrack });
        trackSwitchCount[sourceTrack]++;
        added = true;
      }
    }

    // ABSOLUTE GUARANTEE: If still not added, force it with minimal constraints
    // MUST be reachable before collision: x < 85
    if (!added) {
      const x = 45 + Math.random() * 35; // Force at 45-80 (before collision point)
      const id = `switch${switchId++}`;
      switches[id] = Math.round(x);
      switchConnections.push({
        id,
        source: sourceTrack,
        target: targetTrack,
        x: Math.round(x),
      });
      occupiedPositions.push({ x: Math.round(x), track: sourceTrack });
      trackSwitchCount[sourceTrack]++;
    }
  }

  // Forward switches (track N -> track N+1) - additional switches
  for (let i = 0; i < trackNames.length - 1; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 1];

    // Add 0-2 more switches distributed across the play area
    const additionalSwitches = Math.floor(Math.random() * 3); // 0, 1, or 2

    for (let j = 0; j < additionalSwitches; j++) {
      const x = findAvailablePosition(sourceTrack, switchPositions);
      if (x !== null) {
        const id = `switch${switchId++}`;
        switches[id] = x;
        switchConnections.push({
          id,
          source: sourceTrack,
          target: targetTrack,
          x,
        });
        occupiedPositions.push({ x, track: sourceTrack });
        trackSwitchCount[sourceTrack]++;
      }
    }
  }

  // Backward switches (track N -> track N-1)
  // CRITICAL: Ensure tracks without ultra early switches (like last track) get one
  for (let i = 1; i < trackNames.length; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i - 1];

    // Check if this track has an ultra early switch
    const hasUltraEarly = switchConnections.some(
      (conn) => conn.source === sourceTrack && conn.x < 90,
    );

    // Always add ultra early backward switch if track has no ultra early switch
    // Otherwise add randomly
    if (!hasUltraEarly || Math.random() < 0.3) {
      // Try to add ultra early backward switch (40-80) if needed
      if (!hasUltraEarly) {
        let added = false;
        for (let attempt = 0; attempt < 30 && !added; attempt++) {
          const x = 40 + Math.random() * 40; // Ultra early: 40-80
          const relaxedSpacing =
            attempt > 15 ? minSwitchSpacing * 0.5 : minSwitchSpacing;
          const isAvailable = !occupiedPositions.some(
            (pos) =>
              Math.abs(pos.x - x) < relaxedSpacing ||
              (pos.track === sourceTrack &&
                Math.abs(pos.x - x) < relaxedSpacing * 1.2),
          );

          // CRITICAL: Check for bidirectional conflict
          // Don't create a backward switch near a forward switch going the opposite direction
          const hasBidirectionalConflict = switchConnections.some(
            (conn) =>
              Math.abs(conn.x - x) < 30 && // Within 30px (test uses 25px tolerance)
              conn.source === targetTrack &&
              conn.target === sourceTrack,
          );

          if (isAvailable && !hasBidirectionalConflict) {
            const id = `switch${switchId++}`;
            switches[id] = Math.round(x);
            switchConnections.push({
              id,
              source: sourceTrack,
              target: targetTrack,
              x: Math.round(x),
            });
            occupiedPositions.push({ x: Math.round(x), track: sourceTrack });
            trackSwitchCount[sourceTrack]++;
            added = true;
          }
        }

        // ABSOLUTE GUARANTEE for tracks without ultra early switches
        // Try harder to find a non-conflicting position
        if (!added) {
          for (let attempt = 0; attempt < 50; attempt++) {
            const x = 40 + Math.random() * 40; // 40-80 range
            const hasBidirectionalConflict = switchConnections.some(
              (conn) =>
                Math.abs(conn.x - x) < 30 && // Within 30px (test uses 25px tolerance)
                conn.source === targetTrack &&
                conn.target === sourceTrack,
            );

            if (!hasBidirectionalConflict) {
              const id = `switch${switchId++}`;
              switches[id] = Math.round(x);
              switchConnections.push({
                id,
                source: sourceTrack,
                target: targetTrack,
                x: Math.round(x),
              });
              occupiedPositions.push({ x: Math.round(x), track: sourceTrack });
              trackSwitchCount[sourceTrack]++;
              added = true;
              break;
            }
          }

          // ULTIMATE GUARANTEE: Force switch even with potential conflicts
          // This is critical to prevent tracks with no switches
          if (!added) {
            const x = 55 + Math.floor(Math.random() * 15); // Force at 55-70px
            const id = `switch${switchId++}`;
            switches[id] = x;
            switchConnections.push({
              id,
              source: sourceTrack,
              target: targetTrack,
              x,
            });
            occupiedPositions.push({ x, track: sourceTrack });
            trackSwitchCount[sourceTrack]++;
            console.warn(
              `Forced backward switch for ${sourceTrack} at ${x}px (all attempts failed)`,
            );
          }
        }
      } else if (Math.random() < 0.3) {
        // Random additional backward switch
        const x = findAvailablePosition(sourceTrack, switchPositions);
        if (x !== null) {
          // Check for bidirectional conflict
          const hasBidirectionalConflict = switchConnections.some(
            (conn) =>
              Math.abs(conn.x - x) < 30 && // Within 30px (test uses 25px tolerance)
              conn.source === targetTrack &&
              conn.target === sourceTrack,
          );

          if (!hasBidirectionalConflict) {
            const id = `switch${switchId++}`;
            switches[id] = x;
            switchConnections.push({
              id,
              source: sourceTrack,
              target: targetTrack,
              x,
            });
            occupiedPositions.push({ x, track: sourceTrack });
            trackSwitchCount[sourceTrack]++;
          }
        }
      }
    }
  }

  // Skip switches (track N -> track N+2) - for more strategic options
  for (let i = 0; i < trackNames.length - 2; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 2];

    // Add skip switches only if track needs more switches or randomly
    if (trackSwitchCount[sourceTrack] === 0 || Math.random() < 0.2) {
      const x = findAvailablePosition(sourceTrack, switchPositions);
      if (x !== null) {
        const id = `switch${switchId++}`;
        switches[id] = x;
        switchConnections.push({
          id,
          source: sourceTrack,
          target: targetTrack,
          x,
        });
        occupiedPositions.push({ x, track: sourceTrack });
        trackSwitchCount[sourceTrack]++;
      }
    }
  }

  // CRITICAL: Ensure every track has at least one switch
  trackNames.forEach((track) => {
    if (trackSwitchCount[track] === 0) {
      // Force add a switch for this track
      const possibleTargets = trackNames.filter((t) => t !== track);
      const targetTrack =
        possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

      // Try multiple positions to find a valid spot
      for (let attempt = 0; attempt < 10; attempt++) {
        const x = 200 + Math.random() * (gameWidth - 400); // Keep away from edges
        if (isPositionAvailable(x, track)) {
          const id = `switch${switchId++}`;
          switches[id] = Math.round(x);
          switchConnections.push({
            id,
            source: track,
            target: targetTrack,
            x: Math.round(x),
          });
          occupiedPositions.push({ x: Math.round(x), track });
          trackSwitchCount[track]++;
          break;
        }
      }
    }
  });

  // CRITICAL: Ensure every track has at least one ULTRA EARLY switch (x < 150)
  // This is essential for handling even very aggressive rapid spawning scenarios
  // (Should already be covered by the first loop, but double-check as safety measure)
  const trackEarlySwitchCount: Record<string, number> = {};
  trackNames.forEach((track) => {
    const earlySwitches = switchConnections.filter(
      (conn) => conn.source === track && conn.x < 150,
    );
    trackEarlySwitchCount[track] = earlySwitches.length;
  });

  trackNames.forEach((track) => {
    if (trackEarlySwitchCount[track] === 0) {
      // Force add an early switch for this track
      const possibleTargets = trackNames.filter((t) => t !== track);
      const targetTrack =
        possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

      let added = false;
      // Try ultra early positions (40-85) to find a valid spot
      for (let attempt = 0; attempt < 30 && !added; attempt++) {
        const x = 40 + Math.random() * 45; // Ultra early zone: 40-85 (before collision point)
        if (isPositionAvailable(x, track)) {
          const id = `switch${switchId++}`;
          switches[id] = Math.round(x);
          switchConnections.push({
            id,
            source: track,
            target: targetTrack,
            x: Math.round(x),
          });
          occupiedPositions.push({ x: Math.round(x), track });
          trackSwitchCount[track]++;
          trackEarlySwitchCount[track]++;
          added = true;
        }
      }

      // ABSOLUTE GUARANTEE: If still not added after all attempts, force it
      // This MUST succeed to prevent tracks with no switches
      if (!added) {
        const x = 50 + Math.floor(Math.random() * 20); // Force at 50-70px
        const id = `switch${switchId++}`;
        switches[id] = x;
        switchConnections.push({
          id,
          source: track,
          target: targetTrack,
          x,
        });
        occupiedPositions.push({ x, track });
        trackSwitchCount[track]++;
        trackEarlySwitchCount[track]++;
        console.warn(
          `Forced switch for ${track} at ${x}px (no valid positions found)`,
        );
      }
    }
  });

  // Generate stops - ensure each has at least one switch before it with adequate spacing
  const stops: Record<string, { x: number; track: string; duration: number }> =
    {};
  const stopPositions = [
    gameWidth * 0.4, // 40% across
    gameWidth * 0.6, // 60% across
    gameWidth * 0.8, // 80% across
  ];

  stopPositions.forEach((stopX, index) => {
    // Choose random track for this stop
    let track = trackNames[Math.floor(Math.random() * trackNames.length)];
    const minSwitchToStopDistance = 300; // Minimum distance from switch to stop for safe operation (increased for switching time)

    // Check if the chosen track has adequate switch coverage for this stop position
    const switchesBeforeStop = switchConnections.filter(
      (sw) => sw.source === track && sw.x < stopX - minSwitchToStopDistance,
    );

    // If no adequate switches, try to find a better track or add a switch
    if (switchesBeforeStop.length === 0) {
      // First, try to find a track that already has good switch coverage
      let foundBetterTrack = false;
      for (const candidateTrack of trackNames) {
        const candidateSwitches = switchConnections.filter(
          (sw) =>
            sw.source === candidateTrack &&
            sw.x < stopX - minSwitchToStopDistance,
        );
        if (candidateSwitches.length > 0) {
          track = candidateTrack;
          foundBetterTrack = true;
          break;
        }
      }

      // If no track has good coverage, add a switch before this stop
      if (!foundBetterTrack) {
        const earlierX = stopX - minSwitchToStopDistance - Math.random() * 150; // Extra buffer for emergency switches
        const availableTargets = trackNames.filter((t) => t !== track);
        const targetTrack =
          availableTargets[Math.floor(Math.random() * availableTargets.length)];

        if (earlierX > 100 && isPositionAvailable(earlierX, track)) {
          // Ensure switch isn't too close to start
          const id = `switch${switchId++}`;
          switches[id] = Math.round(earlierX);
          switchConnections.push({
            id,
            source: track,
            target: targetTrack,
            x: earlierX,
          });
          occupiedPositions.push({ x: earlierX, track });
        }
      }
    }

    const baseDuration = 1000 + Math.random() * 1500; // 1-2.5 second stops
    stops[`stop${index + 1}`] = {
      x: Math.round(stopX),
      track,
      duration: calculateStopDuration(baseDuration, score),
    };
  });

  // CRITICAL: Ensure switches are distributed across all zones
  // This provides strategic options throughout the game area
  const zoneRanges = [
    { min: 300, max: 500 }, // Mid-early zone  { min: 500, max: 700 },   // Mid zone
    { min: 700, max: 900 }, // Mid-late zone
    { min: 900, max: 1100 }, // Late zone
  ];

  zoneRanges.forEach((zoneRange) => {
    const switchesInZone = switchConnections.filter(
      (conn) => conn.x >= zoneRange.min && conn.x < zoneRange.max,
    );

    if (switchesInZone.length === 0) {
      // Add at least one switch in this zone
      const track =
        trackNames[Math.floor(Math.random() * (trackNames.length - 1))];
      const possibleTargets = trackNames.filter((t) => t !== track);
      const targetTrack =
        possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

      const zoneWidth = zoneRange.max - zoneRange.min;
      let x = Math.round(zoneRange.min + Math.random() * zoneWidth);
      let added = false;

      // Check for bidirectional conflict and find alternative position if needed
      let attempts = 0;
      while (attempts < 30) {
        const hasBidirectionalConflict = switchConnections.some(
          (conn) =>
            Math.abs(conn.x - x) < 30 && // Within 30px (test uses 25px tolerance)
            conn.source === targetTrack &&
            conn.target === track,
        );

        if (!hasBidirectionalConflict) {
          added = true;
          break;
        }

        x = Math.round(zoneRange.min + Math.random() * zoneWidth);
        attempts++;
      }

      // Force add even with conflict if necessary
      if (!added) {
        x = Math.round(zoneRange.min + zoneWidth / 2); // Middle of zone
        console.warn(
          `Forced zone switch at ${x}px (zone ${zoneRange.min}-${zoneRange.max})`,
        );
      }

      const id = `switch${switchId++}`;
      switches[id] = x;
      switchConnections.push({
        id,
        source: track,
        target: targetTrack,
        x,
      });
      occupiedPositions.push({ x, track });
      trackSwitchCount[track]++;
    }
  });

  // Debug: Log switch distribution
  console.log('Switch distribution per track:', trackSwitchCount);
  console.log('Total switches generated:', switchConnections.length);

  return { switches, stops, connections: switchConnections };
}

// Speed progression helper functions
export function calculateSpeedMultiplier(score: number): number {
  const config = GAME_CONFIG.physics.speedProgression;
  const level = Math.floor(score / config.pointsPerSpeedIncrease);
  const multiplier = 1 + level * 0.15; // Each level adds 15% speed
  return Math.min(multiplier, config.maxSpeedMultiplier);
}

export function calculateSpawnInterval(
  score: number,
  baseInterval: number,
): number {
  const config = GAME_CONFIG.physics.speedProgression;
  const level = Math.floor(score / config.pointsPerSpeedIncrease);
  let interval = baseInterval;

  for (let i = 0; i < level; i++) {
    interval *= config.spawnIntervalDecrease;
  }

  return Math.max(interval, config.minSpawnInterval);
}

export function getSpeedLevel(score: number): number {
  return Math.floor(
    score / GAME_CONFIG.physics.speedProgression.pointsPerSpeedIncrease,
  );
}

// Level progression helper functions
export function getGameLevel(score: number): number {
  const levelProgression = GAME_CONFIG.physics.levelProgression;

  if (score >= levelProgression.level2Points) {
    return 2;
  } else if (score >= levelProgression.level1Points) {
    return 1;
  }
  return 0; // Beginner level
}

export function getAvailableTracks(score: number): string[] {
  const level = getGameLevel(score);

  if (level === 0) {
    // Beginner level: only 3 tracks (middle tracks for simplicity)
    return ['track2', 'track3', 'track4'];
  } else if (level === 1) {
    // Basic level: 5 tracks
    return ['track1', 'track2', 'track3', 'track4', 'track5'];
  } else if (level >= 2) {
    // Advanced level: all 6 tracks
    return ['track1', 'track2', 'track3', 'track4', 'track5', 'track6'];
  }

  return ['track2', 'track3', 'track4']; // Default to beginner
}

export function calculateStopDuration(
  baseDuration: number,
  score: number,
): number {
  const level = getGameLevel(score);
  if (level >= 2) {
    return (
      baseDuration * GAME_CONFIG.physics.levelProgression.level2StopMultiplier
    );
  }
  return baseDuration;
}

export function calculateLevelSpawnInterval(
  score: number,
  baseInterval: number,
): number {
  // First apply speed progression
  let interval = calculateSpawnInterval(score, baseInterval);

  // Then apply level-specific multipliers
  const level = getGameLevel(score);
  if (level >= 2) {
    interval *= GAME_CONFIG.physics.levelProgression.level2SpawnMultiplier;
  }

  return Math.max(
    interval,
    GAME_CONFIG.physics.speedProgression.minSpawnInterval,
  );
}
