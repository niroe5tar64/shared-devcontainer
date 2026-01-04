#!/usr/bin/env bash
#
# Claude Code プラグインセットアップスクリプト
#
# このスクリプトは、推奨される Claude Code プラグインを
# ユーザースコープで自動的にセットアップします。
#
# 使い方:
#   bash scripts/setup-claude-plugins.sh
#

set -e  # エラーが発生したら即座に終了

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプメッセージ
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Claude CLI が利用可能かチェック
if ! command -v claude &> /dev/null; then
    print_error "claude コマンドが見つかりません"
    echo "Claude Code CLI がインストールされているか確認してください"
    exit 1
fi

print_info "Claude Code プラグインのセットアップを開始します"
echo ""

# 1. マーケットプレイスの追加
print_info "ステップ 1/2: マーケットプレイスを追加しています..."
if claude plugin marketplace add niroe5tar64/niro-agent-plugins; then
    print_success "マーケットプレイス 'niroe5tar64/niro-agent-plugins' を追加しました"
else
    print_warning "マーケットプレイスの追加に失敗しました（既に追加済みの可能性があります）"
fi
echo ""

# 2. 各プラグインをユーザースコープで追加
print_info "ステップ 2/2: プラグインをインストールしています..."
echo ""

PLUGINS=(
    "git-ops"
    "decision-support"
    "statusline"
    "bash-safety"
)

MARKETPLACE="niro-agent-plugins"
FAILED_PLUGINS=()

for plugin in "${PLUGINS[@]}"; do
    print_info "  ${plugin}@${MARKETPLACE} をインストール中..."
    if claude plugin install "${plugin}@${MARKETPLACE}" --scope user; then
        print_success "  ${plugin}@${MARKETPLACE} をインストールしました"
    else
        print_warning "  ${plugin}@${MARKETPLACE} のインストールに失敗しました"
        FAILED_PLUGINS+=("${plugin}@${MARKETPLACE}")
    fi
done

echo ""

if [ ${#FAILED_PLUGINS[@]} -eq 0 ]; then
    print_success "すべてのプラグインのセットアップが完了しました！"
else
    print_warning "一部のプラグインのインストールに失敗しました:"
    for failed_plugin in "${FAILED_PLUGINS[@]}"; do
        echo "  - ${failed_plugin}"
    done
fi

echo ""
print_info "プラグインの有効化状態を確認するには:"
echo "  cat ~/.claude/settings.json"
echo ""
print_info "インストール済みプラグインの詳細確認："
echo "  cat ~/.claude/settings.json | jq '.enabledPlugins' 2>/dev/null || cat ~/.claude/settings.json"
echo ""
