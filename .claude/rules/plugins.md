---
paths: .claude/**
---

# Claude Code プラグインガイド

## 基本方針

**Claude Code プラグインはユーザースコープ (`~/.claude/settings.json`) での追加を推奨**

## スコープの使い分け

| スコープ | 設定ファイル | Git管理 | 推奨度 | 用途 |
|---------|-------------|---------|--------|------|
| **User** | `~/.claude/settings.json` | なし | ⭐️ **推奨** | 全プロジェクト共通の個人設定 |
| **Local** | `.claude/settings.local.json` | なし | ⚠️ 非推奨 | プラグイン管理ファイルと干渉の可能性 |
| **Project** | `.claude/settings.json` | あり | ❌ 避ける | Git管理で不整合が生じる |

## ユーザースコープを推奨する理由

1. **DevContainer 再作成時の干渉を回避**
   - `~/.claude/` 配下のプラグイン管理ファイルとローカル/プロジェクトスコープの設定が干渉しない
   - DevContainer を作り直しても設定が安定して維持される

2. **Git 管理による不整合を回避**
   - プロジェクトスコープ (`.claude/settings.json`) は Git 管理されるため、チームメンバー間で不整合が生じる
   - 個人のプラグイン設定をリポジトリに含めるべきではない

3. **複数プロジェクト間での一貫性**
   - 一度設定すれば、すべての DevContainer プロジェクトで同じプラグインが利用可能
   - プロジェクトごとに設定を繰り返す必要がない

## プラグインの追加

```bash
# マーケットプレースを追加（ユーザースコープ）
claude plugin marketplace add <marketplace-name>

# プラグイン一覧を確認
claude plugin list
```

## 設定ファイルの記述

### enabledPlugins

`~/.claude/settings.json` (ユーザースコープ - 推奨):

```json
{
  "enabledPlugins": {
    "statusline@niro-agent-plugins": true,
    "git-ops@niro-agent-plugins": true
  }
}
```

### statusLine.command

環境変数 `$HOME` を使用してパスを指定します。

`~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "$HOME/.claude/plugins/cache/marketplace-name/plugin-name/version/scripts/script.sh"
  }
}
```

**NG例** (ユーザー名固定):
```json
"command": "/home/dev-user/.claude/plugins/..."  // 環境依存のため非推奨（自動生成されたパスは例外）
```

**OK例** (環境変数使用):
```json
"command": "$HOME/.claude/plugins/..."  // 推奨
```

## 特殊なケース: チーム共有プラグイン

⚠️ **注意**: 基本的にはユーザースコープを使用してください。プロジェクトスコープは以下のリスクがあるため避けることを推奨します：

- Git 管理によるメンバー間の設定不整合
- DevContainer 再作成時のプラグイン管理ファイルとの干渉

**代替案**: README にプラグインのインストール手順を記載し、各メンバーがユーザースコープで個別に設定する方法を推奨します。

## トラブルシューティング

### プラグインが動作しない

```bash
# プラグインの状態確認
claude plugin list

# キャッシュクリア
rm -rf ~/.claude/plugins/cache
```

### パスが見つからない

- `$HOME` が正しく展開されているか確認
- シェルスクリプトの実行権限を確認: `chmod +x script.sh`

## 参考

詳細は `README.md` の「Claude Code プラグインの管理」セクションを参照。
