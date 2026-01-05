# npx/bunx ベース配布への移行計画

## 概要

git submodule ベースの配布方式から、npx/bunx コマンドによる配布方式への移行計画。

## 決定事項

| 項目 | 決定内容 |
|-----|---------|
| パッケージ名 | `@niroe5tar64/devcontainer` |
| 公開先 | GitHub Packages (public) |
| 構成 | 単一パッケージ（現状維持） |
| project-config | TypeScript 維持 |

## 目標

```bash
# 移行後のユーザー体験
npx @niroe5tar64/devcontainer init --preset node
# または
bunx @niroe5tar64/devcontainer init --preset node
```

## 現状 → 移行後の比較

| 項目 | 現状 (git submodule) | 移行後 (npx/bunx) |
|-----|---------------------|-------------------|
| 初期セットアップ | 3ステップ | 1コマンド |
| Bun 依存 | クライアント側も必須 | 不要（npm で動作） |
| バージョン管理 | git ref | semver |
| 更新方法 | `git submodule update` + rebuild | `npx pkg@latest` |
| カスタマイズ | `project-config.ts` | 同様に対応可能 |

---

## Phase 1: CLI 機能の追加

### 1.1 ディレクトリ構成の変更

```
shared-devcontainer/
├── src/
│   ├── cli/                      # CLI コード
│   │   ├── index.ts              # エントリポイント
│   │   └── commands/
│   │       ├── init.ts           # init コマンド
│   │       └── list-presets.ts   # list-presets コマンド
│   ├── config/                   # 設定ファイル
│   │   ├── base.ts               # 既存の src/base.ts を移動
│   │   └── presets/              # 既存の src/presets/ を移動
│   ├── lib/                      # ユーティリティ
│   │   └── devcontainer-builder.ts
│   ├── types.ts
│   └── types.generated.ts
├── templates/                    # テンプレートファイル
│   ├── bin/
│   │   ├── claude
│   │   └── codex
│   ├── post-create.sh
│   └── initialize.sh
├── package.json
├── tsup.config.ts
└── ...
```

### 1.2 package.json の設定

```json
{
  "name": "@niroe5tar64/devcontainer",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "devcontainer": "./dist/cli/index.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/niroe5tar64/shared-devcontainer.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "scripts": {
    "build:cli": "tsup src/cli/index.ts --format esm --out-dir dist/cli",
    "prepublishOnly": "npm run build:cli"
  }
}
```

### 1.3 CLI コマンド設計

```bash
# 基本コマンド
npx @niroe5tar64/devcontainer init [--preset <name>] [--output <dir>]
npx @niroe5tar64/devcontainer list-presets
npx @niroe5tar64/devcontainer --version
npx @niroe5tar64/devcontainer --help

# オプション
--preset, -p    プリセット名 (node, python, fullstack, writing, bun)
--output, -o    出力ディレクトリ (デフォルト: .devcontainer)
--force, -f     既存ファイルを上書き
--dry-run       実行内容の確認のみ
```

### 1.4 依存ライブラリの選定

| 用途 | ライブラリ | 理由 |
|-----|-----------|------|
| CLI フレームワーク | `commander` or `citty` | 軽量、TypeScript 対応 |
| ファイル操作 | Node.js 標準 (fs/promises) | 依存を最小化 |
| テンプレート | 静的ファイルコピー | 複雑なテンプレートエンジン不要 |
| ビルド | `tsup` | ESM 対応、バンドル対応 |

---

## Phase 2: 生成ロジックの移植

### 2.1 既存ロジックの活用

以下のファイルは基本的にそのまま移植可能：

- `src/base.ts` → `src/config/base.ts`
- `src/presets/*.ts` → `src/config/presets/`
- `scripts/build/lib/devcontainer-builder.ts` → `src/lib/devcontainer-builder.ts`

### 2.2 テンプレートファイルの配置

```
templates/
├── bin/
│   ├── claude
│   └── codex
├── post-create.sh
└── initialize.sh
```

既存の `.devcontainer/bin/`, `.devcontainer/post-create.sh`, `.devcontainer/initialize.sh` を移動。

### 2.3 生成フローの実装

```typescript
// src/cli/commands/init.ts
export async function init(options: InitOptions) {
  const outputDir = options.output || '.devcontainer';

  // 1. プリセットの読み込み
  const preset = await loadPreset(options.preset);

  // 2. project-config.ts の読み込み（存在すれば）
  const projectConfig = await loadProjectConfig(outputDir);

  // 3. 設定のマージ
  const config = mergeConfigs(base, preset, projectConfig);

  // 4. ファイルの生成
  await writeDevcontainerJson(outputDir, config);
  await copyTemplates(outputDir);

  console.log('DevContainer files generated successfully');
}
```

---

## Phase 3: project-config.ts のサポート

### 3.1 カスタマイズ方法

ユーザーは `.devcontainer/project-config.ts` を作成してカスタマイズ可能：

```typescript
// .devcontainer/project-config.ts
import type { DevContainerConfig } from '@niroe5tar64/devcontainer';

export const projectConfig: Partial<DevContainerConfig> = {
  name: 'My Project',
  customizations: {
    vscode: {
      extensions: ['my.custom-extension'],
    },
  },
};
```

### 3.2 動的インポートの実装

```typescript
// project-config.ts の読み込み
async function loadProjectConfig(dir: string) {
  const configPath = path.join(dir, 'project-config.ts');

  if (!existsSync(configPath)) {
    return {};
  }

  // jiti で動的インポート（tsx よりも軽量）
  const jiti = createJiti(import.meta.url);
  const { projectConfig } = await jiti.import(configPath);
  return projectConfig;
}
```

### 3.3 jiti の採用理由

- `tsx` より軽量
- ESM/CommonJS 両対応
- TypeScript をランタイムで実行可能
- `unjs/jiti` として広く使われている

---

## Phase 4: GitHub Packages への公開

### 4.1 公開準備

#### .npmrc の設定（利用者側）

```
@niroe5tar64:registry=https://npm.pkg.github.com
```

#### GitHub Personal Access Token

利用者は以下の権限を持つ PAT が必要：
- `read:packages`

### 4.2 公開フロー

```bash
# 1. GitHub にログイン
npm login --registry=https://npm.pkg.github.com

# 2. ビルド
bun run build:cli

# 3. バージョン更新
npm version patch/minor/major

# 4. 公開
npm publish

# 5. タグ付け（GitHub）
git push --tags
```

### 4.3 CI/CD 設定（GitHub Actions）

```yaml
# .github/workflows/publish.yml
name: Publish to GitHub Packages

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://npm.pkg.github.com'
          scope: '@niroe5tar64'

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install
      - run: bun run build:cli

      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 4.4 GitHub Packages の注意点

| 項目 | 内容 |
|-----|------|
| 認証必須 | public でも `read:packages` 権限の PAT が必要 |
| スコープ必須 | パッケージ名は `@owner/package` 形式が必須 |
| リポジトリ紐付け | `repository` フィールドでリポジトリを指定 |

---

## Phase 5: ドキュメント・移行ガイド

### 5.1 README の更新

```markdown
## Quick Start

### 1. .npmrc の設定

@niroe5tar64:registry=https://npm.pkg.github.com

### 2. DevContainer の生成

npx @niroe5tar64/devcontainer init --preset node

## Available Presets

- `node` - Node.js/TypeScript development
- `python` - Python development
- `fullstack` - Full-stack with Docker-in-Docker
- `writing` - AI writing environment
- `bun` - Bun development
```

### 5.2 既存ユーザー向け移行ガイド

```markdown
## Migration from git submodule

1. Remove the submodule:
   git submodule deinit -f .devcontainer/shared
   git rm -f .devcontainer/shared
   rm -rf .git/modules/.devcontainer/shared

2. Configure npm registry:
   echo "@niroe5tar64:registry=https://npm.pkg.github.com" >> .npmrc

3. Generate new files:
   npx @niroe5tar64/devcontainer init --preset <your-preset>

4. (Optional) Keep your project-config.ts:
   # The CLI will automatically detect and use it
```

---

## 実装チェックリスト

### Step 1: 基盤整備
- [ ] ディレクトリ構成の整理（`src/config/`, `src/lib/`, `src/cli/` に再編）
- [ ] `tsup.config.ts` の作成
- [ ] CLI エントリポイントの作成 (`src/cli/index.ts`)

### Step 2: ファイル移動・移植
- [ ] `src/base.ts` → `src/config/base.ts`
- [ ] `src/presets/` → `src/config/presets/`
- [ ] `scripts/build/lib/devcontainer-builder.ts` → `src/lib/`
- [ ] `.devcontainer/bin/` → `templates/bin/`
- [ ] `.devcontainer/post-create.sh` → `templates/`
- [ ] `.devcontainer/initialize.sh` → `templates/`

### Step 3: コア機能実装
- [ ] `init` コマンドの実装
- [ ] `list-presets` コマンドの実装
- [ ] プリセット読み込みの実装
- [ ] テンプレートコピーの実装

### Step 4: カスタマイズ対応
- [ ] `jiti` の導入
- [ ] `project-config.ts` 読み込みの実装
- [ ] マージロジックの移植・調整

### Step 5: 公開準備
- [ ] `package.json` の更新（bin, files, publishConfig）
- [ ] GitHub Actions の設定
- [ ] ローカルでの動作確認

### Step 6: ドキュメント
- [ ] README の更新
- [ ] 移行ガイドの作成
- [ ] CLAUDE.md の更新

---

## 技術的考慮事項

### Node.js vs Bun

| 観点 | Node.js (npm) | Bun |
|-----|--------------|-----|
| 利用者の環境 | ほぼ確実に存在 | 未インストールの可能性 |
| npx 対応 | ネイティブ | bunx で対応 |
| 実行速度 | 十分高速 | より高速 |
| 推奨 | **主要ターゲット** | セカンダリ |

**結論**: npm/npx をプライマリ、bunx をセカンダリとして対応

### TypeScript 実行方法

| 方法 | メリット | デメリット |
|-----|---------|----------|
| ビルド済み JS | 追加依存なし | ビルドステップ必要 |
| tsx 経由 | TS のまま実行 | tsx が依存に入る |
| Bun 直接実行 | 高速 | Bun が必要 |

**結論**: ビルド済み JS を配布（`tsup` でバンドル）

---

## リスクと対策

| リスク | 対策 |
|-------|------|
| 既存ユーザーの混乱 | 移行ガイドの提供、submodule 版の一定期間メンテナンス |
| GitHub Packages の認証 | README に .npmrc 設定手順を明記 |
| project-config.ts の動的読み込み | jiti の導入でランタイム TypeScript 実行 |
| バージョン間の互換性 | semver に従った破壊的変更の管理 |

---

## Self DevContainer のビルドについて

CLI パッケージ移行後も、このリポジトリ自身の DevContainer（Self DevContainer）は引き続きビルドが必要。

### 方針

- `bun run build` / `bun run build:self` は引き続き維持
- 既存の `scripts/build/build.ts` は Self DevContainer 専用として残す
- CLI パッケージは Client DevContainer 生成のみを担当

### ディレクトリ構成（最終形）

```
shared-devcontainer/
├── src/
│   ├── cli/                      # CLI パッケージ用
│   ├── config/                   # 共通設定（CLI & Self 両方で使用）
│   │   ├── base.ts
│   │   └── presets/
│   ├── lib/                      # 共通ユーティリティ
│   └── types.ts
├── scripts/
│   └── build/
│       └── build.ts              # Self DevContainer 用（既存を維持）
├── templates/                    # CLI 配布用テンプレート
├── .devcontainer/                # Self DevContainer
│   ├── devcontainer.json         # 生成される
│   ├── project-config.ts
│   ├── bin/                      # ソース（templates/ にもコピー）
│   └── post-create.sh            # ソース（templates/ にもコピー）
└── package.json
```
