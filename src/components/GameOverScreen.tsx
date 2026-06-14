type GameOverScreenProps = {
  score: number;
  bestScore: number;
  highestValue: number;
  onRetry: () => void;
};

export function GameOverScreen({
  score,
  bestScore,
  highestValue,
  onRetry,
}: GameOverScreenProps) {
  return (
    <section className="screen">
      <p className="eyebrow">Danger Over</p>
      <h1>ゲームオーバー</h1>
      <p>危険ラインを超えた状態が続き、盤面があふれました。</p>
      <div className="result-grid">
        <div>
          <span>スコア</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>ベスト</span>
          <strong>{bestScore}</strong>
        </div>
        <div>
          <span>最大到達</span>
          <strong>{highestValue}</strong>
        </div>
      </div>
      <div className="screen-actions">
        <button onClick={onRetry}>もう一度遊ぶ</button>
      </div>
    </section>
  );
}
