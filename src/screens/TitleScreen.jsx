import { useState } from "react";
import { C, FM, FD, GLOBAL_STYLE, Btn, Card, Lbl, Tag, inp } from "../design.js";
import { getVowels, countKana, isSameVowel } from "../vowels.js";
import { aiGenerateHomovowels } from "../gemini.js";
import { saveDB } from "../github.js";
import { AI_CONFIG } from "../config.js";

function generateId() {
  return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function TitleScreen({ onStart, onWordList, db, sha, token, onDbUpdate }) {
  const [players, setPlayers] = useState([{ name: "プレイヤー1" }]);
  const [rounds, setRounds] = useState(3);
  const [topicWord, setTopicWord] = useState("");
  const [topicReading, setTopicReading] = useState("");
  const [topicMeaning, setTopicMeaning] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genLog, setGenLog] = useState("");
  const [errors, setErrors] = useState({});

  const addPlayer = () => { if (players.length < 6) setPlayers(p => [...p, { name: `プレイヤー${p.length + 1}` }]); };
  const removePlayer = (i) => { if (players.length > 1) setPlayers(p => p.filter((_, idx) => idx !== i)); };
  const updatePlayer = (i, v) => setPlayers(p => p.map((x, idx) => idx === i ? { ...x, name: v } : x));

  const prepareAndStart = async () => {
    const errs = {};
    players.forEach((p, i) => { if (!p.name.trim()) errs[`p${i}`] = true; });
    if (!topicWord.trim()) errs.tw = true;
    if (!topicReading.trim()) errs.tr = true;
    if (!topicMeaning.trim()) errs.tm = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setGenerating(true);

    // DBのディープコピーで作業
    let currentDb = {
      ...db,
      words: [...(db.words || [])],
      exhausted: { ...(db.exhausted || {}) },
    };
    const vowelPat = getVowels(topicReading);

    // お題単語をDBに登録（未登録なら追加）
    const alreadyIn = currentDb.words.find(w => w.reading === topicReading && w.word === topicWord);
    if (!alreadyIn) {
      currentDb.words.push({
        id: generateId(), word: topicWord, reading: topicReading,
        meaning: topicMeaning, charCount: countKana(topicReading),
      });
    }

    // お題以外の同母音語を集計
    const existing = currentDb.words.filter(w =>
      isSameVowel(w.reading, topicReading) &&
      !(w.reading === topicReading && w.word === topicWord)
    );

    const isExhausted = !!currentDb.exhausted?.[vowelPat];
    const needMore = existing.length < AI_CONFIG.GENERATE_TARGET && !isExhausted;

    if (needMore) {
      const needed = AI_CONFIG.GENERATE_TARGET - existing.length;
      setGenLog(`同母音語を AI が追加生成中... (残り${needed}語)`);
      const result = await aiGenerateHomovowels(topicReading, topicWord, existing, needed);

      if (result.words?.length > 0) {
        result.words.forEach(w => {
          if (!isSameVowel(w.reading, topicReading)) return;
          if (!currentDb.words.find(x => x.word === w.word && x.reading === w.reading)) {
            currentDb.words.push({
              id: generateId(), word: w.word, reading: w.reading,
              meaning: w.meaning, charCount: countKana(w.reading),
            });
          }
        });
        setGenLog(`${result.words.length} 語追加しました`);
      }
      if (result.exhausted) {
        currentDb.exhausted[vowelPat] = true;
        setGenLog("この母音パターンの単語は網羅されました（上限を記録）");
      }

      // GitHub に保存
      if (token) {
        currentDb.updatedAt = new Date().toISOString();
        const { sha: newSha } = await saveDB(currentDb, sha, token);
        onDbUpdate(currentDb, newSha || sha);
      } else {
        onDbUpdate(currentDb, sha);
      }
    } else {
      setGenLog(isExhausted
        ? "上限記録済み — 既存データを使用します"
        : `DB内 ${existing.length}語 ✓ — AI生成スキップ`);
      await new Promise(r => setTimeout(r, 500));
    }

    const pool = currentDb.words.filter(w =>
      isSameVowel(w.reading, topicReading) &&
      !(w.reading === topicReading && w.word === topicWord)
    );

    setGenerating(false);
    onStart({
      players, rounds,
      topic: { word: topicWord, reading: topicReading, meaning: topicMeaning },
      pool,
    });
  };

  const vowelPreview = topicReading ? getVowels(topicReading) : "";
  const dbCount = topicReading
    ? (db.words || []).filter(w => isSameVowel(w.reading, topicReading) && !(w.reading === topicReading && w.word === topicWord)).length
    : 0;
  const isExhausted = vowelPreview ? !!db.exhausted?.[vowelPreview] : false;

  return (
    <div style={{ minHeight: "100vh", background: C.black, padding: "32px 16px" }}>
      <style>{GLOBAL_STYLE}</style>

      {/* タイトル */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontFamily: FD, fontSize: "clamp(4rem,12vw,9rem)", color: C.yellow, lineHeight: 0.88 }}>同母音</div>
        <div style={{ fontFamily: FD, fontSize: "clamp(1.3rem,4.5vw,3rem)", color: C.white, letterSpacing: "0.12em" }}>HOMOVOWEL GAME</div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
          <Tag>同じ母音パターンの異義語を当てろ！</Tag>
          <Tag bg={token ? C.green : C.gray}>{token ? "GitHub DB 接続中" : "オフラインモード"}</Tag>
        </div>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* お題単語入力 */}
        <Card bg={C.white} sh={C.red}>
          <Lbl>◆ お題単語を入力</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <Lbl>単語（漢字・仮名）</Lbl>
              <input style={inp(errors.tw)} placeholder="例: 登山" value={topicWord} onChange={e => setTopicWord(e.target.value)} />
            </div>
            <div>
              <Lbl>読み（ひらがな）</Lbl>
              <input style={inp(errors.tr)} placeholder="例: とざん" value={topicReading} onChange={e => setTopicReading(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <Lbl>意味・説明</Lbl>
            <input style={inp(errors.tm)} placeholder="例: 山の頂上を目指す活動" value={topicMeaning} onChange={e => setTopicMeaning(e.target.value)} />
          </div>
          {topicReading && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Tag>母音: {vowelPreview.toUpperCase()}</Tag>
              <Tag bg={C.gray}>{countKana(topicReading)}音節</Tag>
              <Tag bg={dbCount >= AI_CONFIG.GENERATE_TARGET ? C.green : dbCount > 0 ? C.yellow : C.gray}>
                DB: {dbCount}語 {dbCount >= AI_CONFIG.GENERATE_TARGET ? "✓" : `(不足 → AI生成: ${AI_CONFIG.GENERATE_TARGET - dbCount}語)`}
              </Tag>
              {isExhausted && <Tag bg={C.red}>上限記録済み</Tag>}
            </div>
          )}
        </Card>

        {/* ラウンド数 */}
        <Card>
          <Lbl>◆ ラウンド数: {rounds}回</Lbl>
          <input type="range" min="1" max="10" value={rounds} onChange={e => setRounds(Number(e.target.value))} style={{ width: "100%", accentColor: C.yellow, height: "8px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginTop: "4px", color: C.midGray }}>
            <span>1回</span>
            <span style={{ fontFamily: FD, fontSize: "1.6rem", color: C.red }}>{rounds}回</span>
            <span>10回</span>
          </div>
        </Card>

        {/* プレイヤー設定 */}
        <Card>
          <Lbl>◆ プレイヤー設定 ({players.length}人)</Lbl>
          {players.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ background: C.yellow, color: C.black, padding: "8px 12px", border: `2px solid ${C.black}`, fontWeight: "700", minWidth: "36px", textAlign: "center" }}>{i + 1}</div>
              <input style={{ ...inp(errors[`p${i}`]), flex: 1 }} value={p.name} onChange={e => updatePlayer(i, e.target.value)} placeholder={`プレイヤー${i + 1}`} />
              {players.length > 1 && <Btn bg={C.red} fg={C.white} size="sm" onClick={() => removePlayer(i)}>✕</Btn>}
            </div>
          ))}
          {players.length < 6 && <Btn bg={C.darkGray} fg={C.yellow} size="sm" onClick={addPlayer}>＋ 追加</Btn>}
        </Card>

        {/* AI生成ログ */}
        {generating && (
          <div style={{ background: C.darkGray, border: `3px solid ${C.yellow}`, padding: "14px 18px", marginBottom: "14px" }} className="blink">
            <div style={{ color: C.yellow, fontWeight: "700" }}>🤖 {genLog || "処理中..."}</div>
          </div>
        )}

        {/* ボタン */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <Btn bg={C.yellow} fg={C.black} sh={C.red} size="lg" full onClick={prepareAndStart} disabled={generating}>
              {generating ? "準備中..." : "ゲームスタート →"}
            </Btn>
          </div>
          <Btn bg={C.blue} fg={C.white} size="lg" onClick={onWordList} title="単語リスト管理">📚</Btn>
        </div>
        <div style={{ marginTop: "6px", fontSize: "0.72rem", color: C.midGray, textAlign: "right" }}>
          📚 = 単語リスト管理
        </div>
      </div>
    </div>
  );
}
