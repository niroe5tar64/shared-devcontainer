import { defineCommand } from 'citty';
import { PRESET_METADATA } from '../../config/presets/index';

export const listPresets = defineCommand({
  meta: {
    name: 'list-presets',
    description: 'List available presets',
  },
  async run() {
    console.log('📦 Available Presets:\n');

    for (const [key, preset] of Object.entries(PRESET_METADATA)) {
      console.log(`  ${key.padEnd(12)} - ${preset.name}`);
      console.log(`  ${' '.repeat(16)}${preset.description}`);
      console.log('');
    }

    console.log('Usage: npx @niroe5tar64/devcontainer init --preset <name>');
  },
});
