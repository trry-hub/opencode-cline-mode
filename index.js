import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  // Load prompt files
  const planPromptPath = join(__dirname, 'prompts/plan.md');
  const actPromptPath = join(__dirname, 'prompts/act.md');

  await client.app.log({
    body: {
      service: 'opencode-cline-mode',
      level: 'info',
      message: 'Cline Mode Plugin initialized - registering agents',
      extra: { 
        directory,
        worktree,
        project: project.name,
        planPrompt: planPromptPath,
        actPrompt: actPromptPath
      },
    },
  });

  return {
    /**
     * Register agent configurations
     */
    config: async (config) => {
      // Ensure agent object exists
      if (!config.agent) {
        config.agent = {};
      }

      // Register cline-plan agent
      config.agent['cline-plan'] = {
        mode: 'primary',
        model: config.model || 'inherit', // Use default model or inherit
        tools: {
          bash: false,  // No command execution in plan mode
          edit: false,  // No file editing in plan mode
          write: false, // No file writing in plan mode
        },
        system: [readFileSync(planPromptPath, 'utf-8')],
      };

      // Register cline-act agent
      config.agent['cline-act'] = {
        mode: 'primary',
        model: config.model || 'inherit', // Use default model or inherit
        tools: {
          bash: true,  // Allow command execution
          edit: true,  // Allow file editing
          write: true, // Allow file writing
        },
        system: [readFileSync(actPromptPath, 'utf-8')],
      };

      await client.app.log({
        body: {
          service: 'opencode-cline-mode',
          level: 'info',
          message: 'Agents registered successfully',
          extra: {
            agents: ['cline-plan', 'cline-act'],
            planTools: config.agent['cline-plan'].tools,
            actTools: config.agent['cline-act'].tools,
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
