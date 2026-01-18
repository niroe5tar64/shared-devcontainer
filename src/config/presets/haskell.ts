import type { DevContainerConfig } from '../../types';

/**
 * DevContainer ユーザー名
 *
 * 環境変数 DEVCONTAINER_USER で上書き可能。
 * 例: DEVCONTAINER_USER=myuser bun run build
 */
const DEVCONTAINER_USER = process.env.DEVCONTAINER_USER || 'dev-user';

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
  // ghcup、Cabal、Stack のバイナリディレクトリを追加
  // base.ts の PATH は自動的に連結される
  remoteEnv: {
    PATH: `/home/${DEVCONTAINER_USER}/.ghcup/bin:/home/${DEVCONTAINER_USER}/.cabal/bin`,
  },

  // Haskell 開発環境のセットアップ
  // - libgmp-dev をインストール（GHC の依存関係）
  // - ghcup インストーラーを使用して以下をセットアップ:
  //   - GHC 9.8.4（最新安定版）
  //   - Cabal 3.12.1.0
  //   - Stack（最新版）
  //   - HLS（Haskell Language Server、最新版）
  postCreateCommand:
    'sudo apt-get update && sudo apt-get install -y libgmp-dev && curl --proto "=https" --tlsv1.2 -sSf https://get-ghcup.haskell.org | BOOTSTRAP_HASKELL_NONINTERACTIVE=1 BOOTSTRAP_HASKELL_GHC_VERSION=9.8.4 BOOTSTRAP_HASKELL_CABAL_VERSION=3.12.1.0 BOOTSTRAP_HASKELL_INSTALL_STACK=1 BOOTSTRAP_HASKELL_INSTALL_HLS=1 sh',
};
