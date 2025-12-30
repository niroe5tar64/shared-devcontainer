# アーキテクチャ

## ソース → ビルド → 配布フロー

```
src/base.ts + src/presets/*.ts + .devcontainer/project-config.ts
        ↓ bun run build (Self DevContainer)
.devcontainer/devcontainer.json
        ↓ git submodule
他プロジェクトで bun run build:client <preset> を実行
        ↓
親プロジェクトの .devcontainer/devcontainer.json + bin/ + post-create.sh を生成
```

## ディレクトリ構成

```
shared-devcontainer/
├── src/                      # 設定のソースファイル（編集するのはここ）
│   ├── base.ts              # 共通設定
│   ├── types.ts             # カスタム型定義
│   ├── types.generated.ts   # 自動生成された型（編集禁止）
│   └── presets/             # プリセット
├── scripts/
│   ├── build/
│   │   ├── build.ts             # 統合ビルドスクリプト（Self/Client両対応）
│   │   └── lib/
│   │       └── devcontainer-builder.ts  # 共通ユーティリティ
│   └── ops/
│       └── generate-types.ts    # 型生成スクリプト
└── .devcontainer/           # このリポジトリ自体の開発環境
    ├── devcontainer.json    # 自動生成（Self DevContainer）
    ├── project-config.ts    # プロジェクト固有設定
    ├── bin/                 # ラッパースクリプト（ソース）
    └── post-create.sh       # セットアップスクリプト（ソース）
```

## マージロジック（scripts/build/lib/devcontainer-builder.ts）

ビルド時、base + preset + project-config は以下のルールで3層マージされる：

| フィールド | マージ方法 |
|-----------|----------|
| `features` | オブジェクトを深くマージ（後から指定したものが優先） |
| `customizations.vscode.extensions` | 配列を結合し重複排除 |
| `customizations.vscode.settings` | オブジェクトを深くマージ |
| `mounts` | project-config > preset > base の優先順 |
| `postCreateCommand` | project-config で明示指定すれば上書き、なければマージ |
| その他 | 後から指定したもので上書き |

## 生成されるファイルの関係

- `.devcontainer/devcontainer.json`: base + (preset) + project-config をマージ（Self DevContainer）
- Client 実行時は親プロジェクトの `.devcontainer/` に以下を生成:
  - `devcontainer.json`
  - `bin/`（ラッパースクリプトをコピー）
  - `post-create.sh`（セットアップスクリプトをコピー）

## 配布先での利用方法

**注意**: DevContainer の `extends` プロパティはサブモジュール（別リポジトリ）には対応していません。
代わりに、ビルドスクリプトで完全な `devcontainer.json` を生成する方式を採用しています。

```bash
# Client プロジェクトでの利用手順
cd .devcontainer/shared
bun run build:client writing  # writing プリセットで devcontainer.json を生成
```

これにより、親プロジェクトの `.devcontainer/` に以下が生成されます：
- `devcontainer.json` - 完全な設定ファイル
- `bin/` - ラッパースクリプト（`.devcontainer/bin` からコピー）
- `post-create.sh` - セットアップスクリプト（`.devcontainer/post-create.sh` からコピー）

プロジェクト固有の設定は `.devcontainer/project-config.ts` で追加可能です。
