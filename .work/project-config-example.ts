/**
 * プロジェクト固有の DevContainer 設定例
 *
 * ファイル名: .devcontainer/project-config.ts
 *
 * このファイルを作成すると、ビルド時に
 * base + preset + この設定がマージされます。
 *
 * - Self DevContainer: bun run build
 * - Client DevContainer: bun run build:client <preset-name>
 */

// 型定義のインポート（利用側プロジェクトでのパス例）
// import type { DevContainerConfig } from './shared/src/types';

/**
 * 使用するプリセット名（オプション）
 * Self DevContainer の場合のみ使用
 * Client DevContainer では build:client の引数で指定
 *
 * 利用可能なプリセット: 'node' | 'python' | 'fullstack' | 'writing'
 */
// export const presetName: string | undefined = 'node';

export const projectConfig /*: DevContainerConfig */ = {
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

export default projectConfig;
