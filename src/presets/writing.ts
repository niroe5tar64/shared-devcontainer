import type { DevContainerConfig } from '../types';

/**
 * AI Writing / Content Creation Preset
 *
 * base.ts の設定をそのまま継承。
 * 将来的にプロジェクト固有の設定を追加する場合はここで定義可能。
 */
export const writingPreset: DevContainerConfig = {
  name: 'AI Writing Base',
};
