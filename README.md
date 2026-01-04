# Shared DevContainer Configuration

チーム共通の DevContainer 設定リポジトリです。

**特徴**:
- ✅ TypeScript で型安全に設定を管理
- ✅ DRY原則に基づいた設定の再利用
- ✅ ビルドスクリプトで JSON を自動生成
- ✅ Client 側でビルドして `.devcontainer/` を生成

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

### セットアップ

```bash
# 依存関係をインストール
bun install

# JSON を生成（Self DevContainer）
bun run build
```

### 設定の編集

1. **共通設定の変更**: `src/base.ts` を編集
2. **プリセットの変更**: `src/presets/*.ts` を編集
3. **ビルドして JSON を生成**:

```bash
# Self DevContainer の生成
bun run build
```

**重要**: `.devcontainer/devcontainer.json` は生成ファイルのため直接編集せず、`src/` を編集して `bun run build` を実行してください。

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

2. **Client DevContainer を生成**:

```bash
cd .devcontainer/shared
bun install
bun run build:client node
cd ../..
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

# 3. Client DevContainer を生成
cd .devcontainer/shared
bun install
bun run build:client node
cd ../..
```

### 共通設定の更新

共通設定の更新を各プロジェクトに反映する方法は2つあります：

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

**注意**:
- `git submodule update --init --recursive` は**初回セットアップ専用**のコマンドです
- このコマンドは親リポジトリが記録している特定のコミットに戻すため、最新版への更新には使えません
- 最新版に更新するには `git submodule update --remote` または `git pull` を使用してください

### 特定バージョンの使用

特定のバージョンタグを使用したい場合：

```bash
cd .devcontainer/shared
git checkout v1.0.0

# devcontainer.json を再生成
bun run build:client node
cd ../..
```

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

変更後はサブモジュール内で再生成します：

```bash
cd .devcontainer/shared
bun run build:client node
cd ../..
```

⚠️ **注意**: `extensions` 配列は上書きではなく、プリセットの拡張機能に追加されます（devcontainer の仕様）。

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

#### 初回セットアップ手順

**1. DevContainer を起動**

VS Code で `Cmd+Shift+P` → `Dev Containers: Reopen in Container`

**2. 認証を実行**

コンテナ内またはホストマシンで以下のコマンドを実行：

```bash
# Claude Code にログイン
claude login

# Codex にログイン（OpenAI API キーが必要）
codex login
```

認証情報はホストマシンの以下のディレクトリに保存されます：
- `~/.claude/` (Mac/Linux) または `%USERPROFILE%\.claude\` (Windows)
- `~/.codex/` (Mac/Linux) または `%USERPROFILE%\.codex\` (Windows)

**3. 認証状態の確認**

DevContainer のビルド完了時に自動的に認証状態がチェックされ、未認証の場合は警告が表示されます。

#### Rebuild 後の挙動

DevContainer を Rebuild しても：
- ✅ 認証情報はホストマシンに保存されているため、**確実に維持される**
- ✅ **再ログイン不要**で `claude` および `codex` コマンドをすぐに使用可能
- ✅ コマンド履歴や設定も維持される
- ✅ 複数のプロジェクト間で同じ認証情報を共有できる

#### 認証情報の管理

**認証情報の確認**:
```bash
# ホストマシンで実行
ls -la ~/.claude/
ls -la ~/.codex/
```

**認証情報のバックアップ（オプション）**:
```bash
# 認証情報をバックアップしたい場合
tar czf claude-backup.tar.gz ~/.claude ~/.codex
```

**認証情報の削除（リセットしたい場合）**:
```bash
# 警告: 認証情報が完全に削除されます
rm -rf ~/.claude ~/.codex
```

#### トラブルシューティング

**症状**: 初回ログイン後も認証が保存されない

**確認事項**:
1. **ホストマシンにディレクトリが作成されているか確認**:
   ```bash
   # ホストマシンで実行
   ls -la ~/.claude
   ls -la ~/.codex
   ```

2. **devcontainer.json のマウント設定を確認**:
   - `type=bind` になっているか
   - `source=${localEnv:HOME}/.claude` のパスが正しいか

3. **ディレクトリの権限を確認**:
   ```bash
   # ホストマシンで実行
   chmod 700 ~/.claude ~/.codex
   ```

**症状**: 複数のプロジェクトで認証情報を共有したい

**解決策**: バインドマウント方式では、すべてのプロジェクトでホストマシンの `~/.claude` と `~/.codex` を共有します。一度ログインすれば、すべてのプロジェクトで認証情報が利用可能です。

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

推奨プラグイン（`git-ops`, `decision-support`, `statusline`, `bash-safety`）を自動で一括セットアップできるスクリプトを用意しています：

```bash
bun run setup-claude-plugins
```

このスクリプトが実行する内容：
1. マーケットプレイス `niroe5tar64/niro-agent-plugins` を追加（未追加の場合）
2. 4つの推奨プラグインをユーザースコープで自動追加（未インストールの場合）

既にインストール済みのプラグインは自動的にスキップされます。

**実行後の確認**：
```bash
cat ~/.claude/settings.json
```

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

### プリセット名が見つからない

**症状**: `bun run build:client <preset>` でエラーが発生

**解決策**: プリセット名を確認
```bash
ls -la .devcontainer/shared/src/presets/
```

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

## 関連リンク

- [Dev Containers 公式ドキュメント](https://containers.dev/)
- [DevContainer Specification](https://github.com/devcontainers/spec)
- [VS Code Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
