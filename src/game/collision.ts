import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  COLLISION_FRICTION,
  COLLISION_RESTITUTION,
} from './constants';
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

function getBlockRadius(block: Block) {
  return block.size / 2;
}

function getBlockMass(block: Block) {
  return block.size * block.size;
}

export function getCollisionInfo(first: Block, second: Block) {
  const firstCenter = getBlockCenter(first);
  const secondCenter = getBlockCenter(second);
  const dx = secondCenter.x - firstCenter.x;
  const dy = secondCenter.y - firstCenter.y;
  const rawDistance = Math.hypot(dx, dy);
  const distance = rawDistance || 0.0001;
  const radiusSum = getBlockRadius(first) + getBlockRadius(second);

  return {
    dx,
    dy,
    distance,
    overlap: radiusSum - rawDistance,
    normalX: rawDistance === 0 ? 0 : dx / distance,
    normalY: rawDistance === 0 ? -1 : dy / distance,
  };
}

export function areBlocksTouching(first: Block, second: Block, tolerance = 0) {
  const info = getCollisionInfo(first, second);
  return info.overlap + tolerance > 0;
}

export function areBlocksCloseEnoughToMerge(
  first: Block,
  second: Block,
  distanceTolerance = 4,
) {
  const info = getCollisionInfo(first, second);
  return info.overlap + distanceTolerance >= 0;
}

export function resolveBlockCollision(first: Block, second: Block) {
  const info = getCollisionInfo(first, second);

  if (info.overlap <= 0) {
    return 0;
  }

  const firstInverseMass = 1 / getBlockMass(first);
  const secondInverseMass = 1 / getBlockMass(second);
  const inverseMassSum = firstInverseMass + secondInverseMass;
  const correction = Math.max(0, info.overlap - 0.35) / inverseMassSum;

  first.x -= info.normalX * correction * firstInverseMass;
  first.y -= info.normalY * correction * firstInverseMass;
  second.x += info.normalX * correction * secondInverseMass;
  second.y += info.normalY * correction * secondInverseMass;

  const relativeVelocityX = second.vx - first.vx;
  const relativeVelocityY = second.vy - first.vy;
  const normalVelocity =
    relativeVelocityX * info.normalX + relativeVelocityY * info.normalY;

  if (normalVelocity < 0) {
    const restitution =
      Math.abs(normalVelocity) > 180 ? COLLISION_RESTITUTION : 0;
    const normalImpulse =
      ((1 + restitution) * -normalVelocity) / inverseMassSum;
    const impulseX = normalImpulse * info.normalX;
    const impulseY = normalImpulse * info.normalY;

    first.vx -= impulseX * firstInverseMass;
    first.vy -= impulseY * firstInverseMass;
    second.vx += impulseX * secondInverseMass;
    second.vy += impulseY * secondInverseMass;

    const tangentX = -info.normalY;
    const tangentY = info.normalX;
    const tangentVelocity =
      relativeVelocityX * tangentX + relativeVelocityY * tangentY;
    const frictionImpulse = clamp(
      -tangentVelocity / inverseMassSum,
      -normalImpulse * COLLISION_FRICTION,
      normalImpulse * COLLISION_FRICTION,
    );
    const frictionX = frictionImpulse * tangentX;
    const frictionY = frictionImpulse * tangentY;

    first.vx -= frictionX * firstInverseMass;
    first.vy -= frictionY * firstInverseMass;
    second.vx += frictionX * secondInverseMass;
    second.vy += frictionY * secondInverseMass;
  }

  first.x = clamp(first.x, 0, BOARD_WIDTH - first.size);
  second.x = clamp(second.x, 0, BOARD_WIDTH - second.size);
  first.y = clamp(first.y, 0, BOARD_HEIGHT - first.size);
  second.y = clamp(second.y, 0, BOARD_HEIGHT - second.size);

  return Math.abs(normalVelocity);
}
