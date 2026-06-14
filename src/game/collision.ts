import { BOARD_HEIGHT, BOARD_WIDTH, COLLISION_RESTITUTION } from './constants';
import type { Block } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getBlockCenter(block: Block) {
  return {
    x: block.x + block.size / 2,
    y: block.y + block.size / 2,
  };
}

export function getBlockRadius(block: Block) {
  return block.size * 0.44;
}

export function getCollisionInfo(first: Block, second: Block) {
  const firstCenter = getBlockCenter(first);
  const secondCenter = getBlockCenter(second);
  const dx = secondCenter.x - firstCenter.x;
  const dy = secondCenter.y - firstCenter.y;
  const distance = Math.hypot(dx, dy) || 0.0001;
  const minDistance = getBlockRadius(first) + getBlockRadius(second);
  const overlap = minDistance - distance;

  return {
    dx,
    dy,
    distance,
    minDistance,
    overlap,
    normalX: dx / distance,
    normalY: dy / distance,
  };
}

export function areBlocksTouching(first: Block, second: Block, tolerance = 0) {
  return getCollisionInfo(first, second).overlap > tolerance;
}

export function areBlocksCloseEnoughToMerge(
  first: Block,
  second: Block,
  distanceTolerance = 4,
) {
  const info = getCollisionInfo(first, second);
  return info.distance <= info.minDistance + distanceTolerance;
}

export function resolveBlockCollision(first: Block, second: Block) {
  const info = getCollisionInfo(first, second);

  if (info.overlap <= 0) {
    return;
  }

  const totalSize = first.size + second.size;
  const firstShare = second.size / totalSize;
  const secondShare = first.size / totalSize;
  const separation = info.overlap + 0.2;

  first.x -= info.normalX * separation * firstShare;
  first.y -= info.normalY * separation * firstShare;
  second.x += info.normalX * separation * secondShare;
  second.y += info.normalY * separation * secondShare;

  const relativeVelocityX = second.vx - first.vx;
  const relativeVelocityY = second.vy - first.vy;
  const normalVelocity =
    relativeVelocityX * info.normalX + relativeVelocityY * info.normalY;

  if (normalVelocity < 0) {
    const impulse =
      ((1 + COLLISION_RESTITUTION) * -normalVelocity) /
      (1 / first.size + 1 / second.size);
    const impulseX = impulse * info.normalX;
    const impulseY = impulse * info.normalY;

    first.vx -= impulseX / first.size;
    first.vy -= impulseY / first.size;
    second.vx += impulseX / second.size;
    second.vy += impulseY / second.size;
  }

  first.x = clamp(first.x, 0, BOARD_WIDTH - first.size);
  second.x = clamp(second.x, 0, BOARD_WIDTH - second.size);
  first.y = clamp(first.y, 0, BOARD_HEIGHT - first.size);
  second.y = clamp(second.y, 0, BOARD_HEIGHT - second.size);
}
