import type { PluginContext, OpenCodeConfig } from './types.js';
import { isTransformOutput } from './types.js';
import { Logger } from './logger.js';
import { loadPluginConfig } from './config-loader.js';
import { buildClineAgents } from './agent-builder.js';
import { transformMessages } from './message-transformer.js';

/**
 * OpenCode Cline Mode Plugin
 * Provides Cline-style Plan/Act workflow
 */
export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;

  const logger = new Logger(client);

  try {
    const pluginConfig = loadPluginConfig(directory);
    await logger.info('Plugin config loaded', { config: pluginConfig });

    await logger.info('Cline Mode Plugin initialized', {
      directory,
      worktree,
      project: project.name,
      replaceDefaultAgents: pluginConfig.replace_default_agents,
    });

    return {
      /**
       * Config hook: Register cline-plan and cline-act agents
       */
      config: async (config: OpenCodeConfig) => {
        const defaultModel = config.model || 'inherit';

        const clineAgents = buildClineAgents({
          config: pluginConfig,
          defaultModel,
        });

        const originalConfigAgent = config.agent || {};

        if (pluginConfig.replace_default_agents) {
          // Completely replace default agents with only Cline agents
          config.agent = { ...clineAgents };
          config.default_agent = pluginConfig.default_agent || 'cline-plan';

          if (!config.agent[config.default_agent]) {
            config.default_agent = 'cline-plan';
          }

          await logger.info('Cline Mode: Default agents replaced', {
            visibleAgents: Object.keys(clineAgents),
            defaultAgent: config.default_agent,
          });
        } else {
          // Add Cline agents alongside default agents
          config.agent = {
            ...originalConfigAgent,
            ...clineAgents,
          };

          await logger.info('Cline Mode: Cline agents added alongside defaults', {
            allAgents: Object.keys(config.agent),
          });
        }
      },

      /**
       * Message transform hook: Add plan completion notification and inheritance
       */
      'experimental.chat.messages.transform': async (_input: unknown, output: unknown) => {
        if (isTransformOutput(output)) {
          transformMessages(output, {
            enableExecuteCommand: pluginConfig.enable_execute_command,
          });
        } else {
          await logger.warn('Invalid transform output structure');
        }
      },

      /**
       * Chat message hook: Log agent activations
       */
      'chat.message': async (input: { agent?: string; sessionID?: string }) => {
        const { agent } = input;

        if (agent === 'cline-plan' || agent === 'cline-act') {
          await logger.info(`${agent} agent activated`, {
            sessionID: input.sessionID,
            agent,
          });
        }
      },

      /**
       * Tool hook: Register /start-act command
       */
      tool: pluginConfig.enable_execute_command
        ? {
            'start-act': {
              description: 'Switch to cline-act agent to execute the plan',
              parameters: {
                type: 'object',
                properties: {},
              },
              execute: async () => {
                try {
                  await client.app.event({
                    body: {
                      type: 'tui.command.execute',
                      properties: {
                        command: 'agent.cycle',
                      },
                    },
                  });

                  await logger.info('/start-act command triggered');

                  return {
                    output: '✅ Switching to cline-act agent...',
                  };
                } catch (error) {
                  await logger.error('Failed to execute /start-act command', {
                    error: error instanceof Error ? error.message : String(error),
                  });

                  return {
                    output: `❌ Failed to switch agent: ${error instanceof Error ? error.message : String(error)}`,
                  };
                }
              },
            },
          }
        : undefined,
    };
  } catch (error) {
    await logger.error('Failed to initialize Cline Mode Plugin', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
