import { useState } from "react";
import { C, FM, FD, GLOBAL_STYLE, Btn, Card, Lbl, Tag, inp } from "../design.js";
import { GH_OWNER, GH_REPO, fetchDB } from "../github.js";
import { FALLBACK_DB } from "../fallbackDb.js";

// ============================================================
// SetupScreen — 初回アクセス時にGitHub PATを入力させる画面
// ============================================================
// なぜ画面入力か？
//   GitHubに書き込みできるPATをビルド成果物に含めると
//   リポジトリを見た全員に漏洩するため、実行時入力にしている。
//   PATはsessionStorageに保持（タブを閉じると消える）。
// ============================================================

const SESSION_KEY = "homovowel_gh_token";

export function getStoredToken() {
  try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch { return ""; }
}
function storeToken(t) {
  try { sessionStorage.setItem(SESSION_KEY, t); } catch {}
}

export default function SetupScreen({ onComplete }) {
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);

  const isGhConfigured = !!(GH_OWNER && GH_REPO);

  // GitHub未設定 or トークンをスキップしてオフラインで遊ぶ
  const handleSkip = () => {
    storeToken("");
    onComplete({ db: JSON.parse(JSON.stringify(FALLBACK_DB)), sha: null, token: "" });
  };

  // PATで接続してDBを取得
  const handleConnect = async () => {
    if (!token.trim()) { setError("トークンを入力してください"); return; }
    setLoading(true); setError("");
    const { db, sha, error: err } = await fetchDB(token.trim());
    if (err || !db) {
      setError(`接続失敗: ${err || "不明なエラー"}`);
      setLoading(false); return;
    }
    storeToken(token.trim());
    onComplete({ db, sha, token: token.trim() });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.black, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ width: "100%", maxWidth: "520px" }}>

        {/* タイトル */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontFamily: FD, fontSize: "clamp(4rem,12vw,8rem)", color: C.yellow, lineHeight: 0.88 }}>同母音</div>
          <div style={{ fontFamily: FD, fontSize: "clamp(1.2rem,4vw,2.2rem)", color: C.white, letterSpacing: "0.1em" }}>HOMOVOWEL GAME</div>
          <div style={{ marginTop: "10px" }}>
            <Tag bg={C.yellow}>同じ母音パターンの異義語を当てろ！</Tag>
          </div>
        </div>

        {isGhConfigured ? (
          /* GitHub設定済みの場合 */
          <Card bg={C.white} sh={C.yellow}>
            <Lbl>◆ GitHub トークンでデータベースに接続</Lbl>
            <p style={{ fontSize: "0.85rem", marginBottom: "14px", lineHeight: 1.7 }}>
              単語データベースの読み書きには <strong>GitHub Personal Access Token</strong> が必要です。
              トークンはこのタブを閉じると消えます（セキュリティのため保存しません）。
            </p>

            <div style={{ marginBottom: "12px" }}>
              <Lbl>Personal Access Token（repo スコープ）</Lbl>
              <div style={{ position: "relative" }}>
                <input
                  type={showToken ? "text" : "password"}
                  style={{ ...inp(!!error), paddingRight: "48px" }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={e => { setToken(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleConnect()}
                  autoComplete="off"
                />
                <button
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: C.darkGray }}
                  onClick={() => setShowToken(v => !v)}
                  tabIndex={-1}
                >{showToken ? "🙈" : "👁"}</button>
              </div>
              {error && <div style={{ color: C.red, fontSize: "0.8rem", marginTop: "4px", fontWeight: "700" }}>{error}</div>}
            </div>

            <div style={{ background: C.darkGray, color: C.gray, padding: "10px 14px", fontSize: "0.78rem", lineHeight: 1.6, marginBottom: "14px", border: `2px solid ${C.midGray}` }}>
              <strong style={{ color: C.yellow }}>取得方法:</strong><br />
              GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)<br />
              → Generate new token → <strong>repo</strong> スコープにチェック → 生成
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <Btn bg={C.yellow} fg={C.black} sh={C.red} size="lg" full onClick={handleConnect} disabled={loading}>
                  {loading ? "接続中..." : "接続してプレイ →"}
                </Btn>
              </div>
              <Btn bg={C.darkGray} fg={C.gray} onClick={handleSkip} disabled={loading}>
                スキップ
              </Btn>
            </div>
            <div style={{ fontSize: "0.75rem", color: C.midGray, marginTop: "8px" }}>
              スキップするとオフラインモード（データ保存なし）でプレイできます
            </div>
          </Card>
        ) : (
          /* GitHub未設定の場合（ローカル開発等） */
          <Card bg={C.white} sh={C.gray}>
            <Lbl>◆ オフラインモード</Lbl>
            <p style={{ fontSize: "0.85rem", marginBottom: "16px", lineHeight: 1.7 }}>
              GitHub リポジトリ設定が見つかりません。<br />
              組み込みの単語データでゲームを楽しめます（データの保存はできません）。
            </p>
            <Btn bg={C.yellow} fg={C.black} size="lg" full onClick={handleSkip}>
              オフラインでプレイ →
            </Btn>
          </Card>
        )}

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.75rem", color: C.midGray }}>
          リポジトリ: {GH_OWNER && GH_REPO ? `${GH_OWNER}/${GH_REPO}` : "未設定"}
        </div>
      </div>
    </div>
  );
}
