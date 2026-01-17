# コマンドチートシート

よく使うコマンドのクイックリファレンスです。

## 目次

- [開発者向け（Self）](#開発者向けself)
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
bun run build              # preset なし（base のみ）
bun run build:self         # 明示的に Self モード
bun run build:self bun     # Self モード + bun preset
```

### プリセットの追加

```bash
# 1. src/config/presets/rust.ts を作成
# 2. src/config/presets/index.ts の PRESETS と PRESET_METADATA に追加
# 3. ビルドして確認
bun run build && bun run build:cli
```

### DevContainer の再ビルド

VS Code: `Cmd+Shift+P` → `Dev Containers: Rebuild Container`

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

### 拡張機能が反映されない

```bash
# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### プリセット名が見つからない

```bash
# 利用可能なプリセットを確認
npx @niroe5tar64/devcontainer list-presets

# または開発時
bun run scripts/build/build.ts --help
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
| Bun/TypeScript | `bun` | Bun runtime, TypeScript |
| Haskell | `haskell` | GHC 9.8.4, Cabal, Stack, HLS |

**共通で含まれる機能（すべてのプリセット）**:
- AI アシスタント: Claude Code, GitHub Copilot
- Git ツール: Git, GitHub CLI, GitLens
- エディタ支援: ErrorLens, TODO Highlight
- シェル: Zsh + Oh My Zsh

---

## 注意事項

- **`.devcontainer/devcontainer.json` を直接編集しない** - `src/` を編集して `bun run build` で生成
- **プラグインはユーザースコープ（`~/.claude/settings.json`）で管理** - プロジェクトスコープは避ける
