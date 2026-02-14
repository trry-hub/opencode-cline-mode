import { existsSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

export function resolvePromptsDir(pluginDir: string): string {
  const possiblePaths = [
    join(pluginDir, 'prompts'),
    join(process.cwd(), 'prompts'),
    join(homedir(), '.config/opencode/plugins/opencode-cline-mode/prompts'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    `Could not find prompts directory. Searched paths:\n${possiblePaths.map(p => `  - ${p}`).join('\n')}\n\nPlease ensure:\n1. The plugin is installed correctly\n2. The 'prompts' directory exists in one of the above locations`
  );
}

export function resolveConfigPath(directory: string): string | null {
  const configPaths = [
    join(directory, '.opencode', 'opencode-cline-mode.json'),
    join(homedir(), '.config', 'opencode', 'opencode-cline-mode.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

export function getPluginDir(metaUrl: string): string {
  const __filename = fileURLToPath(metaUrl);
  return dirname(realpathSync(__filename));
}
