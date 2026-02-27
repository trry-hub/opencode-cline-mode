import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Resolve configuration file path
 */
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
