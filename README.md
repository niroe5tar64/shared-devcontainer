# Shared DevContainer Configuration

チーム共通の DevContainer 設定リポジトリです。

**特徴**:
- ✅ TypeScript で型安全に設定を管理
- ✅ DRY原則に基づいた設定の再利用
- ✅ ビルドスクリプトで JSON を自動生成
- ✅ Git では TypeScript ソースのみを管理（JSON は生成物）

## 構成

```
shared-devcontainer/
├── src/                      # 設定のソースファイル（編集するのはここ）
│   ├── base.ts              # 共通設定
│   ├── types.ts             # 型定義
│   └── presets/             # プリセット
│       ├── node.ts
│       ├── python.ts
│       └── fullstack.ts
├── scripts/
│   └── build.ts             # ビルドスクリプト
└── dist/                    # ← 自動生成（Git管理外）
    ├── base.json
    └── presets/
        ├── node.json
        ├── python.json
        └── fullstack.json
```

### 生成される設定ファイル（`dist/` 内）

- **`dist/base.json`**: すべてのプロジェクトに共通の基本設定
  - AI 開発ツール（Claude Code, GitHub Copilot）
  - Git ツール（Git, GitHub CLI）
  - 基本エディタ設定（フォーマット、リント）

- **`dist/presets/`**: 技術スタック別のプリセット
  - `node.json`: Node.js/TypeScript プロジェクト用
  - `python.json`: Python プロジェクト用
  - `fullstack.json`: フルスタック（Node.js + Docker）プロジェクト用

## 開発者向け：設定の変更方法

### 前提条件

- [Bun](https://bun.sh/) がインストールされていること

### セットアップ

```bash
# 依存関係をインストール
bun install

# JSON を生成
bun run build
```

### 設定の編集

1. **共通設定の変更**: `src/base.ts` を編集
2. **プリセットの変更**: `src/presets/*.ts` を編集
3. **ビルドして JSON を生成**:

```bash
# ビルド
bun run build

# クリーン + ビルド
bun run rebuild
```

### 変更例：新しい拡張機能を全プロジェクトに追加

```typescript
// src/base.ts
export const base: BaseConfig = {
  // ...
  extensions: [
    'GitHub.copilot',
    'anthropic.claude-code',
    // 新しい拡張機能を追加
    'usernamehw.errorlens',
    'wayou.vscode-todo-highlight',
    'github.vscode-pull-request-github', // ← 追加
  ],
  // ...
};
```

```bash
# ビルドして JSON を生成
bun run build

# Git にコミット（src/ のみ、JSON は含まない）
git add src/base.ts
git commit -m "feat: add GitHub PR extension"
git push
```

### 変更例：Node.js プリセットに拡張機能を追加

```typescript
// src/presets/node.ts
export const nodePreset: PresetConfig = {
  // ...
  extensions: [
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'prisma.prisma', // ← 追加
  ],
  // ...
};
```

### プリセットの追加

新しいプリセット（例：Rust）を追加する場合：

1. **`src/presets/rust.ts` を作成**:

```typescript
import type { PresetConfig } from '../types';

export const rustPreset: PresetConfig = {
  name: 'Rust Base',
  image: 'mcr.microsoft.com/devcontainers/rust:1-bullseye',
  features: {
    'ghcr.io/devcontainers/features/rust:1': {
      version: 'latest',
    },
  },
  extensions: [
    'rust-lang.rust-analyzer',
    'tamasfe.even-better-toml',
  ],
  settings: {},
};
```

2. **`scripts/build.ts` に追加**:

```typescript
import { rustPreset } from '../src/presets/rust';

// ...

const presets = [
  { name: 'node', config: nodePreset },
  { name: 'python', config: pythonPreset },
  { name: 'fullstack', config: fullstackPreset },
  { name: 'rust', config: rustPreset }, // ← 追加
];
```

3. **ビルド**:

```bash
bun run build
```

### 型チェック

TypeScript の型チェックで設定ミスを防げます：

```bash
# 型チェック
bun run tsc --noEmit
```

## 使用方法

### 新規プロジェクトへの適用

1. **プロジェクトルートで Git Submodule として追加**:

```bash
cd /path/to/your/project
git submodule add https://github.com/niroe5tar64/shared-devcontainer.git .devcontainer/shared
```

2. **`.devcontainer/devcontainer.json` を作成**:

```json
{
  "name": "My Project",
  "extends": "./shared/dist/presets/node.json",

  // プロジェクト固有の設定
  "forwardPorts": [3000],

  "customizations": {
    "vscode": {
      "extensions": [
        // プロジェクト固有の拡張機能
        "prisma.prisma"
      ]
    }
  },

  "postCreateCommand": "npm install"
}
```

3. **DevContainer を開く**:

VS Code で `Cmd+Shift+P` → `Dev Containers: Reopen in Container`

### 既存プロジェクトへの適用

既存の `.devcontainer/devcontainer.json` がある場合：

```bash
# 1. 既存設定をバックアップ
mv .devcontainer/devcontainer.json .devcontainer/devcontainer.json.backup

# 2. Submodule を追加
git submodule add https://github.com/niroe5tar64/shared-devcontainer.git .devcontainer/shared

# 3. 新しい devcontainer.json を作成（上記参照）
```

### 共通設定の更新

共通設定の更新を各プロジェクトに反映：

```bash
# プロジェクトディレクトリで実行
git submodule update --remote .devcontainer/shared
git add .devcontainer/shared
git commit -m "chore: update devcontainer config"

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### 特定バージョンの使用

特定のバージョンタグを使用したい場合：

```bash
cd .devcontainer/shared
git checkout v1.0.0
cd ../..
git add .devcontainer/shared
git commit -m "chore: pin devcontainer config to v1.0.0"
```

## プリセット選択ガイド

プロジェクトの技術スタックに応じて適切なプリセットを選択：

| プロジェクトタイプ | プリセット | 含まれる機能 |
|-------------------|-----------|-------------|
| Node.js/TypeScript | `presets/node.json` | Node.js 20, Bun, pnpm, ESLint, Prettier |
| Python | `presets/python.json` | Python 3.11, Poetry, Black, Ruff |
| フルスタック（Docker使用） | `presets/fullstack.json` | Node.js 20, Docker-in-Docker, Bun, pnpm |

**共通で含まれる機能（すべてのプリセット）**:
- AI アシスタント: Claude Code, GitHub Copilot
- Git ツール: Git, GitHub CLI, GitLens
- エディタ支援: ErrorLens, TODO Highlight
- シェル: Zsh + Oh My Zsh

### コマンドラインツールの自動設定

DevContainer では、以下のコマンドラインツールが自動的にオプション付きで実行されるように設定されています：

| コマンド | 自動付与されるオプション | 説明 |
|---------|----------------------|------|
| `claude` | `--dangerously-skip-permissions` | Claude Code CLI の実行時に権限確認をスキップ |
| `codex` | `--yolo` | OpenAI Codex CLI の実行時に承認なし + サンドボックス完全無効で実行 |

**仕組み**:
- `.devcontainer/bin/` にラッパースクリプトを配置
- DevContainer ビルド時に `~/.local/bin/` にコピーされ、PATH の先頭に追加
- コマンド実行時にラッパーが自動的にオプションを追加して本体を呼び出し

これにより、DevContainer 内での開発時に毎回オプションを指定する必要がなくなります。

## カスタマイズ

### プロジェクト固有の拡張機能を追加

```json
{
  "extends": "./shared/presets/node.json",
  "customizations": {
    "vscode": {
      "extensions": [
        // 共通の拡張機能は自動で含まれる
        // プロジェクト固有の拡張のみ追加
        "prisma.prisma",
        "GraphQL.vscode-graphql"
      ]
    }
  }
}
```

⚠️ **注意**: `extensions` 配列は上書きではなく、プリセットの拡張機能に追加されます（devcontainer の仕様）。

### ポート転送の設定

```json
{
  "extends": "./shared/presets/node.json",
  "forwardPorts": [3000, 5432, 6379]
}
```

### 環境変数の設定

```json
{
  "extends": "./shared/presets/node.json",
  "containerEnv": {
    "NODE_ENV": "development",
    "DATABASE_URL": "postgresql://localhost:5432/mydb"
  }
}
```

### 追加の Features

```json
{
  "extends": "./shared/presets/node.json",
  "features": {
    // プリセットの Features に追加
    "ghcr.io/devcontainers/features/aws-cli:1": {}
  }
}
```

## トラブルシューティング

### サブモジュールが初期化されていない

**症状**: 新しくクローンしたプロジェクトで `.devcontainer/shared` が空

**解決策**:
```bash
git submodule update --init --recursive
```

### 拡張機能が反映されない

**症状**: プリセットで指定した拡張機能がインストールされない

**解決策**: DevContainer を再ビルド
```bash
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### プリセットのパスが見つからない

**症状**: `extends` でエラーが発生

**解決策**: パスが正しいか確認
```bash
ls -la .devcontainer/shared/presets/node.json
```

## 貢献

共通設定の改善提案は Issue または Pull Request でお願いします。

### プリセットの追加

新しい技術スタック用のプリセットを追加する場合：

1. `presets/` に新しい JSON ファイルを作成
2. base.json の設定を継承（手動で含める）
3. 技術スタック固有の設定を追加
4. このREADME の「プリセット選択ガイド」を更新

## バージョン履歴

- `v1.0.0` (2025-12-27): 初回リリース
  - base.json: AI 開発ツール、基本エディタ設定
  - プリセット: Node.js, Python, Fullstack

## ライセンス

MIT License

## 関連リンク

- [Dev Containers 公式ドキュメント](https://containers.dev/)
- [DevContainer Specification](https://github.com/devcontainers/spec)
- [VS Code Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
