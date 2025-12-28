#!/usr/bin/env bun

/**
 * Build Script for DevContainer Configurations
 *
 * TypeScript の設定ファイルから JSON を生成します。
 */

import { mkdir, writeFile, copyFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { base } from '../src/base';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import { writingPreset } from '../src/presets/writing';
import type { DevContainerConfig } from '../src/types';

const SCHEMA_URL = 'https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json';

/**
 * VS Code customizations の型定義
 * 生成された型では customizations が { [k: string]: unknown } のため、
 * 型安全にアクセスするためのヘルパー型を定義
 */
interface VSCodeCustomizations {
  extensions?: string[];
  settings?: Record<string, unknown>;
}

function getVSCodeCustomizations(config: DevContainerConfig): VSCodeCustomizations | undefined {
  return config.customizations?.vscode as VSCodeCustomizations | undefined;
}

function getPostCreateCommand(config: DevContainerConfig): string | string[] | undefined {
  const cmd = config.postCreateCommand;
  if (typeof cmd === 'string' || Array.isArray(cmd)) {
    return cmd;
  }
  return undefined;
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
 * .devcontainer/devcontainer.json を生成（このリポジトリ自体の開発環境用）
 */
function generateDevContainerConfig(): DevContainerConfig {
  return {
    $schema: SCHEMA_URL,
    name: 'Base Configuration',
    ...base,
    // このリポジトリ自体では .devcontainer/post-create.sh を参照
    postCreateCommand: 'bash .devcontainer/post-create.sh',
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
  const baseVSCode = getVSCodeCustomizations(base);
  const presetVSCode = getVSCodeCustomizations(preset);

  return {
    $schema: SCHEMA_URL,
    ...base,
    ...preset,
    // 特定のフィールドは専用のマージロジックを使用
    features: deepMerge(base.features, preset.features),
    customizations: {
      vscode: {
        extensions: mergeArrays(
          baseVSCode?.extensions,
          presetVSCode?.extensions
        ),
        settings: deepMerge(
          baseVSCode?.settings,
          presetVSCode?.settings
        ),
      },
    },
    containerEnv: deepMerge(base.containerEnv, preset.containerEnv),
    remoteEnv: deepMerge(base.remoteEnv, preset.remoteEnv),
    mounts: preset.mounts || base.mounts,
    postCreateCommand: mergePostCreateCommand(
      getPostCreateCommand(base),
      getPostCreateCommand(preset)
    ),
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

  // base.json を生成（サブモジュール配布用）
  const baseConfig = generateBaseConfig();
  await writeJsonFile(join('dist', 'base.json'), baseConfig);

  // .devcontainer/devcontainer.json を生成（このリポジトリ自体の開発環境用）
  await mkdir('.devcontainer', { recursive: true });
  const devContainerConfig = generateDevContainerConfig();
  await writeJsonFile(join('.devcontainer', 'devcontainer.json'), devContainerConfig);

  // プリセットを生成
  const presets = [
    { name: 'node', config: nodePreset },
    { name: 'python', config: pythonPreset },
    { name: 'fullstack', config: fullstackPreset },
    { name: 'writing', config: writingPreset },
  ];

  for (const { name, config } of presets) {
    const presetConfig = generatePresetConfig(config);
    await writeJsonFile(join('dist', 'presets', `${name}.json`), presetConfig);
  }

  // bin/ と post-create.sh を dist/ にコピー（サブモジュール対応）
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
