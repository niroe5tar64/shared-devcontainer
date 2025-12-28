import type { BaseConfig } from './types';

/**
 * Base DevContainer Configuration
 *
 * すべてのプロジェクトで共通の設定を定義します。
 * - AI 開発ツール（Claude Code, Codex）
 * - Git ツール
 * - 基本エディタ設定
 * - 開発ツール（vim, tree, jq, Bun）
 */
export const base: BaseConfig = {
  image: 'mcr.microsoft.com/devcontainers/base:ubuntu',

  features: {
    'ghcr.io/devcontainers/features/git:1': {
      version: 'latest',
    },
    'ghcr.io/devcontainers/features/github-cli:1': {
      version: 'latest',
    },
    'ghcr.io/devcontainers/features/node:1': {
      version: 'lts',
    },
    'ghcr.io/devcontainers/features/common-utils:2': {
      installZsh: true,
      installOhMyZsh: true,
      upgradePackages: true,
      username: 'dev-user',
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

  // PATH設定：プロジェクトのラッパースクリプトとユーザーローカルのバイナリを優先
  remoteEnv: {
    PATH: '/workspaces/shared-devcontainer/.devcontainer/bin:${containerEnv:HOME}/.local/bin:${containerEnv:HOME}/.bun/bin:${containerEnv:PATH}',
  },

  // 認証情報の永続化：ホストマシンとバインドマウントで共有
  mounts: [
    'source=${localEnv:HOME}/.claude,target=/home/dev-user/.claude,type=bind',
    'source=${localEnv:HOME}/.codex,target=/home/dev-user/.codex,type=bind',
  ],

  // 開発ツールと AI アシスタントをすべての環境に標準装備
  // 1. 基本ツール（vim, tree, jq）
  // 2. Bun（高速パッケージマネージャー）
  // 3. AI 開発ツール（Claude Code, Codex）のインストールとラッパースクリプト設定
  postCreateCommand: 'bash .devcontainer/post-create.sh',

  remoteUser: 'dev-user',
};
