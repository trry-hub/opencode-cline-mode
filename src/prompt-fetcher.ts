/**
 * Prompt fetcher for retrieving Cline prompts from GitHub
 */

import { fetchMultipleFiles, checkRateLimit } from "./utils/github-api.js";
import { GitHubAPIError } from "./utils/github-api.js";
import { PromptCache } from "./utils/cache.js";

export const CLINE_PROMPT_FILES = [
  "src/core/prompts/system-prompt/components/act_vs_plan_mode.ts",
  "src/core/prompts/system-prompt/components/capabilities.ts",
  "src/core/prompts/system-prompt/components/rules.ts",
  "src/core/prompts/system-prompt/components/objective.ts",
  "src/core/prompts/system-prompt/components/agent_role.ts",
  "src/core/prompts/system-prompt/components/task_progress.ts",
  "src/core/prompts/system-prompt/index.ts",
];

export interface FetchedPrompt {
  path: string;
  rawContent: string;
}

export class PromptFetcher {
  private cache: PromptCache;

  constructor() {
    this.cache = new PromptCache();
  }

  /**
   * Fetch all Cline prompts from GitHub
   */
  async fetchAll(): Promise<Map<string, FetchedPrompt>> {
    try {
      const rateLimit = await checkRateLimit();

      if (rateLimit.remaining < CLINE_PROMPT_FILES.length) {
        const resetTime = rateLimit.resetTime.toLocaleTimeString();
        throw new GitHubAPIError(
          `GitHub API rate limit exceeded. Please try again after ${resetTime}.`,
          403,
          rateLimit.resetTime,
        );
      }

      const files = await fetchMultipleFiles(CLINE_PROMPT_FILES);
      const prompts = new Map<string, FetchedPrompt>();

      for (const [path, content] of files) {
        prompts.set(path, {
          path,
          rawContent: content,
        });

        this.cache.set(path, content);
      }

      return prompts;
    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error;
      }

      throw new GitHubAPIError(
        `Failed to fetch Cline prompts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Fetch a single prompt file
   */
  async fetchOne(filePath: string): Promise<FetchedPrompt> {
    const files = await fetchMultipleFiles([filePath]);
    const content = files.get(filePath);

    if (!content) {
      throw new GitHubAPIError(`Failed to fetch ${filePath}`);
    }

    this.cache.set(filePath, content);

    return {
      path: filePath,
      rawContent: content,
    };
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { fileCount: number; totalSize: number } {
    return this.cache.getStats();
  }
}
