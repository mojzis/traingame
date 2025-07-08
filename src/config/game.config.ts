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
    },
    trainSpeed: 100, // base pixels per second
    trainSpeedVariants: [80, 100, 120, 140], // Different speed options
    switches: {
      switch1: 200, // ON Track1, diverts TO Track2
      switch2: 350, // ON Track1, diverts TO Track3
      switch3: 500, // ON Track2, diverts TO Track3
      switch4: 650, // ON Track2, diverts TO Track4
      switch5: 800, // ON Track3, diverts TO Track4
      switch6: 950, // ON Track3, diverts TO Track5
      switch7: 1100, // ON Track4, diverts TO Track5
      // Backward switches
      switch8: 300, // ON Track2, diverts TO Track1
      switch9: 450, // ON Track3, diverts TO Track1
      switch10: 600, // ON Track3, diverts TO Track2
      switch11: 750, // ON Track4, diverts TO Track2
      switch12: 900, // ON Track4, diverts TO Track3
      switch13: 1050, // ON Track5, diverts TO Track3
      switch14: 1150, // ON Track5, diverts TO Track4
      switch15: 550, // ON Track4, diverts TO Track3 (early diversion for track4)
    },
    stops: {
      stop1: { x: 450, track: 'track2', duration: 2000 }, // 2 second stop (switch8 at x:300 can divert)
      stop2: { x: 850, track: 'track4', duration: 1500 }, // 1.5 second stop (switch11 at x:750 can divert)
      stop3: { x: 950, track: 'track1', duration: 1000 }, // 1 second stop (switches 1&2 can divert)
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

// Layout generator for balanced switch and stop placement
export function generateBalancedLayout() {
  const tracks = GAME_CONFIG.physics.tracks;
  const trackNames = Object.keys(tracks) as (keyof typeof tracks)[];
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

  // Forward switches (track N -> track N+1)
  for (let i = 0; i < trackNames.length - 1; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 1];

    // Add 1-2 switches for this track pair
    const numSwitches = Math.random() < 0.7 ? 1 : 2;
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
      }
    }
  }

  // Backward switches (track N -> track N-1) - fewer of these
  for (let i = 1; i < trackNames.length; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i - 1];

    // Add 1 backward switch per track pair (40% chance, reduced to prevent conflicts)
    if (Math.random() < 0.4) {
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
      }
    }
  }

  // Skip switches (track N -> track N+2) - for more strategic options
  for (let i = 0; i < trackNames.length - 2; i++) {
    const sourceTrack = trackNames[i];
    const targetTrack = trackNames[i + 2];

    // Add skip switches (20% chance, reduced to prevent overcrowding)
    if (Math.random() < 0.2) {
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
      }
    }
  }

  // Generate stops - ensure each has at least one switch before it
  const stops: Record<string, { x: number; track: string; duration: number }> =
    {};
  const stopPositions = [
    gameWidth * 0.4, // 40% across
    gameWidth * 0.6, // 60% across
    gameWidth * 0.8, // 80% across
  ];

  stopPositions.forEach((stopX, index) => {
    // Choose random track for this stop
    const track = trackNames[Math.floor(Math.random() * trackNames.length)];

    // Ensure there's at least one switch before this stop on this track
    const switchesBeforeStop = switchConnections.filter(
      (sw) => sw.source === track && sw.x < stopX - 100,
    );

    if (switchesBeforeStop.length === 0) {
      // Add a switch before this stop, respecting spacing
      const earlierX = stopX - 150 - Math.random() * 100;
      const targetTrack =
        trackNames[Math.floor(Math.random() * trackNames.length)];
      if (targetTrack !== track && isPositionAvailable(earlierX, track)) {
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

    stops[`stop${index + 1}`] = {
      x: Math.round(stopX),
      track,
      duration: 1000 + Math.random() * 1500, // 1-2.5 second stops
    };
  });

  return { switches, stops, connections: switchConnections };
}
