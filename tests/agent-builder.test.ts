import { describe, it, expect } from 'vitest';
import { buildClineAgents, filterClineOnlyAgents } from '../src/agent-builder';
import type { AgentConfig, PluginConfig } from '../src/types';

describe('agent-builder', () => {
  const planPrompt = 'Plan mode prompt';
  const actPrompt = 'Act mode prompt';
  const defaultConfig: Required<PluginConfig> = {
    replace_default_agents: true,
    default_agent: 'cline-plan',
    plan_model: '',
    act_model: '',
    plan_temperature: 0.1,
    act_temperature: 0.3,
    show_completion_toast: true,
    enable_execute_command: true,
    prompt_source: 'auto',
    cline_version: 'latest',
    cache_ttl: 24,
    fallback_to_local: true,
  };

  describe('buildClineAgents', () => {
    it('should build cline agents with default config', () => {
      const agents = buildClineAgents({
        planPrompt,
        actPrompt,
        config: defaultConfig,
        defaultModel: 'claude-3',
      });

      expect(agents['cline-plan']).toBeDefined();
      expect(agents['cline-act']).toBeDefined();
      expect(agents['cline-plan'].mode).toBe('primary');
      expect(agents['cline-plan'].permission?.bash?.['*']).toBe('deny');
      expect(agents['cline-act'].permission?.bash?.['*']).toBe('ask');
    });

    it('should use custom models when specified', () => {
      const config = {
        ...defaultConfig,
        plan_model: 'claude-opus',
        act_model: 'claude-sonnet',
      };

      const agents = buildClineAgents({
        planPrompt,
        actPrompt,
        config,
        defaultModel: 'claude-3',
      });

      expect(agents['cline-plan'].model).toBe('claude-opus');
      expect(agents['cline-act'].model).toBe('claude-sonnet');
    });
  });

  describe('filterClineOnlyAgents', () => {
    it('should filter to keep only cline agents', () => {
      const originalAgents: Record<string, AgentConfig | undefined> = {
        'cline-plan': {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Cline Plan',
          permission: { edit: { '*': 'deny' }, bash: { '*': 'deny' } },
          system: ['Plan prompt'],
        },
        'cline-act': {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Cline Act',
          permission: { edit: { '*': 'allow' }, bash: { '*': 'ask' } },
          system: ['Act prompt'],
        },
        build: {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Build agent',
          permission: { edit: { '*': 'allow' }, bash: { '*': 'allow' } },
          system: ['Build prompt'],
        },
        plan: {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Plan agent',
          permission: { edit: { '*': 'deny' }, bash: { '*': 'deny' } },
          system: ['Plan prompt'],
        },
      };

      const filtered = filterClineOnlyAgents(originalAgents);

      expect(Object.keys(filtered)).toHaveLength(2);
      expect(filtered['cline-plan']).toBeDefined();
      expect(filtered['cline-act']).toBeDefined();
      expect(filtered['build']).toBeUndefined();
      expect(filtered['plan']).toBeUndefined();
    });
  });
});
