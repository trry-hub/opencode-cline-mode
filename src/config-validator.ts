import Ajv from 'ajv';
import type { PluginConfig } from './types';

const ajv = new Ajv({ allErrors: true });

const configSchema = {
  type: 'object',
  properties: {
    $schema: { type: 'string' },
    replace_default_agents: { type: 'boolean' },
    default_agent: {
      type: 'string',
      enum: ['cline-plan', 'cline-act'],
    },
    plan_model: { type: 'string' },
    act_model: { type: 'string' },
    plan_temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    act_temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    show_completion_toast: { type: 'boolean' },
    enable_execute_command: { type: 'boolean' },
    prompt_source: {
      type: 'string',
      enum: ['local', 'github', 'auto'],
    },
    cline_version: { type: 'string' },
    cache_ttl: {
      type: 'number',
      minimum: 1,
    },
    fallback_to_local: { type: 'boolean' },
  },
  additionalProperties: false,
};

const validate = ajv.compile<PluginConfig>(configSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConfig(config: unknown): ValidationResult {
  const valid = validate(config);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = validate.errors?.map(err => `${err.instancePath} ${err.message}`) || [];

  return { valid: false, errors };
}

export function getDefaultConfig(): Required<PluginConfig> {
  return {
    replace_default_agents: true,
    default_agent: 'cline-plan',
    plan_model: '',
    act_model: '',
    plan_temperature: 0.1,
    act_temperature: 0.3,
    show_completion_toast: true,
    enable_execute_command: true,
    prompt_source: 'local',
    cline_version: 'latest',
    cache_ttl: 24,
    fallback_to_local: true,
  };
}

export function mergeWithDefaults(userConfig: PluginConfig): Required<PluginConfig> {
  const defaults = getDefaultConfig();

  return {
    replace_default_agents: userConfig.replace_default_agents ?? defaults.replace_default_agents,
    default_agent: userConfig.default_agent ?? defaults.default_agent,
    plan_model: userConfig.plan_model ?? defaults.plan_model,
    act_model: userConfig.act_model ?? defaults.act_model,
    plan_temperature: userConfig.plan_temperature ?? defaults.plan_temperature,
    act_temperature: userConfig.act_temperature ?? defaults.act_temperature,
    show_completion_toast: userConfig.show_completion_toast ?? defaults.show_completion_toast,
    enable_execute_command: userConfig.enable_execute_command ?? defaults.enable_execute_command,
    prompt_source: userConfig.prompt_source ?? defaults.prompt_source,
    cline_version: userConfig.cline_version ?? defaults.cline_version,
    cache_ttl: userConfig.cache_ttl ?? defaults.cache_ttl,
    fallback_to_local: userConfig.fallback_to_local ?? defaults.fallback_to_local,
  };
}
