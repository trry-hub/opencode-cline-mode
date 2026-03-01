import type { PluginConfig } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate plugin configuration
 */
export function validateConfig(config: unknown): ValidationResult {
  if (typeof config !== "object" || config === null) {
    return { valid: false, errors: ["Config must be an object"] };
  }

  const cfg = config as Record<string, unknown>;
  const errors: string[] = [];

  // Validate specific fields
  if (
    "replace_default_agents" in cfg &&
    typeof cfg.replace_default_agents !== "boolean"
  ) {
    errors.push("replace_default_agents must be a boolean");
  }

  if (
    "default_agent" in cfg &&
    !["cline-plan", "cline-act"].includes(cfg.default_agent as string)
  ) {
    errors.push('default_agent must be "cline-plan" or "cline-act"');
  }

  if ("plan_temperature" in cfg) {
    const temp = cfg.plan_temperature;
    if (typeof temp !== "number" || temp < 0 || temp > 1) {
      errors.push("plan_temperature must be a number between 0 and 1");
    }
  }

  if ("act_temperature" in cfg) {
    const temp = cfg.act_temperature;
    if (typeof temp !== "number" || temp < 0 || temp > 1) {
      errors.push("act_temperature must be a number between 0 and 1");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get default plugin configuration
 */
export function getDefaultConfig(): Required<PluginConfig> {
  return {
    replace_default_agents: true,
    default_agent: "cline-plan",
    plan_model: "",
    act_model: "",
    plan_temperature: 0.1,
    act_temperature: 0.3,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(
  userConfig: PluginConfig,
): Required<PluginConfig> {
  const defaults = getDefaultConfig();

  return {
    replace_default_agents:
      userConfig.replace_default_agents ?? defaults.replace_default_agents,
    default_agent: userConfig.default_agent ?? defaults.default_agent,
    plan_model: userConfig.plan_model ?? defaults.plan_model,
    act_model: userConfig.act_model ?? defaults.act_model,
    plan_temperature: userConfig.plan_temperature ?? defaults.plan_temperature,
    act_temperature: userConfig.act_temperature ?? defaults.act_temperature,
  };
}
