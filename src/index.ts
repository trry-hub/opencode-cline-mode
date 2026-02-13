import { readFileSync } from 'fs';
import { join } from 'path';
import type { PluginContext, OpenCodeConfig } from './types';
import { Logger } from './logger';
import { getPluginDir, resolvePromptsDir } from './path-resolver';
import { loadPluginConfig } from './config-loader';
import { buildClineAgents, hideDefaultAgents } from './agent-builder';
import { transformMessages } from './message-transformer';

export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;

  const logger = new Logger(client);
  const pluginDir = getPluginDir(import.meta.url);
  const promptsDir = resolvePromptsDir(pluginDir);
  const pluginConfig = loadPluginConfig(directory);

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

    'experimental.chat.messages.transform': async (_input: unknown, output: { messages: unknown[] }) => {
      if (output && 'messages' in output) {
        transformMessages(output as Parameters<typeof transformMessages>[0]);
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
  };
}
