/**
 * DevContainer Configuration Types
 */

// 公式スキーマから生成された型をインポート
export type { DevContainerConfig } from './types.generated';

/**
 * Feature設定の型
 * 各Featureは設定オプションを持つことができる
 */
export interface DevContainerFeature {
  [key: string]: Record<string, unknown> | string | boolean;
}

/**
 * Base Configuration (shared settings)
 * 簡略化されたDSL形式の設定。ビルド時に完全なDevContainerConfigに変換される。
 */
export interface BaseConfig {
  image?: string;
  features: DevContainerFeature;
  extensions: string[];
  settings: Record<string, unknown>;
  postCreateCommand?: string | string[];
  remoteUser: string;
  remoteEnv?: Record<string, string>;
  mounts?: string[];
}

/**
 * Preset Configuration (extends base)
 * 簡略化されたDSL形式の設定。ビルド時にbaseと結合され、完全なDevContainerConfigに変換される。
 */
export interface PresetConfig {
  name: string;
  image: string;
  features: DevContainerFeature;
  extensions: string[];
  settings?: Record<string, unknown>;
  mounts?: string[];
  postCreateCommand?: string | string[];
}
