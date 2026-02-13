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

  return {
    'cline-plan': {
      mode: 'primary',
      model: planModel,
      temperature: config.plan_temperature,
      description: 'Cline Plan Mode - Analysis and planning without code changes',
      tools: {
        bash: false,
        edit: false,
        write: false,
      },
      system: [planPrompt],
    },
    'cline-act': {
      mode: 'primary',
      model: actModel,
      temperature: config.act_temperature,
      description: 'Cline Act Mode - Execute plans with full tool access',
      tools: {
        bash: true,
        edit: true,
        write: true,
      },
      system: [actPrompt],
    },
  };
}

export function hideDefaultAgents(
  agents: Record<string, AgentConfig | undefined>
): Record<string, AgentConfig> {
  const hidden: Record<string, AgentConfig> = {};

  for (const [name, agentConfig] of Object.entries(agents)) {
    if (agentConfig && typeof agentConfig === 'object') {
      hidden[name] = {
        ...agentConfig,
        mode: 'subagent',
        hidden: true,
      };
    }
  }

  return hidden;
}
