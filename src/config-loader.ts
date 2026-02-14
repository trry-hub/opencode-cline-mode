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
        const match = parseError.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1], 10) : -1;
        const line = position >= 0 ? content.substring(0, position).split('\n').length : 'unknown';

        console.warn(
          `Invalid JSON in config file ${configPath}:\n` +
            `  Error: ${parseError.message}\n` +
            `  Line: ${line}\n` +
            `  Suggestion: Validate JSON at https://jsonlint.com/ or check for trailing commas\n` +
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
