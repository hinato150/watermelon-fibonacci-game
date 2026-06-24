import { useEffect, useState } from 'react';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CURSOR_STEP,
  DANGER_LINE_Y,
  FIBONACCI_GOAL,
  GAME_OVER_GRACE_MS,
  SPAWN_Y,
  getBlockColor,
  getBlockSize,
} from '../game/constants';
import type { BlockValue, GameState } from '../game/types';
import { canDrop, getCurrentPartners } from '../game/update';
import appIcon from '../icon.png';

type GameCanvasProps = {
  gameState: GameState;
  onDrop: () => void;
  onMoveCursor: (x: number) => void;
};

function PreviewBlock({ value, cursorX }: { value: BlockValue; cursorX: number }) {
  const size = getBlockSize(value);

  return (
    <div
      className="block preview-block"
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
  const [boardScale, setBoardScale] = useState(1);
  const dropReady = canDrop(gameState);
  const warningRatio = Math.min(gameState.warningMs / GAME_OVER_GRACE_MS, 1);
  const partners = getCurrentPartners(gameState.currentValue);
  const hasReachedGoal = gameState.highestValue >= FIBONACCI_GOAL;

  useEffect(() => {
    function updateBoardScale() {
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const safeWidth = viewportWidth - 20;
      setBoardScale(Math.min(1, safeWidth / BOARD_WIDTH));
    }

    updateBoardScale();
    window.addEventListener('resize', updateBoardScale);
    window.visualViewport?.addEventListener('resize', updateBoardScale);

    return () => {
      window.removeEventListener('resize', updateBoardScale);
      window.visualViewport?.removeEventListener('resize', updateBoardScale);
    };
  }, []);

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
        <img className="hud-logo" src={appIcon} alt="フィボドロップ" />
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

      <div
        className="board-frame"
        style={{
          width: BOARD_WIDTH * boardScale,
          height: BOARD_HEIGHT * boardScale,
        }}
      >
        <div
          className="game-board"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            transform: `scale(${boardScale})`,
          }}
          onPointerMove={(event) =>
            updateCursorFromClientX(event.clientX, event.currentTarget)
          }
          onPointerDown={(event) => {
            updateCursorFromClientX(event.clientX, event.currentTarget);

            if (event.pointerType !== 'mouse') {
              event.preventDefault();
              onDrop();
            }
          }}
          onClick={onDrop}
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
      </div>

      <div className="mobile-controls" aria-label="スマホ用操作">
        <button
          type="button"
          onClick={() => onMoveCursor(gameState.cursorX - CURSOR_STEP)}
        >
          ←
        </button>
        <button type="button" className="mobile-drop-button" onClick={onDrop}>
          落下
        </button>
        <button
          type="button"
          onClick={() => onMoveCursor(gameState.cursorX + CURSOR_STEP)}
        >
          →
        </button>
      </div>

      <p className="caption">タップ / クリック / スペースで落下</p>
    </section>
  );
}
