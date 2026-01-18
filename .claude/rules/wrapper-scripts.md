---
paths: .devcontainer/bin/**
---

# ラッパースクリプトガイド

## 概要

AI ツール（Claude Code, Codex）のラッパースクリプト。
DevContainer 環境で便利なデフォルトオプションを自動付与する。

## ファイル構成

- `.devcontainer/bin/` - ソース（編集対象）

## claude ラッパー

```bash
# 自動付与されるオプション
--dangerously-skip-permissions
```

### 動作

1. VS Code 拡張機能ディレクトリから Claude バイナリを検索
2. 見つからない場合、PATH から探す（自分自身を除外して再帰回避）
3. それでも見つからない場合、npm グローバルインストールを確認
4. 見つかったバイナリを `--dangerously-skip-permissions` 付きで実行

### 改善点

- ✅ 再帰実行リスクを解消（自分自身を除外するロジック追加）
- ✅ ユーザー名非依存（`$HOME` 環境変数を使用）
- ✅ npm グローバルインストールにも対応

## codex ラッパー

```bash
# 設定方法
~/.codex/config.toml で approval_policy と sandbox_mode を設定

# login コマンドのみ自動付与
--device-auth
```

### 動作

1. `which -a codex` で本物のバイナリを検索（bash ラッパーをスキップ）
2. `login` コマンドの場合、`--device-auth` を付与してデバイス認証を使用
3. その他のコマンドは `~/.codex/config.toml` の設定で実行

### 改善点

- ✅ config.toml ベースに移行（公式サポートの設定方法）
- ✅ 非公式環境変数（`CODEX_SANDBOX`、`CODEX_APPROVAL`）を廃止
- ✅ ラッパースクリプトを簡素化（設定は config.toml に委譲）

## post-create.sh

DevContainer 作成後に実行されるセットアップスクリプト。

### 実行内容

1. 基本ツールインストール（vim, tree, jq, unzip）
2. Bun インストール
3. Claude Code / Codex CLI インストール（npm）
4. Codex config.toml のセットアップ（既存設定がなければコピー）
5. ラッパースクリプトを `~/.local/bin/` にコピー

### PATH 設定

`devcontainer.json` の `remoteEnv.PATH` で一元管理：
```typescript
remoteEnv: {
  PATH: `/home/${DEVCONTAINER_USER}/.local/bin:/home/${DEVCONTAINER_USER}/.bun/bin:\${containerEnv:PATH}`,
}
```

### 配布先での参照

サブモジュールとして利用する場合、相対パスで参照：
```json
{
  "postCreateCommand": "bash .devcontainer/post-create.sh"
}
```

## 改善履歴

### 2026-01-18: ラッパースクリプト改善

- Claude ラッパー: 再帰実行リスクを解消
- Codex ラッパー: config.toml ベースに移行
- PATH 設定: devcontainer.json の remoteEnv に一本化
- Codex 設定: 公式サポートの config.toml を使用
