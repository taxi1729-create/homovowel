# 同母音異義語ゲーム 🎮

同じ母音パターンを持つ異義語を当てるゲームです。  
例: **とざん** (登山) → 母音: **oan** → **ロマン** (ろまん) も母音 **oan** ！

---

## セットアップ手順

### 1. このリポジトリをForkまたはテンプレートとして使用

GitHub上で「Fork」または「Use this template」を押してください。

### 2. Gemini API キーを取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. 「Get API key」→「Create API key」
3. キーをコピーしておく

### 3. GitHub Secrets に登録

リポジトリの **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|-------|
| `VITE_GEMINI_KEY` | 手順2で取得したGemini APIキー |

### 4. GitHub Pages を有効化

リポジトリの **Settings → Pages**

- Source: **GitHub Actions** を選択

### 5. デプロイ実行

`main` ブランチに push するか、Actions タブから手動で `Deploy to GitHub Pages` を実行。

---

## ゲームのプレイ方法

1. デプロイ後のURLにアクセス
2. **GitHub Personal Access Token** を入力（`repo` スコープ必要）
   - 取得: GitHub → Settings → Developer settings → Personal access tokens
   - トークンはブラウザのセッションにのみ保存され、外部に送信されません
3. お題単語を入力してゲームスタート！

> **オフラインモード**: トークンなしでもゲームは遊べます（データ保存なし）

---

## データベース管理

- 単語データは **`database.json`** に保存されます（同リポジトリ内）
- ゲーム中に新しい同母音語をAIが生成すると自動保存されます
- ゲーム画面の 📚 ボタンから単語の検索・編集・追加ができます

---

## ローカル開発

```bash
# .env.local を作成
echo "VITE_GEMINI_KEY=your_key_here" > .env.local
echo "VITE_GITHUB_OWNER=your_username" >> .env.local
echo "VITE_GITHUB_REPO=your_repo_name" >> .env.local

npm install
npm run dev
```

---

## 技術スタック

- **フロントエンド**: React + Vite
- **AI**: Gemini 2.0 Flash (Google AI Studio)
- **DB**: GitHub REST API (database.json)
- **ホスティング**: GitHub Pages
- **CI/CD**: GitHub Actions
