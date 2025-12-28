---
paths: scripts/**
---

# ビルドスクリプトガイド

## scripts/build.ts

TypeScript 設定から JSON を生成するメインスクリプト。

### 主要な関数

| 関数 | 役割 |
|-----|------|
| `generateBaseConfig()` | `dist/base.json` 用の設定を生成 |
| `generateDevContainerConfig()` | `.devcontainer/devcontainer.json` 用の設定を生成 |
| `generatePresetConfig(preset)` | プリセット用の設定を base とマージして生成 |
| `mergeArrays()` | 配列を結合し重複排除 |
| `deepMerge()` | オブジェクトを再帰的にマージ |
| `mergePostCreateCommand()` | postCreateCommand を `&&` で結合 |

### プリセットの追加

`presets` 配列に新しいエントリを追加：

```typescript
import { newPreset } from '../src/presets/new';

const presets = [
  { name: 'node', config: nodePreset },
  { name: 'python', config: pythonPreset },
  { name: 'fullstack', config: fullstackPreset },
  { name: 'new', config: newPreset },  // 追加
];
```

### 出力先

- `dist/base.json` - サブモジュール配布用
- `dist/presets/*.json` - プリセット別設定
- `.devcontainer/devcontainer.json` - このリポジトリ自体の開発環境
- `dist/bin/` - `.devcontainer/bin/` からコピー
- `dist/post-create.sh` - `.devcontainer/post-create.sh` からコピー

## scripts/generate-types.ts

公式 DevContainer スキーマから TypeScript 型を生成。

```bash
bun run generate-types
```

生成先: `src/types.generated.ts`

### 再生成が必要なケース

- DevContainer 仕様に新しいプロパティが追加された時
- 型エラーが発生し、スキーマが古い可能性がある時
