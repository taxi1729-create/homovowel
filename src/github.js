// ============================================================
// GitHub REST API — DB読み書き
// ============================================================
// VITE_GITHUB_OWNER / VITE_GITHUB_REPO はビルド時に Actions から注入
// database.json は公開リポジトリなのでトークンなしで読み取り可能
// 書き込みだけ PAT が必要（TitleScreen の任意入力）
// ============================================================

export const GH_OWNER = import.meta.env.VITE_GITHUB_OWNER || "";
export const GH_REPO  = import.meta.env.VITE_GITHUB_REPO  || "";
const BRANCH  = "main";
const DB_PATH = "database.json";

function ghHeaders(token) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/vnd.github+json",
  };
}

/** トークンなしで公開リポジトリの database.json を読む */
export async function fetchDB() {
  if (!GH_OWNER || !GH_REPO) return { db: null, sha: null, error: "repo未設定" };
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${DB_PATH}?ref=${BRANCH}`,
      { headers: { "Accept": "application/vnd.github+json" } }
    );
    if (!res.ok) return { db: null, sha: null, error: `HTTP ${res.status}` };
    const json = await res.json();
    const db = JSON.parse(atob(json.content.replace(/\n/g, "")));
    return { db, sha: json.sha, error: null };
  } catch (e) {
    return { db: null, sha: null, error: e.message };
  }
}

/** PAT を使って database.json を書き込む */
export async function saveDB(db, sha, token) {
  if (!token)                return { sha: null, error: "トークンが未入力です" };
  if (!GH_OWNER || !GH_REPO) return { sha: null, error: "リポジトリが未設定です" };
  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));
    const body = {
      message: `chore: update database [${new Date().toISOString()}]`,
      content,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${DB_PATH}`,
      { method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { sha: null, error: err.message || `HTTP ${res.status}` };
    }
    const json = await res.json();
    return { sha: json.content?.sha || sha, error: null };
  } catch (e) {
    return { sha: null, error: e.message };
  }
}
