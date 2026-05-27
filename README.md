# 同母音異義語ゲーム 🎮

同じ母音パターンを持つ異義語を当てるゲームです。
例: **とざん**（登山）→ 母音 **oan** → **ロマン**（ろまん）も **oan** ！

## すぐに遊ぶ

### GitHub Pagesで公開する場合

1. このリポジトリを GitHub に push
2. **Settings → Pages → Source: Deploy from a branch → Branch: main / (root)**
3. `https://ユーザー名.github.io/リポジトリ名/` にアクセス

**※ GitHub Actions 不要・ビルド不要。index.html を main ブランチに置くだけで動きます。**

### ローカルで動かす場合

`index.html` をブラウザで直接開くだけで動きます。

---

## 設定（index.html 先頭を編集）

```javascript
// Gemini API キー (Google AI Studio で取得)
// https://aistudio.google.com/
const GEMINI_KEY = "ここにキーを貼る";

// GitHub DB設定（任意 — 単語を自動保存したい場合のみ）
const GH_OWNER = "GitHubユーザー名";
const GH_REPO  = "リポジトリ名";
```

- **GEMINI_KEY** だけ設定すれば AI によるヒント生成・同母音語自動生成が動きます
- GitHub DB設定は任意。未設定でも内蔵データベースで遊べます

---

## 単語データベース

- ゲーム内の 📚 ボタンから単語の検索・編集・追加ができます
- GitHub PAT（repo スコープ）を入力すると、AIが生成した新単語を `database.json` に自動保存します
