import type { GameState } from '../game/types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../game/constants';

type GameCanvasProps = {
  gameState: GameState;
};

export function GameCanvas({ gameState }: GameCanvasProps) {
  const { player, enemies, score } = gameState;

  return (
    <section className="game">
      <div className="hud">Score: {score}</div>

      <div
        className="game-area"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }}
      >
        <div
          className="player"
          style={{
            width: player.size,
            height: player.size,
            left: player.position.x,
            top: player.position.y,
          }}
        />

        {enemies.map((enemy, index) => (
          <div
            key={index}
            className="enemy"
            style={{
              width: enemy.size,
              height: enemy.size,
              left: enemy.position.x,
              top: enemy.position.y,
            }}
          />
        ))}
      </div>
    </section>
  );
}