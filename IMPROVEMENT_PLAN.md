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

## 優先度：中（短期） - 一部完了

### 2. コード品質改善

#### 2.1 型安全性の向上

- [ ] **src/lib/devcontainer-builder.ts:76-78**: `isDevContainerConfig()` を改善
  - 現状: すべてのオブジェクトが DevContainerConfig として判定される
  - 提案: 必須フィールドのチェックを追加、または zod などのスキーマ検証ライブラリを導入

#### 2.2 haskell.ts のユーザー名対応

- [x] ユーザー名は `DEVCONTAINER_USER` 定数で定義済み（base.ts と同じパターン）
  - DevContainer の JSON は静的生成のため、環境変数での上書きは対象外
  - 現状の実装で問題なし

#### 2.3 コメント修正

- [x] **src/config/presets/haskell.ts**: GHC バージョンコメントを修正
  - 古い: `GHC 9.8.1（最新安定版）`
  - 新しい: `GHC 9.8.4（最新安定版）`

---

## 優先度：低（中期）

### 3. テスト追加

- [ ] テストフレームワーク導入（bun:test）
- [ ] `src/lib/devcontainer-builder.ts` のユニットテスト
  - `deepMerge()` のテスト
  - `mergeArrays()` のテスト
  - `mergeMounts()` のテスト
  - `mergePostCreateCommand()` のテスト
  - `generatePresetConfig()` のテスト
- [ ] CLI コマンドの統合テスト
- [ ] 生成される JSON のスキーマ検証テスト

### 4. CI/CD パイプライン

- [ ] GitHub Actions ワークフロー追加
  ```yaml
  # .github/workflows/ci.yml
  - bun run typecheck
  - bun run check
  - bun run build
  - bun run build:cli
  - bun test (テスト追加後)
  ```

### 5. 開発体験向上

- [ ] プリセット追加のスキャフォールドスクリプト
  ```bash
  bun run create-preset rust
  # → src/config/presets/rust.ts を生成
  # → src/config/presets/index.ts を自動更新
  ```

- [ ] postCreateCommand マージロジックのドキュメント追加
  - 現在の動作: projectConfig で指定すると上書き、未指定だとマージ
  - CLAUDE.md または .claude/rules/architecture.md に追記

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

### 2026-01-17
- 優先度：高の全タスクを完了
- 優先度：中のコメント修正を完了
- 型チェック、Lint、ビルドすべて成功確認
