import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadPluginConfig } from './config-loader';

describe('config-loader', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'opencode-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('loadPluginConfig', () => {
    it('should load valid config from file', async () => {
      const configDir = join(tempDir, '.opencode');
      await mkdir(configDir);
      const configPath = join(configDir, 'opencode-cline-mode.json');

      await writeFile(configPath, JSON.stringify({
        replace_default_agents: false,
        default_agent: 'cline-act',
      }));

      const config = loadPluginConfig(tempDir);

      expect(config.replace_default_agents).toBe(false);
      expect(config.default_agent).toBe('cline-act');
    });

    it('should return defaults when no config file', async () => {
      const config = loadPluginConfig(tempDir);

      expect(config.replace_default_agents).toBe(true);
      expect(config.default_agent).toBe('cline-plan');
    });

    it('should handle malformed JSON gracefully', async () => {
      const configDir = join(tempDir, '.opencode');
      await mkdir(configDir);
      const configPath = join(configDir, 'opencode-cline-mode.json');

      await writeFile(configPath, '{ invalid json }');

      const config = loadPluginConfig(tempDir);

      expect(config.replace_default_agents).toBe(true);
    });
  });
});
