---
paths: scripts/**
---

# ビルドスクリプトガイド

## scripts/build/build.ts

Self DevContainer と Client DevContainer の両方に対応した統合ビルドスクリプト。

### 使用方法

```bash
# 自動判定モード（実行ディレクトリから Self/Client を判定）
bun run build              # preset なし
bun run build node         # node preset

# 明示的指定モード（実行ディレクトリに依存しない）
bun run build:self           # Self モード
bun run build:self node      # Self モード + node preset
bun run build:client writing # Client モード + writing preset
```

### 主要な関数

| 関数 | 役割 |
|-----|------|
| `detectBuildMode()` | 実行ディレクトリから Self/Client を自動判定 |
| `buildSelf(presetName?)` | Self DevContainer のビルド |
| `buildClient(presetName)` | Client DevContainer のビルド |

### モード判定ロジック

1. `src/base.ts` が存在すれば **Self モード**
2. カレントディレクトリ名が `shared` で、親に `.devcontainer` があれば **Client モード**
3. `--mode=self` / `--mode=client` フラグで明示的に指定可能

### プリセットの追加

`PRESETS` オブジェクトに新しいエントリを追加：

```typescript
import { newPreset } from '../src/presets/new';

const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
  new: newPreset,  // 追加
};
```

### 出力先

**Self モード**:
- `.devcontainer/devcontainer.json` - Self DevContainer

**Client モード**:
- `../.devcontainer/devcontainer.json` - Client DevContainer
- `../.devcontainer/bin/` - `.devcontainer/bin/` からコピー
- `../.devcontainer/post-create.sh` - `.devcontainer/post-create.sh` からコピー

## scripts/build/lib/devcontainer-builder.ts

Self/Client 共通のユーティリティ関数を集約。

### 主要な関数

| 関数 | 役割 |
|-----|------|
| `generatePresetConfig(preset?, projectConfig?)` | base + preset + projectConfig を3層マージ |
| `mergeArrays()` | 配列を結合し重複排除 |
| `deepMerge()` | オブジェクトを再帰的にマージ |
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
