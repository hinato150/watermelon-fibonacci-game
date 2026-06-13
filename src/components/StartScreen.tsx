type StartScreenProps = {
  onStart: () => void;
};

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="screen">
      <h1>My Browser Game</h1>
      <p>敵に当たらないように移動するゲームです。</p>
      <button onClick={onStart}>Start</button>
    </section>
  );
}