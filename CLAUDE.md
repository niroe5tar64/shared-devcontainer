# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## プロジェクト概要

チーム共通の DevContainer 設定を TypeScript で管理し、JSON 設定ファイルを自動生成するリポジトリ。
他プロジェクトから Git サブモジュールとして利用することを想定。

## ビルドコマンド

```bash
bun run build          # TypeScript から JSON 設定を生成
bun run rebuild        # クリーン後にビルド (rm -rf dist && build)
bun run generate-types # 公式スキーマから TypeScript 型を再生成
bun run tsc --noEmit   # 型チェック
```

## 絶対ルール

- **`.devcontainer/devcontainer.json` を直接編集しない** - `src/base.ts` を編集して `bun run build` で生成
- **`dist/` は Git 管理対象** - サブモジュール利用時にビルド不要にするため
- **型定義の手動編集禁止** - `src/types.generated.ts` は `bun run generate-types` で生成

## 主要ファイル

| パス | 役割 |
|-----|------|
| `src/base.ts` | 全プリセット共通のベース設定 |
| `src/presets/*.ts` | 技術スタック別プリセット |
| `scripts/build.ts` | ビルドスクリプト |
| `.devcontainer/bin/` | AI ツールのラッパースクリプト |

詳細は `.claude/rules/` 配下を参照。
