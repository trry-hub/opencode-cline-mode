import { describe, it, expect } from 'vitest';
import { validateConfig, getDefaultConfig } from './config-validator';
import type { PluginConfig } from './types';

describe('config-validator', () => {
  describe('validateConfig', () => {
    it('should validate a valid config', () => {
      const config: PluginConfig = {
        replace_default_agents: true,
        default_agent: 'cline-plan',
        plan_model: 'claude-opus-4',
        act_model: 'claude-sonnet-4',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate an empty config', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
    });

    it('should reject invalid default_agent', () => {
      const config = {
        default_agent: 'invalid-agent',
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid temperature (too high)', () => {
      const config: PluginConfig = {
        plan_temperature: 1.5,
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid temperature (negative)', () => {
      const config: PluginConfig = {
        act_temperature: -0.1,
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig();

      expect(config.replace_default_agents).toBe(true);
      expect(config.default_agent).toBe('cline-plan');
      expect(config.plan_temperature).toBe(0.1);
      expect(config.act_temperature).toBe(0.3);
    });
  });
});
