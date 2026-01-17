/**
 * devcontainer-builder.ts のユニットテスト
 */

import { describe, expect, test } from 'bun:test';
import {
  deepMerge,
  generatePresetConfig,
  getPostCreateCommand,
  getVSCodeCustomizations,
  mergeArrays,
  mergeMounts,
  mergePostCreateCommand,
} from '../../src/lib/devcontainer-builder';
import type { DevContainerConfig, Mount } from '../../src/types';

describe('mergeArrays', () => {
  test('両方undefined の場合は undefined を返す', () => {
    expect(mergeArrays(undefined, undefined)).toBeUndefined();
  });

  test('base のみの場合は base を返す', () => {
    expect(mergeArrays(['a', 'b'], undefined)).toEqual(['a', 'b']);
  });

  test('preset のみの場合は preset を返す', () => {
    expect(mergeArrays(undefined, ['c', 'd'])).toEqual(['c', 'd']);
  });

  test('両方ある場合は結合して重複を排除', () => {
    expect(mergeArrays(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  test('空配列の場合は空配列を返す', () => {
    expect(mergeArrays([], [])).toEqual([]);
  });
});

describe('deepMerge', () => {
  test('両方undefined の場合は undefined を返す', () => {
    expect(deepMerge(undefined, undefined)).toBeUndefined();
  });

  test('base のみの場合は base を返す', () => {
    const base = { a: 1, b: 2 };
    expect(deepMerge(base, undefined)).toEqual(base);
  });

  test('preset のみの場合は preset を返す', () => {
    const preset = { c: 3, d: 4 };
    expect(deepMerge(undefined, preset)).toEqual(preset);
  });

  test('プリミティブ値は preset で上書き', () => {
    const base = { a: 1, b: 2 };
    const preset = { b: 3, c: 4 };
    expect(deepMerge(base, preset)).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('ネストしたオブジェクトは深くマージ', () => {
    const base = { outer: { a: 1, b: 2 } };
    const preset = { outer: { b: 3, c: 4 } };
    expect(deepMerge(base, preset)).toEqual({ outer: { a: 1, b: 3, c: 4 } });
  });

  test('配列は preset で上書き（マージしない）', () => {
    const base = { arr: [1, 2, 3] };
    const preset = { arr: [4, 5] };
    expect(deepMerge(base, preset)).toEqual({ arr: [4, 5] });
  });

  test('複数階層のネストも正しくマージ', () => {
    const base = { l1: { l2: { a: 1 } } };
    const preset = { l1: { l2: { b: 2 } } };
    expect(deepMerge(base, preset)).toEqual({ l1: { l2: { a: 1, b: 2 } } });
  });
});

describe('mergeMounts', () => {
  test('全て undefined の場合は undefined を返す', () => {
    expect(mergeMounts(undefined, undefined, undefined)).toBeUndefined();
  });

  test('base のみの場合は base を返す', () => {
    const base = ['type=bind,source=/a,target=/b'];
    expect(mergeMounts(base, undefined, undefined)).toEqual(base);
  });

  test('同じ target のマウントは後勝ち（文字列形式）', () => {
    const base = ['type=bind,source=/old,target=/mnt'];
    const preset = ['type=bind,source=/new,target=/mnt'];
    expect(mergeMounts(base, preset, undefined)).toEqual(['type=bind,source=/new,target=/mnt']);
  });

  test('同じ target のマウントは後勝ち（オブジェクト形式）', () => {
    const base: Mount[] = [{ type: 'bind', source: '/old', target: '/mnt' }];
    const preset: Mount[] = [{ type: 'bind', source: '/new', target: '/mnt' }];
    expect(mergeMounts(base, preset, undefined)).toEqual([
      { type: 'bind', source: '/new', target: '/mnt' },
    ]);
  });

  test('異なる target は全て含まれる', () => {
    const base = ['type=bind,source=/a,target=/mnt-a'];
    const preset = ['type=bind,source=/b,target=/mnt-b'];
    const project = ['type=bind,source=/c,target=/mnt-c'];
    expect(mergeMounts(base, preset, project)).toEqual([
      'type=bind,source=/a,target=/mnt-a',
      'type=bind,source=/b,target=/mnt-b',
      'type=bind,source=/c,target=/mnt-c',
    ]);
  });

  test('dst キーも target として認識する', () => {
    const base = ['type=bind,source=/old,dst=/mnt'];
    const preset = ['type=bind,source=/new,dst=/mnt'];
    expect(mergeMounts(base, preset, undefined)).toEqual(['type=bind,source=/new,dst=/mnt']);
  });

  test('target が取得できないマウントは重複排除して追加', () => {
    const base = ['some-mount-without-target'];
    const preset = ['some-mount-without-target', 'another-mount'];
    expect(mergeMounts(base, preset, undefined)).toEqual([
      'some-mount-without-target',
      'another-mount',
    ]);
  });
});

describe('mergePostCreateCommand', () => {
  test('両方 undefined の場合は undefined を返す', () => {
    expect(mergePostCreateCommand(undefined, undefined)).toBeUndefined();
  });

  test('base のみ（文字列）の場合は base を返す', () => {
    expect(mergePostCreateCommand('echo base', undefined)).toBe('echo base');
  });

  test('preset のみ（文字列）の場合は preset を返す', () => {
    expect(mergePostCreateCommand(undefined, 'echo preset')).toBe('echo preset');
  });

  test('両方文字列の場合は && で結合', () => {
    expect(mergePostCreateCommand('echo base', 'echo preset')).toBe('echo base && echo preset');
  });

  test('base が配列の場合は展開して結合', () => {
    expect(mergePostCreateCommand(['cmd1', 'cmd2'], 'cmd3')).toBe('cmd1 && cmd2 && cmd3');
  });

  test('preset が配列の場合は展開して結合', () => {
    expect(mergePostCreateCommand('cmd1', ['cmd2', 'cmd3'])).toBe('cmd1 && cmd2 && cmd3');
  });

  test('両方配列の場合は両方展開して結合', () => {
    expect(mergePostCreateCommand(['cmd1', 'cmd2'], ['cmd3', 'cmd4'])).toBe(
      'cmd1 && cmd2 && cmd3 && cmd4',
    );
  });
});

describe('getVSCodeCustomizations', () => {
  test('customizations がない場合は undefined', () => {
    const config: DevContainerConfig = { image: 'test' };
    expect(getVSCodeCustomizations(config)).toBeUndefined();
  });

  test('vscode がない場合は undefined', () => {
    const config: DevContainerConfig = { image: 'test', customizations: {} };
    expect(getVSCodeCustomizations(config)).toBeUndefined();
  });

  test('vscode がある場合はそれを返す', () => {
    const config: DevContainerConfig = {
      image: 'test',
      customizations: {
        vscode: {
          extensions: ['ext1'],
          settings: { key: 'value' },
        },
      },
    };
    const result = getVSCodeCustomizations(config);
    expect(result?.extensions).toEqual(['ext1']);
    expect(result?.settings).toEqual({ key: 'value' });
  });
});

describe('getPostCreateCommand', () => {
  test('config が undefined の場合は undefined', () => {
    expect(getPostCreateCommand(undefined)).toBeUndefined();
  });

  test('postCreateCommand がない場合は undefined', () => {
    const config: DevContainerConfig = { image: 'test' };
    expect(getPostCreateCommand(config)).toBeUndefined();
  });

  test('文字列の場合はそのまま返す', () => {
    const config: DevContainerConfig = { image: 'test', postCreateCommand: 'echo hello' };
    expect(getPostCreateCommand(config)).toBe('echo hello');
  });

  test('配列の場合はそのまま返す', () => {
    const config: DevContainerConfig = { image: 'test', postCreateCommand: ['cmd1', 'cmd2'] };
    expect(getPostCreateCommand(config)).toEqual(['cmd1', 'cmd2']);
  });
});

describe('generatePresetConfig', () => {
  test('preset なしの場合は base のみで生成', () => {
    const result = generatePresetConfig();
    expect(result.$schema).toBeDefined();
    expect(result.image).toBeDefined();
  });

  test('preset ありの場合は base + preset をマージ', () => {
    const preset: DevContainerConfig = {
      name: 'Test Preset',
      customizations: {
        vscode: {
          extensions: ['preset-ext'],
        },
      },
    };
    const result = generatePresetConfig(preset);
    expect(result.name).toBe('Test Preset');
    // base の拡張機能も含まれているはず
    const extensions = result.customizations?.vscode as { extensions?: string[] };
    expect(extensions.extensions).toContain('preset-ext');
  });

  test('projectConfig ありの場合は 3層マージ', () => {
    const preset: DevContainerConfig = {
      name: 'Preset Name',
    };
    const projectConfig: DevContainerConfig = {
      name: 'Project Name',
      customizations: {
        vscode: {
          extensions: ['project-ext'],
        },
      },
    };
    const result = generatePresetConfig(preset, projectConfig);
    expect(result.name).toBe('Project Name'); // projectConfig が優先
    const extensions = result.customizations?.vscode as { extensions?: string[] };
    expect(extensions.extensions).toContain('project-ext');
  });

  test('postCreateCommand は projectConfig で指定なしなら base + preset をマージ', () => {
    const preset: DevContainerConfig = {
      postCreateCommand: 'echo preset',
    };
    const projectConfig: DevContainerConfig = {};
    const result = generatePresetConfig(preset, projectConfig);
    expect(result.postCreateCommand).toContain('&&');
    expect(result.postCreateCommand).toContain('echo preset');
  });

  test('postCreateCommand は projectConfig で指定ありなら上書き', () => {
    const preset: DevContainerConfig = {
      postCreateCommand: 'echo preset',
    };
    const projectConfig: DevContainerConfig = {
      postCreateCommand: 'echo project',
    };
    const result = generatePresetConfig(preset, projectConfig);
    expect(result.postCreateCommand).toBe('echo project');
  });

  test('features は 3層で深くマージ', () => {
    const preset: DevContainerConfig = {
      features: {
        'ghcr.io/test/feature1:1': { option: 'preset' },
      },
    };
    const projectConfig: DevContainerConfig = {
      features: {
        'ghcr.io/test/feature2:1': {},
      },
    };
    const result = generatePresetConfig(preset, projectConfig);
    // toHaveProperty はドットを含むキー名で問題があるため直接アクセス
    expect(result.features?.['ghcr.io/test/feature1:1']).toBeDefined();
    expect(result.features?.['ghcr.io/test/feature2:1']).toBeDefined();
  });

  test('mounts は 3層でマージされ target が同じなら後勝ち', () => {
    const preset: DevContainerConfig = {
      mounts: ['type=bind,source=/preset,target=/mnt'],
    };
    const projectConfig: DevContainerConfig = {
      mounts: ['type=bind,source=/project,target=/mnt'],
    };
    const result = generatePresetConfig(preset, projectConfig);
    // projectConfig の方が優先される
    expect(result.mounts).toContainEqual('type=bind,source=/project,target=/mnt');
    expect(result.mounts).not.toContainEqual('type=bind,source=/preset,target=/mnt');
  });
});
