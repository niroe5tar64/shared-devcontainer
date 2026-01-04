# Shared DevContainer Configuration

チーム共通の DevContainer 設定リポジトリです。

**特徴**:
- ✅ TypeScript で型安全に設定を管理
- ✅ DRY原則に基づいた設定の再利用
- ✅ ビルドスクリプトで JSON を自動生成
- ✅ Client 側でビルドして `.devcontainer/` を生成

**クイックスタート**: よく使うコマンドは [COMMANDS.md](./COMMANDS.md) を参照してください。

## 構成

```
shared-devcontainer/
├── src/                      # 設定のソースファイル（編集するのはここ）
│   ├── base.ts              # 共通設定
│   ├── types.ts             # 型定義
│   ├── types.generated.ts   # 自動生成された型（編集禁止）
│   └── presets/             # プリセット
│       ├── node.ts
│       ├── python.ts
│       └── fullstack.ts
├── scripts/
│   ├── build/               # ビルド関連
│   │   ├── build.ts         # ビルドスクリプト
│   │   └── lib/             # 共通ユーティリティ
│   └── ops/                 # 運用・メンテナンス
│       └── generate-types.ts  # 型生成スクリプト
└── .devcontainer/           # このリポジトリ自体の開発環境
    ├── devcontainer.json    # 自動生成（Self DevContainer）
    ├── project-config.ts    # Self 用の追加設定
    ├── bin/                 # ラッパースクリプト（ソース）
    └── post-create.sh       # セットアップスクリプト（ソース）
```

### 生成されるファイル

- **Self**: `.devcontainer/devcontainer.json`
- **Client**: 親プロジェクトの `.devcontainer/` に以下を生成
  - `devcontainer.json`
  - `bin/`（ラッパースクリプトのコピー）
  - `post-create.sh`（セットアップスクリプトのコピー）

## 開発者向け：設定の変更方法

### 前提条件

- [Bun](https://bun.sh/) がインストールされていること

### クイックスタート

```bash
# 依存関係をインストール
bun install

# JSON を生成（Self DevContainer）
bun run build
```

### 設定の編集ワークフロー

1. **共通設定の変更**: `src/base.ts` を編集
2. **プリセットの変更**: `src/presets/*.ts` を編集
3. **ビルドして JSON を生成**: `bun run build`

**重要**: `.devcontainer/devcontainer.json` は生成ファイルのため直接編集せず、`src/` を編集して `bun run build` を実行してください。

**詳細なコマンドは [COMMANDS.md](./COMMANDS.md#開発者向けself) を参照してください。**

### 変更例：新しい拡張機能を全プロジェクトに追加

```typescript
// src/base.ts
export const base: DevContainerConfig = {
  // ...
  customizations: {
    vscode: {
      extensions: [
        'GitHub.copilot',
        'anthropic.claude-code',
        // 新しい拡張機能を追加
        'usernamehw.errorlens',
        'wayou.vscode-todo-highlight',
        'github.vscode-pull-request-github', // ← 追加
      ],
    },
  },
  // ...
};
```

```bash
# ビルドして JSON を生成
bun run build
```

### 変更例：Node.js プリセットに拡張機能を追加

```typescript
// src/presets/node.ts
export const nodePreset: DevContainerConfig = {
  // ...
  customizations: {
    vscode: {
      extensions: [
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode',
        'prisma.prisma', // ← 追加
      ],
    },
  },
  // ...
};
```

### プリセットの追加

新しいプリセット（例：Rust）を追加する場合：

1. **`src/presets/rust.ts` を作成**:

```typescript
import type { DevContainerConfig } from '../types';

export const rustPreset: DevContainerConfig = {
  name: 'Rust Base',
  image: 'mcr.microsoft.com/devcontainers/rust:1-bullseye',
  features: {
    'ghcr.io/devcontainers/features/rust:1': {
      version: 'latest',
    },
  },
  customizations: {
    vscode: {
      extensions: [
        'rust-lang.rust-analyzer',
        'tamasfe.even-better-toml',
      ],
      settings: {},
    },
  },
};
```

2. **`scripts/build/build.ts` に追加**:

```typescript
import { rustPreset } from '../src/presets/rust';

const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
  rust: rustPreset, // ← 追加
};
```

3. **ビルド**: `bun run build`

## 使用方法

### 新規プロジェクトへの適用

```bash
# 1. Submodule として追加
cd /path/to/your/project
git submodule add https://github.com/niroe5tar64/shared-devcontainer.git .devcontainer/shared

# 2. Client DevContainer を生成
cd .devcontainer/shared
bun install
bun run build:client node  # プリセット選択: node, python, fullstack, writing
cd ../..

# 3. DevContainer を開く
# VS Code: Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

**詳細な手順は [COMMANDS.md](./COMMANDS.md#ユーザー向けclient) を参照してください。**

### 既存プロジェクトへの適用

既存の `.devcontainer/devcontainer.json` がある場合は、まずバックアップしてから Submodule を追加します。

**詳細な手順は [COMMANDS.md](./COMMANDS.md#既存プロジェクトへの適用) を参照してください。**

### 共通設定の更新

サブモジュールを最新版に更新する方法：

```bash
# 推奨：親リポジトリのルートから実行
git submodule update --remote .devcontainer/shared
cd .devcontainer/shared && bun run build:client node && cd ../..
git add .devcontainer/shared
git commit -m "chore: Update shared-devcontainer submodule"
```

**重要**:
- `git submodule update --init --recursive` は**初回セットアップ専用**です
- 最新版への更新には `git submodule update --remote` を使用してください

**詳細は [COMMANDS.md](./COMMANDS.md#共通設定の更新) を参照してください。**

## プリセット選択ガイド

プロジェクトの技術スタックに応じて適切なプリセットを選択：

| プロジェクトタイプ | プリセット | 含まれる機能 |
|-------------------|-----------|-------------|
| Node.js/TypeScript | `node` | Node.js 20, Bun, pnpm, ESLint, Prettier |
| Python | `python` | Python 3.11, Poetry, Black, Ruff |
| フルスタック（Docker使用） | `fullstack` | Node.js 20, Docker-in-Docker, Bun, pnpm |

**共通で含まれる機能（すべてのプリセット）**:
- AI アシスタント: Claude Code, GitHub Copilot
- Git ツール: Git, GitHub CLI, GitLens
- エディタ支援: ErrorLens, TODO Highlight
- シェル: Zsh + Oh My Zsh

## カスタマイズ

プロジェクト固有の設定は `.devcontainer/project-config.ts` で追加します。

```typescript
// .devcontainer/project-config.ts
import type { DevContainerConfig } from './shared/src/types';

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
    PROJECT_NAME: 'my-project',
  },
};

export default projectConfig;
```

変更後は `cd .devcontainer/shared && bun run build:client node` で再生成してください。

⚠️ **注意**: `extensions` 配列は上書きではなく、プリセットの拡張機能に追加されます（devcontainer の仕様）。

**詳細は [COMMANDS.md](./COMMANDS.md#プロジェクト固有のカスタマイズ) を参照してください。**

## コマンドラインツールの自動設定

DevContainer では、以下のコマンドラインツールが自動的にオプション付きで実行されるように設定されています：

| コマンド | 自動付与されるオプション | 説明 |
|---------|----------------------|------|
| `claude` | `--dangerously-skip-permissions` | Claude Code CLI の実行時に権限確認をスキップ |
| `codex` | `--sandbox workspace-write --ask-for-approval never` | Codex CLI の実行時に sandbox を維持しつつ、承認なしで実行 |

**追加機能**:
- `codex` コマンドは、`login`/`logout` 以外のコマンド実行時に自動的にログイン状態をチェックし、未ログインの場合はデバイスコード認証でログインします
- `codex login` 実行時は自動的に `--device-auth` オプションが付与され、DevContainer 環境でもスムーズに認証できます

**仕組み**:
- `.devcontainer/bin/` にラッパースクリプトを配置
- DevContainer ビルド時に `~/.local/bin/` にコピーされ、PATH の先頭に追加
- コマンド実行時にラッパーが自動的にオプションを追加して本体を呼び出し

これにより、DevContainer 内での開発時に毎回オプションを指定する必要がなくなります。

## Claude Code / Codex 認証情報の永続化

DevContainer では、Claude Code と Codex の認証情報を **ホストマシンとバインドマウントで共有**するため、**コンテナを再ビルドしても認証状態が確実に維持**され、複数のプロジェクト間でも認証情報を共有できます。

**マウント設定（ホストマシンの設定を共有）**:
```json
"mounts": [
  "source=${localEnv:HOME}/.claude,target=/home/dev-user/.claude,type=bind",
  "source=${localEnv:HOME}/.codex,target=/home/dev-user/.codex,type=bind"
]
```

※ `common-utils` フィーチャーで `username: "dev-user"` を指定しているため、コンテナビルド時に `dev-user` が作成されます。

この設定により：
- 認証情報は **ホストマシン** の `~/.claude` および `~/.codex` に保存される
- 複数のプロジェクト（DevContainer）で **同じ認証情報を共有**できる
- ホストマシンから直接認証情報にアクセス可能
- Rebuild 後も **確実に維持**される

### 初回セットアップ

```bash
# Claude Code にログイン
claude login

# Codex にログイン
codex login
```

認証情報はホストマシンの `~/.claude/` と `~/.codex/` に保存されます。

**詳細な手順とトラブルシューティングは [COMMANDS.md](./COMMANDS.md#認証関連) を参照してください。**

## Claude Code プラグインの管理

DevContainer 環境では、**Claude Code プラグインはユーザースコープでの追加を推奨**します。

### プラグインのスコープについて

Claude Code には3つの設定スコープがあります：

| スコープ | 設定ファイル | 対象 | Git管理 | 推奨度 | 用途 |
|---------|-------------|------|---------|--------|------|
| **User** | `~/.claude/settings.json` | 個人（全プロジェクト） | なし | ⭐️ **推奨** | 複数プロジェクト共通の個人設定 |
| **Local** | `.claude/settings.local.json` | 個人のみ | なし（`.gitignore`） | ⚠️ 非推奨 | プラグイン管理ファイルと干渉の可能性 |
| **Project** | `.claude/settings.json` | チーム全員 | あり | ❌ 避ける | Git管理で不整合が生じる |

### 推奨プラグイン

このプロジェクトでは、以下のプラグインの使用を推奨しています：

**[niro-agent-plugins](https://github.com/niroe5tar64/niro-agent-plugins)**

開発効率を向上させる便利なプラグイン集：
- `statusline@niro-agent-plugins` - ステータスライン表示機能
- `git-ops@niro-agent-plugins` - Git操作支援機能

プラグインのインストール方法は「プラグインの追加方法」セクションを参照してください。

### プラグインの自動セットアップ

推奨プラグイン（`git-ops`, `decision-support`, `statusline`, `bash-safety`）を自動で一括セットアップ：

```bash
bun run setup-claude-plugins
```

**詳細は [COMMANDS.md](./COMMANDS.md#プラグイン管理) を参照してください。**

### ユーザースコープを推奨する理由

1. **DevContainer 再作成時の干渉を回避**
   - `~/.claude/` 配下のプラグイン管理ファイルとローカル/プロジェクトスコープの設定が干渉しない
   - DevContainer を作り直しても設定が安定して維持される

2. **Git 管理による不整合を回避**
   - プロジェクトスコープ (`.claude/settings.json`) は Git 管理されるため、チームメンバー間で不整合が生じる
   - 個人のプラグイン設定をリポジトリに含めるべきではない

3. **複数プロジェクト間での一貫性**
   - 一度設定すれば、すべての DevContainer プロジェクトで同じプラグインが利用可能
   - プロジェクトごとに設定を繰り返す必要がない

### プラグインの追加方法

**1. プラグインマーケットプレースの追加**

```bash
# ユーザースコープでマーケットプレースを追加（推奨）
claude plugin marketplace add <marketplace-name>
```

**2. プラグインの有効化**

`~/.claude/settings.json` (ユーザースコープ) で管理：

```json
{
  "enabledPlugins": {
    "statusline@niro-agent-plugins": true,
    "git-ops@niro-agent-plugins": true
  }
}
```

**3. プラグイン設定のカスタマイズ**

環境変数 `$HOME` を使用してパスを指定：

```json
{
  "statusLine": {
    "type": "command",
    "command": "$HOME/.claude/plugins/cache/marketplace-name/plugin-name/version/scripts/script.sh"
  }
}
```

**重要**: 絶対パス `/home/dev-user/...` ではなく、環境変数 `$HOME` を使用することで、異なるユーザー名を持つ環境でも動作します。

### チーム共有が必要な場合

⚠️ **注意**: 基本的にはユーザースコープを使用してください。プロジェクトスコープは以下のリスクがあるため避けることを推奨します：

- Git 管理によるメンバー間の設定不整合
- DevContainer 再作成時のプラグイン管理ファイルとの干渉

**推奨される代替案**: README にプラグインのインストール手順を記載し、各メンバーがユーザースコープで個別に設定する方法を推奨します。

## トラブルシューティング

よくある問題と解決方法は [COMMANDS.md](./COMMANDS.md#トラブルシューティング) を参照してください。

主な問題：
- サブモジュールが初期化されていない
- 拡張機能が反映されない
- 認証情報が保存されない
- ラッパースクリプトが動作しない

## 貢献

共通設定の改善提案は Issue または Pull Request でお願いします。

### プリセットの追加

新しい技術スタック用のプリセットを追加する場合：

1. `src/presets/` に新しいファイルを作成
2. `scripts/build/build.ts` の `PRESETS` に追加
3. `bun run build` を実行

## バージョン履歴

- `v1.0.0` (2025-12-27): 初回リリース
  - 共通設定とプリセットの提供

## ライセンス

MIT License

## クイックリファレンス

- **[COMMANDS.md](./COMMANDS.md)** - よく使うコマンドのチートシート

## 関連リンク

- [Dev Containers 公式ドキュメント](https://containers.dev/)
- [DevContainer Specification](https://github.com/devcontainers/spec)
- [VS Code Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
