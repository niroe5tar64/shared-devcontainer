import type { BaseConfig } from './types';

/**
 * Base DevContainer Configuration
 *
 * すべてのプロジェクトで共通の設定を定義します。
 * - AI 開発ツール（Claude Code, GitHub Copilot）
 * - Git ツール
 * - 基本エディタ設定
 */
export const base: BaseConfig = {
  features: {
    'ghcr.io/devcontainers/features/git:1': {
      version: 'latest',
    },
    'ghcr.io/devcontainers/features/github-cli:1': {
      version: 'latest',
    },
    'ghcr.io/devcontainers/features/common-utils:2': {
      installZsh: true,
      installOhMyZsh: true,
      upgradePackages: true,
    },
  },

  extensions: [
    // AI アシスタント
    'GitHub.copilot',
    'GitHub.copilot-chat',
    'anthropic.claude-code',

    // Git 関連
    'eamodio.gitlens',

    // エディタ支援
    'usernamehw.errorlens',
    'wayou.vscode-todo-highlight',
  ],

  settings: {
    // エディタ基本設定
    'editor.formatOnSave': true,
    'editor.codeActionsOnSave': {
      'source.fixAll': 'explicit',
    },
    'files.autoSave': 'onFocusChange',
    'files.trimTrailingWhitespace': true,

    // Git 設定
    'git.autofetch': true,
    'git.confirmSync': false,
  },

  // 開発ツールと AI アシスタントをすべての環境に標準装備
  // 1. 基本ツール（vim, tree, jq）
  // 2. Bun（高速パッケージマネージャー）
  // 3. AI 開発ツール（Claude Code, Codex）を Bun でインストール
  postCreateCommand: 'sudo apt-get update && sudo apt-get install -y vim tree jq && sudo npm install -g bun && sudo bun install -g @anthropic-ai/claude-code@latest @openai/codex@latest',

  remoteUser: 'vscode',
};
