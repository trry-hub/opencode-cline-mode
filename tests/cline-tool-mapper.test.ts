import { describe, it, expect } from 'vitest';
import {
  mapToolName,
  adaptPromptToolNames,
  getClineToolNames,
  getOpenCodeToolNames,
  isClineTool,
  isOpenCodeTool,
} from '../src/cline-tool-mapper';

describe('ClineToolMapper', () => {
  describe('mapToolName', () => {
    it('should map Cline tool names to OpenCode tool names', () => {
      expect(mapToolName('read_file')).toBe('read');
      expect(mapToolName('write_to_file')).toBe('write');
      expect(mapToolName('execute_command')).toBe('bash');
      expect(mapToolName('search_files')).toBe('grep');
      expect(mapToolName('list_files')).toBe('glob');
    });

    it('should return original name if no mapping exists', () => {
      expect(mapToolName('unknown_tool')).toBe('unknown_tool');
    });
  });

  describe('adaptPromptToolNames', () => {
    it('should replace tool names in XML tags', () => {
      const prompt = '<read_file><path>test.ts</path></read_file>';
      const adapted = adaptPromptToolNames(prompt);
      expect(adapted).toBe('<read><path>test.ts</path></read>');
    });

    it('should replace tool names in quotes', () => {
      const prompt = 'Use the "read_file" tool to read files';
      const adapted = adaptPromptToolNames(prompt);
      expect(adapted).toBe('Use the "read" tool to read files');
    });

    it('should replace tool names in backticks', () => {
      const prompt = 'Use `write_to_file` to create files';
      const adapted = adaptPromptToolNames(prompt);
      expect(adapted).toBe('Use `write` to create files');
    });

    it('should replace tool names followed by colon', () => {
      const prompt = 'execute_command: Run shell commands';
      const adapted = adaptPromptToolNames(prompt);
      expect(adapted).toBe('bash: Run shell commands');
    });

    it('should handle multiple tool names in one prompt', () => {
      const prompt = `
        Use <read_file> to read and <write_to_file> to write.
        The "execute_command" tool runs commands.
      `;
      const adapted = adaptPromptToolNames(prompt);
      expect(adapted).toContain('<read>');
      expect(adapted).toContain('<write>');
      expect(adapted).toContain('"bash"');
    });
  });

  describe('getClineToolNames', () => {
    it('should return all Cline tool names', () => {
      const names = getClineToolNames();
      expect(names).toContain('read_file');
      expect(names).toContain('write_to_file');
      expect(names).toContain('execute_command');
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('getOpenCodeToolNames', () => {
    it('should return all OpenCode tool names', () => {
      const names = getOpenCodeToolNames();
      expect(names).toContain('read');
      expect(names).toContain('write');
      expect(names).toContain('bash');
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('isClineTool', () => {
    it('should return true for Cline tool names', () => {
      expect(isClineTool('read_file')).toBe(true);
      expect(isClineTool('write_to_file')).toBe(true);
    });

    it('should return false for non-Cline tool names', () => {
      expect(isClineTool('read')).toBe(false);
      expect(isClineTool('unknown')).toBe(false);
    });
  });

  describe('isOpenCodeTool', () => {
    it('should return true for OpenCode tool names', () => {
      expect(isOpenCodeTool('read')).toBe(true);
      expect(isOpenCodeTool('write')).toBe(true);
    });

    it('should return false for non-OpenCode tool names', () => {
      expect(isOpenCodeTool('read_file')).toBe(false);
      expect(isOpenCodeTool('unknown')).toBe(false);
    });
  });
});
