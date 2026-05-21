// SetupScreen は廃止 — App.jsx で起動時に直接DB読み込みを行うようにした
// このファイルは互換性のために残しているが使われていない

export function getStoredToken() {
  try { return sessionStorage.getItem("homovowel_gh_token") || ""; } catch { return ""; }
}
export function storeToken(t) {
  try { if (t) sessionStorage.setItem("homovowel_gh_token", t); else sessionStorage.removeItem("homovowel_gh_token"); } catch {}
}
