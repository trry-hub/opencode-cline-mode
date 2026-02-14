/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /** Replace OpenCode's default agents with Cline agents */
  replace_default_agents?: boolean;
  /** Default agent to use when starting OpenCode */
  default_agent?: 'cline-plan' | 'cline-act';
  /** Model for cline-plan agent */
  plan_model?: string;
  /** Model for cline-act agent */
  act_model?: string;
  /** Temperature for plan mode (lower = more focused) */
  plan_temperature?: number;
  /** Temperature for act mode */
  act_temperature?: number;
  /** Show toast notification when plan is complete */
  show_completion_toast?: boolean;
  /** Enable /execute-plan command */
  enable_execute_command?: boolean;
  /** Prompt source: 'local' (use local files), 'github' (fetch from Cline repo), 'auto' (cache -> github -> local) */
  prompt_source?: 'local' | 'github' | 'auto';
  /** Cline version to use: 'latest' or specific version/branch */
  cline_version?: string;
  /** Cache TTL in hours */
  cache_ttl?: number;
  /** Fallback to local prompts if GitHub fetch fails */
  fallback_to_local?: boolean;
}

/**
 * Agent configuration
 */
type PermissionAction = 'allow' | 'ask' | 'deny';

export interface AgentConfig {
  mode: 'primary' | 'subagent';
  model: string;
  temperature: number;
  description: string;
  permission?: {
    edit?: {
      '*': PermissionAction;
    };
    bash?: {
      '*': PermissionAction;
    };
  };
  system: string[];
  hidden?: boolean;
}

/**
 * OpenCode config object
 */
export interface OpenCodeConfig {
  model?: string;
  agent?: Record<string, AgentConfig | undefined>;
  default_agent?: string;
}

/**
 * Plugin context
 */
export interface PluginContext {
  client: {
    app: {
      log: (params: { body: LogBody }) => Promise<void>;
      event: (params: { body: EventBody }) => Promise<void>;
    };
  };
  project: {
    name: string;
  };
  directory: string;
  worktree?: string;
  $: unknown;
}

/**
 * Log body structure
 */
export interface LogBody {
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  extra?: Record<string, unknown>;
}

export interface EventBody {
  type: string;
  properties: Record<string, unknown>;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  info: {
    role: 'assistant' | 'user';
    agent?: string;
  };
  parts: MessagePart[];
}

/**
 * Message part
 */
export interface MessagePart {
  type: 'text' | 'image' | 'code';
  text?: string;
}

/**
 * Transform output structure
 */
export interface TransformOutput {
  messages: ChatMessage[];
}

/**
 * Transform input/output parameters
 */
export interface TransformParams {
  input: unknown;
  output: TransformOutput;
}

/**
 * Type guard for TransformOutput
 */
export function isTransformOutput(value: unknown): value is TransformOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (!('messages' in obj) || !Array.isArray(obj.messages)) {
    return false;
  }

  return obj.messages.every((msg: unknown) => {
    if (typeof msg !== 'object' || msg === null) {
      return false;
    }
    const message = msg as Record<string, unknown>;
    return 'info' in message && 'parts' in message && Array.isArray(message.parts);
  });
}
