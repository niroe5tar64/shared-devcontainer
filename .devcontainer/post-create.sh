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
