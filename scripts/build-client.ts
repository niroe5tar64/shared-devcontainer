#!/usr/bin/env bun

/**
 * Build Script for Client Projects
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

import { mkdir, writeFile, copyFile, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { base } from '../src/base';
import { nodePreset } from '../src/presets/node';
import { pythonPreset } from '../src/presets/python';
import { fullstackPreset } from '../src/presets/fullstack';
import { writingPreset } from '../src/presets/writing';
import type { DevContainerConfig } from '../src/types';

const SCHEMA_URL = 'https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json';

/**
 * VS Code customizations の型定義
 */
interface VSCodeCustomizations {
  extensions?: string[];
  settings?: Record<string, unknown>;
}

function getVSCodeCustomizations(config: DevContainerConfig): VSCodeCustomizations | undefined {
  return config.customizations?.vscode as VSCodeCustomizations | undefined;
}

function getPostCreateCommand(config: DevContainerConfig | undefined): string | string[] | undefined {
  if (!config) return undefined;
  const cmd = config.postCreateCommand;
  if (typeof cmd === 'string' || Array.isArray(cmd)) {
    return cmd;
  }
  return undefined;
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
 */
function generatePresetConfig(preset: DevContainerConfig, projectConfig?: DevContainerConfig): DevContainerConfig {
  const baseVSCode = getVSCodeCustomizations(base);
  const presetVSCode = getVSCodeCustomizations(preset);
  const projectVSCode = projectConfig ? getVSCodeCustomizations(projectConfig) : undefined;

  return {
    $schema: SCHEMA_URL,
    ...base,
    ...preset,
    ...projectConfig,
    // 特定のフィールドは専用のマージロジックを使用
    features: deepMerge(deepMerge(base.features, preset.features), projectConfig?.features),
    customizations: {
      vscode: {
        extensions: mergeArrays(
          mergeArrays(baseVSCode?.extensions, presetVSCode?.extensions),
          projectVSCode?.extensions
        ),
        settings: deepMerge(
          deepMerge(baseVSCode?.settings, presetVSCode?.settings),
          projectVSCode?.settings
        ),
      },
    },
    containerEnv: deepMerge(deepMerge(base.containerEnv, preset.containerEnv), projectConfig?.containerEnv),
    remoteEnv: deepMerge(deepMerge(base.remoteEnv, preset.remoteEnv), projectConfig?.remoteEnv),
    mounts: projectConfig?.mounts || preset.mounts || base.mounts,
    postCreateCommand: mergePostCreateCommand(
      mergePostCreateCommand(
        getPostCreateCommand(base),
        getPostCreateCommand(preset)
      ),
      getPostCreateCommand(projectConfig)
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
 * プロジェクト固有の設定を読み込み（オプション）
 */
async function loadProjectConfig(clientDevcontainerDir: string): Promise<DevContainerConfig | undefined> {
  const configPath = join(clientDevcontainerDir, 'project-config.ts');

  if (!existsSync(configPath)) {
    return undefined;
  }

  try {
    console.log(`📝 Loading project-specific config from: ${configPath}`);
    const module = await import(configPath);
    return module.default || module.projectConfig;
  } catch (error) {
    console.warn(`⚠️  Failed to load project config: ${error}`);
    return undefined;
  }
}

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

  console.log(`🔨 Building DevContainer for client project (preset: ${presetName})...\n`);

  // 親プロジェクトのパスを計算
  // このスクリプトは .devcontainer/shared/ で実行される想定
  // PWD環境変数を使用してシンボリックリンクを辿らないパスを取得
  const cwd = process.env.PWD || process.cwd();
  const clientDevcontainerDir = resolve(cwd, '..');

  console.log(`📂 Current directory: ${cwd}`);
  console.log(`📂 Target directory: ${clientDevcontainerDir}`);

  // プロジェクト固有の設定を読み込み（存在する場合）
  const projectConfig = await loadProjectConfig(clientDevcontainerDir);

  // 設定を生成
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
