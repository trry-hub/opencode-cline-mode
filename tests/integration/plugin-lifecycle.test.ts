/**
 * Integration tests for plugin lifecycle
 */

import { describe, it, expect } from 'vitest';
import ClineModePlugin from '../../src/index.js';
import { createMockPluginContext } from '../mocks/context.js';
import type { OpenCodeConfig } from '../../src/types.js';

describe('Plugin Lifecycle Integration', () => {
  it('should load plugin and register hooks', async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    expect(plugin).toBeDefined();
    expect(typeof plugin.config).toBe('function');
    expect(plugin['experimental.chat.messages.transform']).toBeDefined();
    expect(plugin['chat.message']).toBeDefined();
  });

  it('should register cline-plan and cline-act agents via config hook', async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    const config: OpenCodeConfig = {
      model: 'test-model',
      agent: {},
    };

    await plugin.config(config);

    expect(config.agent).toBeDefined();
    expect(config.agent?.['cline-plan']).toBeDefined();
    expect(config.agent?.['cline-act']).toBeDefined();
    expect(config.default_agent).toBe('cline-plan');
  });

  it('should set correct agent permissions', async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    const config: OpenCodeConfig = {
      model: 'test-model',
      agent: {},
    };

    await plugin.config(config);

    expect(config.agent?.['cline-plan']?.permission?.edit).toEqual({ '*': 'deny' });
    expect(config.agent?.['cline-plan']?.permission?.bash).toEqual({ '*': 'deny' });
    expect(config.agent?.['cline-act']?.permission?.edit).toEqual({ '*': 'allow' });
    expect(config.agent?.['cline-act']?.permission?.bash).toEqual({ '*': 'ask' });
  });

  it('should register /start-act tool when enabled', async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    expect(plugin.tool).toBeDefined();
    expect(plugin.tool?.['start-act']).toBeDefined();
    expect(plugin.tool?.['start-act'].description).toContain('cline-act');
  });
});
