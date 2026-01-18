/**
 * DevContainer Configuration Builder Library
 *
 * Self DevContainer と Client DevContainer の両方で使用する共通ユーティリティ
 */

import { writeFile } from 'node:fs/promises';
import { base } from '../config/base';
import type { DevContainerConfig, Mount } from '../types';

/**
 * DevContainer スキーマ URL
 */
export const SCHEMA_URL =
  'https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json';

/**
 * VS Code customizations の型定義
 * 生成された型では customizations が { [k: string]: unknown } のため、
 * 型安全にアクセスするためのヘルパー型を定義
 */
export interface VSCodeCustomizations {
  extensions?: string[];
  settings?: Record<string, unknown>;
}

/**
 * VS Code customizations を取得
 */
export function getVSCodeCustomizations(
  config: DevContainerConfig,
): VSCodeCustomizations | undefined {
  return config.customizations?.vscode as VSCodeCustomizations | undefined;
}

/**
 * postCreateCommand を取得
 */
export function getPostCreateCommand(
  config: DevContainerConfig | undefined,
): string | string[] | undefined {
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
export function mergeArrays<T>(base?: T[], preset?: T[]): T[] | undefined {
  if (!base && !preset) return undefined;
  const combined = [...(base || []), ...(preset || [])];
  return Array.from(new Set(combined));
}

/**
 * マウント指定から target を取得
 */
function getMountTarget(mount: string | Mount): string | undefined {
  // Mount オブジェクトの場合
  if (typeof mount === 'object') {
    return mount.target;
  }
  // 文字列の場合
  const parts = mount.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    const [key, ...rest] = trimmed.split('=');
    if (key === 'target' || key === 'dst') {
      return rest.join('=');
    }
  }
  return undefined;
}

/**
 * mounts をマージ（target が同一なら後勝ち）
 */
export function mergeMounts(
  base?: (string | Mount)[],
  preset?: (string | Mount)[],
  project?: (string | Mount)[],
): (string | Mount)[] | undefined {
  const lists = [base, preset, project];
  const result: (string | Mount)[] = [];
  const targetIndex = new Map<string, number>();
  const seen = new Set<string | Mount>();

  for (const list of lists) {
    if (!list) continue;
    for (const mount of list) {
      const target = getMountTarget(mount);
      if (target) {
        const existing = targetIndex.get(target);
        if (existing !== undefined) {
          result[existing] = mount;
        } else {
          targetIndex.set(target, result.length);
          result.push(mount);
        }
      } else if (!seen.has(mount)) {
        seen.add(mount);
        result.push(mount);
      }
    }
  }

  return result.length ? result : undefined;
}

/**
 * オブジェクトを深くマージ
 */
export function deepMerge<T extends Record<string, unknown>>(base?: T, preset?: T): T | undefined {
  if (!base && !preset) return undefined;
  if (!base) return preset;
  if (!preset) return base;

  const result = { ...base } as T;
  for (const key in preset) {
    if (preset[key] && typeof preset[key] === 'object' && !Array.isArray(preset[key])) {
      result[key] = deepMerge(
        base[key] as Record<string, unknown>,
        preset[key] as Record<string, unknown>,
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = preset[key];
    }
  }
  return result;
}

/**
 * postCreateCommand を結合
 */
export function mergePostCreateCommand(
  baseCmd?: string | string[],
  presetCmd?: string | string[],
): string | undefined {
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
 * PATH を連結
 *
 * preset の PATH と base の PATH を連結する。
 * preset が追加パスのみを記述することで、base との密結合を避ける。
 *
 * @param basePath - base の PATH
 * @param presetPath - preset の PATH（追加分のみ）
 * @returns 連結された PATH（preset:base の順）
 */
export function mergePath(basePath?: string, presetPath?: string): string | undefined {
  if (!basePath && !presetPath) return undefined;
  if (!basePath) return presetPath;
  if (!presetPath) return basePath;

  // preset のパスを前に配置（優先度を高くする）
  return `${presetPath}:${basePath}`;
}

/**
 * プリセットから完全な DevContainer 設定を生成
 *
 * base + preset + projectConfig を3層マージ
 *
 * @param preset - プリセット設定（undefined の場合は base + projectConfig のみ）
 * @param projectConfig - プロジェクト固有設定（オプション）
 * @returns 完全な DevContainer 設定
 */
export function generatePresetConfig(
  preset?: DevContainerConfig,
  projectConfig?: DevContainerConfig,
): DevContainerConfig {
  const baseVSCode = getVSCodeCustomizations(base);
  const presetVSCode = preset ? getVSCodeCustomizations(preset) : undefined;
  const projectVSCode = projectConfig ? getVSCodeCustomizations(projectConfig) : undefined;

  // postCreateCommand のマージロジック
  // projectConfig で明示的に指定されている場合はそれを優先（上書き）
  // projectConfig で指定されていない場合のみ、base + preset をマージ
  let finalPostCreateCommand: string | string[] | undefined;
  if (projectConfig?.postCreateCommand !== undefined) {
    // projectConfig で明示的に設定されている場合は上書き
    finalPostCreateCommand = getPostCreateCommand(projectConfig);
  } else {
    // projectConfig で設定されていない場合は base + preset をマージ
    finalPostCreateCommand = mergePostCreateCommand(
      getPostCreateCommand(base),
      getPostCreateCommand(preset),
    );
  }

  // remoteEnv のマージ（PATH は特殊処理）
  const mergedRemoteEnv = deepMerge(
    deepMerge(base.remoteEnv, preset?.remoteEnv),
    projectConfig?.remoteEnv,
  );

  // PATH を3層マージ（base → preset → projectConfig の順で連結）
  const basePath = base.remoteEnv?.PATH as string | undefined;
  const presetPath = preset?.remoteEnv?.PATH as string | undefined;
  const projectPath = projectConfig?.remoteEnv?.PATH as string | undefined;

  // まず base + preset をマージ
  const basePresetPath = mergePath(basePath, presetPath);
  // 次に (base + preset) + projectConfig をマージ
  const finalPath = mergePath(basePresetPath, projectPath);

  // PATH を設定（他のフィールドは deepMerge の結果を維持）
  if (finalPath && mergedRemoteEnv) {
    mergedRemoteEnv.PATH = finalPath;
  }

  return {
    $schema: SCHEMA_URL,
    ...base,
    ...preset,
    ...projectConfig,
    // 特定のフィールドは専用のマージロジックを使用
    features: deepMerge(deepMerge(base.features, preset?.features), projectConfig?.features),
    customizations: {
      vscode: {
        extensions: mergeArrays(
          mergeArrays(baseVSCode?.extensions, presetVSCode?.extensions),
          projectVSCode?.extensions,
        ),
        settings: deepMerge(
          deepMerge(baseVSCode?.settings, presetVSCode?.settings),
          projectVSCode?.settings,
        ),
      },
    },
    containerEnv: deepMerge(
      deepMerge(base.containerEnv, preset?.containerEnv),
      projectConfig?.containerEnv,
    ),
    remoteEnv: mergedRemoteEnv,
    mounts: mergeMounts(base.mounts, preset?.mounts, projectConfig?.mounts),
    postCreateCommand: finalPostCreateCommand,
  };
}

/**
 * JSON ファイルを書き込み
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, `${json}\n`, 'utf-8');
  console.log(`✅ Generated: ${filePath}`);
}
