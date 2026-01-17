/**
 * CLI list-presets コマンドの統合テスト
 */

import { describe, expect, test } from 'bun:test';
import { PRESET_METADATA, PRESETS } from '../../src/config/presets/index';

describe('list-presets command', () => {
  test('利用可能なプリセットを一覧表示', async () => {
    const proc = Bun.spawn(['bun', 'run', './src/cli/index.ts', 'list-presets'], {
      cwd: '/workspaces/shared-devcontainer',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Available Presets');

    // 全プリセットが表示されているか
    for (const presetName of Object.keys(PRESETS)) {
      expect(stdout).toContain(presetName);
    }
  });

  test('プリセットの説明が表示される', async () => {
    const proc = Bun.spawn(['bun', 'run', './src/cli/index.ts', 'list-presets'], {
      cwd: '/workspaces/shared-devcontainer',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);

    // メタデータの説明が表示されているか
    for (const [, metadata] of Object.entries(PRESET_METADATA)) {
      expect(stdout).toContain(metadata.name);
      expect(stdout).toContain(metadata.description);
    }
  });

  test('使用方法が表示される', async () => {
    const proc = Bun.spawn(['bun', 'run', './src/cli/index.ts', 'list-presets'], {
      cwd: '/workspaces/shared-devcontainer',
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('--preset');
  });
});

describe('PRESETS と PRESET_METADATA の整合性', () => {
  test('PRESETS と PRESET_METADATA のキーが一致', () => {
    const presetKeys = Object.keys(PRESETS).sort();
    const metadataKeys = Object.keys(PRESET_METADATA).sort();

    expect(presetKeys).toEqual(metadataKeys);
  });

  test('全プリセットにメタデータが存在', () => {
    for (const presetName of Object.keys(PRESETS)) {
      expect(PRESET_METADATA[presetName]).toBeDefined();
      expect(PRESET_METADATA[presetName].name).toBeDefined();
      expect(PRESET_METADATA[presetName].description).toBeDefined();
    }
  });
});
