import { join } from 'path';
import { readFile } from 'fs/promises';
import { ClineCache } from './cline-cache';
import { ClineFetcher } from './cline-fetcher';
import { adaptPromptToolNames } from './cline-tool-mapper';
import { Logger } from './logger';

export interface ClineAdapterOptions {
  promptSource: 'local' | 'github' | 'auto';
  clineVersion: string; // 'latest' or specific version
  cacheTtl: number; // in hours
  fallbackToLocal: boolean;
  cacheDir: string;
  localPromptsDir: string;
  logger?: Logger;
}

export interface AdaptedPrompts {
  planPrompt: string;
  actPrompt: string;
  source: 'local' | 'github' | 'cache';
}

/**
 * Main adapter for Cline prompts
 * Coordinates fetching, caching, and adapting Cline prompts for OpenCode
 */
export class ClineAdapter {
  private cache: ClineCache;
  private fetcher: ClineFetcher;
  private options: ClineAdapterOptions;
  private logger: Logger | null;

  constructor(options: ClineAdapterOptions) {
    this.options = options;
    this.logger = options.logger || null;

    this.cache = new ClineCache({
      cacheDir: options.cacheDir,
      ttl: options.cacheTtl,
    });

    this.fetcher = new ClineFetcher(options.logger);
  }

  /**
   * Load prompts from local files
   */
  private async loadLocalPrompts(): Promise<{ planPrompt: string; actPrompt: string }> {
    if (this.logger) {
      await this.logger.info('Loading prompts from local files');
    }

    try {
      const planPath = join(this.options.localPromptsDir, 'plan.md');
      const actPath = join(this.options.localPromptsDir, 'act.md');

      const [planPrompt, actPrompt] = await Promise.all([
        readFile(planPath, 'utf-8'),
        readFile(actPath, 'utf-8'),
      ]);

      return { planPrompt, actPrompt };
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Failed to load local prompts', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error(
        `Failed to load local prompts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch prompts from GitHub
   */
  private async fetchFromGitHub(): Promise<{ planPrompt: string; actPrompt: string }> {
    if (this.logger) {
      await this.logger.info('Fetching prompts from GitHub', {
        version: this.options.clineVersion,
      });
    }

    const version =
      this.options.clineVersion === 'latest'
        ? await this.fetcher.getLatestVersion()
        : this.options.clineVersion;

    const [planPrompt, actPrompt] = await Promise.all([
      this.fetcher.fetchPlanPrompt({ version }),
      this.fetcher.fetchActPrompt({ version }),
    ]);

    // Cache the fetched prompts
    await Promise.all([
      this.cache.set('plan', version, planPrompt),
      this.cache.set('act', version, actPrompt),
    ]);

    return { planPrompt, actPrompt };
  }

  /**
   * Try to load from cache
   */
  private async loadFromCache(): Promise<{ planPrompt: string; actPrompt: string } | null> {
    const version =
      this.options.clineVersion === 'latest'
        ? await this.fetcher.getLatestVersion()
        : this.options.clineVersion;

    const [planPrompt, actPrompt] = await Promise.all([
      this.cache.get('plan', version),
      this.cache.get('act', version),
    ]);

    if (planPrompt && actPrompt) {
      if (this.logger) {
        await this.logger.info('Loaded prompts from cache', { version });
      }
      return { planPrompt, actPrompt };
    }

    return null;
  }

  /**
   * Get prompts based on configuration
   */
  async getPrompts(): Promise<AdaptedPrompts> {
    let planPrompt: string;
    let actPrompt: string;
    let source: 'local' | 'github' | 'cache';

    try {
      switch (this.options.promptSource) {
        case 'local': {
          // Always use local files
          const localPrompts = await this.loadLocalPrompts();
          planPrompt = localPrompts.planPrompt;
          actPrompt = localPrompts.actPrompt;
          source = 'local';
          break;
        }

        case 'github': {
          // Always fetch from GitHub
          try {
            const githubPrompts = await this.fetchFromGitHub();
            planPrompt = githubPrompts.planPrompt;
            actPrompt = githubPrompts.actPrompt;
            source = 'github';
          } catch (error) {
            if (this.options.fallbackToLocal) {
              if (this.logger) {
                await this.logger.warn('GitHub fetch failed, falling back to local', {
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              const fallbackPrompts = await this.loadLocalPrompts();
              planPrompt = fallbackPrompts.planPrompt;
              actPrompt = fallbackPrompts.actPrompt;
              source = 'local';
            } else {
              throw error;
            }
          }
          break;
        }

        case 'auto':
        default: {
          // Try cache first, then GitHub, then local
          const cachedPrompts = await this.loadFromCache();

          if (cachedPrompts) {
            planPrompt = cachedPrompts.planPrompt;
            actPrompt = cachedPrompts.actPrompt;
            source = 'cache';
          } else {
            try {
              const githubPrompts = await this.fetchFromGitHub();
              planPrompt = githubPrompts.planPrompt;
              actPrompt = githubPrompts.actPrompt;
              source = 'github';
            } catch (error) {
              if (this.options.fallbackToLocal) {
                if (this.logger) {
                  await this.logger.warn('GitHub fetch failed, falling back to local', {
                    error: error instanceof Error ? error.message : String(error),
                  });
                }
                const fallbackPrompts = await this.loadLocalPrompts();
                planPrompt = fallbackPrompts.planPrompt;
                actPrompt = fallbackPrompts.actPrompt;
                source = 'local';
              } else {
                throw error;
              }
            }
          }
          break;
        }
      }

      // Adapt tool names from Cline to OpenCode
      planPrompt = adaptPromptToolNames(planPrompt);
      actPrompt = adaptPromptToolNames(actPrompt);

      if (this.logger) {
        await this.logger.info('Prompts loaded and adapted', { source });
      }

      return {
        planPrompt,
        actPrompt,
        source,
      };
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Failed to get prompts', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    if (this.logger) {
      await this.logger.info('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }
}
