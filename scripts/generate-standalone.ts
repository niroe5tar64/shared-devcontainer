#!/usr/bin/env bun

/**
 * プリセットから完全なdevcontainer.jsonを生成するスクリプト
 * サブモジュールとして使う場合、extendsが動作しないため
 * このスクリプトで完全な設定ファイルを生成する
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const presetName = process.argv[2];
const outputPath = process.argv[3];

if (!presetName || !outputPath) {
	console.error("Usage: bun run generate-standalone <preset-name> <output-path>");
	console.error('Example: bun run generate-standalone writing ../ai-writing-starter/.devcontainer/devcontainer.json');
	process.exit(1);
}

const presetPath = resolve(import.meta.dir, `../dist/presets/${presetName}.json`);
const outputFullPath = resolve(outputPath);

try {
	const presetContent = readFileSync(presetPath, "utf-8");
	const preset = JSON.parse(presetContent);

	// post-create.sh のパスを調整
	if (preset.postCreateCommand) {
		preset.postCreateCommand = "bash ./.devcontainer/shared/dist/post-create.sh";
	}

	// コメントを追加
	const output = {
		$comment: [
			"このファイルは shared-devcontainer から自動生成されました",
			`生成元: dist/presets/${presetName}.json`,
			"手動編集せず、必要に応じて再生成してください",
			`再生成コマンド: cd .devcontainer/shared && bun run generate-standalone ${presetName} ${outputPath}`
		],
		...preset
	};

	writeFileSync(outputFullPath, JSON.stringify(output, null, 2));
	console.log(`✅ Generated: ${outputFullPath}`);
	console.log(`   From: ${presetPath}`);
} catch (error) {
	console.error("❌ Error:", error);
	process.exit(1);
}
