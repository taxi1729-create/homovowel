// ============================================================
// Gemini API (Google AI Studio) 呼び出しモジュール
// ============================================================
// VITE_GEMINI_KEY はビルド時に GitHub Actions Secrets から注入される
// ============================================================

import { getVowels } from "./vowels.js";

// ビルド時に埋め込まれるAPIキー
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";

// 使用モデル — 2025年時点の最新安定版
const MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt, maxTokens = 2000) {
  if (!GEMINI_KEY) throw new Error("Gemini APIキーが設定されていません");
  const url = `${API_BASE}/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * お題単語の同母音異義語をAIで生成する
 */
export async function aiGenerateHomovowels(targetReading, targetWord, existing, needed) {
  const vowelPat = getVowels(targetReading);
  const existingList = existing.map(e => `${e.word}（${e.reading}）`).join("、");

  const prompt = `あなたは日本語の同母音異義語の専門家です。
以下の条件で単語を${needed}個生成してください。

■ 母音パターン: ${vowelPat.toUpperCase()}
■ お題単語: ${targetWord}（${targetReading}）
■ 既存リスト（重複禁止）: ${existingList || "なし"}

■ 同母音の定義:
- 仮名をローマ字変換した時の母音列が一致すること
- 伸ばし棒（ー）は直前の母音を繰り返す
- 拗音は1音節として扱う（しゃ→ya, しゅ→yu, しょ→yo）
- 例: 「登山」tozan→oan / 「ロマン」roman→oan ← 同じ母音パターン！

■ 必須条件:
- お題単語と母音パターンが完全一致すること
- 2〜6音節の実在する日本語であること
- 既存リストと重複しないこと
- 意味は30文字以内

■ 出力形式（JSONのみ。前置き・コードブロック・改行なし）:
{"words":[{"word":"表記","reading":"よみがな","meaning":"説明"}],"exhausted":false}
これ以上単語が存在しない場合: {"words":[],"exhausted":true}`;

  try {
    const text = await callGemini(prompt, 2000);
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("AI generate error:", e);
    return { words: [], exhausted: false };
  }
}

/**
 * 答え単語の意味ヒントをAIで生成する
 */
export async function aiGenerateHint(answerWord, answerReading) {
  const prompt = `単語「${answerWord}」（${answerReading}）の意味を、その単語自体や読み方を一切使わずに30文字以内で説明してください。意味の説明文のみ回答（余計な言葉・句読点不要）。`;
  try {
    const text = await callGemini(prompt, 200);
    return text.trim() || `${answerWord}に関するもの`;
  } catch (e) {
    console.error("AI hint error:", e);
    return `${answerWord}に関するもの`;
  }
}
