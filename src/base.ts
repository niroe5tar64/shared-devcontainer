import type { DevContainerConfig } from "./types";

/**
 * DevContainer ユーザー名
 *
 * 環境変数 DEVCONTAINER_USER で上書き可能。
 * 例: DEVCONTAINER_USER=myuser bun run build
 */
const DEVCONTAINER_USER = process.env.DEVCONTAINER_USER || "dev-user";

/**
 * Base DevContainer Configuration
 *
 * すべてのプロジェクトで共通の設定を定義します。
 * - AI 開発ツール（Claude Code, Codex）
 * - Git ツール
 * - 基本エディタ設定
 * - 開発ツール（vim, tree, jq, Bun）
 */
export const base: DevContainerConfig = {
  image: "mcr.microsoft.com/devcontainers/base:ubuntu",

  features: {
    "ghcr.io/devcontainers/features/git:1": {
      version: "latest",
    },
    "ghcr.io/devcontainers/features/github-cli:1": {
      version: "latest",
    },
    "ghcr.io/devcontainers/features/node:1": {
      version: "lts",
    },
    "ghcr.io/devcontainers/features/common-utils:2": {
      installZsh: true,
      installOhMyZsh: true,
      upgradePackages: true,
      timezone: "Asia/Tokyo",
      username: DEVCONTAINER_USER,
    },
  },

  customizations: {
    vscode: {
      extensions: [
        // AI アシスタント
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "anthropic.claude-code",

        // Git 関連
        "eamodio.gitlens",
        "mhutchie.git-graph",

        // エディタ支援
        "usernamehw.errorlens",
        "wayou.vscode-todo-highlight",

        // リンター/フォーマッター
        "biomejs.biome",

        // 開発ツール
        "oven.bun-vscode",

        // ドキュメント
        "bierner.markdown-mermaid",
      ],

      settings: {
        // エディタ基本設定
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "biomejs.biome",
        "editor.codeActionsOnSave": {
          "source.fixAll": "explicit",
        },
        "files.autoSave": "onFocusChange",
        "files.trimTrailingWhitespace": true,

        // ターミナル設定
        "terminal.integrated.defaultProfile.linux": "bash",

        // Git 設定
        "git.autofetch": true,
        "git.confirmSync": false,
      },
    },
  },

  // 環境変数の追加
  containerEnv: {
    CLAUDE_SETTINGS_PATH: "/workspaces/.claude/settings.json",
    TZ: "Asia/Tokyo",
  },

  // PATH設定：ユーザーローカルのバイナリを優先
  // ${containerEnv:HOME} は未定義のため使えない → ユーザー名変数でパスを構築
  remoteEnv: {
    PATH: `/home/${DEVCONTAINER_USER}/.local/bin:/home/${DEVCONTAINER_USER}/.bun/bin:\${containerEnv:PATH}`,
  },

  // ホストマシンとバインドマウントで共有
  mounts: [
    // Git設定とSSH鍵
    `source=\${localEnv:HOME}/.gitconfig,target=/home/${DEVCONTAINER_USER}/.gitconfig,type=bind,consistency=cached`,
    `source=\${localEnv:HOME}/.ssh,target=/home/${DEVCONTAINER_USER}/.ssh,type=bind,consistency=cached,readonly`,
    // AI開発ツールの認証情報
    `source=\${localEnv:HOME}/.claude,target=/home/${DEVCONTAINER_USER}/.claude,type=bind`,
    `source=\${localEnv:HOME}/.codex,target=/home/${DEVCONTAINER_USER}/.codex,type=bind`,
  ],

  // 開発ツールと AI アシスタントをすべての環境に標準装備
  // 1. 基本ツール（vim, tree, jq）
  // 2. Bun（高速パッケージマネージャー）
  // 3. AI 開発ツール（Claude Code, Codex）のインストールとラッパースクリプト設定
  postCreateCommand: "bash ./post-create.sh",

  remoteUser: DEVCONTAINER_USER,
};
