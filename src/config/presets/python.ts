import type { DevContainerConfig } from '../types';

/**
 * Python Preset
 *
 * Python 3.11 + Poetry
 * Black + Ruff
 */
export const pythonPreset: DevContainerConfig = {
  name: 'Python Base',
  image: 'mcr.microsoft.com/devcontainers/python:1-3.11-bullseye',

  features: {
    'ghcr.io/devcontainers/features/python:1': {
      version: '3.11',
    },
  },

  customizations: {
    vscode: {
      extensions: [
        // Python 開発
        'ms-python.python',
        'ms-python.vscode-pylance',
        'ms-python.black-formatter',
        'charliermarsh.ruff',
      ],

      settings: {
        'python.defaultInterpreterPath': '/usr/local/bin/python',
        'python.formatting.provider': 'black',
        'python.linting.enabled': true,
        'python.linting.ruffEnabled': true,
        '[python]': {
          'editor.defaultFormatter': 'ms-python.black-formatter',
          'editor.formatOnSave': true,
        },
      },
    },
  },

  postCreateCommand: 'pip install --upgrade pip && pip install poetry',
};
