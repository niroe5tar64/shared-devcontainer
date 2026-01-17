---
paths: scripts/**
---

# ビルドスクリプトガイド

## scripts/build/build.ts

このリポジトリ自身の Self DevContainer 設定を生成するビルドスクリプト。

### 使用方法

```bash
bun run build              # preset なし（base のみ）
bun run build bun          # bun preset を使用
bun run build:self         # 明示的に Self モード
bun run build:self bun     # Self モード + bun preset
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
  bun: bunPreset,
  haskell: haskellPreset,
  new: newPreset,  // 追加
};

export const PRESET_METADATA: Record<string, { name: string; description: string }> = {
  bun: { name: 'Bun', description: 'Bun development environment' },
  haskell: { name: 'Haskell', description: 'Haskell development environment with GHC, Cabal, Stack, and HLS' },
  new: { name: 'New', description: 'New preset description' },  // 追加
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
