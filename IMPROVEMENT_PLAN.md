# 改善計画

このファイルはリポジトリの改善計画を記録しています。
各項目の完了後はチェックボックスを更新してください。

---

## 優先度：高（即座に対応） - 完了

### 1. ドキュメントと実装の整合性修正

#### 1.1 README.md の修正

- [x] **L158-183**: プリセット追加例を修正
  - 古い: `scripts/build/build.ts` と `src/cli/commands/init.ts` に追加
  - 新しい: `src/config/presets/index.ts` の `PRESETS` と `PRESET_METADATA` に追加

- [x] **L164-183**: コード例で `node`, `python`, `fullstack`, `writing` を `bun`, `haskell` に変更

- [x] **L228-233**: プリセット選択ガイドを実装に合わせて更新

- [x] **L445**: `src/presets/` → `src/config/presets/` に修正

- [x] **L353**: setup-claude-plugins のプラグインリストを更新
  - 追加: `decision-support`, `bash-safety`

#### 1.2 COMMANDS.md の修正

- [x] **L50**: `bun run build:self node` の例を `bun run build:self bun` に修正

- [x] **L154**: 古いパス `.devcontainer/shared/src/presets/` を削除
  - 代替: `npx @niroe5tar64/devcontainer list-presets` を使用

- [x] **L209-216**: プリセット選択ガイドを実装に合わせて更新

#### 1.3 .claude/rules/ の修正

- [x] **scripts.md**: PRESETS の追加手順を更新、プリセット例を修正

- [x] **src.md L17**: プリセット追加手順を修正

---

## 優先度：中（短期） - 完了

### 2. コード品質改善

#### 2.1 型安全性の向上

- [x] **src/cli/commands/init.ts**: `isDevContainerConfig()` を改善
  - 配列チェックを追加
  - 既知の DevContainer フィールドの検証を追加
  - 認識されないフィールドのみの場合は警告を出力

#### 2.2 haskell.ts のユーザー名対応

- [x] ユーザー名は `DEVCONTAINER_USER` 定数で定義済み（base.ts と同じパターン）
  - DevContainer の JSON は静的生成のため、環境変数での上書きは対象外
  - 現状の実装で問題なし

#### 2.3 コメント修正

- [x] **src/config/presets/haskell.ts**: GHC バージョンコメントを修正
  - 古い: `GHC 9.8.1（最新安定版）`
  - 新しい: `GHC 9.8.4（最新安定版）`

#### 2.4 postCreateCommand マージロジックのドキュメント

- [x] **.claude/rules/architecture.md**: 詳細なマージ動作の説明を追加
  - project-config で指定しない場合: base + preset を `&&` で結合
  - project-config で指定した場合: 完全に上書き

---

## 優先度：低（中期） - 一部完了

### 3. テスト追加

- [x] テストフレームワーク導入（bun:test）
- [x] `src/lib/devcontainer-builder.ts` のユニットテスト
  - [x] `deepMerge()` のテスト
  - [x] `mergeArrays()` のテスト
  - [x] `mergeMounts()` のテスト
  - [x] `mergePostCreateCommand()` のテスト
  - [x] `generatePresetConfig()` のテスト
  - [x] `getVSCodeCustomizations()` のテスト
  - [x] `getPostCreateCommand()` のテスト
- [ ] CLI コマンドの統合テスト
- [ ] 生成される JSON のスキーマ検証テスト

### 4. CI/CD パイプライン

- [x] GitHub Actions ワークフロー追加
  - `.github/workflows/ci.yml` を作成
  - 型チェック、Lint、ビルド、生成ファイル検証を実行

### 5. 開発体験向上

- [ ] プリセット追加のスキャフォールドスクリプト
  ```bash
  bun run create-preset rust
  # → src/config/presets/rust.ts を生成
  # → src/config/presets/index.ts を自動更新
  ```

---

## 完了チェックリスト

実行前に以下を確認:
- [x] 変更後 `bun run typecheck` が通る
- [x] 変更後 `bun run check` が通る
- [x] 変更後 `bun run build` が成功する
- [x] 変更後 `bun run build:cli` が成功する

---

## 実行コマンド

```bash
# 型チェック
bun run typecheck

# Lint/Format
bun run check

# ビルド確認
bun run build && bun run build:cli

# 変更差分確認
git diff
```

---

## 備考

- 作成日: 2026-01-17
- 最終更新: 2026-01-17
- このファイルは改善完了後に削除可能

## 変更履歴

### 2026-01-17 (3回目)
- テスト環境を整備
  - `bun:test` でテストフレームワーク導入
  - `tests/lib/devcontainer-builder.test.ts` でユニットテスト追加（40 テスト）
  - CI ワークフローにテストステップを追加
  - `package.json` に `test`, `test:watch` スクリプト追加
  - `validate` スクリプトにテストを追加

### 2026-01-17 (2回目)
- CI/CD パイプライン（`.github/workflows/ci.yml`）を追加
- 型安全性の向上（`isDevContainerConfig()` の改善）
- postCreateCommand マージロジックのドキュメントを追加
- CLI のプリセット説明を更新

### 2026-01-17 (1回目)
- 優先度：高の全タスクを完了
- 優先度：中のコメント修正を完了
- 型チェック、Lint、ビルドすべて成功確認
