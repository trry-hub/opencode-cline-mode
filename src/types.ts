/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /** Replace OpenCode's default agents with Cline agents */
  replace_default_agents?: boolean;
  /** Default agent to use when starting OpenCode */
  default_agent?: "cline-plan" | "cline-act";
  /** Model for cline-plan agent */
  plan_model?: string;
  /** Model for cline-act agent */
  act_model?: string;
  /** Temperature for plan mode (lower = more focused) */
  plan_temperature?: number;
  /** Temperature for act mode */
  act_temperature?: number;
}

/**
 * Agent configuration
 */
type PermissionAction = "allow" | "ask" | "deny";

export interface AgentConfig {
  mode: "primary" | "subagent";
  model?: string;
  temperature?: number;
  description: string;
  permission?: {
    edit?: {
      "*": PermissionAction;
    };
    bash?: {
      "*": PermissionAction;
    };
  };
  tools?: {
    write?: boolean;
    edit?: boolean;
    patch?: boolean;
    bash?: boolean;
  };
  system?: string[];
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
 * Plugin context from @opencode-ai/plugin
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
  level: "info" | "warn" | "error" | "debug";
  message: string;
  extra?: Record<string, unknown>;
}

/**
 * Event body structure
 */
export interface EventBody {
  type: string;
  properties: Record<string, unknown>;
}
