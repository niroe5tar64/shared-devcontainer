#!/usr/bin/env bun

/**
 * Build Script for Client DevContainer Configuration
 *
 * サブモジュールとして配置された状態で実行し、
 * 親プロジェクトの .devcontainer/ に完全な設定を生成します。
 *
 * Usage:
 *   cd .devcontainer/shared
 *   bun run build:client <preset-name>
 *
 * Example:
 *   bun run build:client writing
 */

import { mkdir, copyFile, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import { writingPreset } from '../src/presets/writing';
import type { DevContainerConfig } from '../src/types';
import {
  generatePresetConfig,
  writeJsonFile,
  loadProjectConfig,
  getPostCreateCommand,
} from './lib/devcontainer-builder';

/**
 * メイン処理
 */
async function main() {
  const presetName = process.argv[2];

  if (!presetName) {
    console.error('❌ Error: Preset name is required');
    console.error('Usage: bun run build:client <preset-name>');
    console.error('Example: bun run build:client writing');
    process.exit(1);
  }

  // プリセットマップ
  const presets: Record<string, DevContainerConfig> = {
    node: nodePreset,
    python: pythonPreset,
    fullstack: fullstackPreset,
    writing: writingPreset,
  };

  const preset = presets[presetName];
  if (!preset) {
    console.error(`❌ Error: Unknown preset "${presetName}"`);
    console.error(`Available presets: ${Object.keys(presets).join(', ')}`);
    process.exit(1);
  }

  console.log(`🔨 Building Client DevContainer configuration (preset: ${presetName})...\n`);

  // 親プロジェクトのパスを計算
  // このスクリプトは .devcontainer/shared/ で実行される想定
  // PWD環境変数を使用してシンボリックリンクを辿らないパスを取得
  const cwd = process.env.PWD || process.cwd();
  const clientDevcontainerDir = resolve(cwd, '..');

  console.log(`📂 Current directory: ${cwd}`);
  console.log(`📂 Target directory: ${clientDevcontainerDir}`);

  // プロジェクト固有の設定を読み込み（存在する場合）
  const projectConfig = await loadProjectConfig(clientDevcontainerDir);

  // base + preset + projectConfig を3層マージして設定を生成
  const config = generatePresetConfig(preset, projectConfig);

  // postCreateCommand のパスを調整
  // 生成された設定は "bash ./post-create.sh" なので、これを .devcontainer/ からの相対パスに
  const postCreateCmd = getPostCreateCommand(config);
  if (postCreateCmd) {
    config.postCreateCommand = 'bash .devcontainer/post-create.sh';
  }

  // devcontainer.json を生成
  await mkdir(clientDevcontainerDir, { recursive: true });
  await writeJsonFile(join(clientDevcontainerDir, 'devcontainer.json'), config);

  // bin/ と post-create.sh をコピー
  console.log('\n📦 Copying additional files...');
  // distDir は shared-devcontainer/dist/
  const distDir = resolve(cwd, 'dist');

  await mkdir(join(clientDevcontainerDir, 'bin'), { recursive: true });
  await cp(join(distDir, 'bin'), join(clientDevcontainerDir, 'bin'), { recursive: true });
  console.log(`✅ Copied: ${join(clientDevcontainerDir, 'bin')}`);

  await copyFile(join(distDir, 'post-create.sh'), join(clientDevcontainerDir, 'post-create.sh'));
  console.log(`✅ Copied: ${join(clientDevcontainerDir, 'post-create.sh')}`);

  console.log('\n✨ Client DevContainer configuration generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Return to your project root directory');
  console.log('   2. Open in VS Code');
  console.log('   3. Dev Containers: Reopen in Container');
}

main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
