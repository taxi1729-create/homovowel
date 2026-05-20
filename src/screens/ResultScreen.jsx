import { C, FD, GLOBAL_STYLE, Btn, Card, Lbl, Tag } from "../design.js";

export default function ResultScreen({ scores, history, players, onRestart }) {
  const sorted = [...players].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0));
  const top = scores[sorted[0].name];
  const winners = sorted.filter(p => scores[p.name] === top);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ minHeight: "100vh", background: C.black, padding: "32px 16px" }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ maxWidth: "640px", margin: "0 auto" }} className="fu">

        {/* タイトル */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontFamily: FD, fontSize: "clamp(4rem,12vw,8rem)", color: C.yellow, lineHeight: 0.88 }}>RESULT</div>
          <div style={{ marginTop: "12px" }}>
            {winners.length === 1
              ? <Tag bg={C.yellow}>🏆 {winners[0].name} の勝利！ {top}点</Tag>
              : <Tag bg={C.yellow}>🤝 引き分け！ {winners.map(w => w.name).join(" & ")} {top}点</Tag>}
          </div>
        </div>

        {/* スコア */}
        <Card>
          <Lbl>◆ 最終スコア</Lbl>
          {sorted.map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: [C.yellow, C.gray, "#d8d6ce"][i] || "#e0ded6", border: `2px solid ${C.black}`, marginBottom: "8px" }}>
              <div style={{ fontFamily: FD, fontSize: "2rem", minWidth: "36px" }}>{medals[i] || `${i + 1}`}</div>
              <div style={{ flex: 1, fontWeight: "700" }}>{p.name}</div>
              <div style={{ fontFamily: FD, fontSize: "2.8rem" }}>{scores[p.name] || 0}</div>
              <div style={{ fontSize: "0.8rem" }}>点</div>
            </div>
          ))}
        </Card>

        {/* ラウンド履歴 */}
        <Card>
          <Lbl>◆ ラウンド履歴</Lbl>
          {history.map((r, i) => (
            <div key={i} style={{ background: r.correct ? "#b8f0a0" : "#ffc0c0", border: `2px solid ${C.black}`, padding: "10px 14px", marginBottom: "8px", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontWeight: "700" }}>R{r.round}</span>
                <span style={{ color: C.darkGray }}>{r.player}</span>
                <span style={{ fontWeight: "700" }}>{r.correct ? "✓ 正解" : "✗ 不正解"}</span>
              </div>
              <div>お題: <strong>{r.topicWord}</strong> → 正解: <strong>{r.answer}</strong>（{r.answerReading}）</div>
              <div style={{ color: C.darkGray }}>あなたの回答: {r.userInput}</div>
            </div>
          ))}
        </Card>

        <Btn bg={C.yellow} fg={C.black} sh={C.red} size="lg" full onClick={onRestart}>
          もう一度プレイ →
        </Btn>
      </div>
    </div>
  );
}
