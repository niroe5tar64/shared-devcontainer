#!/usr/bin/env node

import { defineCommand, runMain } from 'citty';
import { version } from '../../package.json';
import { init } from './commands/init';
import { listPresets } from './commands/list-presets';

const main = defineCommand({
  meta: {
    name: 'devcontainer',
    version,
    description: 'DevContainer configuration generator',
  },
  subCommands: {
    init,
    'list-presets': listPresets,
  },
});

runMain(main);
