#!/usr/bin/env bun

/**
 * Build Script for DevContainer Configurations
 *
 * TypeScript の設定ファイルから JSON を生成します。
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { base } from '../src/base';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import type { DevContainerConfig, PresetConfig } from '../src/types';

const SCHEMA_URL = 'https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json';

/**
 * base.json を生成
 */
function generateBaseConfig(): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    name: 'Base Configuration',
    ...(base.image && { image: base.image }),
    features: base.features,
    customizations: {
      vscode: {
        extensions: base.extensions,
        settings: base.settings,
      },
    },
    ...(base.remoteEnv && { remoteEnv: base.remoteEnv }),
    ...(base.mounts && { mounts: base.mounts }),
    postCreateCommand: base.postCreateCommand || "echo 'DevContainer setup complete!'",
    remoteUser: base.remoteUser,
  };
}

/**
 * postCreateCommand を結合
 */
function mergePostCreateCommand(baseCmd?: string | string[], presetCmd?: string | string[]): string | undefined {
  const commands: string[] = [];

  if (baseCmd) {
    if (Array.isArray(baseCmd)) {
      commands.push(...baseCmd);
    } else {
      commands.push(baseCmd);
    }
  }

  if (presetCmd) {
    if (Array.isArray(presetCmd)) {
      commands.push(...presetCmd);
    } else {
      commands.push(presetCmd);
    }
  }

  return commands.length > 0 ? commands.join(' && ') : undefined;
}

/**
 * プリセットから完全な DevContainer 設定を生成
 */
function generatePresetConfig(preset: PresetConfig): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    name: preset.name,
    image: preset.image,
    features: {
      ...base.features,
      ...preset.features,
    },
    customizations: {
      vscode: {
        // base の拡張機能 + プリセット固有の拡張機能
        extensions: [...base.extensions, ...preset.extensions],
        // base の設定 + プリセット固有の設定
        settings: {
          ...base.settings,
          ...preset.settings,
        },
      },
    },
    ...(base.remoteEnv && { remoteEnv: base.remoteEnv }),
    ...(preset.mounts ? { mounts: preset.mounts } : base.mounts && { mounts: base.mounts }),
    postCreateCommand: mergePostCreateCommand(base.postCreateCommand, preset.postCreateCommand),
    remoteUser: base.remoteUser,
  };
}

/**
 * JSON ファイルを書き込み
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, json + '\n', 'utf-8');
  console.log(`✅ Generated: ${filePath}`);
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔨 Building DevContainer configurations...\n');

  // dist ディレクトリを作成
  await mkdir('dist', { recursive: true });
  await mkdir(join('dist', 'presets'), { recursive: true });

  // base.json を生成
  const baseConfig = generateBaseConfig();
  await writeJsonFile(join('dist', 'base.json'), baseConfig);
  // VS Code が直接参照する .devcontainer/devcontainer.json も同内容で出力
  await mkdir('.devcontainer', { recursive: true });
  await writeJsonFile(join('.devcontainer', 'devcontainer.json'), baseConfig);

  // プリセットを生成
  const presets = [
    { name: 'node', config: nodePreset },
    { name: 'python', config: pythonPreset },
    { name: 'fullstack', config: fullstackPreset },
  ];

  for (const { name, config } of presets) {
    const presetConfig = generatePresetConfig(config);
    await writeJsonFile(join('dist', 'presets', `${name}.json`), presetConfig);
  }

  console.log('\n✨ Build complete!');
}

main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
