type StartScreenProps = {
  onStart: () => void;
};

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="screen">
      <p className="eyebrow">Prototype 0.1</p>
      <h1>フィボドロップ</h1>
      <p>
        フィボナッチ数列で隣り合う数字をつなげて育てる
        落下パズルゲームです。
      </p>
      <div className="screen-actions">
        <button onClick={onStart}>ゲーム開始</button>
      </div>
      <p className="screen-note">
        1と2で3、2と3で5、3と5で8。マウス移動 / 左右キーで位置調整、クリック / スペースで落下
      </p>
    </section>
  );
}
