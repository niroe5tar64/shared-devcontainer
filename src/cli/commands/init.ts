import { defineCommand } from 'citty';
import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import type { DevContainerConfig } from '../../types';
import { bunPreset } from '../../config/presets/bun';
import { fullstackPreset } from '../../config/presets/fullstack';
import { nodePreset } from '../../config/presets/node';
import { pythonPreset } from '../../config/presets/python';
import { writingPreset } from '../../config/presets/writing';
import { generatePresetConfig, writeJsonFile } from '../../lib/devcontainer-builder';

const PRESETS: Record<string, DevContainerConfig> = {
  node: nodePreset,
  python: pythonPreset,
  fullstack: fullstackPreset,
  writing: writingPreset,
  bun: bunPreset,
};

/**
 * project-config.ts を読み込む
 */
async function loadProjectConfig(configDir: string): Promise<DevContainerConfig | undefined> {
  const configPath = join(configDir, 'project-config.ts');

  if (!existsSync(configPath)) {
    return undefined;
  }

  try {
    console.log(`📝 Loading project-specific config from: ${configPath}`);
    const jiti = createJiti(import.meta.url);
    const module = await jiti.import(configPath);
    return module.default || module.projectConfig;
  } catch (error) {
    console.warn(`⚠️  Failed to load project config: ${error}`);
    return undefined;
  }
}

/**
 * テンプレートファイルをコピー
 */
async function copyTemplates(outputDir: string, templateDir: string) {
  console.log('\n📦 Copying template files...');

  // bin/ のコピー
  await mkdir(join(outputDir, 'bin'), { recursive: true });
  await cp(join(templateDir, 'bin'), join(outputDir, 'bin'), {
    recursive: true,
  });
  console.log(`✅ Copied: ${join(outputDir, 'bin')}`);

  // initialize.sh のコピー
  await copyFile(
    join(templateDir, 'initialize.sh'),
    join(outputDir, 'initialize.sh'),
  );
  console.log(`✅ Copied: ${join(outputDir, 'initialize.sh')}`);

  // post-create.sh のコピー
  await copyFile(
    join(templateDir, 'post-create.sh'),
    join(outputDir, 'post-create.sh'),
  );
  console.log(`✅ Copied: ${join(outputDir, 'post-create.sh')}`);
}

export const init = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize DevContainer configuration',
  },
  args: {
    preset: {
      type: 'string',
      description: 'Preset name (node, python, fullstack, writing, bun)',
      alias: 'p',
    },
    output: {
      type: 'string',
      description: 'Output directory',
      alias: 'o',
      default: '.devcontainer',
    },
    force: {
      type: 'boolean',
      description: 'Overwrite existing files',
      alias: 'f',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Show what would be done without making changes',
      default: false,
    },
  },
  async run({ args }) {
    const outputDir = resolve(args.output);
    const dryRun = args['dry-run'];

    console.log('🔨 Initializing DevContainer configuration...\n');

    // preset の取得
    let preset: DevContainerConfig | undefined = undefined;
    if (args.preset) {
      preset = PRESETS[args.preset];
      if (!preset) {
        console.error(`❌ Error: Unknown preset "${args.preset}"`);
        console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
        process.exit(1);
      }
      console.log(`📦 Using preset: ${args.preset}`);
    } else {
      console.log('📦 Using base configuration only (no preset)');
    }

    // 既存ファイルのチェック
    const devcontainerJsonPath = join(outputDir, 'devcontainer.json');
    if (existsSync(devcontainerJsonPath) && !args.force) {
      console.error(`❌ Error: ${devcontainerJsonPath} already exists`);
      console.error('Use --force to overwrite');
      process.exit(1);
    }

    // project-config.ts の読み込み
    const projectConfig = await loadProjectConfig(outputDir);

    // 設定のマージ
    const config = generatePresetConfig(preset, projectConfig);

    if (dryRun) {
      console.log('\n📋 Dry run mode - no files will be created');
      console.log(`\nWould create: ${devcontainerJsonPath}`);
      console.log(`Would copy templates to: ${outputDir}`);
      return;
    }

    // ディレクトリ作成
    await mkdir(outputDir, { recursive: true });

    // devcontainer.json の生成
    await writeJsonFile(devcontainerJsonPath, config);

    // テンプレートファイルのコピー
    // パッケージのルートディレクトリからtemplates/を見つける
    // ビルド後は dist/cli/index.js なので、../../templates になる
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = resolve(__filename, '..');
    const packageRoot = resolve(__dirname, '../..');
    const templateDir = join(packageRoot, 'templates');

    await copyTemplates(outputDir, templateDir);

    console.log('\n✨ DevContainer configuration generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open your project in VS Code');
    console.log('   2. Dev Containers: Reopen in Container');
  },
});
