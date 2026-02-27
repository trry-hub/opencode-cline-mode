/**
 * Unit tests for agent-builder
 */

import { describe, it, expect } from 'vitest';
import { buildClineAgents } from '../src/agent-builder.js';

describe('Agent Builder', () => {
  it('should return cline-plan and cline-act agents', () => {
    const params = {
      config: {
        replace_default_agents: true,
        default_agent: 'cline-plan' as const,
        plan_model: '',
        act_model: '',
        plan_temperature: 0.1,
        act_temperature: 0.3,
        show_completion_toast: true,
        enable_execute_command: true,
      },
      defaultModel: 'inherit',
    };

    const result = buildClineAgents(params);

    expect(Object.keys(result)).toEqual(['cline-plan', 'cline-act']);
  });

  it('should set correct permissions for cline-plan', () => {
    const params = {
      config: {
        replace_default_agents: true,
        default_agent: 'cline-plan' as const,
        plan_model: '',
        act_model: '',
        plan_temperature: 0.1,
        act_temperature: 0.3,
        show_completion_toast: true,
        enable_execute_command: true,
      },
      defaultModel: 'inherit',
    };

    const result = buildClineAgents(params);

    expect(result['cline-plan'].permission?.edit).toEqual({ '*': 'deny' });
    expect(result['cline-plan'].permission?.bash).toEqual({ '*': 'deny' });
  });

  it('should set correct permissions for cline-act', () => {
    const params = {
      config: {
        replace_default_agents: true,
        default_agent: 'cline-plan' as const,
        plan_model: '',
        act_model: '',
        plan_temperature: 0.1,
        act_temperature: 0.3,
        show_completion_toast: true,
        enable_execute_command: true,
      },
      defaultModel: 'inherit',
    };

    const result = buildClineAgents(params);

    expect(result['cline-act'].permission?.edit).toEqual({ '*': 'allow' });
    expect(result['cline-act'].permission?.bash).toEqual({ '*': 'ask' });
  });

  it('should set correct temperatures', () => {
    const params = {
      config: {
        replace_default_agents: true,
        default_agent: 'cline-plan' as const,
        plan_model: '',
        act_model: '',
        plan_temperature: 0.1,
        act_temperature: 0.3,
        show_completion_toast: true,
        enable_execute_command: true,
      },
      defaultModel: 'inherit',
    };

    const result = buildClineAgents(params);

    expect(result['cline-plan'].temperature).toBe(0.1);
    expect(result['cline-act'].temperature).toBe(0.3);
  });
});
