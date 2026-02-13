import { readFileSync } from 'fs';
import { validateConfig, mergeWithDefaults, getDefaultConfig } from './config-validator';
import { resolveConfigPath } from './path-resolver';
import type { PluginConfig } from './types';

export function loadPluginConfig(directory: string): Required<PluginConfig> {
  const configPath = resolveConfigPath(directory);

  if (!configPath) {
    return getDefaultConfig();
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content) as PluginConfig;

    const validation = validateConfig(userConfig);

    if (!validation.valid) {
      console.warn(
        `Invalid config at ${configPath}:\n${validation.errors.join('\n')}\nUsing defaults.`
      );
      return getDefaultConfig();
    }

    return mergeWithDefaults(userConfig);
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error);
    return getDefaultConfig();
  }
}
