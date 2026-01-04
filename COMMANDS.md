# コマンドチートシート

よく使うコマンドのクイックリファレンスです。

## 目次

- [開発者向け（Self）](#開発者向けself)
- [ユーザー向け（Client）](#ユーザー向けclient)
- [認証関連](#認証関連)
- [プラグイン管理](#プラグイン管理)
- [トラブルシューティング](#トラブルシューティング)

---

## 開発者向け（Self）

このリポジトリ自体を開発する人向けのコマンド。

### セットアップ

```bash
# 依存関係をインストール
bun install

# Self DevContainer の JSON を生成
bun run build
```

### 開発ワークフロー

```bash
# 設定を編集
# src/base.ts, src/presets/*.ts を編集

# JSON を生成（Self DevContainer）
bun run build

# 型チェック
bun run tsc --noEmit

# 型定義を再生成（公式スキーマから）
bun run generate-types
```

### ビルドコマンド

```bash
# Self DevContainer（このプロジェクト自身）
bun run build              # 自動判定（preset なし）
bun run build:self         # 明示的に Self モード
bun run build:self node    # Self モード + node preset

# Client DevContainer（テスト用）
bun run build:client writing  # Client モード + preset
```

### プリセットの追加

```bash
# 1. src/presets/rust.ts を作成
# 2. scripts/build/build.ts の PRESETS に追加
# 3. ビルドして確認
bun run build
```

### DevContainer の再ビルド

VS Code: `Cmd+Shift+P` → `Dev Containers: Rebuild Container`

---

## ユーザー向け（Client）

このリポジトリを Git サブモジュールとして利用する側のコマンド。

### 初回セットアップ

```bash
# 1. プロジェクトルートで Submodule として追加
cd /path/to/your/project
git submodule add https://github.com/niroe5tar64/shared-devcontainer.git .devcontainer/shared

# 2. Submodule 内に移動して依存関係をインストール
cd .devcontainer/shared
bun install

# 3. Client DevContainer を生成（プリセット選択）
bun run build:client node    # Node.js プロジェクト
# または
bun run build:client python  # Python プロジェクト
# または
bun run build:client fullstack  # フルスタックプロジェクト
# または
bun run build:client writing  # 文章執筆プロジェクト

# 4. 親ディレクトリに戻る
cd ../..

# 5. DevContainer を開く
# VS Code: Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

### 既存プロジェクトへの適用

```bash
# 1. 既存設定をバックアップ
mv .devcontainer/devcontainer.json .devcontainer/devcontainer.json.backup

# 2. Submodule を追加
git submodule add https://github.com/niroe5tar64/shared-devcontainer.git .devcontainer/shared

# 3. Submodule 内で依存関係をインストール
cd .devcontainer/shared
bun install

# 4. Client DevContainer を生成
bun run build:client node
cd ../..

# 5. DevContainer を開く
# VS Code: Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

### 共通設定の更新

**方法1: 親リポジトリのルートから実行**（推奨）

```bash
# サブモジュールを最新の main ブランチに更新
git submodule update --remote .devcontainer/shared

# devcontainer.json を再生成
cd .devcontainer/shared
bun run build:client node
cd ../..

# サブモジュールの更新を親リポジトリにコミット
git add .devcontainer/shared
git commit -m "chore: Update shared-devcontainer submodule"

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

**方法2: サブモジュール内で直接実行**

```bash
# サブモジュール内に移動して更新
cd .devcontainer/shared
git pull origin main

# devcontainer.json を再生成
bun run build:client node
cd ../..

# サブモジュールの更新を親リポジトリにコミット
git add .devcontainer/shared
git commit -m "chore: Update shared-devcontainer submodule"

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### 特定バージョンの使用

```bash
cd .devcontainer/shared
git checkout v1.0.0

# devcontainer.json を再生成
bun run build:client node
cd ../..

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### プロジェクト固有のカスタマイズ

```bash
# 1. .devcontainer/project-config.ts を編集
# 2. サブモジュール内で再生成
cd .devcontainer/shared
bun run build:client node
cd ../..

# 3. DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

---

## 認証関連

### Claude Code

```bash
# ログイン
claude login

# ログイン状態確認
ls -la ~/.claude/

# 認証情報の削除（リセット）
rm -rf ~/.claude
```

### Codex

```bash
# ログイン（デバイス認証）
codex login

# ログイン状態確認
codex login status

# 認証情報の確認
ls -la ~/.codex/

# 認証情報の削除（リセット）
rm -rf ~/.codex
```

### 認証情報のバックアップ

```bash
# 認証情報をバックアップ
tar czf claude-backup.tar.gz ~/.claude ~/.codex

# リストア
tar xzf claude-backup.tar.gz -C ~/
```

---

## プラグイン管理

### 推奨プラグインの自動セットアップ

```bash
# 推奨プラグイン（git-ops, decision-support, statusline, bash-safety）を一括セットアップ
bun run setup-claude-plugins

# 設定確認
cat ~/.claude/settings.json
```

### 手動でプラグインを追加

```bash
# マーケットプレースを追加
claude plugin marketplace add <marketplace-name>

# プラグインを有効化（~/.claude/settings.json を編集）
# {
#   "enabledPlugins": {
#     "statusline@niro-agent-plugins": true,
#     "git-ops@niro-agent-plugins": true
#   }
# }
```

---

## トラブルシューティング

### サブモジュールが初期化されていない

```bash
# サブモジュールを初期化
git submodule update --init --recursive
```

### 拡張機能が反映されない

```bash
# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### プリセット名が見つからない

```bash
# 利用可能なプリセットを確認
ls -la .devcontainer/shared/src/presets/
```

### 型エラーが発生する

```bash
# 型チェック
bun run tsc --noEmit

# 型定義を再生成
bun run generate-types
```

### ビルドが失敗する

```bash
# 依存関係の再インストール
rm -rf node_modules && bun install

# 再ビルド
bun run build
```

### ラッパースクリプトが動作しない

```bash
# claude コマンドの確認
which claude
ls -la ~/.local/bin/claude

# VS Code 拡張機能の確認
ls ~/.vscode-server/extensions/ | grep claude

# 直接バイナリを実行してテスト
find ~/.vscode-server/extensions -name "claude" -path "*/native-binary/*" -type f
```

### 認証情報が保存されない

```bash
# ホストマシンにディレクトリが存在するか確認
ls -la ~/.claude
ls -la ~/.codex

# ディレクトリの権限を確認・修正
chmod 700 ~/.claude ~/.codex

# devcontainer.json のマウント設定を確認
# "mounts": [
#   "source=${localEnv:HOME}/.claude,target=/home/dev-user/.claude,type=bind",
#   "source=${localEnv:HOME}/.codex,target=/home/dev-user/.codex,type=bind"
# ]
```

---

## プリセット選択ガイド

| プロジェクトタイプ | プリセット | 含まれる機能 |
|-------------------|-----------|-------------|
| Node.js/TypeScript | `node` | Node.js 20, Bun, pnpm, ESLint, Prettier |
| Python | `python` | Python 3.11, Poetry, Black, Ruff |
| フルスタック（Docker使用） | `fullstack` | Node.js 20, Docker-in-Docker, Bun, pnpm |
| 文章執筆 | `writing` | Node.js 20, textlint, 日本語校正ツール |

**共通で含まれる機能（すべてのプリセット）**:
- AI アシスタント: Claude Code, GitHub Copilot
- Git ツール: Git, GitHub CLI, GitLens
- エディタ支援: ErrorLens, TODO Highlight
- シェル: Zsh + Oh My Zsh

---

## 注意事項

- **`.devcontainer/devcontainer.json` を直接編集しない** - `src/` を編集して `bun run build` で生成
- **`git submodule update --init --recursive` は初回セットアップ専用** - 最新版への更新には `git submodule update --remote` または `git pull` を使用
- **プラグインはユーザースコープ（`~/.claude/settings.json`）で管理** - プロジェクトスコープは避ける
