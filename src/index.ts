import { join } from 'path';
import type { PluginContext, OpenCodeConfig } from './types';
import { isTransformOutput } from './types';
import { Logger } from './logger';
import { getPluginDir, resolvePromptsDir } from './path-resolver';
import { loadPluginConfig } from './config-loader';
import { buildClineAgents } from './agent-builder';
import { transformMessages } from './message-transformer';
import { ClineAdapter } from './cline-adapter';

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

    // Initialize Cline adapter
    const cacheDir = join(directory, '.cline-cache');
    const adapter = new ClineAdapter({
      promptSource: pluginConfig.prompt_source,
      clineVersion: pluginConfig.cline_version,
      cacheTtl: pluginConfig.cache_ttl,
      fallbackToLocal: pluginConfig.fallback_to_local,
      cacheDir,
      localPromptsDir: promptsDir,
      logger,
    });

    // Load prompts using the adapter
    let planPrompt: string;
    let actPrompt: string;

    try {
      const prompts = await adapter.getPrompts();
      planPrompt = prompts.planPrompt;
      actPrompt = prompts.actPrompt;

      await logger.info('Prompts loaded successfully', {
        source: prompts.source,
        planLength: planPrompt.length,
        actLength: actPrompt.length,
      });
    } catch (error) {
      await logger.error('Failed to load prompts via adapter', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    await logger.info('Cline Mode Plugin initialized', {
      directory,
      worktree,
      project: project.name,
      config: pluginConfig,
    });

    return {
      config: async (config: OpenCodeConfig) => {
        const defaultModel = config.model || 'inherit';

        const clineAgents = buildClineAgents({
          planPrompt,
          actPrompt,
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

          await logger.info('Cline Mode: Default agents completely replaced with Cline agents', {
            visibleAgents: Object.keys(clineAgents),
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
        if (isTransformOutput(output)) {
          transformMessages(output, {
            enableExecuteCommand: pluginConfig.enable_execute_command,
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
