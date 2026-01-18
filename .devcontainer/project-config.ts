/**
 * このプロジェクト固有のDevContainer設定
 *
 * base + (preset) + この設定 がマージされて
 * .devcontainer/devcontainer.json が生成されます
 *
 * preset を使用する場合は、ビルド時に引数で指定：
 *   bun run build bun  # bun preset を使用
 */

import type { DevContainerConfig } from '../src/types';

export const projectConfig: DevContainerConfig = {
  name: 'Shared DevContainer Development',

  // postCreateCommand は base.ts で定義されているため、ここでは上書きしない
  // これにより Self と CLI で同じマージルールが適用される
};

/**
 * JSON に含める追加フィールド
 * （DevContainerConfig 型には含まれないが、JSON としては有効）
 */
export const projectConfigMetadata = {
  $comment: 'チーム共通DevContainer設定の開発環境',
};
