import type { DevContainerConfig } from '../../types';
import { bunPreset } from './bun';
import { haskellPreset } from './haskell';

export const PRESETS: Record<string, DevContainerConfig> = {
  bun: bunPreset,
  haskell: haskellPreset,
};

export const PRESET_METADATA: Record<string, { name: string; description: string }> = {
  bun: {
    name: 'Bun',
    description: 'Bun development environment',
  },
  haskell: {
    name: 'Haskell',
    description: 'Haskell development environment with GHC, Cabal, Stack, and HLS',
  },
};
