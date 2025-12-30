# AGENTS.md

このリポジトリ向けの作業ガイドの入口です。詳細は各ドキュメントを参照してください。

## リポジトリ概要

- TypeScript で共通 DevContainer 設定を管理し、JSON を自動生成する
- 他リポジトリから Git サブモジュールとして利用する想定
- エージェントとの会話は日本語で行なう

## 絶対ルール

- `.devcontainer/devcontainer.json` を直接編集しない（`src/base.ts` を編集して `bun run build`）
- `src/types.generated.ts` は手動編集禁止（`bun run generate-types` で再生成）

## 主要コマンド

- `bun run build` / `bun run build:self` / `bun run build:client <preset>`
- `bun run generate-types`
- `bun run tsc --noEmit`

## 詳細ドキュメント（概要のみ）

- `CLAUDE.md`: プロジェクト概要、用語定義、ビルドコマンド、主要ファイルの案内
- `.claude/rules/architecture.md`: ビルド/配布フロー、ディレクトリ構成、マージルール
- `.claude/rules/scripts.md`: `scripts/` 配下のビルド/生成スクリプトの使い方
- `.claude/rules/src.md`: `src/` 編集ガイド、プリセット追加手順、型再生成
- `.claude/rules/troubleshooting.md`: ビルド/DevContainer/認証/ラッパーのトラブル対応
- `.claude/rules/wrapper-scripts.md`: ラッパースクリプトと post-create の概要
