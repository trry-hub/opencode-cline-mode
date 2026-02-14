import { Logger } from './logger';

export interface FetchOptions {
  version: string; // 'latest' or specific version/branch
  timeout?: number; // in milliseconds
}

export interface ClinePromptComponents {
  actVsPlanMode: string;
  agentRole: string;
  capabilities: string;
  editingFiles: string;
  feedback: string;
  mcp: string;
  objective: string;
  rules: string;
  skills: string;
  systemInfo: string;
  taskProgress: string;
  userInstructions: string;
  toolUse: string;
}

/**
 * Fetcher for Cline prompts from GitHub
 */
export class ClineFetcher {
  private baseUrl: string;
  private logger: Logger | null;

  constructor(logger?: Logger) {
    this.baseUrl = 'https://raw.githubusercontent.com/cline/cline';
    this.logger = logger || null;
  }

  /**
   * Fetch a file from Cline repository
   */
  private async fetchFile(path: string, version: string, timeout: number = 10000): Promise<string> {
    const url = `${this.baseUrl}/${version}/${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (this.logger) {
        await this.logger.error(`Failed to fetch ${path}`, {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw new Error(
        `Failed to fetch ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch all prompt components from Cline repository
   */
  async fetchPromptComponents(options: FetchOptions): Promise<ClinePromptComponents> {
    const { version, timeout = 10000 } = options;
    const basePath = 'src/core/prompts/system-prompt/components';

    if (this.logger) {
      await this.logger.info('Fetching Cline prompt components', { version });
    }

    try {
      const [
        actVsPlanMode,
        agentRole,
        capabilities,
        editingFiles,
        feedback,
        mcp,
        objective,
        rules,
        skills,
        systemInfo,
        taskProgress,
        userInstructions,
        toolUse,
      ] = await Promise.all([
        this.fetchFile(`${basePath}/act_vs_plan_mode.ts`, version, timeout),
        this.fetchFile(`${basePath}/agent_role.ts`, version, timeout),
        this.fetchFile(`${basePath}/capabilities.ts`, version, timeout),
        this.fetchFile(`${basePath}/editing_files.ts`, version, timeout),
        this.fetchFile(`${basePath}/feedback.ts`, version, timeout),
        this.fetchFile(`${basePath}/mcp.ts`, version, timeout),
        this.fetchFile(`${basePath}/objective.ts`, version, timeout),
        this.fetchFile(`${basePath}/rules.ts`, version, timeout),
        this.fetchFile(`${basePath}/skills.ts`, version, timeout),
        this.fetchFile(`${basePath}/system_info.ts`, version, timeout),
        this.fetchFile(`${basePath}/task_progress.ts`, version, timeout),
        this.fetchFile(`${basePath}/user_instructions.ts`, version, timeout),
        this.fetchFile(`${basePath}/tool_use/index.ts`, version, timeout),
      ]);

      if (this.logger) {
        await this.logger.info('Successfully fetched all Cline prompt components');
      }

      return {
        actVsPlanMode,
        agentRole,
        capabilities,
        editingFiles,
        feedback,
        mcp,
        objective,
        rules,
        skills,
        systemInfo,
        taskProgress,
        userInstructions,
        toolUse,
      };
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Failed to fetch Cline prompt components', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }

  /**
   * Extract template text from TypeScript component file
   */
  extractTemplateText(componentContent: string): string {
    // Match the template string in the TypeScript file
    // Looking for patterns like: const getXxxTemplateText = (context) => `...`
    const templateRegex =
      /const\s+get\w+TemplateText\s*=\s*\([^)]*\)\s*=>\s*`([\s\S]*?)`\s*(?:export|const|function|$)/;
    const match = componentContent.match(templateRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback: try to find any template literal
    const fallbackRegex = /`([\s\S]*?)`/;
    const fallbackMatch = componentContent.match(fallbackRegex);

    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim();
    }

    return '';
  }

  /**
   * Build plan mode prompt from components
   */
  buildPlanPrompt(components: ClinePromptComponents): string {
    const sections = [
      this.extractTemplateText(components.agentRole),
      this.extractTemplateText(components.actVsPlanMode),
      this.extractTemplateText(components.objective),
      this.extractTemplateText(components.capabilities),
      this.extractTemplateText(components.rules),
      this.extractTemplateText(components.editingFiles),
      this.extractTemplateText(components.toolUse),
      this.extractTemplateText(components.taskProgress),
      this.extractTemplateText(components.skills),
      this.extractTemplateText(components.mcp),
      this.extractTemplateText(components.systemInfo),
      this.extractTemplateText(components.userInstructions),
      this.extractTemplateText(components.feedback),
    ];

    return sections.filter(s => s.length > 0).join('\n\n====\n\n');
  }

  /**
   * Build act mode prompt from components
   */
  buildActPrompt(components: ClinePromptComponents): string {
    const sections = [
      this.extractTemplateText(components.agentRole),
      this.extractTemplateText(components.actVsPlanMode),
      this.extractTemplateText(components.objective),
      this.extractTemplateText(components.capabilities),
      this.extractTemplateText(components.rules),
      this.extractTemplateText(components.editingFiles),
      this.extractTemplateText(components.toolUse),
      this.extractTemplateText(components.taskProgress),
      this.extractTemplateText(components.skills),
      this.extractTemplateText(components.mcp),
      this.extractTemplateText(components.systemInfo),
      this.extractTemplateText(components.userInstructions),
      this.extractTemplateText(components.feedback),
    ];

    return sections.filter(s => s.length > 0).join('\n\n====\n\n');
  }

  /**
   * Fetch and build plan prompt
   */
  async fetchPlanPrompt(options: FetchOptions): Promise<string> {
    const components = await this.fetchPromptComponents(options);
    return this.buildPlanPrompt(components);
  }

  /**
   * Fetch and build act prompt
   */
  async fetchActPrompt(options: FetchOptions): Promise<string> {
    const components = await this.fetchPromptComponents(options);
    return this.buildActPrompt(components);
  }

  /**
   * Get the latest version/commit from Cline repository
   */
  async getLatestVersion(): Promise<string> {
    try {
      const response = await fetch('https://api.github.com/repos/cline/cline/commits/main');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { sha: string };
      return data.sha.substring(0, 7); // Short commit hash
    } catch (error) {
      if (this.logger) {
        await this.logger.warn('Failed to get latest version, using "main"', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return 'main'; // Fallback to main branch
    }
  }
}
