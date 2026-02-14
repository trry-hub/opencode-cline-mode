import { describe, it, expect } from 'vitest';
import { buildClineAgents, hideDefaultAgents } from '../src/agent-builder';
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

  describe('hideDefaultAgents', () => {
    it('should hide default agents', () => {
      const originalAgents: Record<string, AgentConfig> = {
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

      const hidden = hideDefaultAgents(originalAgents);

      expect(hidden['build'].mode).toBe('subagent');
      expect(hidden['build'].hidden).toBe(true);
      expect(hidden['plan'].mode).toBe('subagent');
      expect(hidden['plan'].hidden).toBe(true);
    });
  });
});
