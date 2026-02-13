import Ajv from 'ajv';
import type { PluginConfig } from './types';

const ajv = new Ajv({ allErrors: true });

const configSchema = {
  type: 'object',
  properties: {
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

  const errors = validate.errors?.map(err =>
    `${err.instancePath} ${err.message}`
  ) || [];

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
  };
}
