#!/usr/bin/env bun

/**
 * Unified Build Script for DevContainer Configurations
 *
 * Self DevContainer と Client DevContainer の両方に対応した統合ビルドスクリプト
 *
 * Usage:
 *   # 自動判定モード（実行ディレクトリから Self/Client を判定）
 *   bun run build              # Self: preset なし / Client: エラー（preset 必須）
 *   bun run build node         # Self: node preset / Client: node preset
 *
 *   # 明示的指定モード（実行ディレクトリに依存しない）
 *   bun run build --mode=self           # Self: preset なし
 *   bun run build --mode=self node      # Self: node preset
 *   bun run build --mode=client writing # Client: writing preset
 *
 *   # package.json の npm scripts 経由（推奨）
 *   bun run build              # 自動判定
 *   bun run build:self         # Self モード
 *   bun run build:self node    # Self モード + node preset
 *   bun run build:client writing # Client モード + writing preset
 */

import { mkdir, copyFile, cp } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { base } from '../src/base';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import { writingPreset } from '../src/presets/writing';
import type { DevContainerConfig } from '../src/types';
import {
  SCHEMA_URL,
  generatePresetConfig,
  writeJsonFile,
  loadProjectConfig,
  getPostCreateCommand,
} from './lib/devcontainer-builder';

/**
 * プリセットマップ（Self/Client 共通）
 */
const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
};

/**
 * ビルドモード
 */
type BuildMode = 'self' | 'client';

/**
 * ビルドモードを判定
 * 実行ディレクトリから Self/Client を自動判別
 */
async function detectBuildMode(): Promise<BuildMode> {
  const cwd = process.cwd();

  // src/base.ts が存在すれば Self モード
  if (existsSync(join(cwd, 'src', 'base.ts'))) {
    return 'self';
  }

  // 親ディレクトリに .devcontainer が存在し、カレントが shared なら Client モード
  const parentDir = resolve(cwd, '..');
  const parentDirName = basename(cwd);
  if (parentDirName === 'shared' && existsSync(join(parentDir, '.devcontainer'))) {
    return 'client';
  }

  // デフォルトは Self
  return 'self';
}

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
 * Self DevContainer のビルド
 */
async function buildSelf(presetName?: string) {
  console.log('🔨 Building Self DevContainer configuration...\n');

  // preset を取得
  let preset: DevContainerConfig | undefined = undefined;
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
  const projectConfigModule = await import('../.devcontainer/project-config');
  const projectConfig = projectConfigModule.projectConfig;
  const projectConfigMetadata = projectConfigModule.projectConfigMetadata;

  // dist ディレクトリを作成
  await mkdir('dist', { recursive: true });
  await mkdir(join('dist', 'presets'), { recursive: true });

  // base.json を生成（サブモジュール配布用）
  const baseConfig = generateBaseConfig();
  await writeJsonFile(join('dist', 'base.json'), baseConfig);

  // .devcontainer/devcontainer.json を生成（Self DevContainer用）
  await mkdir('.devcontainer', { recursive: true });
  const config = generatePresetConfig(preset, projectConfig);
  const devContainerConfig = {
    ...projectConfigMetadata, // $comment などのメタデータ
    ...config,
  };
  await writeJsonFile(join('.devcontainer', 'devcontainer.json'), devContainerConfig);

  // プリセットを生成（サブモジュール配布用）
  for (const [name, config] of Object.entries(PRESETS)) {
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

/**
 * Client DevContainer のビルド
 */
async function buildClient(presetName: string) {
  console.log(`🔨 Building Client DevContainer configuration (preset: ${presetName})...\n`);

  // preset を取得
  const preset = PRESETS[presetName];
  if (!preset) {
    console.error(`❌ Error: Unknown preset "${presetName}"`);
    console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

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

/**
 * メイン処理
 */
async function main() {
  // コマンドライン引数から --mode フラグを解析
  const args = process.argv.slice(2);
  const modeIndex = args.findIndex(arg => arg.startsWith('--mode='));

  let mode: BuildMode;
  if (modeIndex !== -1) {
    // --mode フラグが指定されている場合（明示的指定）
    const modeValue = args[modeIndex].split('=')[1] as BuildMode;
    if (modeValue !== 'self' && modeValue !== 'client') {
      console.error(`❌ Error: Invalid mode "${modeValue}"`);
      console.error('Valid modes: self, client');
      process.exit(1);
    }
    mode = modeValue;
    console.log(`🔧 Build mode: ${mode} (explicitly specified)`);
    // --mode フラグを除去
    args.splice(modeIndex, 1);
  } else {
    // --mode フラグがない場合は自動判定
    mode = await detectBuildMode();
    console.log(`🔧 Build mode: ${mode} (auto-detected)`);
  }

  // 残りの引数から preset 名を取得
  const presetName = args[0];

  if (mode === 'self') {
    // Self DevContainer: preset はオプション
    await buildSelf(presetName);
  } else {
    // Client DevContainer: preset は必須
    if (!presetName) {
      console.error('❌ Error: Preset name is required for Client DevContainer');
      console.error('Usage: bun run build <preset-name>');
      console.error('Example: bun run build writing');
      console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
      process.exit(1);
    }
    await buildClient(presetName);
  }
}

main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
