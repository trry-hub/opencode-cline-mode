import type { AgentConfig, PluginConfig } from './types';

interface BuildAgentsParams {
  planPrompt: string;
  actPrompt: string;
  config: Required<PluginConfig>;
  defaultModel: string;
}

export function buildClineAgents(params: BuildAgentsParams): Record<string, AgentConfig> {
  const { planPrompt, actPrompt, config, defaultModel } = params;

  const planModel = config.plan_model || defaultModel;
  const actModel = config.act_model || defaultModel;
  const planTemperature = config.plan_temperature ?? 0.1;
  const actTemperature = config.act_temperature ?? 0.3;

  return {
    'cline-plan': {
      mode: 'primary',
      model: planModel,
      temperature: planTemperature,
      description: 'Cline Plan Mode - Analysis and planning without code changes',
      permission: {
        edit: {
          '*': 'deny',
        },
        bash: {
          '*': 'deny',
        },
      },
      system: [planPrompt],
    },
    'cline-act': {
      mode: 'primary',
      model: actModel,
      temperature: actTemperature,
      description: 'Cline Act Mode - Execute plans with full tool access',
      permission: {
        edit: {
          '*': 'allow',
        },
        bash: {
          '*': 'ask',
        },
      },
      system: [actPrompt],
    },
  };
}

/**
 * Filter out default OpenCode agents, keeping only Cline agents
 * This ensures complete replacement rather than just hiding
 */
export function filterClineOnlyAgents(
  originalAgents: Record<string, AgentConfig | undefined>
): Record<string, AgentConfig> {
  const clineOnly: Record<string, AgentConfig> = {};

  // Only keep cline-plan and cline-act agents
  for (const [name, agentConfig] of Object.entries(originalAgents)) {
    if ((name === 'cline-plan' || name === 'cline-act') && agentConfig) {
      clineOnly[name] = agentConfig;
    }
  }

  return clineOnly;
}
