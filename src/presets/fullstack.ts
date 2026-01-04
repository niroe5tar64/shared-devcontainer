import type { DevContainerConfig } from '../types';

/**
 * Fullstack Preset
 *
 * Node.js 20 + Docker-in-Docker
 * フロントエンド + バックエンド + コンテナ開発
 */
export const fullstackPreset: DevContainerConfig = {
  name: 'Fullstack Base',
  image: 'mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye',

  features: {
    'ghcr.io/devcontainers/features/node:1': {
      version: '20',
    },
    'ghcr.io/devcontainers/features/docker-in-docker:2': {
      version: 'latest',
      dockerDashComposeVersion: 'v2',
    },
  },

  customizations: {
    vscode: {
      extensions: [
        // フロントエンド
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode',
        'bradlc.vscode-tailwindcss',

        // Docker
        'ms-azuretools.vscode-docker',

        // データベース
        'mtxr.sqltools',
      ],

      settings: {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
      },
    },
  },

  mounts: ['source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind'],

  // Bun は base で既にインストール済み
  postCreateCommand: 'npm install -g pnpm',
};
