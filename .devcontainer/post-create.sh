#!/bin/bash
set -e

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

# Install CLI tools (npm)
npm install -g @anthropic-ai/claude-code @openai/codex

# Install wrapper scripts for claude and codex
mkdir -p ~/.local/bin
cp .devcontainer/bin/claude ~/.local/bin/claude
cp .devcontainer/bin/codex ~/.local/bin/codex
chmod +x ~/.local/bin/claude ~/.local/bin/codex

# Add ~/.local/bin to PATH (prepend to ensure wrappers are found first)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
