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
import type { DevContainerConfig } from '../src/types';

const SCHEMA_URL = 'https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json';

/**
 * base.json を生成
 */
function generateBaseConfig(): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    name: 'Base Configuration',
    ...base,
  };
}

/**
 * 配列をマージ（重複を排除）
 */
function mergeArrays<T>(base?: T[], preset?: T[]): T[] | undefined {
  if (!base && !preset) return undefined;
  const combined = [...(base || []), ...(preset || [])];
  return Array.from(new Set(combined));
}

/**
 * オブジェクトを深くマージ
 */
function deepMerge<T extends Record<string, any>>(base?: T, preset?: T): T | undefined {
  if (!base && !preset) return undefined;
  if (!base) return preset;
  if (!preset) return base;

  const result = { ...base } as T;
  for (const key in preset) {
    if (preset[key] && typeof preset[key] === 'object' && !Array.isArray(preset[key])) {
      result[key] = deepMerge(base[key], preset[key]) as any;
    } else {
      result[key] = preset[key];
    }
  }
  return result;
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
 * baseとpresetをマージする
 */
function generatePresetConfig(preset: DevContainerConfig): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    ...base,
    ...preset,
    // 特定のフィールドは専用のマージロジックを使用
    features: deepMerge(base.features, preset.features),
    customizations: {
      vscode: {
        extensions: mergeArrays(
          base.customizations?.vscode?.extensions,
          preset.customizations?.vscode?.extensions
        ),
        settings: deepMerge(
          base.customizations?.vscode?.settings,
          preset.customizations?.vscode?.settings
        ),
      },
    },
    mounts: preset.mounts || base.mounts,
    postCreateCommand: mergePostCreateCommand(base.postCreateCommand, preset.postCreateCommand),
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
