import type { AgentConfig, PluginConfig } from "./types.js";
import type { AdaptedPrompt } from "./prompt-adapter.js";

interface BuildAgentsParams {
  config: Required<PluginConfig>;
  defaultModel: string;
  planPrompt: AdaptedPrompt;
  actPrompt: AdaptedPrompt;
}

/**
 * Build cline-plan and cline-act agent configurations using adapted prompts
 */
export function buildClineAgents(
  params: BuildAgentsParams,
): Record<string, AgentConfig> {
  const { config, defaultModel, planPrompt, actPrompt } = params;

  const planModel = config.plan_model || defaultModel;
  const actModel = config.act_model || defaultModel;
  const planTemperature = config.plan_temperature ?? 0.1;
  const actTemperature = config.act_temperature ?? 0.3;

  return {
    "cline-plan": {
      mode: "primary",
      model: planModel,
      temperature: planTemperature,
      description:
        "Cline Plan Mode - Analysis and planning without code changes (prompts from official Cline repository)",
      tools: { write: false, edit: false, patch: false, bash: false },
      system: [planPrompt.systemPrompt],
    },
    "cline-act": {
      mode: "primary",
      model: actModel,
      temperature: actTemperature,
      description:
        "Cline Act Mode - Execute plans with full tool access (prompts from official Cline repository)",
      tools: { write: true, edit: true, patch: true, bash: true },
      system: [actPrompt.systemPrompt],
    },
  };
}
