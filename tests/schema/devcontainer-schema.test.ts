/**
 * 生成される devcontainer.json のスキーマ検証テスト
 *
 * DevContainer 公式スキーマに対して生成される設定を検証
 */

import { describe, expect, test } from 'bun:test';
import { PRESETS } from '../../src/config/presets/index';
import { generatePresetConfig, SCHEMA_URL } from '../../src/lib/devcontainer-builder';
import type { DevContainerConfig } from '../../src/types';

/**
 * DevContainer 仕様で定義されている必須・推奨フィールド
 */
const REQUIRED_FIELDS = ['image'] as const;

const RECOMMENDED_FIELDS = ['name', 'remoteUser'] as const;

const VALID_TOP_LEVEL_FIELDS = new Set([
  '$schema',
  'name',
  'image',
  'dockerFile',
  'build',
  'features',
  'customizations',
  'forwardPorts',
  'portsAttributes',
  'postCreateCommand',
  'postStartCommand',
  'postAttachCommand',
  'containerEnv',
  'remoteEnv',
  'remoteUser',
  'mounts',
  'runArgs',
  'workspaceFolder',
  'workspaceMount',
  'shutdownAction',
  'overrideCommand',
  'initializeCommand',
  'onCreateCommand',
  'updateContentCommand',
  'waitFor',
  'userEnvProbe',
  'hostRequirements',
  'privileged',
  'capAdd',
  'securityOpt',
  'containerUser',
  'updateRemoteUserUID',
  'appPort',
  'gpuSupport',
  'otherPortsAttributes',
]);

/**
 * 設定が DevContainer スキーマに準拠しているか検証
 */
function validateDevContainerSchema(config: DevContainerConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // $schema の検証
  if (config.$schema && config.$schema !== SCHEMA_URL) {
    warnings.push(`Unexpected $schema URL: ${config.$schema}`);
  }

  // 必須フィールドの検証（image または dockerFile/build のいずれか）
  const hasImage = config.image !== undefined;
  const hasDockerFile = config.dockerFile !== undefined;
  const hasBuild = config.build !== undefined;

  if (!hasImage && !hasDockerFile && !hasBuild) {
    errors.push('Missing required field: image, dockerFile, or build');
  }

  // 推奨フィールドの検証
  for (const field of RECOMMENDED_FIELDS) {
    if (config[field] === undefined) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  }

  // トップレベルフィールドの検証
  for (const key of Object.keys(config)) {
    if (!VALID_TOP_LEVEL_FIELDS.has(key)) {
      warnings.push(`Unknown top-level field: ${key}`);
    }
  }

  // features の検証
  if (config.features) {
    for (const [featureName, featureConfig] of Object.entries(config.features)) {
      // feature 名の形式検証（ghcr.io/... または devcontainers/features/...）
      if (!featureName.includes('/')) {
        warnings.push(`Unusual feature name format: ${featureName}`);
      }
      // feature 設定がオブジェクトであることを確認
      if (typeof featureConfig !== 'object') {
        errors.push(`Invalid feature config for ${featureName}: expected object`);
      }
    }
  }

  // customizations の検証
  if (config.customizations) {
    const vscode = config.customizations.vscode as { extensions?: unknown; settings?: unknown };
    if (vscode) {
      // extensions が配列であることを確認
      if (vscode.extensions && !Array.isArray(vscode.extensions)) {
        errors.push('customizations.vscode.extensions must be an array');
      }
      // settings がオブジェクトであることを確認
      if (vscode.settings && typeof vscode.settings !== 'object') {
        errors.push('customizations.vscode.settings must be an object');
      }
    }
  }

  // postCreateCommand の検証
  if (config.postCreateCommand !== undefined) {
    const cmd = config.postCreateCommand;
    const isValid =
      typeof cmd === 'string' ||
      (Array.isArray(cmd) && cmd.every((c) => typeof c === 'string')) ||
      (typeof cmd === 'object' && !Array.isArray(cmd));

    if (!isValid) {
      errors.push('postCreateCommand must be string, string[], or object');
    }
  }

  // mounts の検証
  if (config.mounts) {
    if (!Array.isArray(config.mounts)) {
      errors.push('mounts must be an array');
    } else {
      for (const mount of config.mounts) {
        if (typeof mount !== 'string' && typeof mount !== 'object') {
          errors.push('Each mount must be a string or object');
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

describe('DevContainer スキーマ検証', () => {
  describe('base 設定', () => {
    test('base のみで有効なスキーマを生成', () => {
      const config = generatePresetConfig();
      const result = validateDevContainerSchema(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('$schema が正しく設定されている', () => {
      const config = generatePresetConfig();
      expect(config.$schema).toBe(SCHEMA_URL);
    });
  });

  describe('全プリセットのスキーマ検証', () => {
    for (const [presetName, preset] of Object.entries(PRESETS)) {
      test(`${presetName} プリセットが有効なスキーマを生成`, () => {
        const config = generatePresetConfig(preset);
        const result = validateDevContainerSchema(config);

        if (result.errors.length > 0) {
          console.error(`Errors in ${presetName}:`, result.errors);
        }

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      test(`${presetName} プリセットの推奨フィールドが設定されている`, () => {
        const config = generatePresetConfig(preset);

        // image が設定されている
        expect(config.image).toBeDefined();

        // name が設定されている
        expect(config.name).toBeDefined();
      });
    }
  });

  describe('必須フィールドの検証', () => {
    test('image フィールドが必ず存在', () => {
      const config = generatePresetConfig();
      expect(config.image).toBeDefined();
      expect(typeof config.image).toBe('string');
    });

    test('customizations.vscode.extensions が配列', () => {
      const config = generatePresetConfig();
      const vscode = config.customizations?.vscode as { extensions?: unknown };

      expect(Array.isArray(vscode?.extensions)).toBe(true);
    });
  });

  describe('features の検証', () => {
    test('features が正しい形式', () => {
      for (const [presetName, preset] of Object.entries(PRESETS)) {
        const config = generatePresetConfig(preset);

        if (config.features) {
          expect(typeof config.features).toBe('object');

          for (const [featureName, featureConfig] of Object.entries(config.features)) {
            // feature 名が文字列
            expect(typeof featureName).toBe('string');
            // feature 設定がオブジェクト
            expect(typeof featureConfig).toBe('object');
          }
        }
      }
    });
  });

  describe('mounts の検証', () => {
    test('mounts が配列', () => {
      const config = generatePresetConfig();

      if (config.mounts) {
        expect(Array.isArray(config.mounts)).toBe(true);

        for (const mount of config.mounts) {
          expect(['string', 'object'].includes(typeof mount)).toBe(true);
        }
      }
    });
  });

  describe('postCreateCommand の検証', () => {
    test('postCreateCommand が有効な形式', () => {
      for (const [, preset] of Object.entries(PRESETS)) {
        const config = generatePresetConfig(preset);

        if (config.postCreateCommand !== undefined) {
          const cmd = config.postCreateCommand;
          const isValid =
            typeof cmd === 'string' ||
            (Array.isArray(cmd) && cmd.every((c) => typeof c === 'string')) ||
            (typeof cmd === 'object' && !Array.isArray(cmd));

          expect(isValid).toBe(true);
        }
      }
    });
  });
});

describe('生成される JSON の構造検証', () => {
  test('JSON.stringify でシリアライズ可能', () => {
    for (const [presetName, preset] of Object.entries(PRESETS)) {
      const config = generatePresetConfig(preset);

      // 例外が発生しないことを確認
      const json = JSON.stringify(config, null, 2);
      expect(typeof json).toBe('string');

      // パース可能であることを確認
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(config);
    }
  });

  test('循環参照がない', () => {
    for (const [, preset] of Object.entries(PRESETS)) {
      const config = generatePresetConfig(preset);

      // JSON.stringify は循環参照があるとエラーになる
      expect(() => JSON.stringify(config)).not.toThrow();
    }
  });
});
