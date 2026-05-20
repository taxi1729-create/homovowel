import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE_PATH は GitHub Actions で "/リポジトリ名/" として渡される
// ローカル開発時は "/" を使う
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
});
