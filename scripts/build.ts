#!/usr/bin/env bun

/**
 * Build Script for Self DevContainer Configuration
 *
 * TypeScript の設定ファイルから JSON を生成します。
 * - Self DevContainer: このプロジェクト自身の開発環境
 * - dist/: サブモジュール配布用のファイル
 */

import { mkdir, copyFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { base } from '../src/base';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import { writingPreset } from '../src/presets/writing';
import { projectConfig, projectConfigMetadata } from '../.devcontainer/project-config';
import type { DevContainerConfig } from '../src/types';
import {
  SCHEMA_URL,
  generatePresetConfig,
  writeJsonFile,
} from './lib/devcontainer-builder';

/**
 * dist/base.json を生成（サブモジュールとして配布する用）
 */
function generateBaseConfig(): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    name: 'Base Configuration',
    ...base,
  };
}

/**
 * .devcontainer/devcontainer.json を生成（Self DevContainer用）
 *
 * base + (preset) + projectConfig をマージ
 * preset は現在使用していないが、将来的に追加可能
 */
function generateDevContainerConfig(): DevContainerConfig {
  const preset = undefined; // 現在はプリセット未使用（将来的に nodePreset などを指定可能）

  // base + preset + projectConfig を3層マージ
  const config = generatePresetConfig(preset, projectConfig);

  // メタデータを追加
  return {
    ...projectConfigMetadata, // $comment などのメタデータ
    ...config,
  };
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔨 Building Self DevContainer configuration...\n');

  // dist ディレクトリを作成
  await mkdir('dist', { recursive: true });
  await mkdir(join('dist', 'presets'), { recursive: true });

  // base.json を生成（サブモジュール配布用）
  const baseConfig = generateBaseConfig();
  await writeJsonFile(join('dist', 'base.json'), baseConfig);

  // .devcontainer/devcontainer.json を生成（Self DevContainer用）
  await mkdir('.devcontainer', { recursive: true });
  const devContainerConfig = generateDevContainerConfig();
  await writeJsonFile(join('.devcontainer', 'devcontainer.json'), devContainerConfig);

  // プリセットを生成（サブモジュール配布用）
  const presets = [
    { name: 'node', config: nodePreset },
    { name: 'python', config: pythonPreset },
    { name: 'fullstack', config: fullstackPreset },
    { name: 'writing', config: writingPreset },
  ];

  for (const { name, config } of presets) {
    // プリセットは projectConfig なしで生成（Client側で読み込むため）
    const presetConfig = generatePresetConfig(config);
    await writeJsonFile(join('dist', 'presets', `${name}.json`), presetConfig);
  }

  // bin/ と post-create.sh を dist/ にコピー（サブモジュール配布用）
  console.log('\n📦 Copying additional files...');
  await mkdir(join('dist', 'bin'), { recursive: true });
  await cp(join('.devcontainer', 'bin'), join('dist', 'bin'), { recursive: true });
  await copyFile(join('.devcontainer', 'post-create.sh'), join('dist', 'post-create.sh'));
  console.log('✅ Copied: dist/bin/');
  console.log('✅ Copied: dist/post-create.sh');

  console.log('\n✨ Build complete!');
}

main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
