export const BOARD_WIDTH = 420;
export const BOARD_HEIGHT = 640;
export const SPAWN_Y = 24;
export const DANGER_LINE_Y = 92;
export const GAME_OVER_GRACE_MS = 3000;

export const GRAVITY = 1800;
export const WALL_BOUNCE = 0.12;
export const FLOOR_BOUNCE = 0.08;
export const FRICTION = 0.985;
export const AIR_DRAG = 0.996;
export const CURSOR_STEP = 28;
export const COLLISION_RESTITUTION = 0.18;
export const COLLISION_PASSES = 3;

export const FIBONACCI_START = [1, 2, 3, 5, 8, 13, 21, 34];
export const MAX_PREVIEW_SEQUENCE = 8;

export function getBlockSize(value: number) {
  const index = Math.max(0, Math.round(Math.log(value) / Math.log(1.618)));
  return Math.min(98, 44 + index * 4);
}

export function getBlockColor(value: number) {
  const hue = Math.min(48, 146 - Math.round(Math.log(value + 1) * 18));
  const saturation = Math.min(78, 52 + Math.round(Math.log(value + 1) * 6));
  const lightness = Math.max(48, 78 - Math.round(Math.log(value + 1) * 5));

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
