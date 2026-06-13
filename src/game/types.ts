export type Position = {
  x: number;
  y: number;
};

export type Player = {
  position: Position;
  size: number;
};

export type Enemy = {
  position: Position;
  size: number;
};

export type GameStatus = 'start' | 'playing' | 'gameOver';

export type GameState = {
  status: GameStatus;
  score: number;
  player: Player;
  enemies: Enemy[];
};