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

### 型エラー修正（完了）

`scripts/build.ts` の型エラーを解決済み（コミット: 8f65e5c）

---

## 現在の状態（セッション引継ぎ用）

### 完了済み

1. **CLAUDE.md + rules 整備** (09d5084)
   - CLAUDE.md を軽量化
   - `.claude/rules/` に詳細ドキュメントを分離

2. **ユーザー名の変数化** (5514154)
   - `DEVCONTAINER_USER` 環境変数で動的設定可能
   - `src/base.ts`, `.devcontainer/bin/claude` を修正

3. **型エラー修正** (8f65e5c)
   - `scripts/build.ts` のヘルパー関数追加

4. **remoteEnv PATH設定の修正** (5785110)
   - `${containerEnv:HOME}` が未定義で空文字列になっていた問題を修正
   - `/home/${DEVCONTAINER_USER}` を明示的に指定
   - これにより `~/.local/bin` のラッパースクリプトが正しく優先される

### 動作確認コマンド

```bash
bun run tsc --noEmit   # 型チェック（エラーなし）
bun run build          # ビルド（正常動作）

# カスタムユーザーでビルド
DEVCONTAINER_USER=myuser bun run build
```

### 未コミットの変更

なし（すべてコミット済み）

### 今後の検討事項

- ラッパースクリプトの配布方法（ディレクトリ構成の見直し）
- プリセットのラインナップ見直し

---

## PATH問題の詳細記録（5785110）

### 発生していた問題

claudeラッパースクリプトが `--dangerously-skip-permissions` オプション付きで実行されない。

### 根本原因

1. **remoteEnvでの変数展開エラー**
   ```typescript
   // 修正前
   remoteEnv: {
     PATH: '${containerEnv:HOME}/.local/bin:...'
   }
   ```
   - `${containerEnv:HOME}` が未定義のため空文字列に展開
   - 結果: `/.local/bin` という不正なパスが生成

2. **PATHの優先順位**
   ```
   実際のPATH:
   /.local/bin:/.bun/bin:/usr/local/share/nvm/.../bin:.../home/dev-user/.local/bin

   問題:
   - npm の claude が優先（/usr/local/share/nvm/versions/node/v24.12.0/bin）
   - ラッパースクリプト（/home/dev-user/.local/bin）は最後
   ```

3. **DevContainer再ビルドでも解決しない理由**
   - ソースの設定自体が間違っていたため

### 解決策

```typescript
// 修正後（src/base.ts L95）
remoteEnv: {
  PATH: `/home/${DEVCONTAINER_USER}/.local/bin:/home/${DEVCONTAINER_USER}/.bun/bin:\${containerEnv:PATH}`,
}
```

- `${containerEnv:HOME}` → `/home/${DEVCONTAINER_USER}` に変更
- ビルド時に正しいパスが生成される
- DevContainer再ビルド後、ラッパースクリプトが優先される

### 動作確認方法

DevContainer再ビルド後：
```bash
which claude
# 期待値: /home/dev-user/.local/bin/claude

claude --version
# ラッパー経由で --dangerously-skip-permissions が付与される
```

