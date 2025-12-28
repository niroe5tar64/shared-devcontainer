#!/bin/bash
set -e

# スクリプトのディレクトリを取得（サブモジュール対応）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Update system packages
sudo apt-get update
sudo apt-get install -y vim tree jq unzip

# Install bun
curl -fsSL https://bun.sh/install | bash

# Add bun to PATH for bash and zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc

# Update PATH for current session
export PATH="$HOME/.bun/bin:$PATH"

# Install CLI tools (npm) - check if npm packages are installed (not just command exists)
if ! npm list -g @anthropic-ai/claude-code @openai/codex &> /dev/null; then
    echo "Installing Claude Code and Codex CLI tools..."
    npm install -g @anthropic-ai/claude-code @openai/codex
else
    echo "Claude Code and Codex CLI tools already installed, skipping..."
fi

# Install wrapper scripts for claude and codex
mkdir -p ~/.local/bin
cp "${SCRIPT_DIR}/bin/claude" ~/.local/bin/claude
cp "${SCRIPT_DIR}/bin/codex" ~/.local/bin/codex
chmod +x ~/.local/bin/claude ~/.local/bin/codex

# Add ~/.local/bin to PATH (prepend to ensure wrappers are found first)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
