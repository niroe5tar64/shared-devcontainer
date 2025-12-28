# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

チーム共通の DevContainer 設定を TypeScript で管理し、JSON 設定ファイルを自動生成するリポジトリ。他プロジェクトから Git サブモジュールとして利用することを想定。

## ビルドコマンド

```bash
bun run build          # TypeScript から JSON 設定を生成
bun run rebuild        # クリーン後にビルド (rm -rf dist && build)
bun run generate-types # 公式 DevContainer スキーマから TypeScript 型を再生成
```

型チェック:
```bash
bun run tsc --noEmit
```

## アーキテクチャ

### ソース → ビルド → 配布フロー

```
src/base.ts + src/presets/*.ts
        ↓ bun run build
dist/base.json + dist/presets/*.json + dist/bin/ + dist/post-create.sh
        ↓ git submodule
他プロジェクトが dist/ 内のファイルを extends で利用
```

### 主要ファイル

- **`src/base.ts`**: 全プリセット共通のベース設定。共通 features（git, github-cli, node, common-utils）、VS Code 拡張機能（Copilot, Claude Code, GitLens, Biome）、エディタ設定、マウント設定を定義。

- **`src/presets/*.ts`**: 技術スタック別プリセット（node, python, fullstack）。ベース設定を拡張し、追加の features や設定を定義。

- **`src/types.ts` / `src/types.generated.ts`**: 型定義。generated ファイルは公式 DevContainer JSON スキーマから自動生成。

- **`scripts/build.ts`**: ビルドスクリプト。以下を実行:
  1. ベース設定と各プリセットを独自マージロジックで結合（features, extensions, settings）
  2. `dist/base.json` と `dist/presets/*.json` を生成
  3. このリポジトリ自体の `.devcontainer/devcontainer.json` も再生成
  4. `bin/` と `post-create.sh` を `dist/` にコピー

- **`scripts/generate-types.ts`**: 公式 DevContainer スキーマを取得し TypeScript 型を生成。

### 重要なパターン

- **`.devcontainer/devcontainer.json` を直接編集しない** - `bun run build` で `src/base.ts` から生成される
- **dist/ は Git 管理対象** - サブモジュールとして利用時にビルド不要にするため、生成ファイルをコミット
- プリセット設定はベース設定とディープマージ（配列は重複排除でマージ、オブジェクトは再帰的にマージ）
