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
export const COLLISION_PASSES = 6;
export const MERGE_TOUCH_TOLERANCE = 8;

export const FIBONACCI_START = [1, 2, 3, 5, 8, 13, 21, 34];
export const FIBONACCI_GOAL = 144;
export const MAX_PREVIEW_SEQUENCE = 8;

export function getBlockSize(value: number) {
  return Math.min(152, (8 + value) * 2);
}

export function getBlockColor(value: number) {
  const neonHues = [184, 104, 54, 31, 331, 204, 146, 48, 312, 174, 22];
  const index = Math.max(0, Math.round(Math.log(value) / Math.log(1.618)));
  const hue = neonHues[index % neonHues.length];
  const saturation = 92;
  const lightness = Math.max(52, 68 - index * 2);

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
