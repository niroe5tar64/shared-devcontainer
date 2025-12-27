import type { PresetConfig } from '../types';

/**
 * Node.js/TypeScript Preset
 *
 * Node.js 20 + Bun + pnpm
 * ESLint + Prettier
 */
export const nodePreset: PresetConfig = {
  name: 'Node.js Base',
  image: 'mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye',

  features: {
    'ghcr.io/devcontainers/features/node:1': {
      version: '20',
      nodeGypDependencies: true,
    },
  },

  extensions: [
    // Node.js/TypeScript 開発
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'orta.vscode-jest',

    // Package.json 支援
    'christian-kohler.npm-intellisense',
  ],

  settings: {
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
    '[javascript]': {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    },
    '[typescript]': {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    },
    'eslint.validate': ['javascript', 'typescript'],
  },

  postCreateCommand: 'npm install -g bun pnpm',
};
