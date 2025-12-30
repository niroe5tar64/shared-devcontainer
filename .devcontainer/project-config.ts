/**
 * このプロジェクト固有のDevContainer設定
 *
 * base + (preset) + この設定 がマージされて
 * .devcontainer/devcontainer.json が生成されます
 */

import type { DevContainerConfig } from '../src/types';

/**
 * 使用するプリセット名（オプション）
 * undefined の場合は base + projectConfig のみ
 *
 * 利用可能なプリセット: 'node' | 'python' | 'fullstack' | 'writing'
 */
export const presetName: string | undefined = undefined;

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
