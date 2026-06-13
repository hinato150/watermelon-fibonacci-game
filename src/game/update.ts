import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_SPEED } from './constants';
import { isColliding } from './collision';
import type { GameState } from './types';

export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export function updateGameState(
  state: GameState,
  input: InputState,
): GameState {
  if (state.status !== 'playing') {
    return state;
  }

  const nextPlayer = {
    ...state.player,
    position: {
      x: state.player.position.x,
      y: state.player.position.y,
    },
  };

  if (input.left) nextPlayer.position.x -= PLAYER_SPEED;
  if (input.right) nextPlayer.position.x += PLAYER_SPEED;
  if (input.up) nextPlayer.position.y -= PLAYER_SPEED;
  if (input.down) nextPlayer.position.y += PLAYER_SPEED;

  nextPlayer.position.x = Math.max(
    0,
    Math.min(CANVAS_WIDTH - nextPlayer.size, nextPlayer.position.x),
  );

  nextPlayer.position.y = Math.max(
    0,
    Math.min(CANVAS_HEIGHT - nextPlayer.size, nextPlayer.position.y),
  );

  const hitEnemy = state.enemies.some((enemy) =>
    isColliding(nextPlayer, enemy),
  );

  return {
    ...state,
    player: nextPlayer,
    score: state.score + 1,
    status: hitEnemy ? 'gameOver' : state.status,
  };
}