import { readFileSync } from 'fs';
import { join } from 'path';
import type { PluginContext, OpenCodeConfig } from './types';
import { isTransformOutput } from './types';
import { Logger } from './logger';
import { getPluginDir, resolvePromptsDir } from './path-resolver';
import { loadPluginConfig } from './config-loader';
import { buildClineAgents, hideDefaultAgents } from './agent-builder';
import { transformMessages } from './message-transformer';

export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;

  const logger = new Logger(client);

  try {
    const pluginDir = getPluginDir(import.meta.url);
    await logger.info('Plugin directory resolved', { pluginDir });

    const promptsDir = resolvePromptsDir(pluginDir);
    await logger.info('Prompts directory resolved', { promptsDir });

    const pluginConfig = loadPluginConfig(directory);
    await logger.info('Plugin config loaded', { config: pluginConfig });

    const planPromptPath = join(promptsDir, 'plan.md');
    const actPromptPath = join(promptsDir, 'act.md');

    await logger.info('Cline Mode Plugin initialized', {
      directory,
      worktree,
      project: project.name,
      config: pluginConfig,
    });

    return {
      config: async (config: OpenCodeConfig) => {
        const planPrompt = readFileSync(planPromptPath, 'utf-8');
        const actPrompt = readFileSync(actPromptPath, 'utf-8');

        const defaultModel = config.model || 'inherit';

        const clineAgents = buildClineAgents({
          planPrompt,
          actPrompt,
          config: pluginConfig,
          defaultModel,
        });

        const originalConfigAgent = config.agent || {};

        if (pluginConfig.replace_default_agents) {
          const hiddenAgents = hideDefaultAgents(originalConfigAgent);

          config.agent = {
            ...clineAgents,
            ...hiddenAgents,
          };

          if (!config.agent || Object.keys(config.agent).length === 0) {
            config.agent = { ...clineAgents };
          }

          config.default_agent = pluginConfig.default_agent || 'cline-plan';

          if (!config.agent[config.default_agent]) {
            config.default_agent = 'cline-plan';
          }

          await logger.info('Cline Mode: Default agents hidden, only Cline agents visible', {
            visibleAgents: Object.keys(clineAgents),
            hiddenAgents: Object.keys(hiddenAgents),
            defaultAgent: config.default_agent,
          });
        } else {
          config.agent = {
            ...originalConfigAgent,
            ...clineAgents,
          };

          await logger.info('Cline Mode: Cline agents added alongside default agents', {
            allAgents: Object.keys(config.agent),
          });
        }
      },

      'experimental.chat.messages.transform': async (_input: unknown, output: unknown) => {
        await logger.debug('Transform hook called', {
          hasInput: _input !== undefined,
          hasOutput: output !== undefined,
          outputType: output?.constructor?.name,
        });

        if (isTransformOutput(output)) {
          await logger.debug('Transform output structure valid', {
            messagesCount: output.messages?.length,
            enableExecuteCommand: pluginConfig.enable_execute_command,
          });

          transformMessages(output, {
            enableExecuteCommand: pluginConfig.enable_execute_command,
          });

          await logger.debug('Transform completed', {
            messagesCount: output.messages?.length,
          });
        } else {
          await logger.warn('Invalid transform output structure', { output });
        }
      },

      'chat.message': async (input: { agent?: string; sessionID?: string }) => {
        const { agent } = input;

        if (agent === 'cline-plan' || agent === 'cline-act') {
          await logger.info(`${agent} agent activated`, {
            sessionID: input.sessionID,
            agent,
          });
        }
      },

      tool: pluginConfig.enable_execute_command
        ? {
            'execute-plan': {
              description: 'Switch to cline-act agent and execute the plan',
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

                  await logger.info('Execute plan command triggered');

                  return {
                    output: '✅ Switching to cline-act agent...',
                  };
                } catch (error) {
                  await logger.error('Failed to execute plan command', {
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
