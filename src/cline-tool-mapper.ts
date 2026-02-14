/**
 * Cline to OpenCode tool name mapping
 * Maps Cline's tool names to OpenCode's equivalent tools
 */

export interface ToolMapping {
  cline: string;
  opencode: string;
  description: string;
}

/**
 * Complete mapping of Cline tools to OpenCode tools
 */
export const TOOL_MAPPINGS: ToolMapping[] = [
  // File Operations
  {
    cline: 'read_file',
    opencode: 'read',
    description: 'Read file contents',
  },
  {
    cline: 'write_to_file',
    opencode: 'write',
    description: 'Write content to a file',
  },
  {
    cline: 'replace_in_file',
    opencode: 'edit',
    description: 'Edit existing file content',
  },
  {
    cline: 'apply_patch',
    opencode: 'edit',
    description: 'Apply patch to file',
  },
  {
    cline: 'list_files',
    opencode: 'glob',
    description: 'List files in directory',
  },
  {
    cline: 'search_files',
    opencode: 'grep',
    description: 'Search for content in files',
  },
  {
    cline: 'list_code_definition_names',
    opencode: 'grep',
    description: 'List code definitions',
  },

  // Command Execution
  {
    cline: 'execute_command',
    opencode: 'bash',
    description: 'Execute shell command',
  },

  // Web Operations
  {
    cline: 'web_search',
    opencode: 'google_search',
    description: 'Search the web',
  },
  {
    cline: 'web_fetch',
    opencode: 'webfetch',
    description: 'Fetch web content',
  },

  // Browser Operations
  {
    cline: 'browser_action',
    opencode: 'browser',
    description: 'Browser automation',
  },

  // Task Management
  {
    cline: 'attempt_completion',
    opencode: 'attempt_completion',
    description: 'Complete the task',
  },
  {
    cline: 'ask_followup_question',
    opencode: 'ask_followup_question',
    description: 'Ask user a question',
  },

  // Mode-specific tools
  {
    cline: 'plan_mode_respond',
    opencode: 'plan_mode_respond',
    description: 'Respond in plan mode',
  },
  {
    cline: 'act_mode_respond',
    opencode: 'act_mode_respond',
    description: 'Respond in act mode',
  },

  // MCP and Skills
  {
    cline: 'use_mcp_tool',
    opencode: 'use_mcp_tool',
    description: 'Use MCP tool',
  },
  {
    cline: 'access_mcp_resource',
    opencode: 'access_mcp_resource',
    description: 'Access MCP resource',
  },
  {
    cline: 'load_mcp_documentation',
    opencode: 'load_mcp_documentation',
    description: 'Load MCP documentation',
  },
  {
    cline: 'use_skill',
    opencode: 'skill',
    description: 'Use a skill',
  },

  // Task and Focus
  {
    cline: 'new_task',
    opencode: 'task',
    description: 'Create new task',
  },
  {
    cline: 'focus_chain',
    opencode: 'focus_chain',
    description: 'Focus chain management',
  },
];

/**
 * Create a mapping from Cline tool names to OpenCode tool names
 */
export function createToolNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const mapping of TOOL_MAPPINGS) {
    map.set(mapping.cline, mapping.opencode);
  }
  return map;
}

/**
 * Convert Cline tool name to OpenCode tool name
 */
export function mapToolName(clineToolName: string): string {
  const map = createToolNameMap();
  return map.get(clineToolName) || clineToolName;
}

/**
 * Replace all Cline tool names in a prompt with OpenCode tool names
 */
export function adaptPromptToolNames(prompt: string): string {
  let adapted = prompt;
  const map = createToolNameMap();

  for (const [clineToolName, opencodeToolName] of map.entries()) {
    // Replace tool names in various contexts:
    // 1. Tool tags: <tool_name>...</tool_name>
    const tagRegex = new RegExp(`<${clineToolName}>`, 'g');
    const endTagRegex = new RegExp(`</${clineToolName}>`, 'g');
    adapted = adapted.replace(tagRegex, `<${opencodeToolName}>`);
    adapted = adapted.replace(endTagRegex, `</${opencodeToolName}>`);

    // 2. Tool references in text: "tool_name" or `tool_name`
    const quoteRegex = new RegExp(`(['"\`])${clineToolName}\\1`, 'g');
    adapted = adapted.replace(quoteRegex, `$1${opencodeToolName}$1`);

    // 3. Tool names in markdown code blocks or inline code
    const codeRegex = new RegExp(`\`${clineToolName}\``, 'g');
    adapted = adapted.replace(codeRegex, `\`${opencodeToolName}\``);

    // 4. Tool names followed by colon (e.g., "tool_name:")
    const colonRegex = new RegExp(`\\b${clineToolName}:`, 'g');
    adapted = adapted.replace(colonRegex, `${opencodeToolName}:`);
  }

  return adapted;
}

/**
 * Get all Cline tool names
 */
export function getClineToolNames(): string[] {
  return TOOL_MAPPINGS.map(m => m.cline);
}

/**
 * Get all OpenCode tool names
 */
export function getOpenCodeToolNames(): string[] {
  return TOOL_MAPPINGS.map(m => m.opencode);
}

/**
 * Check if a tool name is a Cline tool
 */
export function isClineTool(toolName: string): boolean {
  return getClineToolNames().includes(toolName);
}

/**
 * Check if a tool name is an OpenCode tool
 */
export function isOpenCodeTool(toolName: string): boolean {
  return getOpenCodeToolNames().includes(toolName);
}
