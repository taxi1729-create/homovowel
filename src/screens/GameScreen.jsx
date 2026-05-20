import { useState, useEffect, useRef } from "react";
import { C, FD, GLOBAL_STYLE, Btn, Card, Lbl, Tag } from "../design.js";
import { getVowels } from "../vowels.js";
import { aiGenerateHint } from "../gemini.js";
import { inp } from "../design.js";

export default function GameScreen({ config, onFinish }) {
  const { players, rounds, topic, pool } = config;
  const isSingle = players.length === 1;

  const [round, setRound] = useState(0);
  const [scores, setScores] = useState(Object.fromEntries(players.map(p => [p.name, 0])));
  const [phase, setPhase] = useState("loading"); // loading | question | answer | result
  const [current, setCurrent] = useState(null);
  const [hint, setHint] = useState("");
  const [selPlayer, setSelPlayer] = useState(isSingle ? players[0].name : null);
  const [answer, setAnswer] = useState("");
  const [judgement, setJudgement] = useState(null); // "correct" | "wrong"
  const [history, setHistory] = useState([]);
  const [showVowels, setShowVowels] = useState(false);
  const usedIds = useRef(new Set());

  const pickAnswer = () => {
    const avail = pool.filter(w => !usedIds.current.has(w.id));
    if (avail.length === 0) { usedIds.current.clear(); return pool[Math.floor(Math.random() * pool.length)]; }
    return avail[Math.floor(Math.random() * avail.length)];
  };

  const loadRound = async () => {
    setPhase("loading"); setJudgement(null); setAnswer(""); setShowVowels(false);
    setSelPlayer(isSingle ? players[0].name : null);
    if (pool.length === 0) { onFinish(scores, history); return; }
    const ans = pickAnswer();
    if (ans?.id) usedIds.current.add(ans.id);
    setCurrent(ans);
    const h = await aiGenerateHint(ans.word, ans.reading);
    setHint(h);
    setPhase("question");
  };

  useEffect(() => { loadRound(); }, []);

  const handleReveal = () => setPhase("answer");

  const handleSubmit = () => {
    if (!selPlayer || !answer.trim()) return;
    const correct = answer.trim() === current.word || answer.trim() === current.reading;
    if (correct) setScores(s => ({ ...s, [selPlayer]: s[selPlayer] + 1 }));
    setJudgement(correct ? "correct" : "wrong");
    setHistory(h => [...h, {
      round: round + 1, player: selPlayer,
      topicWord: topic.word, topicReading: topic.reading,
      answer: current.word, answerReading: current.reading,
      userInput: answer.trim(), correct,
    }]);
    setPhase("result");
  };

  const handleNext = () => {
    const next = round + 1;
    if (next >= rounds) onFinish(scores, history);
    else { setRound(next); loadRound(); }
  };

  const vQ = getVowels(topic.reading);
  const vA = current ? getVowels(current.reading) : "";

  return (
    <div style={{ minHeight: "100vh", background: C.black, padding: "24px 16px" }}>
      <style>{GLOBAL_STYLE}</style>

      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: `3px solid ${C.yellow}`, paddingBottom: "14px" }}>
        <div style={{ fontFamily: FD, fontSize: "2rem", color: C.yellow }}>同母音GAME</div>
        <Tag bg={C.red}>ROUND {round + 1} / {rounds}</Tag>
      </div>

      {/* スコアボード */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", overflowX: "auto", paddingBottom: "4px" }}>
        {players.map(p => (
          <div key={p.name} style={{ background: C.white, border: `3px solid ${C.black}`, padding: "8px 12px", boxShadow: `4px 4px 0 ${C.yellow}`, textAlign: "center", minWidth: "86px", flexShrink: 0 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: "700", color: C.midGray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "76px" }}>{p.name}</div>
            <div style={{ fontFamily: FD, fontSize: "2.2rem", color: C.black }}>{scores[p.name]}</div>
          </div>
        ))}
      </div>

      {/* ローディング */}
      {phase === "loading" && (
        <div style={{ background: C.darkGray, border: `3px solid ${C.yellow}`, padding: "48px", textAlign: "center" }} className="blink">
          <div style={{ fontFamily: FD, fontSize: "2rem", color: C.yellow }}>AI がヒントを生成中...</div>
          <div style={{ color: C.midGray, marginTop: "8px", fontSize: "0.85rem" }}>Gemini が意味を作っています</div>
        </div>
      )}

      {/* ゲーム本体 */}
      {(phase === "question" || phase === "answer" || phase === "result") && current && (
        <div className="fu">

          {/* お題 */}
          <Card>
            <Lbl>◆ お題単語</Lbl>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: FD, fontSize: "3rem", lineHeight: 1 }}>{topic.word}</div>
                <div style={{ fontSize: "0.85rem", color: C.midGray }}>（{topic.reading}）</div>
              </div>
              <div style={{ background: C.black, color: C.white, padding: "8px 14px", border: `2px solid ${C.black}`, fontSize: "0.85rem", flex: 1 }}>
                {topic.meaning}
              </div>
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <Btn bg={C.gray} fg={C.black} size="sm" onClick={() => setShowVowels(v => !v)}>
                {showVowels ? "母音を隠す" : "母音を表示"}
              </Btn>
              {showVowels && <Tag>{vQ.toUpperCase()}</Tag>}
            </div>
          </Card>

          {/* ヒント */}
          <div style={{ background: C.yellow, color: C.black, border: `3px solid ${C.black}`, boxShadow: `8px 8px 0 ${C.red}`, padding: "22px", marginBottom: "16px" }}>
            <Lbl>◆ ヒント — 同じ母音を持つ別の言葉とは？</Lbl>
            <div style={{ fontFamily: FD, fontSize: "clamp(1.5rem,4vw,2rem)", letterSpacing: "0.03em" }}>{hint}</div>
          </div>

          {/* 回答ボタン */}
          {phase === "question" && (
            <Btn bg={C.white} fg={C.black} sh={C.red} size="lg" full onClick={handleReveal}>
              回答する →
            </Btn>
          )}

          {/* 回答入力 */}
          {phase === "answer" && (
            <Card className="fu">
              <Lbl>◆ 回答入力</Lbl>
              {!isSingle && (
                <div style={{ marginBottom: "14px" }}>
                  <Lbl>回答するプレイヤーを選択</Lbl>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {players.map(p => (
                      <Btn
                        key={p.name}
                        bg={selPlayer === p.name ? C.blue : C.gray}
                        fg={selPlayer === p.name ? C.white : C.black}
                        onClick={() => setSelPlayer(p.name)}
                      >{p.name}</Btn>
                    ))}
                  </div>
                </div>
              )}
              <input
                style={inp()}
                placeholder="答えを入力（ひらがな・カタカナ・漢字OK）"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
              <div style={{ marginTop: "12px" }}>
                <Btn bg={C.yellow} fg={C.black} size="lg" full onClick={handleSubmit} disabled={!selPlayer || !answer.trim()}>
                  判定！
                </Btn>
              </div>
            </Card>
          )}

          {/* 判定結果 */}
          {phase === "result" && judgement && (
            <div
              style={{ background: judgement === "correct" ? C.yellow : C.red, color: C.black, border: `3px solid ${C.black}`, boxShadow: `8px 8px 0 ${C.black}`, padding: "22px", marginBottom: "16px" }}
              className="fu"
            >
              <div style={{ fontFamily: FD, fontSize: "3.5rem", lineHeight: 0.9, marginBottom: "10px" }}>
                {judgement === "correct" ? "🎉 CORRECT!" : "✗ WRONG..."}
              </div>
              {!isSingle && <div style={{ fontWeight: "700", marginBottom: "8px" }}>回答者: {selPlayer}</div>}
              <div style={{ background: C.black, color: C.white, padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: C.gray, marginBottom: "4px" }}>正解</div>
                <div style={{ fontFamily: FD, fontSize: "2.5rem" }}>{current.word}</div>
                <div style={{ fontSize: "0.85rem", color: C.gray }}>（{current.reading}）</div>
                <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>{current.meaning}</div>
                <div style={{ marginTop: "10px" }}>
                  <Tag>母音: {vA.toUpperCase()} = {vQ.toUpperCase()}</Tag>
                </div>
              </div>
              <div style={{ marginTop: "16px" }}>
                <Btn bg={C.black} fg={C.yellow} size="lg" full onClick={handleNext}>
                  {round + 1 >= rounds ? "結果を見る 🏆" : `次のラウンドへ (${round + 2}/${rounds})`}
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
