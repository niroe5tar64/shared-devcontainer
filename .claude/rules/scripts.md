---
paths: scripts/**
---

# ビルドスクリプトガイド

## scripts/build/build.ts

このリポジトリ自身の Self DevContainer 設定を生成するビルドスクリプト。

### 使用方法

```bash
bun run build              # preset なし（base のみ）
bun run build node         # node preset を使用
bun run build:self         # 明示的に Self モード
bun run build:self node    # Self モード + node preset
```

### 主要な関数

| 関数 | 役割 |
|-----|------|
| `buildSelf(presetName?)` | Self DevContainer のビルド |

### プリセットの追加

`src/config/presets/index.ts` の `PRESETS` オブジェクトに新しいエントリを追加：

```typescript
// src/config/presets/index.ts
import { newPreset } from './new';

export const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
  new: newPreset,  // 追加
};
```

### 出力先

- `.devcontainer/devcontainer.json` - このリポジトリの Self DevContainer 設定

## scripts/build/lib/devcontainer-builder.ts

Self/Client 共通のユーティリティ関数を集約。

### 主要な関数

| 関数 | 役割 |
|-----|------|
| `generatePresetConfig(preset?, projectConfig?)` | base + preset + projectConfig を3層マージ |
| `mergeArrays()` | 配列を結合し重複排除 |
| `deepMerge()` | オブジェクトを再帰的にマージ |
| `mergeMounts()` | mounts をマージ（`target`/`dst` が同一なら後勝ち） |
| `mergePostCreateCommand()` | postCreateCommand を結合 |
| `writeJsonFile()` | JSON ファイルを書き込み |
| `loadProjectConfig()` | project-config.ts を動的に読み込み |

## scripts/ops/generate-types.ts

公式 DevContainer スキーマから TypeScript 型を生成。

```bash
bun run generate-types
```

生成先: `src/types.generated.ts`

### 再生成が必要なケース

- DevContainer 仕様に新しいプロパティが追加された時
- 型エラーが発生し、スキーマが古い可能性がある時
