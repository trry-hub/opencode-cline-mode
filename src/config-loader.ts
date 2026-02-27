import { readFileSync } from 'fs';
import { validateConfig, mergeWithDefaults, getDefaultConfig } from './config-validator.js';
import { resolveConfigPath } from './path-resolver.js';
import type { PluginConfig } from './types.js';

/**
 * Load plugin configuration from file or return defaults
 */
export function loadPluginConfig(directory: string): Required<PluginConfig> {
  const configPath = resolveConfigPath(directory);

  if (!configPath) {
    return getDefaultConfig();
  }

  try {
    const content = readFileSync(configPath, 'utf-8').trim();

    if (!content) {
      console.warn(`Config file is empty at ${configPath}. Using defaults.`);
      return getDefaultConfig();
    }

    let userConfig: PluginConfig;
    try {
      userConfig = JSON.parse(content) as PluginConfig;
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        console.warn(
          `Invalid JSON in config file ${configPath}:\n` +
            `  Error: ${parseError.message}\n` +
            `  Suggestion: Validate JSON at https://jsonlint.com/\n` +
            `Using defaults.`
        );
      } else {
        console.warn(`Failed to parse config at ${configPath}:`, parseError);
      }
      return getDefaultConfig();
    }

    const validation = validateConfig(userConfig);

    if (!validation.valid) {
      console.warn(
        `Invalid config at ${configPath}:\n${validation.errors.join('\n')}\nUsing defaults.`
      );
      return getDefaultConfig();
    }

    return mergeWithDefaults(userConfig);
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code === 'EACCES') {
      console.warn(`Permission denied reading config at ${configPath}. Using defaults.`);
    } else if (fsError.code === 'ENOENT') {
      console.warn(`Config file not found at ${configPath}. Using defaults.`);
    } else {
      console.warn(`Failed to load config from ${configPath}:`, error);
    }
    return getDefaultConfig();
  }
}
