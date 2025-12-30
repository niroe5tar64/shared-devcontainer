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
2. 見つかったバイナリを `--dangerously-skip-permissions` 付きで実行

### 現在の制約（要改善）

- ユーザー名が `dev-user` 固定（`/home/dev-user/.vscode-server/...`）
- VS Code 系エディタのみ対応

## codex ラッパー

```bash
# 自動付与されるオプション
--full-auto  # 通常コマンド
--device-auth  # login コマンド
```

### 動作

1. `which -a codex` で本物のバイナリを検索（bash ラッパーをスキップ）
2. `login`/`logout` 以外のコマンド実行前にログイン状態をチェック
3. 未ログインなら自動的にデバイス認証でログイン
4. `--full-auto` オプション付きで実行

### 現在の制約（要改善）

- 本物のバイナリ検出ロジックが複雑

## post-create.sh

DevContainer 作成後に実行されるセットアップスクリプト。

### 実行内容

1. 基本ツールインストール（vim, tree, jq, unzip）
2. Bun インストール
3. Claude Code / Codex CLI インストール（npm）
4. ラッパースクリプトを `~/.local/bin/` にコピー
5. PATH 設定

### 配布先での参照

サブモジュールとして利用する場合、相対パスで参照：
```json
{
  "postCreateCommand": "bash .devcontainer/post-create.sh"
}
```

## 今後の改善方針

ディレクトリ構成や配布方法は今後変更の可能性あり。
以下の点を柔軟に対応できるようにする：

- ユーザー名の動的取得（`$USER` や `whoami`）
- 作業ディレクトリの柔軟な指定
- 環境変数による設定のカスタマイズ
