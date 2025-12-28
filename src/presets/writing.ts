import type { DevContainerConfig } from '../types';

/**
 * AI Writing / Content Creation Preset
 *
 * Bun + Biome + Markdown tooling
 * Optimized for AI-assisted writing workflows
 */
export const writingPreset: DevContainerConfig = {
  name: 'AI Writing Base',
  image: 'mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye',

  features: {
    'ghcr.io/devcontainers/features/node:1': {
      version: '20',
      nodeGypDependencies: true,
    },
  },

  customizations: {
    vscode: {
      extensions: [
        // Bun support
        'oven.bun-vscode',

        // Linting and formatting
        'dbaeumer.vscode-eslint',
        'biomejs.biome',

        // Markdown and documentation
        'bierner.markdown-mermaid',

        // Git tools
        'mhutchie.git-graph',
      ],

      settings: {
        'editor.formatOnSave': true,
        'editor.defaultFormatter': 'biomejs.biome',
        '[markdown]': {
          'editor.defaultFormatter': 'biomejs.biome',
        },
        '[typescript]': {
          'editor.defaultFormatter': 'biomejs.biome',
        },
      },
    },
  },

  remoteEnv: {
    CODEX_HOME: '/workspace/.codex',
  },

  postCreateCommand: 'bun install',
};
