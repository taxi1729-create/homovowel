import { useState } from "react";

// ============================================================
// ★ デザイントークン (Neo-brutalism: 白×黒、差し色3色)
// ============================================================
export const C = {
  black:   "#0a0a0a",
  white:   "#f2f0e8",
  yellow:  "#FFE234",
  red:     "#FF2D2D",
  blue:    "#0000EE",
  gray:    "#c0beb6",
  darkGray:"#282826",
  midGray: "#777770",
  green:   "#00BB44",
};

export const FM = "'Space Mono','Courier New',monospace";
export const FD = "'Bebas Neue','Impact',sans-serif";

// グローバルCSS
export const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{min-height:100vh}
  body{background:${C.black};color:${C.white};font-family:${FM};overflow-x:hidden}
  input,textarea,button,select{font-family:${FM}}
  ::selection{background:${C.yellow};color:${C.black}}
  ::-webkit-scrollbar{width:8px}
  ::-webkit-scrollbar-track{background:${C.black}}
  ::-webkit-scrollbar-thumb{background:${C.yellow};border:2px solid ${C.black}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
  .fu{animation:fadeUp .22s ease both}
  .blink{animation:blink 1.1s ease infinite}
`;

// ============================================================
// ★ スタイルヘルパー
// ============================================================
export const inp = (err = false) => ({
  background: C.white,
  color: C.black,
  border: `3px solid ${err ? C.red : C.black}`,
  boxShadow: `4px 4px 0 ${err ? C.red : C.yellow}`,
  padding: "10px 14px",
  fontSize: "1rem",
  fontFamily: FM,
  outline: "none",
  width: "100%",
});

// ============================================================
// ★ 共通コンポーネント
// ============================================================

/** ホバーエフェクト付きボタン */
export function Btn({ bg = C.yellow, fg = C.black, sh = C.black, children, onClick, disabled, full, size = "md" }) {
  const [hov, setHov] = useState(false);
  const pad = size === "lg" ? "15px 28px" : size === "sm" ? "7px 14px" : "11px 22px";
  const fs  = size === "lg" ? "1.15rem"  : size === "sm" ? "0.82rem"  : "0.95rem";
  return (
    <button
      style={{
        background: bg, color: fg,
        border: `3px solid ${C.black}`,
        boxShadow: hov && !disabled ? `2px 2px 0 ${sh}` : `5px 5px 0 ${sh}`,
        transform: hov && !disabled ? "translate(3px,3px)" : "none",
        padding: pad, fontSize: fs, fontWeight: "700", fontFamily: FM,
        cursor: disabled ? "not-allowed" : "pointer",
        textTransform: "uppercase", letterSpacing: "0.05em",
        userSelect: "none", transition: "box-shadow .1s,transform .1s",
        opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={!disabled ? onClick : undefined}
    >{children}</button>
  );
}

/** ブルータルカード */
export function Card({ bg = C.white, sh = C.yellow, children, style = {} }) {
  return (
    <div style={{
      background: bg,
      color: (bg === C.black || bg === C.darkGray) ? C.white : C.black,
      border: `3px solid ${C.black}`,
      boxShadow: `8px 8px 0 ${sh}`,
      padding: "20px 22px",
      marginBottom: "16px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/** セクションラベル */
export function Lbl({ children }) {
  return (
    <div style={{
      fontSize: "0.72rem", fontWeight: "700",
      textTransform: "uppercase", letterSpacing: "0.1em",
      color: C.midGray, marginBottom: "6px",
    }}>{children}</div>
  );
}

/** インラインタグ */
export function Tag({ children, bg = C.yellow }) {
  return (
    <span style={{
      background: bg, color: C.black,
      border: `2px solid ${C.black}`,
      padding: "2px 9px", fontSize: "0.75rem",
      fontWeight: "700", display: "inline-block",
    }}>{children}</span>
  );
}

/** ローディングスクリーン */
export function LoadingScreen({ message = "読み込み中..." }) {
  return (
    <div style={{ minHeight: "100vh", background: C.black, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ textAlign: "center" }} className="blink">
        <div style={{ fontFamily: FD, fontSize: "5rem", color: C.yellow }}>同母音</div>
        <div style={{ color: C.midGray, marginTop: "8px", fontSize: "0.9rem" }}>{message}</div>
      </div>
    </div>
  );
}
