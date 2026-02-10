import { readFileSync, existsSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { homedir } from 'os';

// Resolve to the real plugin directory (works even when symlinked or copied)
const __filename = fileURLToPath(import.meta.url);
const realPluginDir = dirname(realpathSync(__filename));

// Try to find prompts directory
let promptsDir;
const possiblePaths = [
  join(realPluginDir, 'prompts'),           // Real installation directory
  join(dirname(__filename), 'prompts'),     // Resolved symlink location
  join(process.cwd(), 'prompts'),          // Current directory (for testing)
  join(homedir(), '.config/opencode/plugins/opencode-cline-mode/prompts'), // Local plugins
];

for (const path of possiblePaths) {
  if (existsSync(path)) {
    promptsDir = path;
    break;
  }
}

if (!promptsDir) {
  throw new Error(`Could not find prompts directory. Searched: ${possiblePaths.join(', ')}`);
}

/**
 * Load plugin configuration
 */
function loadPluginConfig(directory) {
  const configPaths = [
    join(directory, '.opencode', 'opencode-cline-mode.json'),
    join(homedir(), '.config', 'opencode', 'opencode-cline-mode.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }

  // Default configuration
  return {
    replace_default_agents: true,
    default_agent: 'cline-plan',
  };
}

/**
 * OpenCode Cline Mode Plugin
 * 
 * Registers two agents for Cline-style workflow:
 * - cline-plan: Analysis and planning mode (no code changes)
 * - cline-act: Execution mode (implements the plan)
 * 
 * @param {Object} ctx - Plugin context
 * @param {Object} ctx.client - OpenCode SDK client
 * @param {Object} ctx.project - Current project info
 * @param {string} ctx.directory - Current working directory
 * @param {string} ctx.worktree - Git worktree path
 * @param {Object} ctx.$ - Bun shell API
 * @returns {Promise<Object>} Plugin hooks
 */
export default async function ClineModePlugin({ client, project, directory, worktree, $ }) {
  console.log('[CLINE-MODE] Plugin function called!');
  console.log('[CLINE-MODE] Directory:', directory);
  console.log('[CLINE-MODE] Project:', project?.name);
  
  // Load plugin configuration
  const pluginConfig = loadPluginConfig(directory);
  console.log('[CLINE-MODE] Plugin config:', pluginConfig);

  // Load prompt files
  const planPromptPath = join(promptsDir, 'plan.md');
  const actPromptPath = join(promptsDir, 'act.md');
  
  console.log('[CLINE-MODE] Prompts dir:', promptsDir);
  console.log('[CLINE-MODE] Plan prompt path:', planPromptPath);
  console.log('[CLINE-MODE] Act prompt path:', actPromptPath);

  await client.app.log({
    body: {
      service: 'opencode-cline-mode',
      level: 'info',
      message: 'Cline Mode Plugin initialized',
      extra: { 
        directory,
        worktree,
        project: project.name,
        config: pluginConfig,
      },
    },
  });
  
  console.log('[CLINE-MODE] Returning hooks...');

  return {
    /**
     * Configure agents - completely replace agent configuration
     */
    config: async (config) => {
      // Read prompt files
      const planPrompt = readFileSync(planPromptPath, 'utf-8');
      const actPrompt = readFileSync(actPromptPath, 'utf-8');

      // Get models from plugin config or use default
      const defaultModel = config.model || 'inherit';
      const planModel = pluginConfig.plan_model || defaultModel;
      const actModel = pluginConfig.act_model || defaultModel;

      // Save the original config.agent
      const originalConfigAgent = config.agent || {};

      // Create Cline agents
      const clineAgents = {
        'cline-plan': {
          mode: 'primary',
          model: planModel,
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
          description: 'Cline Act Mode - Execute plans with full tool access',
          tools: {
            bash: true,
            edit: true,
            write: true,
          },
          system: [actPrompt],
        },
      };

      if (pluginConfig.replace_default_agents) {
        // Strategy: Hide default agents, show only Cline agents
        const hiddenAgents = {};
        
        // Demote all agents from opencode.json to subagent and hide them
        for (const [name, agentConfig] of Object.entries(originalConfigAgent)) {
          if (agentConfig && typeof agentConfig === 'object') {
            hiddenAgents[name] = {
              ...agentConfig,
              mode: 'subagent',
              hidden: true,
            };
          }
        }
        
        // COMPLETELY REPLACE config.agent
        // Put Cline agents first, then hidden agents
        config.agent = {
          ...clineAgents,
          ...hiddenAgents,
        };
        
        // Set default agent to cline-plan
        config.default_agent = pluginConfig.default_agent || 'cline-plan';
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Cline Mode: Default agents hidden, only Cline agents visible',
            extra: {
              visibleAgents: Object.keys(clineAgents),
              hiddenAgents: Object.keys(hiddenAgents),
              defaultAgent: config.default_agent,
            },
          },
        });
      } else {
        // ADD Cline agents alongside existing agents
        config.agent = {
          ...originalConfigAgent,
          ...clineAgents,
        };
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Cline Mode: Cline agents added alongside default agents',
            extra: {
              allAgents: Object.keys(config.agent),
            },
          },
        });
      }
    },

    /**
     * Log when agents are used
     */
    'chat.message': async (input, output) => {
      const { agent } = input;
      
      if (agent === 'cline-plan' || agent === 'cline-act') {
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: `${agent} agent activated`,
            extra: {
              sessionID: input.sessionID,
              agent: agent,
            },
          },
        });
      }
    },
  };
}
