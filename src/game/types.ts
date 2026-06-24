export type GameStatus = 'start' | 'playing' | 'gameOver';

export type BlockValue = number;

export type Block = {
  id: number;
  value: BlockValue;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isActive: boolean;
  mergeLockMs: number;
};

export type Effect = {
  id: number;
  x: number;
  y: number;
  size: number;
  lifeMs: number;
  maxLifeMs: number;
};

export type GameState = {
  status: GameStatus;
  score: number;
  bestScore: number;
  highestValue: BlockValue;
  currentValue: BlockValue;
  nextValue: BlockValue;
  cursorX: number;
  blocks: Block[];
  effects: Effect[];
  warningMs: number;
  nextBlockId: number;
  nextEffectId: number;
};
