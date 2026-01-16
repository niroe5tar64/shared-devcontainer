# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## プロジェクト概要

チーム共通の DevContainer 設定を TypeScript で管理し、JSON 設定ファイルを自動生成するリポジトリ。

**配布方式**:
- npx/bunx 経由で GitHub Packages からパッケージを取得

## 用語定義

| 用語 | 意味 | 具体例 |
|-----|------|--------|
| **Self DevContainer** | このプロジェクト自身の開発環境 | `shared-devcontainer/.devcontainer/devcontainer.json` |

- `scripts/build/build.ts` で生成
- 固有設定は `.devcontainer/project-config.ts` で追加可能

## ビルドコマンド

```bash
# Self DevContainer（このプロジェクト自身）
bun run build              # preset なし（base のみ）
bun run build:self         # 明示的に Self モード
bun run build:self node    # Self モード + node preset

# CLI ビルド（パッケージ公開用）
bun run build:cli          # CLI パッケージをビルド

# その他
bun run generate-types # 公式スキーマから TypeScript 型を再生成
bun run tsc --noEmit   # 型チェック
```

## 絶対ルール

- **`.devcontainer/devcontainer.json` を直接編集しない** - `src/config/base.ts` を編集して `bun run build` で生成
- **型定義の手動編集禁止** - `src/types.generated.ts` は `bun run generate-types` で生成

## 主要ファイル

| パス | 役割 |
|-----|------|
| `src/config/base.ts` | 全プリセット共通のベース設定 |
| `src/config/presets/*.ts` | 技術スタック別プリセット |
| `src/cli/` | CLI コマンド実装 |
| `src/lib/devcontainer-builder.ts` | 共通ユーティリティ |
| `scripts/build/build.ts` | Self DevContainer ビルドスクリプト |
| `templates/` | 配布用テンプレートファイル |
| `.devcontainer/bin/` | AI ツールのラッパースクリプト（ソース） |

詳細は `.claude/rules/` 配下を参照。

## Claude Code プラグイン

このプロジェクトでは、**Claude Code プラグインはユーザースコープでの追加を推奨**しています。

- **ユーザースコープ** (`~/.claude/settings.json`) - ⭐️ 推奨：全プロジェクト共通の個人設定
- **ローカルスコープ** (`.claude/settings.local.json`) - ⚠️ 非推奨：プラグイン管理ファイルと干渉
- **プロジェクトスコープ** (`.claude/settings.json`) - ❌ 避ける：Git管理で不整合が生じる

詳細は `README.md` の「Claude Code プラグインの管理」セクションまたは `.claude/rules/plugins.md` を参照。
