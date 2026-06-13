import { useEffect, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { StartScreen } from './components/StartScreen';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ENEMY_SIZE,
  PLAYER_SIZE,
} from './game/constants';
import type { GameState } from './game/types';
import { updateGameState, type InputState } from './game/update';

const initialGameState: GameState = {
  status: 'start',
  score: 0,
  player: {
    position: {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT / 2 - PLAYER_SIZE / 2,
    },
    size: PLAYER_SIZE,
  },
  enemies: [
    {
      position: {
        x: 100,
        y: 100,
      },
      size: ENEMY_SIZE,
    },
  ],
};

const initialInputState: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [inputState, setInputState] = useState<InputState>(initialInputState);

  function startGame() {
    setGameState({
      ...initialGameState,
      status: 'playing',
      score: 0,
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      setInputState((current) => ({
        ...current,
        up: event.key === 'ArrowUp' || event.key === 'w' ? true : current.up,
        down:
          event.key === 'ArrowDown' || event.key === 's'
            ? true
            : current.down,
        left:
          event.key === 'ArrowLeft' || event.key === 'a'
            ? true
            : current.left,
        right:
          event.key === 'ArrowRight' || event.key === 'd'
            ? true
            : current.right,
      }));
    }

    function handleKeyUp(event: KeyboardEvent) {
      setInputState((current) => ({
        ...current,
        up: event.key === 'ArrowUp' || event.key === 'w' ? false : current.up,
        down:
          event.key === 'ArrowDown' || event.key === 's'
            ? false
            : current.down,
        left:
          event.key === 'ArrowLeft' || event.key === 'a'
            ? false
            : current.left,
        right:
          event.key === 'ArrowRight' || event.key === 'd'
            ? false
            : current.right,
      }));
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setGameState((current) => updateGameState(current, inputState));
    }, 16);

    return () => {
      window.clearInterval(timerId);
    };
  }, [inputState]);

  return (
    <main className="app">
      {gameState.status === 'start' && <StartScreen onStart={startGame} />}

      {gameState.status === 'playing' && (
        <GameCanvas gameState={gameState} />
      )}

      {gameState.status === 'gameOver' && (
        <GameOverScreen score={gameState.score} onRetry={startGame} />
      )}
    </main>
  );
}

export default App;