import {
  AIR_DRAG,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  COLLISION_PASSES,
  DANGER_LINE_Y,
  FLOOR_BOUNCE,
  FIBONACCI_GOAL,
  FIBONACCI_START,
  FRICTION,
  GAME_OVER_GRACE_MS,
  GRAVITY,
  HORIZONTAL_SLEEP_SPEED,
  MAX_BLOCK_SPEED,
  MERGE_TOUCH_TOLERANCE,
  RESTING_SPEED,
  SPAWN_Y,
  STACK_FRICTION,
  WALL_BOUNCE,
  getBlockSize,
} from './constants';
import {
  areBlocksCloseEnoughToMerge,
  areBlocksTouching,
  getBlockCenter,
  getCollisionInfo,
  resolveBlockCollision,
} from './collision';
import type { Block, BlockValue, Effect, GameState } from './types';

const STARTING_CURSOR_X = BOARD_WIDTH / 2;
const DEFAULT_CURRENT_VALUE = 1;
const DEFAULT_NEXT_VALUE = 2;
const FIBONACCI_CACHE = [...FIBONACCI_START];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCursorBounds(value: number) {
  const halfSize = getBlockSize(value) / 2;

  return {
    min: halfSize,
    max: BOARD_WIDTH - halfSize,
  };
}

function ensureFibonacciValue(target: number) {
  while (FIBONACCI_CACHE[FIBONACCI_CACHE.length - 1] < target) {
    const last = FIBONACCI_CACHE[FIBONACCI_CACHE.length - 1];
    const previous = FIBONACCI_CACHE[FIBONACCI_CACHE.length - 2];
    FIBONACCI_CACHE.push(last + previous);
  }
}

function getFibonacciIndex(value: number) {
  ensureFibonacciValue(value);
  return FIBONACCI_CACHE.indexOf(value);
}

export function getUnlockedSequence(highestValue: number) {
  ensureFibonacciValue(highestValue);
  const highestIndex = Math.max(0, getFibonacciIndex(highestValue));
  return FIBONACCI_CACHE.slice(0, highestIndex + 1);
}

function getMergePartners(value: number) {
  if (value === 1) {
    return [1, 2];
  }

  const index = getFibonacciIndex(value);

  if (index === -1) {
    return [];
  }

  const partners: number[] = [];

  if (index > 0) {
    partners.push(FIBONACCI_CACHE[index - 1]);
  }

  if (index + 1 < FIBONACCI_CACHE.length) {
    partners.push(FIBONACCI_CACHE[index + 1]);
  } else {
    const last = FIBONACCI_CACHE[FIBONACCI_CACHE.length - 1];
    const previous = FIBONACCI_CACHE[FIBONACCI_CACHE.length - 2];
    partners.push(last + previous);
  }

  return partners;
}

function getSpawnTable(highestValue: number) {
  if (highestValue >= 55) {
    return [
      { value: 1, weight: 35 },
      { value: 2, weight: 25 },
      { value: 3, weight: 20 },
      { value: 5, weight: 15 },
      { value: 8, weight: 5 },
    ];
  }

  if (highestValue >= 21) {
    return [
      { value: 1, weight: 40 },
      { value: 2, weight: 30 },
      { value: 3, weight: 20 },
      { value: 5, weight: 10 },
    ];
  }

  if (highestValue >= 8) {
    return [
      { value: 1, weight: 50 },
      { value: 2, weight: 35 },
      { value: 3, weight: 15 },
    ];
  }

  if (highestValue >= 3) {
    return [
      { value: 1, weight: 55 },
      { value: 2, weight: 30 },
      { value: 3, weight: 15 },
    ];
  }

  return [
    { value: 1, weight: 70 },
    { value: 2, weight: 30 },
  ];
}

function rollNextValue(highestValue: number): BlockValue {
  const table = getSpawnTable(highestValue);
  const total = table.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of table) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.value;
    }
  }

  return table[table.length - 1].value;
}

function createBlock(
  id: number,
  value: BlockValue,
  centerX: number,
  y: number,
  overrides?: Partial<Block>,
): Block {
  const size = getBlockSize(value);

  return {
    id,
    value,
    size,
    x: clamp(centerX - size / 2, 0, BOARD_WIDTH - size),
    y,
    vx: 0,
    vy: 0,
    isActive: true,
    mergeLockMs: 0,
    ...overrides,
  };
}

function separateBlockFromNeighbors(block: Block, neighbors: Block[]) {
  const nextBlock = { ...block };

  for (let pass = 0; pass < 8; pass += 1) {
    for (const neighbor of neighbors) {
      const info = getCollisionInfo(nextBlock, neighbor);

      if (info.overlap <= 0) {
        continue;
      }

      nextBlock.x -= info.normalX * (info.overlap + 1);
      nextBlock.y -= info.normalY * (info.overlap + 1);
      nextBlock.x = clamp(nextBlock.x, 0, BOARD_WIDTH - nextBlock.size);
      nextBlock.y = clamp(nextBlock.y, 0, BOARD_HEIGHT - nextBlock.size);
    }
  }

  return nextBlock;
}

function canMergeValues(firstValue: number, secondValue: number) {
  if (firstValue === 1 && secondValue === 1) {
    return true;
  }

  if (firstValue === secondValue) {
    return false;
  }

  const firstIndex = getFibonacciIndex(firstValue);
  const secondIndex = getFibonacciIndex(secondValue);

  if (firstIndex === -1 || secondIndex === -1) {
    return false;
  }

  return Math.abs(firstIndex - secondIndex) === 1;
}

function getMergedValue(firstValue: number, secondValue: number) {
  if (firstValue === 1 && secondValue === 1) {
    return 2;
  }

  return firstValue + secondValue;
}

function mergeBlocks(
  blocks: Block[],
  mergeCandidates: Set<string>,
  effects: Effect[],
  score: number,
  highestValue: BlockValue,
  nextBlockId: number,
  nextEffectId: number,
) {
  const locked = new Set<number>();
  const removed = new Set<number>();
  const nextBlocks = [...blocks];
  const nextEffects = [...effects];
  let nextScore = score;
  let nextHighestValue = highestValue;
  let nextId = nextBlockId;
  let effectId = nextEffectId;

  for (let index = 0; index < nextBlocks.length; index += 1) {
    const first = nextBlocks[index];

    if (removed.has(first.id) || locked.has(first.id) || first.mergeLockMs > 0) {
      continue;
    }

    for (
      let candidateIndex = index + 1;
      candidateIndex < nextBlocks.length;
      candidateIndex += 1
    ) {
      const second = nextBlocks[candidateIndex];

      if (
        removed.has(second.id) ||
        locked.has(second.id) ||
        second.mergeLockMs > 0 ||
        !canMergeValues(first.value, second.value) ||
        !mergeCandidates.has(getPairKey(first.id, second.id))
      ) {
        continue;
      }

      removed.add(first.id);
      removed.add(second.id);
      locked.add(first.id);
      locked.add(second.id);

      const mergedValue = getMergedValue(first.value, second.value);
      ensureFibonacciValue(mergedValue);
      const firstCenter = getBlockCenter(first);
      const secondCenter = getBlockCenter(second);
      const effectX = (firstCenter.x + secondCenter.x) / 2;
      const effectY = (firstCenter.y + secondCenter.y) / 2;
      const mergedBlock = separateBlockFromNeighbors(
        createBlock(
          nextId,
          mergedValue,
          effectX,
          effectY - getBlockSize(mergedValue) / 2,
          {
            vx: 0,
            vy: 0,
            isActive: false,
            mergeLockMs: 260,
          },
        ),
        nextBlocks.filter(
          (block) =>
            block.id !== first.id &&
            block.id !== second.id &&
            !removed.has(block.id),
        ),
      );

      nextId += 1;
      nextScore += mergedValue;
      nextHighestValue = Math.max(nextHighestValue, mergedValue);
      nextBlocks.push(mergedBlock);
      const isGoalMerge = mergedValue >= FIBONACCI_GOAL;
      nextEffects.push({
        id: effectId,
        x: effectX,
        y: effectY,
        size: Math.max(first.size, second.size) * (isGoalMerge ? 1.6 : 1.05),
        lifeMs: isGoalMerge ? 520 : 320,
        maxLifeMs: isGoalMerge ? 520 : 320,
      });
      effectId += 1;
      break;
    }
  }

  return {
    blocks: nextBlocks.filter((block) => !removed.has(block.id)),
    effects: nextEffects,
    score: nextScore,
    highestValue: nextHighestValue,
    nextBlockId: nextId,
    nextEffectId: effectId,
  };
}

function getPairKey(firstId: number, secondId: number) {
  return firstId < secondId ? `${firstId}:${secondId}` : `${secondId}:${firstId}`;
}

function collectMergeCandidates(blocks: Block[]) {
  const candidates = new Set<string>();

  for (let index = 0; index < blocks.length; index += 1) {
    const first = blocks[index];

    if (first.mergeLockMs > 0) {
      continue;
    }

    for (
      let candidateIndex = index + 1;
      candidateIndex < blocks.length;
      candidateIndex += 1
    ) {
      const second = blocks[candidateIndex];

      if (
        second.mergeLockMs > 0 ||
        !canMergeValues(first.value, second.value) ||
        !areBlocksCloseEnoughToMerge(first, second, MERGE_TOUCH_TOLERANCE)
      ) {
        continue;
      }

      candidates.add(getPairKey(first.id, second.id));
    }
  }

  return candidates;
}

function limitBlockSpeed(block: Block) {
  block.vx = clamp(block.vx, -MAX_BLOCK_SPEED, MAX_BLOCK_SPEED);
  block.vy = clamp(block.vy, -MAX_BLOCK_SPEED, MAX_BLOCK_SPEED);
}

function isBlockSupported(block: Block, blocks: Block[]) {
  if (block.y + block.size >= BOARD_HEIGHT - 1) {
    return true;
  }

  const center = getBlockCenter(block);

  return blocks.some((other) => {
    if (other.id === block.id) {
      return false;
    }

    const otherCenter = getBlockCenter(other);

    if (otherCenter.y <= center.y) {
      return false;
    }

    const distance = Math.hypot(otherCenter.x - center.x, otherCenter.y - center.y);
    const touchDistance = (block.size + other.size) / 2 + 1.5;

    return distance <= touchDistance;
  });
}

function settleRestingBlocks(blocks: Block[]) {
  for (const block of blocks) {
    limitBlockSpeed(block);

    if (!isBlockSupported(block, blocks)) {
      continue;
    }

    block.vx *= STACK_FRICTION;

    if (Math.abs(block.vx) < HORIZONTAL_SLEEP_SPEED) {
      block.vx = 0;
    }

    if (Math.abs(block.vy) < RESTING_SPEED) {
      block.vy = 0;
    }
  }
}

function hasCrossedDangerLine(block: Block) {
  return !block.isActive && block.y <= DANGER_LINE_Y;
}

export function createInitialGameState(bestScore = 0): GameState {
  return {
    status: 'start',
    score: 0,
    bestScore,
    highestValue: 1,
    currentValue: DEFAULT_CURRENT_VALUE,
    nextValue: DEFAULT_NEXT_VALUE,
    cursorX: STARTING_CURSOR_X,
    blocks: [],
    effects: [],
    warningMs: 0,
    nextBlockId: 1,
    nextEffectId: 1,
  };
}

export function startGame(bestScore: number) {
  return {
    ...createInitialGameState(bestScore),
    status: 'playing' as const,
  };
}

export function restartGame(state: GameState) {
  return startGame(Math.max(state.bestScore, state.score));
}

export function moveCursor(state: GameState, delta: number) {
  const bounds = getCursorBounds(state.currentValue);

  return {
    ...state,
    cursorX: clamp(state.cursorX + delta, bounds.min, bounds.max),
  };
}

export function setCursorPosition(state: GameState, positionX: number) {
  const bounds = getCursorBounds(state.currentValue);

  return {
    ...state,
    cursorX: clamp(positionX, bounds.min, bounds.max),
  };
}

export function canDrop(state: GameState) {
  const previewBlock = createBlock(
    -1,
    state.currentValue,
    state.cursorX,
    SPAWN_Y,
  );

  return (
    state.status === 'playing' &&
    !state.blocks.some((block) => areBlocksTouching(previewBlock, block, 2))
  );
}

export function dropCurrentBlock(state: GameState): GameState {
  if (!canDrop(state)) {
    return state;
  }

  return {
    ...state,
    blocks: [
      ...state.blocks,
      createBlock(state.nextBlockId, state.currentValue, state.cursorX, SPAWN_Y, {
        vy: 10,
        mergeLockMs: 200,
      }),
    ],
    currentValue: state.nextValue,
    nextValue: rollNextValue(state.highestValue),
    nextBlockId: state.nextBlockId + 1,
  };
}

export function getCurrentPartners(value: number) {
  return getMergePartners(value);
}

export function updateGameState(state: GameState, deltaMs: number): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const dt = Math.min(deltaMs, 32) / 1000;
  const nextEffects = state.effects
    .map((effect) => ({
      ...effect,
      lifeMs: Math.max(0, effect.lifeMs - deltaMs),
    }))
    .filter((effect) => effect.lifeMs > 0);
  const blocks = state.blocks.map((block) => {
    const next = { ...block };
    next.mergeLockMs = Math.max(0, next.mergeLockMs - deltaMs);
    next.vy += GRAVITY * dt;
    next.vx *= AIR_DRAG;
    next.vy *= AIR_DRAG;
    limitBlockSpeed(next);
    next.x += next.vx * dt;
    next.y += next.vy * dt;

    if (next.x <= 0) {
      next.x = 0;
      next.vx = Math.abs(next.vx) * WALL_BOUNCE;
    } else if (next.x + next.size >= BOARD_WIDTH) {
      next.x = BOARD_WIDTH - next.size;
      next.vx = -Math.abs(next.vx) * WALL_BOUNCE;
    }

    if (next.y + next.size >= BOARD_HEIGHT) {
      next.y = BOARD_HEIGHT - next.size;
      next.vy = -Math.abs(next.vy) * FLOOR_BOUNCE;
      next.vx *= FRICTION;

      if (Math.abs(next.vy) < RESTING_SPEED) {
        next.vy = 0;
      }
    }

    if (next.isActive && next.y > SPAWN_Y + next.size * 1.4) {
      next.isActive = false;
    }

    return next;
  });

  const mergeCandidates = collectMergeCandidates(blocks);
  const nextEffectId = state.nextEffectId;

  for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
    for (let index = 0; index < blocks.length; index += 1) {
      for (
        let candidateIndex = index + 1;
        candidateIndex < blocks.length;
        candidateIndex += 1
      ) {
        const first = blocks[index];
        const second = blocks[candidateIndex];

        if (!areBlocksTouching(first, second, 0)) {
          continue;
        }

        resolveBlockCollision(first, second);
        first.vx *= FRICTION;
        second.vx *= FRICTION;
      }
    }
  }

  settleRestingBlocks(blocks);

  const merged = mergeBlocks(
    blocks,
    mergeCandidates,
    nextEffects,
    state.score,
    state.highestValue,
    state.nextBlockId,
    nextEffectId,
  );

  const bestScore = Math.max(state.bestScore, merged.score);
  const isGameOver = merged.blocks.some(hasCrossedDangerLine);
  const warningMs = isGameOver ? GAME_OVER_GRACE_MS : 0;

  return {
    ...state,
    blocks: merged.blocks,
    effects: merged.effects,
    score: merged.score,
    bestScore,
    highestValue: merged.highestValue,
    nextBlockId: merged.nextBlockId,
    nextEffectId: merged.nextEffectId,
    warningMs,
    status: isGameOver ? 'gameOver' : 'playing',
  };
}
