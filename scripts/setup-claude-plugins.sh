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
CYAN='\033[0;36m'
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

print_skip() {
    echo -e "${CYAN}○${NC} $1"
}

# Claude CLI が利用可能かチェック
if ! command -v claude &> /dev/null; then
    print_error "claude コマンドが見つかりません"
    echo "Claude Code CLI がインストールされているか確認してください"
    exit 1
fi

# 設定ファイルのパス
SETTINGS_FILE="$HOME/.claude/settings.json"

# マーケットプレイスが既に追加されているかチェック
is_marketplace_added() {
    local marketplace_name="$1"
    if claude plugin marketplace list 2>/dev/null | grep -q "${marketplace_name}"; then
        return 0
    fi
    return 1
}

# プラグインが既にインストールされているかチェック
is_plugin_installed() {
    local plugin_name="$1"
    if [ -f "$SETTINGS_FILE" ]; then
        if grep -q "\"${plugin_name}\"" "$SETTINGS_FILE" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

print_info "Claude Code プラグインのセットアップを開始します"
echo ""

# 1. マーケットプレイスの追加
MARKETPLACE_SOURCE="niroe5tar64/niro-agent-plugins"
MARKETPLACE_NAME="niro-agent-plugins"

print_info "ステップ 1/2: マーケットプレイスを確認しています..."

if is_marketplace_added "$MARKETPLACE_NAME"; then
    print_skip "マーケットプレイス '${MARKETPLACE_NAME}' は既に追加済みです"
else
    if claude plugin marketplace add "$MARKETPLACE_SOURCE"; then
        print_success "マーケットプレイス '${MARKETPLACE_NAME}' を追加しました"
    else
        print_error "マーケットプレイスの追加に失敗しました"
        exit 1
    fi
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

INSTALLED_COUNT=0
SKIPPED_COUNT=0
FAILED_PLUGINS=()

for plugin in "${PLUGINS[@]}"; do
    plugin_full_name="${plugin}@${MARKETPLACE_NAME}"

    if is_plugin_installed "$plugin_full_name"; then
        print_skip "  ${plugin_full_name} は既にインストール済みです"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    else
        print_info "  ${plugin_full_name} をインストール中..."
        if claude plugin install "${plugin_full_name}" --scope user; then
            print_success "  ${plugin_full_name} をインストールしました"
            INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
        else
            print_warning "  ${plugin_full_name} のインストールに失敗しました"
            FAILED_PLUGINS+=("${plugin_full_name}")
        fi
    fi
done

echo ""

# 結果サマリー
if [ ${#FAILED_PLUGINS[@]} -eq 0 ]; then
    if [ $INSTALLED_COUNT -eq 0 ] && [ $SKIPPED_COUNT -gt 0 ]; then
        print_success "すべてのプラグインは既にインストール済みです"
    elif [ $INSTALLED_COUNT -gt 0 ]; then
        print_success "セットアップが完了しました（新規: ${INSTALLED_COUNT}, スキップ: ${SKIPPED_COUNT}）"
    else
        print_success "セットアップが完了しました"
    fi
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
