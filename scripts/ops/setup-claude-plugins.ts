#!/usr/bin/env bun

/**
 * Claude Code プラグインセットアップスクリプト
 *
 * 推奨される Claude Code プラグインをユーザースコープで自動的にセットアップします。
 *
 * 使い方:
 *   bun run setup-claude-plugins
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { $ } from 'bun';

// 色の定義
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
} as const;

// ログ関数
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  skip: (msg: string) => console.log(`${colors.cyan}○${colors.reset} ${msg}`),
};

// 設定
const MARKETPLACE_SOURCE = 'niroe5tar64/niro-agent-plugins';
const MARKETPLACE_NAME = 'niro-agent-plugins';
const SETTINGS_FILE = join(homedir(), '.claude', 'settings.json');

const PLUGINS = ['git-ops', 'decision-support', 'statusline', 'bash-safety'] as const;

// Claude CLI が利用可能かチェック
async function checkClaudeCli(): Promise<boolean> {
  try {
    await $`which claude`.quiet();
    return true;
  } catch {
    return false;
  }
}

// マーケットプレイスが既に追加されているかチェック
async function isMarketplaceAdded(name: string): Promise<boolean> {
  try {
    const result = await $`claude plugin marketplace list`.quiet().text();
    return result.includes(name);
  } catch {
    return false;
  }
}

// プラグインが既にインストールされているかチェック
function isPluginInstalled(pluginName: string): boolean {
  if (!existsSync(SETTINGS_FILE)) {
    return false;
  }

  try {
    const content = readFileSync(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(content);
    return settings.enabledPlugins && pluginName in settings.enabledPlugins;
  } catch {
    return false;
  }
}

// メイン処理
async function main(): Promise<void> {
  // Claude CLI チェック
  if (!(await checkClaudeCli())) {
    log.error('claude コマンドが見つかりません');
    console.log('Claude Code CLI がインストールされているか確認してください');
    process.exit(1);
  }

  log.info('Claude Code プラグインのセットアップを開始します');
  console.log();

  // ステップ 1: マーケットプレイスの追加
  log.info('ステップ 1/2: マーケットプレイスを確認しています...');

  if (await isMarketplaceAdded(MARKETPLACE_NAME)) {
    log.skip(`マーケットプレイス '${MARKETPLACE_NAME}' は既に追加済みです`);
  } else {
    try {
      await $`claude plugin marketplace add ${MARKETPLACE_SOURCE}`;
      log.success(`マーケットプレイス '${MARKETPLACE_NAME}' を追加しました`);
    } catch {
      log.error('マーケットプレイスの追加に失敗しました');
      process.exit(1);
    }
  }
  console.log();

  // ステップ 2: プラグインのインストール
  log.info('ステップ 2/2: プラグインをインストールしています...');
  console.log();

  let installedCount = 0;
  let skippedCount = 0;
  const failedPlugins: string[] = [];

  for (const plugin of PLUGINS) {
    const pluginFullName = `${plugin}@${MARKETPLACE_NAME}`;

    if (isPluginInstalled(pluginFullName)) {
      log.skip(`  ${pluginFullName} は既にインストール済みです`);
      skippedCount++;
    } else {
      log.info(`  ${pluginFullName} をインストール中...`);
      try {
        await $`claude plugin install ${pluginFullName} --scope user`;
        log.success(`  ${pluginFullName} をインストールしました`);
        installedCount++;
      } catch {
        log.warning(`  ${pluginFullName} のインストールに失敗しました`);
        failedPlugins.push(pluginFullName);
      }
    }
  }

  console.log();

  // 結果サマリー
  if (failedPlugins.length === 0) {
    if (installedCount === 0 && skippedCount > 0) {
      log.success('すべてのプラグインは既にインストール済みです');
    } else if (installedCount > 0) {
      log.success(
        `セットアップが完了しました（新規: ${installedCount}, スキップ: ${skippedCount}）`,
      );
    } else {
      log.success('セットアップが完了しました');
    }
  } else {
    log.warning('一部のプラグインのインストールに失敗しました:');
    for (const failed of failedPlugins) {
      console.log(`  - ${failed}`);
    }
  }

  console.log();
  log.info('プラグインの有効化状態を確認するには:');
  console.log('  cat ~/.claude/settings.json');
  console.log();
}

main();
