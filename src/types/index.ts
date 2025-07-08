export type TrackPosition =
  | 'track1'
  | 'track2'
  | 'track3'
  | 'track4'
  | 'track5';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface TrainConfig {
  speed?: number;
  color?: number;
}

export interface SpawnConfig {
  interval: number;
  minInterval?: number;
  speedIncrease?: number;
}
