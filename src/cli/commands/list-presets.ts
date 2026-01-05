import { defineCommand } from 'citty';

const PRESETS = {
  node: {
    name: 'Node.js/TypeScript',
    description: 'Node.js and TypeScript development environment',
  },
  python: {
    name: 'Python',
    description: 'Python development environment',
  },
  fullstack: {
    name: 'Full-stack',
    description: 'Full-stack development with Docker-in-Docker',
  },
  writing: {
    name: 'AI Writing',
    description: 'AI-assisted writing environment',
  },
  bun: {
    name: 'Bun',
    description: 'Bun development environment',
  },
};

export const listPresets = defineCommand({
  meta: {
    name: 'list-presets',
    description: 'List available presets',
  },
  async run() {
    console.log('📦 Available Presets:\n');

    for (const [key, preset] of Object.entries(PRESETS)) {
      console.log(`  ${key.padEnd(12)} - ${preset.name}`);
      console.log(`  ${' '.repeat(16)}${preset.description}`);
      console.log('');
    }

    console.log('Usage: npx @niroe5tar64/devcontainer init --preset <name>');
  },
});
