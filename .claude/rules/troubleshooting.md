# トラブルシューティング

## ビルド関連

### 型エラーが発生する

```bash
# 型チェック
bun run tsc --noEmit

# 型定義を再生成（スキーマが古い場合）
bun run generate-types
```

### ビルドが失敗する

```bash
# 再ビルド
bun run build

# 依存関係の再インストール
rm -rf node_modules && bun install
```

## DevContainer 関連

### サブモジュールが初期化されていない

**症状**: `.devcontainer/shared` が空

```bash
git submodule update --init --recursive
```

### 拡張機能が反映されない

**症状**: プリセットで指定した拡張機能がインストールされない

VS Code: `Cmd+Shift+P` → `Dev Containers: Rebuild Container`

### プリセット名が見つからない

**症状**: `bun run build:client <preset>` でエラー

```bash
# 利用可能なプリセットを確認
ls -la .devcontainer/shared/src/presets/
rg "const PRESETS" .devcontainer/shared/scripts/build.ts
```

## 認証関連

### Claude Code にログインできない

```bash
# コンテナ内で実行
claude login

# ホストマシンで ~/.claude/ を確認
ls -la ~/.claude/
```

### Codex にログインできない

```bash
# デバイス認証でログイン
codex login

# ログイン状態確認
codex login status
```

### 認証情報が保存されない

**確認事項**:
1. ホストマシンに `~/.claude` / `~/.codex` ディレクトリが存在するか
2. devcontainer.json の `mounts` 設定が正しいか
3. ディレクトリの権限（`chmod 700`）

## ラッパースクリプト関連

### claude コマンドが見つからない

```bash
# ラッパーの確認
which claude
ls -la ~/.local/bin/claude

# VS Code 拡張機能の確認
ls ~/.vscode-server/extensions/ | grep claude
```

### codex コマンドが見つからない

```bash
# 本物のバイナリ確認
which -a codex

# npm グローバルインストール確認
npm list -g @openai/codex
```

### ラッパーが正しく動作しない

```bash
# 直接バイナリを実行してテスト
# Claude
find ~/.vscode-server/extensions -name "claude" -path "*/native-binary/*" -type f

# Codex（npm グローバル）
npm root -g
```

## 設定変更が反映されない

1. `src/` のファイルを編集したか確認
2. `bun run build` / `bun run build:client <preset>` を実行したか確認
3. DevContainer を再ビルドしたか確認
