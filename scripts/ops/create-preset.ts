#!/usr/bin/env bun
/**
 * プリセット作成スクリプト
 *
 * 新しいプリセットのスキャフォールドを生成し、
 * index.ts を自動更新します。
 *
 * 使用方法:
 *   bun run create-preset rust
 *   bun run create-preset my-preset
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PRESETS_DIR = join(import.meta.dir, '../../src/config/presets');
const INDEX_FILE = join(PRESETS_DIR, 'index.ts');

/**
 * プリセット名をキャメルケースに変換
 * rust -> rust
 * my-preset -> myPreset
 */
function toCamelCase(name: string): string {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * プリセット名をパスカルケースに変換
 * rust -> Rust
 * my-preset -> MyPreset
 */
function toPascalCase(name: string): string {
  const camel = toCamelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * プリセットファイルのテンプレートを生成
 */
function generatePresetTemplate(name: string): string {
  const pascalName = toPascalCase(name);

  return `import type { DevContainerConfig } from '../../types';

/**
 * ${pascalName} Preset
 *
 * TODO: プリセットの説明を記述
 *
 * 含まれる設定:
 * - base.ts: 共通設定（自動的に継承）
 * - TODO: このプリセット固有の設定
 */
export const ${toCamelCase(name)}Preset: DevContainerConfig = {
  name: '${pascalName} Development',

  // TODO: プリセット固有の features を追加
  // features: {
  //   'ghcr.io/devcontainers/features/xxx:1': {},
  // },

  // TODO: プリセット固有の VS Code 拡張機能と設定を追加
  // customizations: {
  //   vscode: {
  //     extensions: [
  //       // 拡張機能 ID
  //     ],
  //     settings: {
  //       // VS Code 設定
  //     },
  //   },
  // },

  // TODO: 必要に応じて環境変数を追加
  // containerEnv: {},
  // remoteEnv: {},

  // TODO: 必要に応じてセットアップコマンドを追加
  // postCreateCommand: '',
};
`;
}

/**
 * index.ts を更新してプリセットを追加
 */
async function updateIndexFile(name: string): Promise<void> {
  const content = await readFile(INDEX_FILE, 'utf-8');
  const camelName = toCamelCase(name);
  const pascalName = toPascalCase(name);

  // 既にプリセットが存在するかチェック
  if (content.includes(`${camelName}Preset`)) {
    throw new Error(`Preset '${name}' already exists in index.ts`);
  }

  const lines = content.split('\n');
  const newLines: string[] = [];

  let importInserted = false;
  let presetsInserted = false;
  let metadataInserted = false;
  let inPresetsObject = false;
  let inMetadataObject = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // インポート文を追加（最後のインポート文の後）
    if (!importInserted && line.startsWith('import ')) {
      newLines.push(line);
      // 次の行がインポートでなければ、ここでインポートを追加
      if (i + 1 < lines.length && !lines[i + 1].startsWith('import ')) {
        newLines.push(`import { ${camelName}Preset } from './${name}';`);
        importInserted = true;
      }
      continue;
    }

    // PRESETS オブジェクトの検出
    if (line.includes('export const PRESETS')) {
      inPresetsObject = true;
    }

    // PRESETS オブジェクトの終端でエントリを追加
    if (inPresetsObject && line.trim() === '};') {
      if (!presetsInserted) {
        newLines.push(`  ${camelName}: ${camelName}Preset,`);
        presetsInserted = true;
      }
      inPresetsObject = false;
    }

    // PRESET_METADATA オブジェクトの検出
    if (line.includes('export const PRESET_METADATA')) {
      inMetadataObject = true;
    }

    // PRESET_METADATA オブジェクトの終端でエントリを追加
    if (inMetadataObject && line.trim() === '};') {
      if (!metadataInserted) {
        newLines.push(`  ${camelName}: {`);
        newLines.push(`    name: '${pascalName}',`);
        newLines.push(`    description: 'TODO: Add description',`);
        newLines.push('  },');
        metadataInserted = true;
      }
      inMetadataObject = false;
    }

    newLines.push(line);
  }

  if (!importInserted || !presetsInserted || !metadataInserted) {
    throw new Error('Failed to update index.ts: Could not find all insertion points');
  }

  await writeFile(INDEX_FILE, newLines.join('\n'));
}

async function main() {
  const presetName = process.argv[2];

  if (!presetName) {
    console.error('Usage: bun run create-preset <preset-name>');
    console.error('Example: bun run create-preset rust');
    process.exit(1);
  }

  // 名前のバリデーション
  if (!/^[a-z][a-z0-9-]*$/.test(presetName)) {
    console.error(
      'Error: Preset name must start with lowercase letter and contain only lowercase letters, numbers, and hyphens',
    );
    process.exit(1);
  }

  const presetFile = join(PRESETS_DIR, `${presetName}.ts`);

  // 既存ファイルのチェック
  if (existsSync(presetFile)) {
    console.error(`Error: Preset file already exists: ${presetFile}`);
    process.exit(1);
  }

  console.log(`\n🔨 Creating preset: ${presetName}\n`);

  // プリセットファイルの生成
  const template = generatePresetTemplate(presetName);
  await writeFile(presetFile, template);
  console.log(`✅ Created: ${presetFile}`);

  // index.ts の更新
  try {
    await updateIndexFile(presetName);
    console.log(`✅ Updated: ${INDEX_FILE}`);
  } catch (error) {
    console.error(`❌ Failed to update index.ts: ${error}`);
    console.log('\n📝 Please manually update src/config/presets/index.ts:');
    console.log(
      `   1. Add import: import { ${toCamelCase(presetName)}Preset } from './${presetName}';`,
    );
    console.log(
      `   2. Add to PRESETS: ${toCamelCase(presetName)}: ${toCamelCase(presetName)}Preset,`,
    );
    console.log(
      `   3. Add to PRESET_METADATA: ${toCamelCase(presetName)}: { name: '${toPascalCase(presetName)}', description: '...' },`,
    );
    process.exit(1);
  }

  console.log('\n✨ Preset scaffold created successfully!\n');
  console.log('📝 Next steps:');
  console.log(`   1. Edit ${presetFile} to add your preset configuration`);
  console.log(`   2. Update the description in src/config/presets/index.ts`);
  console.log('   3. Run `bun run build` and `bun run build:cli` to verify');
  console.log('   4. Run `bun test` to ensure all tests pass\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
