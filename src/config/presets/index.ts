import type { DevContainerConfig } from '../../types';
import { bunPreset } from './bun';
import { fullstackPreset } from './fullstack';
import { nodePreset } from './node';
import { pythonPreset } from './python';
import { writingPreset } from './writing';

export const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
  bun: bunPreset,
};

export const PRESET_METADATA: Record<string, { name: string; description: string }> = {
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
