import { useState } from "react";
import { C, FM, FD, GLOBAL_STYLE, Btn, Card, Lbl, Tag, inp } from "../design.js";
import { getVowels, countKana, isSameVowel } from "../vowels.js";
import { saveDB } from "../github.js";
import { AI_CONFIG } from "../config.js";

function generateId() {
  return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function WordListScreen({ db, sha, token, onSave, onBack }) {
  const [words, setWords] = useState([...(db.words || [])]);
  const [kw, setKw] = useState("");
  const [filterChars, setFilterChars] = useState("all");
  const [filterVowel, setFilterVowel] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { ok, text }
  const [addMode, setAddMode] = useState(false);
  const [nw, setNw] = useState({ word: "", reading: "", meaning: "" });

  // フィルター
  const filtered = words.filter(w => {
    const k = kw.trim().toLowerCase();
    const km = !k || w.word.includes(k) || w.reading.includes(k) || w.meaning.includes(k);
    const cm = filterChars === "all" || String(countKana(w.reading)) === filterChars;
    const fv = filterVowel.trim();
    const vm = !fv || getVowels(w.reading) === getVowels(fv) || getVowels(w.reading) === fv.toLowerCase();
    return km && cm && vm;
  });

  // 編集
  const startEdit = (w) => { setEditId(w.id); setEditData({ word: w.word, reading: w.reading, meaning: w.meaning }); };
  const cancelEdit = () => setEditId(null);
  const saveEdit = (id) => {
    setWords(ws => ws.map(w => w.id === id ? { ...w, ...editData, charCount: countKana(editData.reading) } : w));
    setEditId(null);
  };
  const deleteWord = (id) => { if (window.confirm("この単語を削除しますか？")) setWords(ws => ws.filter(w => w.id !== id)); };

  // 追加
  const addWord = () => {
    if (!nw.word || !nw.reading || !nw.meaning) return;
    setWords(ws => [...ws, { id: generateId(), ...nw, charCount: countKana(nw.reading) }]);
    setNw({ word: "", reading: "", meaning: "" }); setAddMode(false);
  };

  // GitHub保存
  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    const newDb = { ...db, words, updatedAt: new Date().toISOString() };
    const { sha: newSha, error } = await saveDB(newDb, sha, token);
    setSaving(false);
    if (error) {
      setSaveMsg({ ok: false, text: `✗ 保存失敗: ${error}` });
    } else {
      setSaveMsg({ ok: true, text: "✓ GitHub に保存しました" });
      onSave(newDb, newSha || sha);
    }
    setTimeout(() => setSaveMsg(null), 4000);
  };

  // 母音パターン集計
  const vowelMap = {};
  words.forEach(w => { const v = getVowels(w.reading); vowelMap[v] = (vowelMap[v] || 0) + 1; });
  const topVowels = Object.entries(vowelMap).sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <div style={{ minHeight: "100vh", background: C.black, padding: "24px 16px" }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: `3px solid ${C.yellow}`, paddingBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: "2.5rem", color: C.yellow }}>WORD DATABASE</div>
            <div style={{ color: C.midGray, fontSize: "0.8rem" }}>{words.length}語 登録済み {!token && <span style={{ color: C.red }}>（読み取り専用 — トークンなし）</span>}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {token && (
              <Btn bg={C.green} fg={C.black} onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "💾 GitHubに保存"}
              </Btn>
            )}
            <Btn bg={C.darkGray} fg={C.white} onClick={onBack}>← 戻る</Btn>
          </div>
        </div>

        {/* 保存メッセージ */}
        {saveMsg && (
          <div style={{ background: saveMsg.ok ? C.green : C.red, color: C.black, border: `3px solid ${C.black}`, padding: "10px 16px", marginBottom: "14px", fontWeight: "700" }}>
            {saveMsg.text}
          </div>
        )}

        {/* 検索・フィルター */}
        <Card bg={C.darkGray} sh={C.midGray}>
          <Lbl>◆ 検索・フィルター</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
            <div>
              <Lbl>キーワード</Lbl>
              <input style={inp()} placeholder="単語・読み・意味" value={kw} onChange={e => setKw(e.target.value)} />
            </div>
            <div>
              <Lbl>文字数（音節）</Lbl>
              <select style={{ ...inp(), appearance: "none", cursor: "pointer" }} value={filterChars} onChange={e => setFilterChars(e.target.value)}>
                <option value="all">すべて</option>
                {[1,2,3,4,5,6].map(n => <option key={n} value={String(n)}>{n}文字</option>)}
              </select>
            </div>
            <div>
              <Lbl>母音パターン（例: oan）</Lbl>
              <input style={inp()} placeholder="母音列 or 読みがな" value={filterVowel} onChange={e => setFilterVowel(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.78rem", color: C.gray }}>
            {filtered.length}件 表示中
            {filterVowel && <span> — 母音: <strong style={{ color: C.yellow }}>{getVowels(filterVowel.trim()) || filterVowel.trim()}</strong></span>}
          </div>
        </Card>

        {/* 母音パターン別集計 */}
        <Card bg={C.darkGray} sh={C.midGray}>
          <Lbl>◆ 母音パターン別集計（クリックでフィルター）</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topVowels.map(([v, cnt]) => (
              <div key={v} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => setFilterVowel(v)} title={`${v}でフィルター`}>
                  <Tag bg={C.yellow}>{v.toUpperCase()}</Tag>
                </button>
                <div style={{ flex: 1, height: "12px", background: C.black, border: `2px solid ${C.midGray}`, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, cnt / AI_CONFIG.GENERATE_TARGET * 100)}%`, height: "100%", background: cnt >= AI_CONFIG.GENERATE_TARGET ? C.green : C.yellow, transition: "width .3s" }} />
                </div>
                <span style={{ color: C.white, fontSize: "0.78rem", minWidth: "52px" }}>{cnt}/{AI_CONFIG.GENERATE_TARGET}</span>
                {db.exhausted?.[v] && <Tag bg={C.red}>上限</Tag>}
              </div>
            ))}
          </div>
        </Card>

        {/* 単語追加 */}
        <div style={{ marginBottom: "14px" }}>
          {!addMode ? (
            <Btn bg={C.yellow} fg={C.black} onClick={() => setAddMode(true)}>＋ 単語を追加</Btn>
          ) : (
            <Card bg={C.white} sh={C.green}>
              <Lbl>◆ 新規単語追加</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div><Lbl>単語</Lbl><input style={inp()} placeholder="例: 登山" value={nw.word} onChange={e => setNw(p => ({ ...p, word: e.target.value }))} /></div>
                <div><Lbl>読み（仮名）</Lbl><input style={inp()} placeholder="例: とざん" value={nw.reading} onChange={e => setNw(p => ({ ...p, reading: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: "10px" }}><Lbl>意味</Lbl><input style={inp()} placeholder="例: 山の頂上を目指す活動" value={nw.meaning} onChange={e => setNw(p => ({ ...p, meaning: e.target.value }))} /></div>
              {nw.reading && (
                <div style={{ marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Tag>母音: {getVowels(nw.reading).toUpperCase()}</Tag>
                  <Tag bg={C.gray}>{countKana(nw.reading)}音節</Tag>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn bg={C.green} fg={C.black} onClick={addWord} disabled={!nw.word || !nw.reading || !nw.meaning}>追加</Btn>
                <Btn bg={C.gray} fg={C.black} onClick={() => setAddMode(false)}>キャンセル</Btn>
              </div>
            </Card>
          )}
        </div>

        {/* 単語一覧 */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: C.midGray, padding: "48px", border: `3px dashed ${C.midGray}` }}>
            該当する単語が見つかりません
          </div>
        )}
        {filtered.map(w => (
          <div key={w.id} className="fu" style={{ background: C.white, border: `3px solid ${C.black}`, boxShadow: `4px 4px 0 ${C.yellow}`, padding: "14px 16px", marginBottom: "10px" }}>
            {editId === w.id ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <div><Lbl>単語</Lbl><input style={inp()} value={editData.word} onChange={e => setEditData(p => ({ ...p, word: e.target.value }))} /></div>
                  <div><Lbl>読み</Lbl><input style={inp()} value={editData.reading} onChange={e => setEditData(p => ({ ...p, reading: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: "8px" }}><Lbl>意味</Lbl><input style={inp()} value={editData.meaning} onChange={e => setEditData(p => ({ ...p, meaning: e.target.value }))} /></div>
                {editData.reading && (
                  <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
                    <Tag>母音: {getVowels(editData.reading).toUpperCase()}</Tag>
                    <Tag bg={C.gray}>{countKana(editData.reading)}音節</Tag>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <Btn bg={C.green} fg={C.black} size="sm" onClick={() => saveEdit(w.id)}>保存</Btn>
                  <Btn bg={C.gray} fg={C.black} size="sm" onClick={cancelEdit}>キャンセル</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FD, fontSize: "1.5rem" }}>{w.word}</span>
                    <span style={{ fontSize: "0.85rem", color: C.midGray }}>（{w.reading}）</span>
                    <Tag bg={C.gray}>{countKana(w.reading)}文字</Tag>
                    <Tag>{getVowels(w.reading).toUpperCase()}</Tag>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: C.darkGray }}>{w.meaning}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <Btn bg={C.blue} fg={C.white} size="sm" onClick={() => startEdit(w)}>編集</Btn>
                  <Btn bg={C.red} fg={C.white} size="sm" onClick={() => deleteWord(w.id)}>削除</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
