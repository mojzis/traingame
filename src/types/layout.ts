/**
 * Type definitions for game layout structures
 * Created during Phase 1 TypeScript improvements
 */

import type { TrackPosition } from './index';

/**
 * Represents a switch connection between two tracks
 */
export interface SwitchConnection {
  /** Unique identifier for this switch connection */
  id: string;
  /** Source track where trains can be switched from */
  source: TrackPosition;
  /** Target track where trains will be switched to */
  target: TrackPosition;
  /** X coordinate position of the switch */
  x: number;
}

/**
 * Represents a stop point that pauses trains temporarily
 */
export interface Stop {
  /** X coordinate position of the stop */
  x: number;
  /** Track on which this stop is located */
  track: TrackPosition;
  /** Duration in milliseconds that trains should pause at this stop */
  duration: number;
}

/**
 * Map of stop IDs to Stop objects
 * Format: { "stop_track1_150": Stop, ... }
 */
export type StopsMap = Record<string, Stop>;

/**
 * Complete generated layout including switches, stops, and connections
 */
export interface GeneratedLayout {
  /** Map of switch IDs to switch data */
  switches: Record<string, unknown>;
  /** Map of stop IDs to Stop objects */
  stops: StopsMap;
  /** Array of all switch connections */
  connections: SwitchConnection[];
}

/**
 * Phaser GameObject with getData functionality
 * Used for type-safe filtering of game objects
 */
export interface GameObjectWithData extends Phaser.GameObjects.GameObject {
  getData(key: string): unknown;
}
