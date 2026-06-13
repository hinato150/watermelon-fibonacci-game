type GameOverScreenProps = {
  score: number;
  onRetry: () => void;
};

export function GameOverScreen({ score, onRetry }: GameOverScreenProps) {
  return (
    <section className="screen">
      <h1>Game Over</h1>
      <p>Score: {score}</p>
      <button onClick={onRetry}>Retry</button>
    </section>
  );
}