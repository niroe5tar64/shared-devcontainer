# 作業計画: base.ts と ラッパースクリプトの柔軟化

## 目標

PCが変わったり、適用先プロジェクトが多岐に渡っても柔軟に対応できるようにする。
ユーザー名を環境変数で動的に設定可能にする（Cレベル）。

---

## 現状の問題点

### 1. src/base.ts のハードコード

| 箇所 | 問題 |
|-----|------|
| L29 `username: 'dev-user'` | common-utils のユーザー名固定 |
| L92-96 `mounts` | `/home/dev-user` がハードコード |
| L106 `remoteUser` | `'dev-user'` 固定 |

### 2. .devcontainer/bin/claude の問題

```bash
find /home/dev-user/.vscode-server/extensions ...
```

- ユーザー名 `dev-user` がハードコード
- `$HOME` を使うべき

### 3. .devcontainer/bin/codex

- 現状は動作しているが、変更時にバグが入りやすい

---

## 修正方針

### 方針A: base.ts での変数化（Cレベル対応）

```typescript
// ビルド時に環境変数を読み取り、デフォルトは 'dev-user'
const DEVCONTAINER_USER = process.env.DEVCONTAINER_USER || 'dev-user';
```

これにより：
- `bun run build` 時にデフォルトで `dev-user` を使用
- `DEVCONTAINER_USER=myuser bun run build` で別ユーザーを指定可能

### 方針B: ラッパースクリプトの修正

```bash
# Before
find /home/dev-user/.vscode-server/extensions ...

# After
find "$HOME/.vscode-server/extensions" ...
```

`$HOME` はシェル実行時に動的に解決されるため、ユーザー非依存になる。

---

## 注意点

### ラッパースクリプト修正時のバグ回避

1. **変数のクォート**: `"$HOME"` のようにダブルクォートで囲む
2. **オプション位置**: `exec "$real" --option "$@"` の順序を維持
3. **テスト**: 修正後に実際にコマンドを実行して確認

### DevContainer 変数の制約

- `mounts` の `target` には `${containerEnv:HOME}` は使えない
  - コンテナ起動前に評価されるため
- TypeScript 側で文字列を構築して解決

---

## 作業ログ

### 完了した作業

- [x] 問題点の洗い出し
- [x] base.ts のユーザー名変数化
  - `DEVCONTAINER_USER` 環境変数で上書き可能に
  - `mounts`, `remoteUser`, `common-utils.username` を変数化
- [x] bin/claude の修正
  - `/home/dev-user` → `$HOME` に変更
- [x] bin/codex の確認
  - ハードコードなし、修正不要
- [x] ビルド・動作確認
  - デフォルト（dev-user）で正常動作
  - `DEVCONTAINER_USER=testuser bun run build` で動的変更確認済み

### 残存する型エラー（既存問題）

`scripts/build.ts` に型エラーあり（今回の修正とは無関係）。
ビルド自体は正常に動作する。

