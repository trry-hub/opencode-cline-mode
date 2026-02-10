import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  // Load plugin configuration
  const pluginConfig = loadPluginConfig(directory);

  // Load prompt files
  const planPromptPath = join(__dirname, 'prompts/plan.md');
  const actPromptPath = join(__dirname, 'prompts/act.md');

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

  return {
    /**
     * Configure agents
     */
    config: async (config) => {
      // Read prompt files
      const planPrompt = readFileSync(planPromptPath, 'utf-8');
      const actPrompt = readFileSync(actPromptPath, 'utf-8');

      // Get models from plugin config or use default
      const defaultModel = config.model || 'inherit';
      const planModel = pluginConfig.plan_model || defaultModel;
      const actModel = pluginConfig.act_model || defaultModel;

      // Create Cline agents
      const clineAgents = {
        'cline-plan': {
          mode: 'primary',
          model: planModel,
          description: 'Cline Plan Mode - Analysis and planning without code changes',
          tools: {
            bash: false,  // No command execution in plan mode
            edit: false,  // No file editing in plan mode
            write: false, // No file writing in plan mode
          },
          system: [planPrompt],
        },
        'cline-act': {
          mode: 'primary',
          model: actModel,
          description: 'Cline Act Mode - Execute plans with full tool access',
          tools: {
            bash: true,  // Allow command execution
            edit: true,  // Allow file editing
            write: true, // Allow file writing
          },
          system: [actPrompt],
        },
      };

      if (pluginConfig.replace_default_agents) {
        // COMPLETELY REPLACE the agent configuration
        // This removes all default OpenCode agents (plan, build, etc.)
        config.agent = clineAgents;
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Default agents replaced with Cline agents',
            extra: {
              agents: Object.keys(config.agent),
            },
          },
        });
      } else {
        // ADD Cline agents alongside existing agents
        if (!config.agent) {
          config.agent = {};
        }
        config.agent = {
          ...config.agent,
          ...clineAgents,
        };
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Cline agents added alongside default agents',
            extra: {
              agents: Object.keys(config.agent),
            },
          },
        });
      }

      // Set default agent
      config.default_agent = pluginConfig.default_agent || 'cline-plan';

      await client.app.log({
        body: {
          service: 'opencode-cline-mode',
          level: 'info',
          message: 'Agent configuration complete',
          extra: {
            defaultAgent: config.default_agent,
            replaceMode: pluginConfig.replace_default_agents,
            planModel,
            actModel,
          },
        },
      });
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
