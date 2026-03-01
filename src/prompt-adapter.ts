/**
 * Prompt adapter for converting Cline prompts to OpenCode format
 */

import type { FetchedPrompt } from "./prompt-fetcher.js";
import { ToolMapper } from "./tool-mapper.js";

export interface AdaptedPrompt {
  systemPrompt: string;
  mode: "plan" | "act";
}

export class PromptAdapter {
  private toolMapper: ToolMapper;

  constructor() {
    this.toolMapper = new ToolMapper();
  }

  /**
   * Adapt fetched prompts to OpenCode format
   */
  adapt(
    prompts: Map<string, FetchedPrompt>,
    mode: "plan" | "act",
  ): AdaptedPrompt {
    const sections: string[] = [];

    const systemPromptIndex = prompts.get(
      "src/core/prompts/system-prompt/index.ts",
    );
    if (systemPromptIndex) {
      sections.push(this.extractPromptContent(systemPromptIndex.rawContent));
    }

    const sections_dir = "src/core/prompts/system-prompt/components/";
    const orderedSections = [
      "agent_role.ts",
      "objective.ts",
      "capabilities.ts",
      "rules.ts",
      "task_progress.ts",
      "act_vs_plan_mode.ts",
    ];

    for (const sectionFile of orderedSections) {
      const section = prompts.get(sections_dir + sectionFile);
      if (section) {
        const content = this.extractPromptContent(section.rawContent);
        const adapted = this.adaptSection(content, sectionFile);
        sections.push(adapted);
      }
    }

    const combined = this.combineSections(sections, mode);

    return {
      systemPrompt: combined,
      mode,
    };
  }

  /**
   * Extract prompt content from TypeScript file
   */
  private extractPromptContent(rawContent: string): string {
    const templateLiteralRegex = /`([\s\S]*?)(?=`)/g;
    const matches = rawContent.matchAll(templateLiteralRegex);

    let content = "";
    for (const match of matches) {
      content += match[1] + "\n";
    }

    content = content
      .replace(/\$\{[^}]+\}/g, "")
      .replace(/\\\n/g, "\n")
      .replace(/\\`/g, "`")
      .replace(/\\\$/g, "$");

    return content.trim();
  }

  /**
   * Adapt a section based on its type
   */
  private adaptSection(content: string, sectionFile: string): string {
    if (sectionFile === "mcp.ts") {
      return "";
    }

    let adapted = content;

    if (sectionFile === "capabilities.ts") {
      adapted = this.toolMapper.mapToolsInText(adapted);
    }

    adapted = this.removeMCPReferences(adapted);

    return adapted;
  }

  /**
   * Remove MCP-related content
   */
  private removeMCPReferences(content: string): string {
    const mcpPatterns = [
      /## MCP[\s\S]*?(?=\n## |$)/gi,
      /\*\*MCP\*\*[\s\S]*?(?=\n\n|\n## |$)/gi,
      /MCP servers[\s\S]*?(?=\n\n|\n## |$)/gi,
    ];

    let result = content;
    for (const pattern of mcpPatterns) {
      result = result.replace(pattern, "");
    }

    return result.trim();
  }

  /**
   * Combine sections into final prompt
   */
  private combineSections(sections: string[], mode: "plan" | "act"): string {
    const validSections = sections.filter((s) => s.length > 0);

    const modeNote = this.getModeNote(mode);

    return [modeNote, ...validSections].join("\n\n====\n\n");
  }

  /**
   * Get mode-specific note (minimal, doesn't override official prompts)
   */
  private getModeNote(mode: "plan" | "act"): string {
    if (mode === "plan") {
      return `# OpenCode Integration Note

You are running in OpenCode's cline-plan agent. This is equivalent to Cline's PLAN MODE.

The official Cline prompts below will guide your planning behavior.

## Available Tools in PLAN MODE

- **plan_mode_respond**: Use this to share your thoughts, analysis, and plans with the user. This is your primary communication tool.
- **ask_followup_question**: Ask clarifying questions to better understand requirements.
- **read, glob, grep**: Read-only tools for information gathering.
- **cline-approve**: Call this tool when you have presented a complete plan and are ready for user approval. This will show a permission dialog for the user to approve or reject.

## Workflow
1. Gather information using read-only tools
2. Use plan_mode_respond to share your analysis
3. Present a detailed step-by-step plan
4. Use ask_followup_question if you need clarification
5. **MANDATORY**: When your plan is complete, you MUST call the \`cline-approve\` tool to request user approval. This will show a popup dialog for the user to approve or reject your plan. DO NOT skip this step.

## Restrictions
- Do NOT use write, edit, patch, or bash tools
- Do NOT execute commands or make changes
- NEVER complete your response without calling \`cline-approve\` after presenting a plan

---`;
    } else {
      return `# OpenCode Integration Note

You are running in OpenCode's cline-act agent. This is equivalent to Cline's ACT MODE.

The official Cline prompts below will guide your execution behavior.

## Available Tools in ACT MODE

- **read, write, edit, patch**: File manipulation tools
- **bash**: Execute terminal commands
- **glob, grep**: Search and pattern matching
- **attempt_completion**: Present the final result when task is complete

## Workflow
1. Execute the approved plan step by step
2. Use file tools and bash to make changes
3. Report progress after each step
4. Verify changes work correctly
5. Use attempt_completion when finished

---`;
    }
  }
}
