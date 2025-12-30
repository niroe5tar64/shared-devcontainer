/**
 * プロジェクト固有の DevContainer 設定例
 *
 * ファイル名: .devcontainer/shared/client-config.ts
 *
 * このファイルを作成すると、bun run build:client 実行時に
 * base + preset + この設定がマージされます。
 */

import type { DevContainerConfig } from './src/types';

export const clientConfig: DevContainerConfig = {
  // プロジェクト固有のポートフォワード
  forwardPorts: [3000, 8080],

  // プロジェクト固有の拡張機能
  customizations: {
    vscode: {
      extensions: [
        // プロジェクト特有の拡張機能を追加
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode',
      ],
      settings: {
        // プロジェクト固有の設定
        'typescript.tsdk': 'node_modules/typescript/lib',
      },
    },
  },

  // プロジェクト固有の環境変数
  containerEnv: {
    PROJECT_NAME: 'my-awesome-project',
    NODE_ENV: 'development',
  },

  // プロジェクト固有のセットアップコマンドを追加
  // 注: base と preset の postCreateCommand と結合されます
  postCreateCommand: 'npm install && npm run setup',
};

export default clientConfig;
