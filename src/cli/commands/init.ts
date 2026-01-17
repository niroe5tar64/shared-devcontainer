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
 * DevContainerConfig で使用される既知のフィールド
 * 完全なリストではないが、よく使われるフィールドをカバー
 */
const KNOWN_DEVCONTAINER_FIELDS = new Set([
  'name',
  'image',
  'dockerFile',
  'build',
  'features',
  'customizations',
  'forwardPorts',
  'portsAttributes',
  'postCreateCommand',
  'postStartCommand',
  'postAttachCommand',
  'containerEnv',
  'remoteEnv',
  'remoteUser',
  'mounts',
  'runArgs',
  'workspaceFolder',
  'workspaceMount',
  'shutdownAction',
  'overrideCommand',
  'initializeCommand',
  'onCreateCommand',
  'updateContentCommand',
  'waitFor',
  'userEnvProbe',
  'hostRequirements',
  'privileged',
  'capAdd',
  'securityOpt',
  '$schema',
]);

/**
 * 値が DevContainerConfig かどうかを検証する型ガード
 *
 * DevContainer 仕様では空オブジェクト {} も有効な設定のため、
 * 以下の条件で検証する：
 * 1. null でないオブジェクトである
 * 2. 配列ではない
 * 3. 既知の DevContainer フィールドを持つか、空オブジェクトである
 */
function isDevContainerConfig(value: unknown): value is DevContainerConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);

  // 空オブジェクトは有効（DevContainer 仕様で許可）
  if (keys.length === 0) {
    return true;
  }

  // 少なくとも1つの既知フィールドを持つか確認
  const hasKnownField = keys.some((key) => KNOWN_DEVCONTAINER_FIELDS.has(key));
  if (!hasKnownField) {
    console.warn(
      `⚠️  project-config.ts has no recognized DevContainer fields. Found: ${keys.join(', ')}`,
    );
  }

  return true;
}

/**
 * project-config.ts の読み込み結果
 */
interface ProjectConfigResult {
  projectConfig?: DevContainerConfig;
  projectConfigMetadata?: Record<string, unknown>;
}

/**
 * project-config.ts を読み込む
 */
async function loadProjectConfig(configDir: string): Promise<ProjectConfigResult> {
  const configPath = join(configDir, 'project-config.ts');

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    console.log(`📝 Loading project-specific config from: ${configPath}`);
    const jiti = createJiti(import.meta.url);
    const module = (await jiti.import(configPath)) as Record<string, unknown>;

    // named export の projectConfig を優先（module.default はモジュール全体を返すことがある）
    const config = module.projectConfig ?? module.default;
    const metadata = module.projectConfigMetadata as Record<string, unknown> | undefined;

    return {
      projectConfig: isDevContainerConfig(config) ? config : undefined,
      projectConfigMetadata: metadata,
    };
  } catch (error) {
    console.warn(`⚠️  Failed to load project config: ${error}`);
    return {};
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
      description: 'Preset name (bun, haskell)',
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
    const { projectConfig, projectConfigMetadata } = await loadProjectConfig(outputDir);

    // 設定のマージ
    const config = generatePresetConfig(preset, projectConfig);

    // メタデータ（$comment など）をマージ
    const devContainerConfig = {
      ...projectConfigMetadata,
      ...config,
    };

    if (dryRun) {
      console.log('\n📋 Dry run mode - no files will be created');
      console.log(`\nWould create: ${devcontainerJsonPath}`);
      console.log(`Would copy templates to: ${outputDir}`);
      return;
    }

    // ディレクトリ作成
    await mkdir(outputDir, { recursive: true });

    // devcontainer.json の生成
    await writeJsonFile(devcontainerJsonPath, devContainerConfig);

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
