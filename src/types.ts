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
  /** Enable YOLO mode - auto-approve and auto-switch from plan to act mode */
  yolo_mode?: boolean;
  /** Enable task progress tracking */
  enable_task_progress?: boolean;
  /** Enable /start-act command for quick switching from plan to act mode */
  enable_execute_command?: boolean;
  /** Show toast notification when plan completes */
  show_completion_toast?: boolean;
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

/**
 * Focus Chain step for task progress tracking
 */
export interface FocusChainStep {
  /** Step description */
  description: string;
  /** Step status */
  status: "pending" | "in_progress" | "completed" | "failed";
  /** Optional file path related to this step */
  filePath?: string;
  /** Optional notes or details */
  notes?: string;
}

/**
 * Focus Chain for task progress tracking
 */
export interface FocusChain {
  /** All steps in the plan */
  steps: FocusChainStep[];
  /** Index of current step */
  currentStepIndex: number;
  /** Completed steps */
  completedSteps: string[];
  /** Failed steps */
  failedSteps: string[];
}

/**
 * Task state for tracking execution progress
 */
export interface TaskState {
  /** Whether we're awaiting a plan response from the user */
  isAwaitingPlanResponse: boolean;
  /** Whether user responded by switching to act mode */
  didRespondToPlanAskBySwitchingMode: boolean;
  /** Consecutive mistake count for error handling */
  consecutiveMistakeCount: number;
  /** Maximum consecutive mistakes before asking user */
  consecutiveMistakeLimit: number;
  /** Auto retry enabled */
  autoRetry: boolean;
  /** Current mode */
  currentMode: "plan" | "act";
  /** Focus chain for task progress */
  focusChain?: FocusChain;
}

/**
 * Session state manager
 */
export interface SessionState {
  /** Task state tracking */
  taskState: TaskState;
  /** YOLO mode enabled */
  yoloModeEnabled: boolean;
  /** Last plan content */
  lastPlan?: string;
}
