import type { DevContainerConfig } from '../../types';

/**
 * DevContainer ユーザー名
 */
const DEVCONTAINER_USER = 'dev-user';

/**
 * Haskell Preset
 *
 * Haskell 開発環境を構築するためのプリセット
 * - GHC（Glasgow Haskell Compiler）
 * - Cabal パッケージマネージャー
 * - Stack ビルドツール
 * - HLS（Haskell Language Server）
 * - VS Code の Haskell 拡張機能
 */
export const haskellPreset: DevContainerConfig = {
  name: 'Haskell Base',
  image: 'mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye',

  // Haskell 開発環境のセットアップ
  // - GHC、Cabal、Stack、HLS を推奨バージョンでインストール
  features: {
    'ghcr.io/devcontainers-extra/features/haskell:3': {
      ghcVersion: 'recommended',
      cabalVersion: 'recommended',
      stackVersion: 'recommended',
      hlsVersion: 'recommended',
      installStack: true,
      installHLS: true,
    },
  },

  customizations: {
    vscode: {
      extensions: [
        // Haskell 開発支援
        'haskell.haskell',
      ],

      settings: {
        // Haskell 固有の VS Code 設定
        '[haskell]': {
          'editor.formatOnSave': true,
        },
      },
    },
  },

  // PATH設定：Haskell ツールチェーンのバイナリを優先
  // base.ts の PATH に加えて、ghcup、Cabal、Stack のバイナリディレクトリを前に追加
  remoteEnv: {
    PATH: `/home/${DEVCONTAINER_USER}/.ghcup/bin:/home/${DEVCONTAINER_USER}/.cabal/bin:/home/${DEVCONTAINER_USER}/.local/bin:/home/${DEVCONTAINER_USER}/.bun/bin:\${containerEnv:PATH}`,
  },

  // 追加の開発ツール
  // Bun は base で既にインストール済み
  postCreateCommand: 'npm install -g pnpm',
};
