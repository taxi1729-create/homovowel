import { useState, useEffect } from "react";
import { LoadingScreen } from "./design.js";
import SetupScreen, { getStoredToken } from "./screens/SetupScreen.jsx";
import TitleScreen from "./screens/TitleScreen.jsx";
import WordListScreen from "./screens/WordListScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import { fetchDB } from "./github.js";
import { FALLBACK_DB } from "./fallbackDb.js";

// ============================================================
// App — 画面ルーティングとグローバル状態管理
// ============================================================
export default function App() {
  // screen: "loading" | "setup" | "title" | "wordlist" | "game" | "result"
  const [screen, setScreen] = useState("loading");
  const [db, setDb] = useState(null);
  const [sha, setSha] = useState(null);
  const [token, setToken] = useState("");
  const [gameConfig, setGameConfig] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [finalHistory, setFinalHistory] = useState(null);

  // 起動時: セッションにトークンが残っていれば自動接続を試みる
  useEffect(() => {
    (async () => {
      const stored = getStoredToken();
      if (stored) {
        const { db: d, sha: s, error } = await fetchDB(stored);
        if (!error && d) {
          setDb(d); setSha(s); setToken(stored);
          setScreen("title"); return;
        }
      }
      // 自動接続失敗 or トークンなし → セットアップ画面へ
      setScreen("setup");
    })();
  }, []);

  // SetupScreen完了時
  const handleSetupComplete = ({ db: d, sha: s, token: t }) => {
    const safeDb = d || JSON.parse(JSON.stringify(FALLBACK_DB));
    setDb(safeDb); setSha(s); setToken(t);
    setScreen("title");
  };

  // DB更新（TitleScreen・WordListScreenからのコールバック）
  const handleDbUpdate = (newDb, newSha) => {
    setDb(newDb);
    if (newSha) setSha(newSha);
  };

  // WordListScreenの保存コールバック
  const handleWordListSave = (newDb, newSha) => {
    setDb(newDb);
    if (newSha) setSha(newSha);
  };

  // ゲーム開始
  const handleStart = (config) => {
    setGameConfig(config);
    setScreen("game");
  };

  // ゲーム終了
  const handleFinish = (scores, history) => {
    setFinalScores(scores);
    setFinalHistory(history);
    setScreen("result");
  };

  // タイトルに戻る
  const handleRestart = () => {
    setGameConfig(null); setFinalScores(null); setFinalHistory(null);
    setScreen("title");
  };

  // ログアウト（トークン破棄）
  const handleLogout = () => {
    try { sessionStorage.removeItem("homovowel_gh_token"); } catch {}
    setToken(""); setDb(null); setSha(null);
    setScreen("setup");
  };

  // ── レンダリング ──
  if (screen === "loading") return <LoadingScreen message="データベースを読み込み中..." />;

  if (screen === "setup") return <SetupScreen onComplete={handleSetupComplete} />;

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
      db={db} sha={sha} token={token}
      onDbUpdate={handleDbUpdate}
    />
  );

  if (screen === "game") return (
    <GameScreen config={gameConfig} onFinish={handleFinish} />
  );

  if (screen === "result") return (
    <ResultScreen
      scores={finalScores}
      history={finalHistory}
      players={gameConfig.players}
      onRestart={handleRestart}
    />
  );

  return null;
}
