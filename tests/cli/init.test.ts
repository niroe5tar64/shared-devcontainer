/**
 * CLI init コマンドの統合テスト
 */

import { existsSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { PRESETS } from '../../src/config/presets/index';
import { generatePresetConfig } from '../../src/lib/devcontainer-builder';

const TEST_OUTPUT_DIR = '/tmp/devcontainer-test';

describe('init command', () => {
  beforeEach(() => {
    // テスト用ディレクトリをクリーンアップ
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  describe('--dry-run', () => {
    test('dry-run ではファイルを作成しない', async () => {
      const proc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--output', TEST_OUTPUT_DIR, '--dry-run'],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Dry run mode');
      expect(existsSync(join(TEST_OUTPUT_DIR, 'devcontainer.json'))).toBe(false);
    });

    test('dry-run でプリセット指定可能', async () => {
      const proc = Bun.spawn(
        [
          'bun',
          'run',
          './src/cli/index.ts',
          'init',
          '--preset',
          'bun',
          '--output',
          TEST_OUTPUT_DIR,
          '--dry-run',
        ],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Using preset: bun');
      expect(stdout).toContain('Dry run mode');
    });
  });

  describe('ファイル生成', () => {
    test('プリセットなしで devcontainer.json を生成', async () => {
      const proc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--output', TEST_OUTPUT_DIR],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);

      // devcontainer.json が生成されたか
      expect(existsSync(join(TEST_OUTPUT_DIR, 'devcontainer.json'))).toBe(true);

      // テンプレートファイルがコピーされたか
      expect(existsSync(join(TEST_OUTPUT_DIR, 'bin'))).toBe(true);
      expect(existsSync(join(TEST_OUTPUT_DIR, 'initialize.sh'))).toBe(true);
      expect(existsSync(join(TEST_OUTPUT_DIR, 'post-create.sh'))).toBe(true);
    });

    test('bun プリセットで devcontainer.json を生成', async () => {
      const proc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--preset', 'bun', '--output', TEST_OUTPUT_DIR],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);

      const content = await readFile(join(TEST_OUTPUT_DIR, 'devcontainer.json'), 'utf-8');
      const config = JSON.parse(content);

      // bun プリセットの設定が反映されているか
      expect(config.name).toBe('Bun Development');
      // base の features がマージされている
      expect(config.features['ghcr.io/devcontainers/features/node:1']).toBeDefined();
    });

    test('haskell プリセットで devcontainer.json を生成', async () => {
      const proc = Bun.spawn(
        [
          'bun',
          'run',
          './src/cli/index.ts',
          'init',
          '--preset',
          'haskell',
          '--output',
          TEST_OUTPUT_DIR,
        ],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      expect(exitCode).toBe(0);

      const content = await readFile(join(TEST_OUTPUT_DIR, 'devcontainer.json'), 'utf-8');
      const config = JSON.parse(content);

      // haskell プリセットの設定が反映されているか
      expect(config.name).toBe('Haskell Base');
      expect(config.postCreateCommand).toContain('ghcup');
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しないプリセットでエラー', async () => {
      const proc = Bun.spawn(
        [
          'bun',
          'run',
          './src/cli/index.ts',
          'init',
          '--preset',
          'nonexistent',
          '--output',
          TEST_OUTPUT_DIR,
        ],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await proc.exited;
      const stderr = await new Response(proc.stderr).text();

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Unknown preset');
    });

    test('既存ファイルがある場合は --force なしでエラー', async () => {
      // 最初にファイルを作成
      const firstProc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--output', TEST_OUTPUT_DIR],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );
      await firstProc.exited;

      // 2回目は --force なしで失敗するはず
      const secondProc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--output', TEST_OUTPUT_DIR],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await secondProc.exited;
      const stderr = await new Response(secondProc.stderr).text();

      expect(exitCode).toBe(1);
      expect(stderr).toContain('already exists');
    });

    test('--force で既存ファイルを上書き', async () => {
      // 最初にファイルを作成
      const firstProc = Bun.spawn(
        ['bun', 'run', './src/cli/index.ts', 'init', '--output', TEST_OUTPUT_DIR],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );
      await firstProc.exited;

      // 2回目は --force で上書き
      const secondProc = Bun.spawn(
        [
          'bun',
          'run',
          './src/cli/index.ts',
          'init',
          '--preset',
          'bun',
          '--output',
          TEST_OUTPUT_DIR,
          '--force',
        ],
        {
          cwd: '/workspaces/shared-devcontainer',
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );

      const exitCode = await secondProc.exited;
      expect(exitCode).toBe(0);

      // bun プリセットの内容で上書きされたか
      const content = await readFile(join(TEST_OUTPUT_DIR, 'devcontainer.json'), 'utf-8');
      const config = JSON.parse(content);
      expect(config.name).toBe('Bun Development');
    });
  });

  describe('generatePresetConfig の検証', () => {
    test('全プリセットで有効な設定が生成される', () => {
      for (const [presetName, preset] of Object.entries(PRESETS)) {
        const config = generatePresetConfig(preset);

        // 必須フィールドの存在確認
        expect(config.$schema).toBeDefined();
        expect(config.image).toBeDefined();

        // customizations.vscode が正しくマージされているか
        expect(config.customizations?.vscode).toBeDefined();

        // extensions が配列であるか
        const vscode = config.customizations?.vscode as { extensions?: string[] };
        expect(Array.isArray(vscode.extensions)).toBe(true);
      }
    });
  });
});
