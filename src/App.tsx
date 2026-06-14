import { useEffect, useEffectEvent, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { StartScreen } from './components/StartScreen';
import { CURSOR_STEP } from './game/constants';
import {
  createInitialGameState,
  dropCurrentBlock,
  moveCursor,
  restartGame,
  setCursorPosition,
  startGame,
  updateGameState,
} from './game/update';
import type { GameState } from './game/types';

const BEST_SCORE_KEY = 'fibo-drop-best-score';

function readBestScore() {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsed = stored ? Number(stored) : 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(readBestScore()),
  );

  useEffect(() => {
    window.localStorage.setItem(BEST_SCORE_KEY, String(gameState.bestScore));
  }, [gameState.bestScore]);

  const tick = useEffectEvent((deltaMs: number) => {
    setGameState((current) => updateGameState(current, deltaMs));
  });

  useEffect(() => {
    if (gameState.status !== 'playing') {
      return;
    }

    let frameId = 0;
    let lastTime = performance.now();

    function loop(now: number) {
      tick(now - lastTime);
      lastTime = now;
      frameId = window.requestAnimationFrame(loop);
    }

    frameId = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(frameId);
  }, [gameState.status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat && event.code === 'Space') {
        return;
      }

      if (gameState.status === 'start' && event.code === 'Space') {
        setGameState((current) => startGame(current.bestScore));
        return;
      }

      if (gameState.status === 'gameOver') {
        if (event.code === 'Space' || event.key.toLowerCase() === 'r') {
          setGameState((current) => restartGame(current));
        }
        return;
      }

      if (gameState.status !== 'playing') {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.code === 'Space') {
        event.preventDefault();
        setGameState((current) => dropCurrentBlock(current));
        return;
      }

      if (key === 'arrowleft' || key === 'a') {
        setGameState((current) => moveCursor(current, -CURSOR_STEP));
      } else if (key === 'arrowright' || key === 'd') {
        setGameState((current) => moveCursor(current, CURSOR_STEP));
      } else if (key === 'r') {
        setGameState((current) => restartGame(current));
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status]);

  return (
    <main className="app">
      {gameState.status === 'start' && (
        <StartScreen onStart={() => setGameState((current) => startGame(current.bestScore))} />
      )}

      {gameState.status === 'playing' && (
        <GameCanvas
          gameState={gameState}
          onDrop={() => setGameState((current) => dropCurrentBlock(current))}
          onMoveCursor={(x) =>
            setGameState((current) => setCursorPosition(current, x))
          }
        />
      )}

      {gameState.status === 'gameOver' && (
        <GameOverScreen
          score={gameState.score}
          bestScore={gameState.bestScore}
          highestValue={gameState.highestValue}
          onRetry={() => setGameState((current) => restartGame(current))}
        />
      )}
    </main>
  );
}

export default App;
