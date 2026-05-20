// ============================================================
// GitHub REST API でのDB読み書き
// ============================================================
// GITHUB_OWNER / GITHUB_REPO はビルド時に環境変数から注入される
// VITE_GITHUB_OWNER, VITE_GITHUB_REPO → GitHub Actions の secrets/vars から
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

/**
 * GitHubからdatabase.jsonを取得する
 * トークンなし → 公開リポジトリなら読み取りのみ可
 * @param {string} token  GitHub PAT（読み取り専用でも可）
 */
export async function fetchDB(token) {
  const headers = token ? ghHeaders(token) : { "Accept": "application/vnd.github+json" };
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${DB_PATH}?ref=${BRANCH}`,
      { headers }
    );
    if (!res.ok) return { db: null, sha: null, error: `HTTP ${res.status}` };
    const json = await res.json();
    const db = JSON.parse(atob(json.content.replace(/\n/g, "")));
    return { db, sha: json.sha, error: null };
  } catch (e) {
    return { db: null, sha: null, error: e.message };
  }
}

/**
 * database.jsonをGitHubに書き込む
 * @param {object} db     保存するDBオブジェクト
 * @param {string} sha    現在のファイルSHA（更新時に必要）
 * @param {string} token  GitHub PAT（write権限必須）
 * @returns {{ sha: string|null, error: string|null }}
 */
export async function saveDB(db, sha, token) {
  if (!token) return { sha: null, error: "トークンが設定されていません" };
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
