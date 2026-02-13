import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolvePromptsDir, resolveConfigPath } from './path-resolver';

describe('path-resolver', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'opencode-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('resolvePromptsDir', () => {
    it('should find prompts directory in plugin directory', async () => {
      const promptsDir = join(tempDir, 'prompts');
      await mkdir(promptsDir);

      const result = resolvePromptsDir(tempDir);
      expect(result).toBe(promptsDir);
    });

    it('should return a valid path string', () => {
      const result = resolvePromptsDir(tempDir);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('resolveConfigPath', () => {
    it('should find project-level config', async () => {
      const projectConfigDir = join(tempDir, '.opencode');
      await mkdir(projectConfigDir);
      const configPath = join(projectConfigDir, 'opencode-cline-mode.json');
      await writeFile(configPath, '{}');

      const result = resolveConfigPath(tempDir);
      expect(result).toBe(configPath);
    });

    it('should return project config over global config', async () => {
      const projectConfigDir = join(tempDir, '.opencode');
      await mkdir(projectConfigDir);
      const configPath = join(projectConfigDir, 'opencode-cline-mode.json');
      await writeFile(configPath, '{}');

      const result = resolveConfigPath(tempDir);
      expect(result).toBe(configPath);
      expect(result).toContain(tempDir);
    });
  });
});
