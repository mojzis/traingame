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

  // Generate evenly distributed switch positions
  const switchPositions = [];
  const numSwitchColumns = 8; // More columns for better distribution

  for (let col = 0; col < numSwitchColumns; col++) {
    const x = (gameWidth / (numSwitchColumns + 1)) * (col + 1);
    switchPositions.push(Math.round(x));
  }

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

  // Forward switches (track N -> track N+1)
  for (let i = 0; i < trackNames.length - 1; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 1];

    // GUARANTEE at least 1 switch for this track pair
    const minSwitches = 1;
    const maxSwitches = 2;
    const numSwitches = Math.random() < 0.7 ? minSwitches : maxSwitches;

    for (let j = 0; j < numSwitches; j++) {
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
  for (let i = 1; i < trackNames.length; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i - 1];

    // Add backward switch only if track needs more switches or randomly
    if (trackSwitchCount[sourceTrack] === 0 || Math.random() < 0.4) {
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
