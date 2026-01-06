# Git Submodule から npx/bunx への移行ガイド

このガイドでは、既存のgit submoduleベースのセットアップから、新しいnpx/bunxベースのセットアップへの移行方法を説明します。

## 移行のメリット

- **シンプルな運用**: submoduleの初期化・更新が不要
- **1コマンドで完結**: 複数ステップが1コマンドに
- **バージョン管理の明確化**: semverによる明確なバージョン管理
- **CI/CDでの利用が容易**: npmパッケージとして扱える

## 前提条件

- Git がインストールされていること
- Node.js または Bun がインストールされていること

## 移行手順

### Step 1: Submodule の削除

プロジェクトルートで以下を実行：

```bash
# Submodule の初期化を解除
git submodule deinit -f .devcontainer/shared

# Submodule を Git から削除
git rm -f .devcontainer/shared

# Submodule のメタデータを削除
rm -rf .git/modules/.devcontainer/shared

# 変更をコミット
git add .
git commit -m "chore: Remove devcontainer submodule"
```

### Step 2: 既存の DevContainer ファイルをバックアップ（オプション）

カスタマイズした設定がある場合は、バックアップを取ります：

```bash
# バックアップディレクトリを作成
mkdir -p .devcontainer.backup

# 既存ファイルをバックアップ
cp -r .devcontainer/* .devcontainer.backup/

# devcontainer.json のみ削除（bin/, post-create.sh は残す）
rm .devcontainer/devcontainer.json
```

### Step 3: .npmrc の設定

プロジェクトルートに `.npmrc` を作成：

```bash
echo "@niroe5tar64:registry=https://npm.pkg.github.com" >> .npmrc
```

**重要**: `.npmrc` を `.gitignore` に追加するか、リポジトリにコミットするかはプロジェクトのポリシーに従ってください。

### Step 4: 新しい DevContainer の生成

```bash
# DevContainer を初期化（適切なプリセットを選択）
npx @niroe5tar64/devcontainer init --preset node

# または Bun を使用
bunx @niroe5tar64/devcontainer init --preset node
```

利用可能なプリセット：
- `node` - Node.js/TypeScript
- `python` - Python
- `fullstack` - Full-stack with Docker-in-Docker
- `writing` - AI writing environment
- `bun` - Bun development

プリセット一覧を確認：
```bash
npx @niroe5tar64/devcontainer list-presets
```

### Step 5: project-config.ts の移行（カスタマイズがある場合）

バックアップした `project-config.ts` がある場合は、新しい設定に移行します：

```bash
# 既存の project-config.ts を確認
cat .devcontainer.backup/project-config.ts

# 必要に応じて .devcontainer/project-config.ts を作成
```

**注意**: import パスが変更されています：

```typescript
// 旧: submodule ベース
import type { DevContainerConfig } from './shared/src/types';

// 新: npx/bunx ベース
import type { DevContainerConfig } from '@niroe5tar64/devcontainer';
```

ただし、npx/bunxベースでは型定義の直接importができないため、以下のように記述します：

```typescript
// .devcontainer/project-config.ts
export const projectConfig = {
  // プロジェクト固有の設定
  forwardPorts: [3000, 8080],
  customizations: {
    vscode: {
      extensions: ['dbaeumer.vscode-eslint'],
    },
  },
};

export default projectConfig;
```

### Step 6: DevContainer の再ビルド

VS Code で DevContainer を再ビルドします：

```
Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### Step 7: 動作確認

DevContainer が正しく起動したら、以下を確認：

1. 拡張機能が正しくインストールされているか
2. コマンドラインツール（claude, codex 等）が動作するか
3. 環境変数が正しく設定されているか

### Step 8: バックアップの削除

すべて正常に動作することを確認したら、バックアップを削除：

```bash
rm -rf .devcontainer.backup
```

### Step 9: 変更をコミット

```bash
git add .devcontainer .npmrc
git commit -m "chore: Migrate to npx-based devcontainer setup"
```

## 更新方法

### DevContainer の更新

新しいバージョンが公開されたら、以下のコマンドで更新できます：

```bash
# 最新バージョンで再生成
npx @niroe5tar64/devcontainer@latest init --preset node --force
```

または、特定のバージョンを指定：

```bash
npx @niroe5tar64/devcontainer@1.2.3 init --preset node --force
```

## トラブルシューティング

### エラー: "Unable to find package"

GitHub Packages の認証が必要な場合があります。`.npmrc` が正しく設定されているか確認してください：

```bash
cat .npmrc
# @niroe5tar64:registry=https://npm.pkg.github.com
```

### 既存ファイルの上書きエラー

`--force` オプションを使用して上書きします：

```bash
npx @niroe5tar64/devcontainer init --preset node --force
```

### project-config.ts が認識されない

`project-config.ts` は `.devcontainer/` 直下に配置されている必要があります：

```bash
ls -la .devcontainer/project-config.ts
```

### カスタマイズした設定が反映されない

`project-config.ts` のエクスポート方法を確認してください：

```typescript
// 正しい
export const projectConfig = { ... };
export default projectConfig;

// または
export default { ... };
```

## よくある質問

### Q: git submodule 方式と併用できますか？

A: 技術的には可能ですが、推奨しません。どちらか一方を選択してください。

### Q: 既存のカスタマイズは維持できますか？

A: はい。`project-config.ts` を使用することで、プロジェクト固有の設定を維持できます。

### Q: チーム全員が移行する必要がありますか？

A: はい。リポジトリから submodule を削除すると、すべてのメンバーが新しい方式に移行する必要があります。事前にチームで合意を取ることを推奨します。

### Q: ロールバックできますか？

A: はい。Git の履歴から submodule を復元できます：

```bash
# 移行前のコミットに戻る
git revert <commit-hash>

# または特定のコミットをチェックアウト
git checkout <commit-hash> -- .gitmodules .devcontainer/shared
git submodule update --init --recursive
```

## サポート

問題が発生した場合は、以下を確認してください：

1. [README.md](../README.md) - 基本的な使用方法
2. [COMMANDS.md](../COMMANDS.md) - コマンドリファレンス
3. [GitHub Issues](https://github.com/niroe5tar64/shared-devcontainer/issues) - 既知の問題と報告

---

移行に関するフィードバックや質問は、GitHub Issues でお気軽にお寄せください。
