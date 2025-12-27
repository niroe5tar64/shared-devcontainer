/**
 * DevContainer Configuration Types
 * Based on: https://containers.dev/implementors/json_schema/
 */

export interface DevContainerFeature {
  [key: string]: Record<string, unknown> | string | boolean;
}

export interface VSCodeExtension {
  extensions?: string[];
  settings?: Record<string, unknown>;
}

export interface DevContainerCustomizations {
  vscode?: VSCodeExtension;
}

export interface DevContainerMount {
  source?: string;
  target?: string;
  type?: string;
}

/**
 * Complete DevContainer Configuration
 */
export interface DevContainerConfig {
  $schema?: string;
  name?: string;
  image?: string;
  features?: DevContainerFeature;
  customizations?: DevContainerCustomizations;
  forwardPorts?: number[];
  postCreateCommand?: string | string[];
  postStartCommand?: string | string[];
  postAttachCommand?: string | string[];
  remoteUser?: string;
  containerEnv?: Record<string, string>;
  mounts?: (DevContainerMount | string)[];
}

/**
 * Base Configuration (shared settings)
 */
export interface BaseConfig {
  features: DevContainerFeature;
  extensions: string[];
  settings: Record<string, unknown>;
  postCreateCommand?: string;
  remoteUser: string;
}

/**
 * Preset Configuration (extends base)
 */
export interface PresetConfig {
  name: string;
  image: string;
  features: DevContainerFeature;
  extensions: string[];
  settings?: Record<string, unknown>;
  mounts?: (DevContainerMount | string)[];
  postCreateCommand?: string | string[];
}
