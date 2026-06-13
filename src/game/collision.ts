import type { Enemy, Player } from './types';

export function isColliding(player: Player, enemy: Enemy): boolean {
  return (
    player.position.x < enemy.position.x + enemy.size &&
    player.position.x + player.size > enemy.position.x &&
    player.position.y < enemy.position.y + enemy.size &&
    player.position.y + player.size > enemy.position.y
  );
}