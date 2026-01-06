---
paths: src/**
---

# ソースファイル編集ガイド

## base.ts の構造

`src/config/base.ts` は全プリセットの基盤となる設定を定義：

```typescript
export const base: DevContainerConfig = {
  image: 'mcr.microsoft.com/devcontainers/base:ubuntu',
  features: { ... },           // DevContainer Features
  customizations: {
    vscode: {
      extensions: [ ... ],     // VS Code 拡張機能
      settings: { ... },       // VS Code 設定
    },
  },
  containerEnv: { ... },       // コンテナ内環境変数
  remoteEnv: { ... },          // リモート接続時の環境変数
  mounts: [ ... ],             // バインドマウント設定
  postCreateCommand: '...',    // コンテナ作成後のコマンド
  remoteUser: 'dev-user',      // コンテナ内ユーザー
};
```

## プリセットの追加方法

1. `src/config/presets/` に新しいファイルを作成
2. `scripts/build/build.ts` と `src/cli/commands/init.ts` の `PRESETS` に追加
3. `bun run build` と `bun run build:cli` を実行

```typescript
// src/config/presets/rust.ts
import type { DevContainerConfig } from '../../types';

export const rustPreset: DevContainerConfig = {
  name: 'Rust Base',
  image: 'mcr.microsoft.com/devcontainers/rust:1-bullseye',
  features: {
    'ghcr.io/devcontainers/features/rust:1': { version: 'latest' },
  },
  customizations: {
    vscode: {
      extensions: ['rust-lang.rust-analyzer'],
    },
  },
};
```

## 型定義

- `src/types.ts`: カスタム型定義（編集可）
- `src/types.generated.ts`: 公式スキーマから自動生成（編集禁止）

型を更新する場合：
```bash
bun run generate-types
```

## 編集後の確認

```bash
bun run tsc --noEmit  # 型チェック
bun run build         # JSON 生成
```

ビルド成功後、以下が更新される：
- `.devcontainer/devcontainer.json`
