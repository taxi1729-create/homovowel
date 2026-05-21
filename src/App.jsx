import { useState, useEffect } from "react";
import { LoadingScreen } from "./design.js";
import TitleScreen from "./screens/TitleScreen.jsx";
import WordListScreen from "./screens/WordListScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import { fetchDB, GH_OWNER, GH_REPO } from "./github.js";
import { FALLBACK_DB } from "./fallbackDb.js";

// ============================================================
// App — 画面ルーティング
// ============================================================
// 起動フロー:
//   1. database.json をトークンなしで公開読み取り
//   2. 失敗したらFALLBACK_DBで動作
//   3. タイトル画面へ直行（PAT入力は不要）
//   4. DB書き込みが必要な時だけTitleScreen内でPAT入力を促す
// ============================================================

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [db, setDb] = useState(null);
  const [sha, setSha] = useState(null);
  const [token, setToken] = useState("");          // 任意の書き込み用PAT
  const [gameConfig, setGameConfig] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [finalHistory, setFinalHistory] = useState(null);

  // 起動時: トークンなしでDBを読み込んでタイトルへ直行
  useEffect(() => {
    (async () => {
      // sessionStorageに残っているPATがあれば復元（任意）
      try {
        const saved = sessionStorage.getItem("homovowel_gh_token") || "";
        if (saved) setToken(saved);
      } catch {}

      if (GH_OWNER && GH_REPO) {
        const { db: d, sha: s } = await fetchDB();
        if (d) { setDb(d); setSha(s); }
        else    { setDb(JSON.parse(JSON.stringify(FALLBACK_DB))); }
      } else {
        // GitHub未設定（ローカル開発時）
        setDb(JSON.parse(JSON.stringify(FALLBACK_DB)));
      }
      setScreen("title");
    })();
  }, []);

  const handleDbUpdate = (newDb, newSha) => {
    setDb(newDb);
    if (newSha) setSha(newSha);
  };

  const handleTokenChange = (t) => {
    setToken(t);
    try { if (t) sessionStorage.setItem("homovowel_gh_token", t); else sessionStorage.removeItem("homovowel_gh_token"); } catch {}
  };

  const handleStart  = (config) => { setGameConfig(config); setScreen("game"); };
  const handleFinish = (scores, history) => { setFinalScores(scores); setFinalHistory(history); setScreen("result"); };
  const handleRestart = () => { setGameConfig(null); setFinalScores(null); setFinalHistory(null); setScreen("title"); };
  const handleWordListSave = (newDb, newSha) => { setDb(newDb); if (newSha) setSha(newSha); };

  if (screen === "loading" || !db) return <LoadingScreen message="データベースを読み込み中..." />;

  if (screen === "wordlist") return (
    <WordListScreen
      db={db} sha={sha} token={token}
      onSave={handleWordListSave}
      onBack={() => setScreen("title")}
    />
  );
  if (screen === "title") return (
    <TitleScreen
      onStart={handleStart}
      onWordList={() => setScreen("wordlist")}
      db={db} sha={sha}
      token={token} onTokenChange={handleTokenChange}
      onDbUpdate={handleDbUpdate}
    />
  );
  if (screen === "game")   return <GameScreen config={gameConfig} onFinish={handleFinish} />;
  if (screen === "result") return (
    <ResultScreen
      scores={finalScores} history={finalHistory}
      players={gameConfig.players} onRestart={handleRestart}
    />
  );
  return null;
}
