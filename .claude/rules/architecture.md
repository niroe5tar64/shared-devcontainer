# アーキテクチャ

## ソース → ビルド → 配布フロー

```
src/base.ts + src/presets/*.ts + .devcontainer/project-config.ts
        ↓ bun run build (Self DevContainer)
dist/base.json + dist/presets/*.json + .devcontainer/devcontainer.json
        ↓ git submodule
他プロジェクトで bun run build:client <preset> を実行
        ↓
親プロジェクトの .devcontainer/devcontainer.json を生成
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
│   ├── build.ts             # 統合ビルドスクリプト（Self/Client両対応）
│   ├── lib/
│   │   └── devcontainer-builder.ts  # 共通ユーティリティ
│   └── generate-types.ts    # 型生成スクリプト
├── dist/                    # 自動生成（Git管理対象）
│   ├── base.json
│   ├── presets/*.json
│   ├── bin/                 # ラッパースクリプト
│   └── post-create.sh
└── .devcontainer/           # このリポジトリ自体の開発環境
    ├── devcontainer.json    # 自動生成（Self DevContainer）
    ├── project-config.ts    # プロジェクト固有設定
    ├── bin/                 # ラッパースクリプト（ソース）
    └── post-create.sh       # セットアップスクリプト（ソース）
```

## マージロジック（scripts/lib/devcontainer-builder.ts）

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

- `dist/base.json`: `src/base.ts` のみから生成
- `dist/presets/*.json`: `src/base.ts` + `src/presets/*.ts` をマージして生成
- `.devcontainer/devcontainer.json`: base + (preset) + project-config をマージ（Self DevContainer）

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
- `bin/` - ラッパースクリプト
- `post-create.sh` - セットアップスクリプト

プロジェクト固有の設定は `.devcontainer/project-config.ts` で追加可能です。
