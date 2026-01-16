import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineCommand } from 'citty';
import { createJiti } from 'jiti';
import { PRESETS } from '../../config/presets/index';
import { generatePresetConfig, writeJsonFile } from '../../lib/devcontainer-builder';
import type { DevContainerConfig } from '../../types';

/**
 * 値が DevContainerConfig かどうかを検証する型ガード
 */
function isDevContainerConfig(value: unknown): value is DevContainerConfig {
  return typeof value === 'object' && value !== null;
}

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
    const module = (await jiti.import(configPath)) as Record<string, unknown>;
    const config = module.default ?? module.projectConfig;
    return isDevContainerConfig(config) ? config : undefined;
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
  await copyFile(join(templateDir, 'initialize.sh'), join(outputDir, 'initialize.sh'));
  console.log(`✅ Copied: ${join(outputDir, 'initialize.sh')}`);

  // post-create.sh のコピー
  await copyFile(join(templateDir, 'post-create.sh'), join(outputDir, 'post-create.sh'));
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
    let preset: DevContainerConfig | undefined;
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
