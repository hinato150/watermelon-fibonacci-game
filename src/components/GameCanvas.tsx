import {
  BOARD_WIDTH,
  DANGER_LINE_Y,
  FIBONACCI_GOAL,
  GAME_OVER_GRACE_MS,
  MAX_PREVIEW_SEQUENCE,
  SPAWN_Y,
  getBlockColor,
  getBlockSize,
} from '../game/constants';
import type { BlockValue, GameState } from '../game/types';
import { canDrop, getCurrentPartners, getUnlockedSequence } from '../game/update';

type GameCanvasProps = {
  gameState: GameState;
  onDrop: () => void;
  onMoveCursor: (x: number) => void;
};

function PreviewBlock({ value, cursorX, faded }: { value: BlockValue; cursorX: number; faded?: boolean }) {
  const size = getBlockSize(value);

  return (
    <div
      className={`block preview-block${faded ? ' is-faded' : ''}`}
      style={{
        width: size,
        height: size,
        left: cursorX - size / 2,
        top: SPAWN_Y,
        background: getBlockColor(value),
      }}
    >
      {value}
    </div>
  );
}

export function GameCanvas({
  gameState,
  onDrop,
  onMoveCursor,
}: GameCanvasProps) {
  const dropReady = canDrop(gameState);
  const warningRatio = Math.min(gameState.warningMs / GAME_OVER_GRACE_MS, 1);
  const partners = getCurrentPartners(gameState.currentValue);
  const hasReachedGoal = gameState.highestValue >= FIBONACCI_GOAL;
  const sequence = getUnlockedSequence(gameState.highestValue).slice(
    0,
    MAX_PREVIEW_SEQUENCE,
  );

  function updateCursorFromClientX(
    clientX: number,
    element: HTMLDivElement,
  ) {
    const rect = element.getBoundingClientRect();
    onMoveCursor(((clientX - rect.left) / rect.width) * BOARD_WIDTH);
  }

  return (
    <section className="game-shell">
      <header className="hud-card">
        <div className="score-stack">
          <div>
            <span>Score</span>
            <strong>{gameState.score}</strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{gameState.bestScore}</strong>
          </div>
        </div>
        <div className="queue-stack">
          <div className="queue-item">
            <span>Next</span>
            <strong>{gameState.currentValue}</strong>
          </div>
          <div className="queue-item">
            <span>After</span>
            <strong>{gameState.nextValue}</strong>
          </div>
        </div>
      </header>

      <div className="status-row">
        <span>最大到達: {gameState.highestValue}</span>
        <span>{hasReachedGoal ? `目標達成: ${FIBONACCI_GOAL}` : `目標: ${FIBONACCI_GOAL}`}</span>
        <span>合体相手: {partners.join(' / ')}</span>
      </div>

      <div className="sequence-row">
        {sequence.map((value, index) => (
          <span key={`${value}-${index}`}>{value}</span>
        ))}
      </div>

      <div
        className="game-board"
        style={{ width: BOARD_WIDTH, maxWidth: '100%' }}
        onMouseMove={(event) =>
          updateCursorFromClientX(event.clientX, event.currentTarget)
        }
        onClick={onDrop}
        onTouchStart={(event) => {
          updateCursorFromClientX(event.touches[0].clientX, event.currentTarget);
          onDrop();
        }}
        onTouchMove={(event) =>
          updateCursorFromClientX(event.touches[0].clientX, event.currentTarget)
        }
      >
        <div className="danger-band" style={{ top: DANGER_LINE_Y - 2 }}>
          <span>危険ライン</span>
          <div
            className="danger-progress"
            style={{ transform: `scaleX(${warningRatio})` }}
          />
        </div>

        <PreviewBlock
          value={gameState.currentValue}
          cursorX={gameState.cursorX}
          faded={!dropReady}
        />

        {gameState.blocks.map((block) => (
          <div
            key={block.id}
            className="block"
            style={{
              width: block.size,
              height: block.size,
              left: block.x,
              top: block.y,
              background: getBlockColor(block.value),
              fontSize: `${Math.max(14, Math.min(34, block.size * (String(block.value).length >= 3 ? 0.25 : 0.34)))}px`,
            }}
          >
            {block.value}
          </div>
        ))}

        {gameState.effects.map((effect) => {
          const opacity = effect.lifeMs / effect.maxLifeMs;
          return (
            <div
              key={effect.id}
              className="merge-effect"
              style={{
                left: effect.x - effect.size / 2,
                top: effect.y - effect.size / 2,
                width: effect.size,
                height: effect.size,
                opacity,
                transform: `scale(${1 + (1 - opacity) * 0.9})`,
              }}
            />
          );
        })}

        <div
          className={`drop-hint${dropReady ? ' is-ready' : ''}`}
          style={{ left: gameState.cursorX }}
        />
      </div>

      <p className="caption">
        {dropReady
          ? 'クリック / スペースで落下'
          : '直前のブロックが少し下がるまで待機'}
      </p>
    </section>
  );
}
