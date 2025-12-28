# アーキテクチャ

## ソース → ビルド → 配布フロー

```
src/base.ts + src/presets/*.ts
        ↓ bun run build
dist/base.json + dist/presets/*.json + dist/bin/ + dist/post-create.sh
        ↓ git submodule
他プロジェクトが dist/ 内のファイルを extends で利用
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
│   ├── build.ts             # ビルドスクリプト
│   └── generate-types.ts    # 型生成スクリプト
├── dist/                    # 自動生成（Git管理対象）
│   ├── base.json
│   ├── presets/*.json
│   ├── bin/                 # ラッパースクリプト
│   └── post-create.sh
└── .devcontainer/           # このリポジトリ自体の開発環境
    ├── devcontainer.json    # src/base.ts から生成
    ├── bin/                 # ラッパースクリプト（ソース）
    └── post-create.sh       # セットアップスクリプト（ソース）
```

## マージロジック（scripts/build.ts）

ビルド時、base と preset は以下のルールでマージされる：

| フィールド | マージ方法 |
|-----------|----------|
| `features` | オブジェクトを深くマージ（preset が優先） |
| `customizations.vscode.extensions` | 配列を結合し重複排除 |
| `customizations.vscode.settings` | オブジェクトを深くマージ |
| `mounts` | preset があれば preset、なければ base |
| `postCreateCommand` | 両方あれば `&&` で結合 |
| その他 | preset で上書き |

## 生成されるファイルの関係

- `dist/base.json`: `src/base.ts` のみから生成
- `dist/presets/*.json`: `src/base.ts` + `src/presets/*.ts` をマージして生成
- `.devcontainer/devcontainer.json`: `src/base.ts` から生成（このリポジトリ用）

## 配布先での利用方法

```json
{
  "extends": "./shared/dist/presets/node.json",
  "forwardPorts": [3000]
}
```

`extends` により、プリセットの設定を継承しつつプロジェクト固有の設定を追加可能。
