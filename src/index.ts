import { join } from 'path';
import { homedir } from 'os';
import type { PluginContext, OpenCodeConfig } from './types';
import { isTransformOutput } from './types';
import { Logger } from './logger';
import { getPluginDir, resolvePromptsDir } from './path-resolver';
import { loadPluginConfig } from './config-loader';
import { buildClineAgents } from './agent-builder';
import { transformMessages } from './message-transformer';
import { ClineAdapter } from './cline-adapter';
import { ApprovalGate } from './approval-gate';

export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;

  const logger = new Logger(client);

  try {
    const pluginDir = getPluginDir(import.meta.url);
    logger.info('Plugin directory resolved', { pluginDir });

    const promptsDir = resolvePromptsDir(pluginDir);
    logger.info('Prompts directory resolved', { promptsDir });

    const pluginConfig = loadPluginConfig(directory);
    logger.info('Plugin config loaded', { config: pluginConfig });

    const plansDir = join(directory, '.opencode', 'plans');
    const approvalGate = new ApprovalGate({ plansDir, logger });

    // Initialize Cline adapter with global cache directory
    const cacheDir = join(homedir(), '.config/opencode/.cline-cache');
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

      logger.info('Prompts loaded successfully', {
        source: prompts.source,
        planLength: planPrompt.length,
        actLength: actPrompt.length,
      });
    } catch (error) {
      logger.error('Failed to load prompts via adapter', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    logger.info('Cline Mode Plugin initialized', {
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
          // Hide default agents by setting them to hidden mode
          // This ensures they don't appear in the agent list
          config.agent = {
            ...clineAgents,
            plan: {
              mode: 'subagent',
              hidden: true,
              model: '',
              temperature: 0,
              description: '',
              system: [],
            },
            build: {
              mode: 'subagent',
              hidden: true,
              model: '',
              temperature: 0,
              description: '',
              system: [],
            },
          };

          config.default_agent = pluginConfig.default_agent || 'cline-plan';

          if (!config.agent[config.default_agent]) {
            config.default_agent = 'cline-plan';
          }

          logger.info('Cline Mode: Default agents hidden, only Cline agents visible', {
            originalAgents: Object.keys(originalConfigAgent),
            clineAgents: Object.keys(clineAgents),
            defaultAgent: config.default_agent,
          });
        } else {
          config.agent = {
            ...originalConfigAgent,
            ...clineAgents,
          };

          logger.info('Cline Mode: Cline agents added alongside default agents', {
            allAgents: Object.keys(config.agent),
          });
        }
      },

      'experimental.chat.messages.transform': async (input: unknown, output: unknown) => {
        logger.debug('Transform hook called', {
          hasInput: !!input,
          hasOutput: !!output,
          outputType: typeof output,
          isArray: Array.isArray((output as Record<string, unknown>)?.messages),
        });

        if (isTransformOutput(output)) {
          logger.debug('Transform hook triggered - valid output', {
            messageCount: output.messages.length,
            lastMessageAgent: output.messages[output.messages.length - 1]?.info?.agent,
          });
          transformMessages(output, {
            enableExecuteCommand: pluginConfig.enable_execute_command,
            enablePlanApproval: pluginConfig.enable_plan_approval,
            logger,
          });
        } else {
          logger.warn('Invalid transform output structure', {
            output,
            outputKeys: output && typeof output === 'object' ? Object.keys(output) : 'N/A',
          });
        }
      },

      'chat.message': async (input: { agent?: string; sessionID?: string }) => {
        const { agent, sessionID } = input;

        if (agent?.toLowerCase() === 'cline-plan' && sessionID) {
          await approvalGate.createPlanStatus(sessionID);
          logger.info('Plan status created', { sessionID });
        }

        if (agent?.toLowerCase() === 'cline-plan' || agent?.toLowerCase() === 'cline-act') {
          logger.info(`${agent} agent activated`, { sessionID, agent });
        }
      },

      tool: {
        ...(pluginConfig.enable_execute_command
          ? {
              'start-act': {
                description: 'Switch to cline-act agent and start execution',
                parameters: {
                  type: 'object',
                  properties: {
                    plan_id: {
                      type: 'string',
                      description: 'Plan ID (session ID from cline-plan)',
                    },
                  },
                },
                execute: async (params: { plan_id?: string }) => {
                  try {
                    const planId = params.plan_id || (await approvalGate.getCurrentPlanId());

                    if (pluginConfig.enable_plan_approval && planId) {
                      await approvalGate.requireApproval(planId);
                    }

                    await client.app.event({
                      body: {
                        type: 'tui.command.execute',
                        properties: {
                          command: 'agent.cycle',
                        },
                      },
                    });

                    logger.info('Start act command triggered', { planId });

                    return {
                      output: '✅ Switching to cline-act agent...',
                    };
                  } catch (error) {
                    logger.error('Failed to start act command', {
                      error: error instanceof Error ? error.message : String(error),
                    });

                    return {
                      output: `❌ ${error instanceof Error ? error.message : String(error)}`,
                    };
                  }
                },
              },
            }
          : {}),

        ...(pluginConfig.enable_plan_approval
          ? {
              'approve-plan': {
                description: 'Approve the current plan to allow execution',
                parameters: {
                  type: 'object',
                  properties: {
                    plan_id: {
                      type: 'string',
                      description:
                        'Plan ID to approve (optional, uses current plan if not provided)',
                    },
                  },
                },
                execute: async (params: { plan_id?: string }) => {
                  try {
                    const planId = params.plan_id || (await approvalGate.getCurrentPlanId());

                    if (!planId) {
                      return {
                        output:
                          '❌ No plan found. Please create a plan first using cline-plan agent.',
                      };
                    }

                    await approvalGate.approve(planId);

                    logger.info('Plan approved', { planId });

                    return {
                      output: `✅ Plan '${planId}' approved successfully. You can now use /start-act to execute it.`,
                    };
                  } catch (error) {
                    logger.error('Failed to approve plan', {
                      error: error instanceof Error ? error.message : String(error),
                    });

                    return {
                      output: `❌ Failed to approve plan: ${error instanceof Error ? error.message : String(error)}`,
                    };
                  }
                },
              },

              'reject-plan': {
                description: 'Reject the current plan',
                parameters: {
                  type: 'object',
                  properties: {
                    plan_id: {
                      type: 'string',
                      description:
                        'Plan ID to reject (optional, uses current plan if not provided)',
                    },
                    reason: {
                      type: 'string',
                      description: 'Reason for rejection',
                    },
                  },
                },
                execute: async (params: { plan_id?: string; reason?: string }) => {
                  try {
                    const planId = params.plan_id || (await approvalGate.getCurrentPlanId());

                    if (!planId) {
                      return {
                        output: '❌ No plan found.',
                      };
                    }

                    await approvalGate.reject(planId, params.reason || 'No reason provided');

                    logger.info('Plan rejected', { planId });

                    return {
                      output: `❌ Plan '${planId}' rejected. Please modify the plan and re-approve it.`,
                    };
                  } catch (error) {
                    logger.error('Failed to reject plan', {
                      error: error instanceof Error ? error.message : String(error),
                    });

                    return {
                      output: `❌ Failed to reject plan: ${error instanceof Error ? error.message : String(error)}`,
                    };
                  }
                },
              },
            }
          : {}),
      },
    };
  } catch (error) {
    logger.error('Failed to initialize Cline Mode Plugin', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
