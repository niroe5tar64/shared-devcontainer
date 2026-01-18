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
  mergePath,
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

describe('mergePath', () => {
  test('両方 undefined の場合は undefined を返す', () => {
    expect(mergePath(undefined, undefined)).toBeUndefined();
  });

  test('basePath のみの場合は basePath を返す', () => {
    expect(mergePath('/usr/bin:/bin', undefined)).toBe('/usr/bin:/bin');
  });

  test('presetPath のみの場合は presetPath を返す', () => {
    expect(mergePath(undefined, '/opt/bin')).toBe('/opt/bin');
  });

  test('両方ある場合は preset:base の順で連結', () => {
    expect(mergePath('/usr/bin:/bin', '/opt/bin:/opt/local/bin')).toBe(
      '/opt/bin:/opt/local/bin:/usr/bin:/bin',
    );
  });

  test('単一パスでも正しく連結', () => {
    expect(mergePath('/usr/bin', '/opt/bin')).toBe('/opt/bin:/usr/bin');
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

  test('postCreateCommand: preset のみの場合は base + preset が && で連結', () => {
    const preset: DevContainerConfig = {
      postCreateCommand: 'apt-get install -y package',
    };
    const result = generatePresetConfig(preset);
    // base の postCreateCommand も含まれている
    expect(result.postCreateCommand).toContain('bash .devcontainer/post-create.sh');
    expect(result.postCreateCommand).toContain('apt-get install -y package');
    // && で連結されている
    expect(result.postCreateCommand).toContain('&&');
    // base が先、preset が後
    expect(result.postCreateCommand).toBe(
      'bash .devcontainer/post-create.sh && apt-get install -y package',
    );
  });

  test('postCreateCommand: preset がない場合は base のみ', () => {
    const preset: DevContainerConfig = {
      name: 'No PostCreate Preset',
    };
    const result = generatePresetConfig(preset);
    // base の postCreateCommand のみ
    expect(result.postCreateCommand).toBe('bash .devcontainer/post-create.sh');
  });

  test('postCreateCommand: 配列形式も正しくマージされる', () => {
    const preset: DevContainerConfig = {
      postCreateCommand: ['cmd1', 'cmd2'],
    };
    const result = generatePresetConfig(preset);
    // base と preset が全て && で連結
    expect(result.postCreateCommand).toContain('bash .devcontainer/post-create.sh');
    expect(result.postCreateCommand).toContain('cmd1');
    expect(result.postCreateCommand).toContain('cmd2');
    expect(result.postCreateCommand).toBe('bash .devcontainer/post-create.sh && cmd1 && cmd2');
  });

  test('postCreateCommand: 実用例（Haskell preset のようなケース）', () => {
    const preset: DevContainerConfig = {
      postCreateCommand:
        'sudo apt-get update && sudo apt-get install -y libgmp-dev && curl --proto "=https" --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh',
    };
    const result = generatePresetConfig(preset);
    // base の基本セットアップが最初に実行される
    expect(result.postCreateCommand).toMatch(/^bash \.devcontainer\/post-create\.sh &&/);
    // preset の Haskell セットアップが後に実行される
    expect(result.postCreateCommand).toContain('apt-get install -y libgmp-dev');
    expect(result.postCreateCommand).toContain('get-ghcup.haskell.org');
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

  test('remoteEnv.PATH は base + preset で連結される', () => {
    const preset: DevContainerConfig = {
      remoteEnv: {
        PATH: '/opt/preset/bin',
      },
    };
    const result = generatePresetConfig(preset);
    // base の PATH と preset の PATH が連結されているか確認
    expect(result.remoteEnv?.PATH).toContain('/opt/preset/bin');
    expect(result.remoteEnv?.PATH).toContain('/.local/bin');
    expect(result.remoteEnv?.PATH).toContain('/.bun/bin');
    // preset が前に来ている（優先度が高い）
    expect(result.remoteEnv?.PATH).toMatch(/^\/opt\/preset\/bin:/);
  });

  test('remoteEnv.PATH は base + preset + projectConfig で3層連結される', () => {
    const preset: DevContainerConfig = {
      remoteEnv: {
        PATH: '/opt/preset/bin',
      },
    };
    const projectConfig: DevContainerConfig = {
      remoteEnv: {
        PATH: '/opt/project/bin',
      },
    };
    const result = generatePresetConfig(preset, projectConfig);
    // 全ての PATH が含まれている
    expect(result.remoteEnv?.PATH).toContain('/opt/project/bin');
    expect(result.remoteEnv?.PATH).toContain('/opt/preset/bin');
    expect(result.remoteEnv?.PATH).toContain('/.local/bin');
    // 優先度順：projectConfig > preset > base
    expect(result.remoteEnv?.PATH).toMatch(/^\/opt\/project\/bin:\/opt\/preset\/bin:/);
  });

  test('remoteEnv.PATH がない preset でも base の PATH は保持される', () => {
    const preset: DevContainerConfig = {
      name: 'No PATH Preset',
    };
    const result = generatePresetConfig(preset);
    // base の PATH が保持されている
    expect(result.remoteEnv?.PATH).toContain('/.local/bin');
    expect(result.remoteEnv?.PATH).toContain('/.bun/bin');
  });

  test('remoteEnv.PATH 以外のフィールドは deepMerge で処理される', () => {
    const preset: DevContainerConfig = {
      remoteEnv: {
        PATH: '/opt/bin',
        CUSTOM_VAR: 'preset-value',
      },
    };
    const projectConfig: DevContainerConfig = {
      remoteEnv: {
        ANOTHER_VAR: 'project-value',
      },
    };
    const result = generatePresetConfig(preset, projectConfig);
    // PATH は連結される
    expect(result.remoteEnv?.PATH).toContain('/opt/bin');
    // 他のフィールドは deepMerge で処理される
    expect(result.remoteEnv?.CUSTOM_VAR).toBe('preset-value');
    expect(result.remoteEnv?.ANOTHER_VAR).toBe('project-value');
  });
});
