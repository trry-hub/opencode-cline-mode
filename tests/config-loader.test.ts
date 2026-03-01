/**
 * Unit tests for config-loader
 */

import { describe, it, expect } from 'vitest';
import { loadPluginConfig } from '../src/config-loader.js';
import { getDefaultConfig } from '../src/config-validator.js';

describe('Config Loader', () => {
  it('should return default config when no config file exists', () => {
    const config = loadPluginConfig('/nonexistent/directory');
    expect(config).toEqual(getDefaultConfig());
  });

  it('should have correct default values', () => {
    const defaults = getDefaultConfig();

    expect(defaults.replace_default_agents).toBe(true);
    expect(defaults.default_agent).toBe('cline-plan');
    expect(defaults.plan_temperature).toBe(0.1);
    expect(defaults.act_temperature).toBe(0.3);
  });
});
