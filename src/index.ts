import type { PluginContext, OpenCodeConfig } from "./types.js";
import { Logger } from "./logger.js";
import { loadPluginConfig } from "./config-loader.js";
import { buildClineAgents } from "./agent-builder.js";
import { PromptFetcher } from "./prompt-fetcher.js";
import { GitHubAPIError } from "./utils/github-api.js";
import { PromptAdapter } from "./prompt-adapter.js";
import { getClineTools } from "./tools/index.js";

export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;
  const logger = new Logger(client);

  try {
    const pluginConfig = loadPluginConfig(directory);
    await logger.info("Plugin config loaded", { config: pluginConfig });

    await logger.info("Fetching Cline prompts from GitHub...", {
      directory,
      worktree,
      project: project.name,
    });

    const fetcher = new PromptFetcher();
    const adapter = new PromptAdapter();

    let prompts;
    try {
      prompts = await fetcher.fetchAll();
      await logger.info("Successfully fetched Cline prompts", {
        fileCount: prompts.size,
        files: Array.from(prompts.keys()),
      });
    } catch (error: unknown) {
      if (error instanceof GitHubAPIError) {
        await logger.error("Failed to fetch Cline prompts from GitHub", {
          error: error.message,
          status: error.status,
          rateLimitReset: error.rateLimitReset?.toISOString(),
        });

        const errorMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  Cline Mode Plugin - Failed to Fetch Prompts                  ║
╠═══════════════════════════════════════════════════════════════╣
║  The plugin could not fetch prompts from Cline's official     ║
║  GitHub repository.                                           ║
║                                                               ║
║  Error: ${error.message.padEnd(52)}║
${error.rateLimitReset ? `║  Rate limit resets at: ${error.rateLimitReset.toLocaleTimeString().padEnd(36)}║` : ""}
║                                                               ║
║  Solutions:                                                   ║
║  1. Check your internet connection                            ║
║  2. Try again in a few minutes                                ║
║  3. If rate limited, wait until the reset time                ║
║  4. Check GitHub's status: https://status.github.com          ║
╚═══════════════════════════════════════════════════════════════╝
        `.trim();

        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(String(error));
    }

    const planPrompt = adapter.adapt(prompts, "plan");
    const actPrompt = adapter.adapt(prompts, "act");

    await logger.info("Cline prompts adapted successfully", {
      planPromptLength: planPrompt.systemPrompt.length,
      actPromptLength: actPrompt.systemPrompt.length,
    });

    return {
      config: async (config: OpenCodeConfig) => {
        const defaultModel = config.model || "inherit";

        const clineAgents = buildClineAgents({
          config: pluginConfig,
          defaultModel,
          planPrompt,
          actPrompt,
        });

        const originalConfigAgent = config.agent || {};

        if (pluginConfig.replace_default_agents) {
          config.agent = { ...clineAgents };
          config.default_agent = pluginConfig.default_agent || "cline-plan";

          if (!config.agent[config.default_agent]) {
            config.default_agent = "cline-plan";
          }

          await logger.info("Cline Mode: Default agents replaced", {
            visibleAgents: Object.keys(clineAgents),
            defaultAgent: config.default_agent,
            promptsFetchedFrom: "GitHub - cline/cline (main branch)",
          });
        } else {
          config.agent = {
            ...originalConfigAgent,
            ...clineAgents,
          };

          await logger.info(
            "Cline Mode: Cline agents added alongside defaults",
            {
              allAgents: Object.keys(config.agent),
              promptsFetchedFrom: "GitHub - cline/cline (main branch)",
            },
          );
        }
      },

      tool: getClineTools(),

      "chat.message": async (input: { agent?: string; sessionID?: string }) => {
        const { agent, sessionID } = input;

        if (agent === "cline-plan" || agent === "cline-act") {
          await logger.info(`${agent} agent activated`, {
            sessionID,
            agent,
            promptsSource: "Official Cline repository (GitHub)",
          });
        }
      },
    };
  } catch (error: unknown) {
    await logger.error("Failed to initialize Cline Mode Plugin", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export { GitHubAPIError } from "./utils/github-api.js";
export { PromptAdapter } from "./prompt-adapter.js";
export { PromptFetcher } from "./prompt-fetcher.js";
export { ToolMapper } from "./tool-mapper.js";
