# アーキテクチャ

## ソース → ビルド → 配布フロー

```
src/config/base.ts + src/config/presets/*.ts + project-config.ts
        ↓ bun run build:cli
dist/cli/index.js + templates/
        ↓ npm publish (GitHub Packages)
他プロジェクトで npx @niroe5tar64/devcontainer init --preset <name>
        ↓
.devcontainer/devcontainer.json + bin/ + post-create.sh + initialize.sh を生成
```

## ディレクトリ構成

```
shared-devcontainer/
├── src/                      # 設定のソースファイル（編集するのはここ）
│   ├── cli/                 # CLI コード
│   │   ├── index.ts         # エントリポイント
│   │   └── commands/        # コマンド実装
│   ├── config/              # 設定ファイル
│   │   ├── base.ts          # 共通設定
│   │   └── presets/         # プリセット
│   ├── lib/                 # ユーティリティ
│   │   └── devcontainer-builder.ts
│   ├── types.ts             # カスタム型定義
│   └── types.generated.ts   # 自動生成された型（編集禁止）
├── templates/               # 配布用テンプレート
│   ├── bin/                 # ラッパースクリプト
│   ├── post-create.sh       # セットアップスクリプト
│   └── initialize.sh        # 初期化スクリプト
├── scripts/
│   ├── build/
│   │   └── build.ts         # Self DevContainer ビルドスクリプト
│   └── ops/
│       └── generate-types.ts    # 型生成スクリプト
├── dist/                    # ビルド成果物（CLI）
│   └── cli/
└── .devcontainer/           # このリポジトリ自体の開発環境
    ├── devcontainer.json    # 自動生成（Self DevContainer）
    ├── project-config.ts    # プロジェクト固有設定
    ├── bin/                 # ラッパースクリプト（ソース）
    └── post-create.sh       # セットアップスクリプト（ソース）
```

## マージロジック（src/lib/devcontainer-builder.ts）

ビルド時、base + preset + project-config は以下のルールで3層マージされる：

| フィールド | マージ方法 |
|-----------|----------|
| `features` | オブジェクトを深くマージ（後から指定したものが優先） |
| `customizations.vscode.extensions` | 配列を結合し重複排除 |
| `customizations.vscode.settings` | オブジェクトを深くマージ |
| `mounts` | base → preset → project をマージ（`target`/`dst` が同一なら後勝ち） |
| `postCreateCommand` | 特殊ルール（下記参照） |
| その他 | 後から指定したもので上書き |

### postCreateCommand のマージ動作

`postCreateCommand` は他のフィールドと異なる特殊なマージ動作をする：

**1. project-config で指定しない場合（推奨）**
- base と preset の `postCreateCommand` を `&&` で結合
- 例: `"bash base.sh" && "bash preset.sh"`

**2. project-config で明示的に指定した場合**
- base + preset のマージ結果を**完全に上書き**
- project-config の値のみが使用される

```typescript
// 例: project-config.ts
export const projectConfig: DevContainerConfig = {
  // 指定しない → base + preset がマージされる（推奨）

  // 指定する → base + preset を上書き
  postCreateCommand: 'bash custom-setup.sh',
};
```

**注意**: 通常は `postCreateCommand` を project-config で指定せず、base + preset のマージに任せることを推奨。カスタムコマンドが必要な場合は、シェルスクリプトを追加して base の `post-create.sh` から呼び出す方法を検討。

## 生成されるファイル

- **Self**: `.devcontainer/devcontainer.json` - このリポジトリの開発環境
- **CLI**: `npx @niroe5tar64/devcontainer init --preset <name>` で、指定したディレクトリに以下を生成
  - `devcontainer.json` - 完全な設定ファイル
  - `bin/` - ラッパースクリプト
  - `post-create.sh` - セットアップスクリプト
  - `initialize.sh` - 初期化スクリプト

プロジェクト固有の設定は `.devcontainer/project-config.ts` で追加可能です。
