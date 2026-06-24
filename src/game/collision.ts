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

export function getCollisionInfo(first: Block, second: Block) {
  const firstCenter = getBlockCenter(first);
  const secondCenter = getBlockCenter(second);
  const dx = secondCenter.x - firstCenter.x;
  const dy = secondCenter.y - firstCenter.y;
  const distance = Math.hypot(dx, dy) || 0.0001;
  const overlapX =
    Math.min(first.x + first.size, second.x + second.size) -
    Math.max(first.x, second.x);
  const overlapY =
    Math.min(first.y + first.size, second.y + second.size) -
    Math.max(first.y, second.y);

  return {
    dx,
    dy,
    distance,
    overlapX,
    overlapY,
    normalX: dx / distance,
    normalY: dy / distance,
  };
}

export function areBlocksTouching(first: Block, second: Block, tolerance = 0) {
  const info = getCollisionInfo(first, second);
  return info.overlapX > tolerance && info.overlapY > tolerance;
}

export function areBlocksCloseEnoughToMerge(
  first: Block,
  second: Block,
  distanceTolerance = 4,
) {
  return (
    first.x < second.x + second.size + distanceTolerance &&
    first.x + first.size + distanceTolerance > second.x &&
    first.y < second.y + second.size + distanceTolerance &&
    first.y + first.size + distanceTolerance > second.y
  );
}

export function resolveBlockCollision(first: Block, second: Block) {
  const info = getCollisionInfo(first, second);

  if (info.overlapX <= 0 || info.overlapY <= 0) {
    return 0;
  }

  const totalSize = first.size + second.size;
  const firstShare = second.size / totalSize;
  const secondShare = first.size / totalSize;
  const separation = Math.min(info.overlapX, info.overlapY) + 0.4;

  if (info.overlapX < info.overlapY) {
    const direction = info.dx >= 0 ? 1 : -1;
    first.x -= direction * separation * firstShare;
    second.x += direction * separation * secondShare;
  } else {
    const direction = info.dy >= 0 ? 1 : -1;
    first.y -= direction * separation * firstShare;
    second.y += direction * separation * secondShare;
  }

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

  return Math.abs(normalVelocity);
}
