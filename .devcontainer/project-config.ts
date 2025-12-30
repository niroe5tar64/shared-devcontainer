/**
 * このプロジェクト固有のDevContainer設定
 *
 * base + (preset) + この設定 がマージされて
 * .devcontainer/devcontainer.json が生成されます
 *
 * preset を使用する場合は、ビルド時に引数で指定：
 *   bun run build node  # node preset を使用
 */

import type { DevContainerConfig } from '../src/types';

export const projectConfig: DevContainerConfig = {
  name: 'Shared DevContainer Development',

  // このプロジェクト自身では .devcontainer/post-create.sh を参照
  postCreateCommand: 'bash .devcontainer/post-create.sh',
};

/**
 * JSON に含める追加フィールド
 * （DevContainerConfig 型には含まれないが、JSON としては有効）
 */
export const projectConfigMetadata = {
  $comment: 'チーム共通DevContainer設定の開発環境',
};
