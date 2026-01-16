#!/usr/bin/env bun

/**
 * Build Script for Self DevContainer Configuration
 *
 * このリポジトリ自身の DevContainer 設定を生成するビルドスクリプト
 *
 * Usage:
 *   bun run build              # base のみ
 *   bun run build node         # node preset を使用
 *   bun run build:self         # explicit Self モード
 *   bun run build:self node    # Self モード + node preset
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PRESETS } from '../../src/config/presets/index';
import { generatePresetConfig, writeJsonFile } from '../../src/lib/devcontainer-builder';
import type { DevContainerConfig } from '../../src/types';

/**
 * Self DevContainer のビルド
 */
async function buildSelf(presetName?: string) {
  console.log('🔨 Building Self DevContainer configuration...\n');

  // preset を取得
  let preset: DevContainerConfig | undefined;
  if (presetName) {
    preset = PRESETS[presetName];
    if (!preset) {
      console.error(`❌ Error: Unknown preset "${presetName}"`);
      console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
      process.exit(1);
    }
    console.log(`📦 Using preset: ${presetName}`);
  }

  // project-config を読み込み
  const projectConfigModule = await import('../../.devcontainer/project-config');
  const projectConfig = projectConfigModule.projectConfig;
  const projectConfigMetadata = projectConfigModule.projectConfigMetadata;

  // .devcontainer/devcontainer.json を生成（Self DevContainer用）
  await mkdir('.devcontainer', { recursive: true });
  const config = generatePresetConfig(preset, projectConfig);
  const devContainerConfig = {
    ...projectConfigMetadata, // $comment などのメタデータ
    ...config,
  };
  await writeJsonFile(join('.devcontainer', 'devcontainer.json'), devContainerConfig);

  console.log('\n✨ Build complete!');
}

/**
 * メイン処理
 */
async function main() {
  // コマンドライン引数から preset 名を取得
  const args = process.argv.slice(2);
  const presetName = args[0];

  console.log('🔧 Build mode: self (Self DevContainer)');

  // Self DevContainer をビルド
  await buildSelf(presetName);
}

main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
