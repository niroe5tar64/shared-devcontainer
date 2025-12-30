# ai-writing-starter への shared-devcontainer 適用手順

## 前提条件

- `shared-devcontainer` リポジトリをリモート（GitHub）にプッシュ済み
- `ai-writing-starter` が Git 管理されている

---

## 用語定義

このガイドでは以下の用語を使用します：

| 用語 | 意味 | 具体例 |
|-----|------|--------|
| **Self DevContainer** | shared-devcontainer プロジェクト自身の開発環境 | `shared-devcontainer/.devcontainer/devcontainer.json` |
| **Client DevContainer** | shared-devcontainer を利用する側のプロジェクトの開発環境 | `ai-writing-starter/.devcontainer/devcontainer.json` |

- このガイドは **Client DevContainer** の構築手順を説明します
- Self DevContainer については `shared-devcontainer` プロジェクトの CLAUDE.md を参照

---

## ステップ1: shared-devcontainer をプッシュ

```bash
cd /workspaces/shared-devcontainer
git push origin main
```

---

## ステップ2: ai-writing-starter にサブモジュールを追加

```bash
cd /Users/eitarofutakuchi/source_code/template-project/ai-writing-starter

# サブモジュールとして追加
git submodule add https://github.com/niroe5tar64/shared-devcontainer .devcontainer/shared

# サブモジュールを初期化
git submodule update --init --recursive
```

---

## ステップ3: DevContainer 設定を生成

サブモジュール内で `bun run build:client` を実行すると、親プロジェクトの `.devcontainer/` に完全な設定ファイルが生成されます。

```bash
cd .devcontainer/shared

# writing プリセットから devcontainer.json を生成
bun run build:client writing

cd ../..
```

### 生成されるファイル

```
ai-writing-starter/
└── .devcontainer/
    ├── devcontainer.json  ← 自動生成
    ├── bin/               ← ラッパースクリプト（コピー）
    ├── post-create.sh     ← セットアップスクリプト（コピー）
    └── shared/            ← サブモジュール
        └── dist/
            ├── presets/
            ├── bin/
            └── post-create.sh
```

---

## ステップ4: 不要なファイルを削除

```bash
cd /Users/eitarofutakuchi/source_code/template-project/ai-writing-starter

# Docker Compose 構成を削除
rm docker-compose.dev.yml
rm Dockerfile.dev
```

---

## ステップ5: 変更をコミット

```bash
git add .
git commit -m "feat: shared-devcontainer をサブモジュールとして導入

Docker Compose構成からDevContainer Features構成に移行
- .devcontainer/shared: サブモジュール追加
- devcontainer.json: プリセットから自動生成
- 不要なファイル削除: docker-compose.dev.yml, Dockerfile.dev
"
```

---

## ステップ6: DevContainer を再ビルド

VS Code で:
1. `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
2. `Dev Containers: Rebuild Container` を選択
3. コンテナのビルドと起動を待つ

---

## ステップ7: 動作確認

コンテナ起動後、以下を確認：

```bash
# ラッパースクリプトが正しく配置されているか
which claude
# 期待値: /home/dev-user/.local/bin/claude

which codex
# 期待値: /home/dev-user/.local/bin/codex

# claude が --dangerously-skip-permissions 付きで起動するか
claude --version
# エラーなく起動すればOK

# PATH設定の確認
echo $PATH | grep -o '/home/dev-user/.local/bin'
# 期待値: /home/dev-user/.local/bin
```

---

## サブモジュール更新時の手順

shared-devcontainer が更新された場合：

```bash
# サブモジュールを最新化
cd .devcontainer/shared
git pull origin main

# devcontainer.json を再生成
bun run build:client writing

# 元のディレクトリに戻る
cd ../..

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → Dev Containers: Rebuild Container
```

---

## プロジェクト固有の設定を追加（オプション）

プロジェクト特有の設定が必要な場合、`.devcontainer/project-config.ts` を作成します。

```typescript
// .devcontainer/project-config.ts
import type { DevContainerConfig } from './src/types';

export const projectConfig: DevContainerConfig = {
  // プロジェクト固有のポートフォワード
  forwardPorts: [3000, 8080],

  // プロジェクト固有の拡張機能
  customizations: {
    vscode: {
      extensions: [
        'dbaeumer.vscode-eslint',
      ],
    },
  },

  // プロジェクト固有の環境変数
  containerEnv: {
    PROJECT_NAME: 'ai-writing-starter',
  },
};

export default projectConfig;
```

この設定は `bun run build:client` 実行時に自動的にマージされます。

詳細は `.devcontainer/shared/.work/project-config-example.ts` を参照してください。

---

## トラブルシューティング

### サブモジュールが空の場合

```bash
git submodule update --init --recursive
```

### 拡張機能がインストールされない

VS Code: `Cmd+Shift+P` → `Dev Containers: Rebuild Container`

### claude コマンドが見つからない

```bash
# post-create.sh が実行されたか確認
ls -la ~/.local/bin/claude

# 存在しない場合、手動実行
bash .devcontainer/post-create.sh
```

### Bun がインストールされていない（Windows など）

サブモジュール内でのビルドに Bun が必要です。

```bash
# Bun をインストール
curl -fsSL https://bun.sh/install | bash

# または、Node.js の npm で実行
cd .devcontainer/shared
npx bun run build:client writing
```

### ビルドエラーが発生する

```bash
# shared-devcontainer 側で先に bun run build を実行
cd .devcontainer/shared
bun run build
bun run build:client writing
```

---

## ロールバック方法（問題が発生した場合）

```bash
# サブモジュールを削除
git submodule deinit -f .devcontainer/shared
rm -rf .git/modules/.devcontainer/shared
git rm -f .devcontainer/shared

# 元の設定に戻す
git checkout HEAD -- .devcontainer/devcontainer.json docker-compose.dev.yml Dockerfile.dev

# DevContainer を再ビルド
```

---

## この方式の利点

### ✅ 1回のビルドで完結
```bash
cd .devcontainer/shared
bun run build:client writing  # これだけで全て生成
```

### ✅ プロジェクト固有設定のサポート
`project-config.ts` で各プロジェクトの設定をカスタマイズ可能

### ✅ クロスプラットフォーム対応
Windows/macOS/Linux で同じ手順で動作

### ✅ Git での管理が容易
生成された `devcontainer.json` は通常のファイルとして Git 管理可能

---

## なぜ `extends` を使わないのか？

DevContainer の `extends` プロパティは、**同じリポジトリ内のファイル**のみをサポートしています。

サブモジュールは別のGitリポジトリなので、以下のような問題が発生します：

- `"extends": "./shared/dist/presets/writing.json"` → ❌ エラー: "image information is missing"
- VS Code が別リポジトリのファイルを正しく解決できない

そのため、**ビルドスクリプトで完全な `devcontainer.json` を生成する方式**を採用しています。

この方式では：
- base.ts + presets/*.ts をマージ
- project-config.ts があればさらにマージ
- 完全な devcontainer.json を親プロジェクトに直接出力
- bin/ や post-create.sh もコピー

---

## 参考: 生成される設定内容

`writing` プリセットから生成される `devcontainer.json` には以下が含まれます：

- **Base Image**: `mcr.microsoft.com/devcontainers/base:ubuntu`
- **Features**: Git, GitHub CLI, Node.js (LTS), Bun, Zsh
- **VS Code 拡張機能**: Copilot, Claude Code, GitLens, Biome, Bun など 10個
- **環境変数**:
  - `CLAUDE_SETTINGS_PATH=/workspace/.claude/settings.json`
  - `PATH` にラッパースクリプト優先設定
- **Mounts**: `~/.gitconfig`, `~/.ssh`, `~/.claude`, `~/.codex`
- **postCreateCommand**: `bash .devcontainer/post-create.sh`（Bun, Claude Code, Codexインストール + ラッパー配置）

詳細は `.devcontainer/shared/dist/presets/writing.json` を参照してください。

---

## 参考資料

- [devcontainers/spec#22 - extends property specification](https://github.com/devcontainers/spec/issues/22)
- [vscode-remote-release#8430 - Ability to extend devcontainer.json](https://github.com/microsoft/vscode-remote-release/issues/8430)
- [Dev Container metadata reference](https://containers.dev/implementors/json_reference/)
