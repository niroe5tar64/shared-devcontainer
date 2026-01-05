import type { DevContainerConfig } from '../types';

/**
 * Bun Development Preset
 *
 * base.ts の設定を継承し、Bun固有の設定を追加。
 * Bun + TypeScript + Biome を使用するプロジェクト向け。
 *
 * 含まれる設定:
 * - base.ts: Bun, Biome, Git, AI開発ツール（既に含まれている）
 * - 将来的にBun固有の設定を追加可能
 */
export const bunPreset: DevContainerConfig = {
  name: 'Bun Development',

  // 将来的に以下のような設定を追加可能:
  //
  // customizations: {
  //   vscode: {
  //     settings: {
  //       'bun.runtime': '/home/dev-user/.bun/bin/bun',
  //       'bun.debugAdapterPort': 6499,
  //     },
  //   },
  // },
  //
  // containerEnv: {
  //   BUN_RUNTIME_TRANSPILER_CACHE_PATH: '/workspaces/.bun-cache',
  //   BUN_INSTALL_BIN: '/home/dev-user/.bun/bin',
  // },
};
