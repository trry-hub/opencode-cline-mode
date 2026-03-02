/**
 * Prompt adapter for converting Cline prompts to OpenCode format
 */

import type { FetchedPrompt } from "./prompt-fetcher.js";
import { ToolMapper } from "./tool-mapper.js";

export interface AdaptedPrompt {
  systemPrompt: string;
  mode: "plan" | "act";
}

export interface AdapterContext {
  yoloModeEnabled?: boolean;
  cwd?: string;
}

export class PromptAdapter {
  private toolMapper: ToolMapper;
  private context: AdapterContext;

  constructor(context?: AdapterContext) {
    this.toolMapper = new ToolMapper();
    this.context = context || {};
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
    const yoloNote = this.context.yoloModeEnabled
      ? `\n\n## YOLO Mode Enabled\n\nYou are in YOLO mode! Auto-approvals are enabled and you will automatically switch to ACT MODE after presenting a complete plan.`
      : "";

    if (mode === "plan") {
      return `# OpenCode Integration Note

You are running in OpenCode's cline-plan agent. This is equivalent to Cline's PLAN MODE.

The official Cline prompts below will guide your planning behavior.

## What is PLAN MODE in OpenCode?

- In PLAN MODE, you may need to do some information gathering using read-only tools like read, glob, and grep to get more context about the task.
- You may also ask the user clarifying questions with ask_followup_question to get a better understanding of the task.
- Once you've gained more context about the user's request, you should architect a detailed plan for how you will accomplish the task. Present the plan to the user using the plan_mode_respond tool.
- Then you might ask the user if they are pleased with this plan, or if they would like to make any changes. Think of this as a brainstorming session where you can discuss the task and plan the best way to accomplish it.
- Finally once it seems like you've reached a good plan, ask the user to switch to ACT MODE (cline-act agent) to implement the solution.

## Available Tools

- **plan_mode_respond**: Use this to share your thoughts, analysis, and plans with the user. This is your primary communication tool in PLAN MODE.
  - Set \`needs_more_exploration: true\` if you need to gather more information before finalizing the plan
  - Provide \`options\` array to give the user predefined choices
- **ask_followup_question**: Ask clarifying questions to better understand requirements.
- **read, glob, grep**: Read-only tools for information gathering and code exploration.

## Important Restrictions

- Do NOT use write, edit, patch, or bash tools in PLAN MODE
- Do NOT execute commands or make changes to files
- Do NOT use skills in PLAN MODE - skills are only available in ACT MODE
- Do NOT use subagents in PLAN MODE - subagents are only available in ACT MODE
- ONLY use read-only tools for exploration and analysis

## Switching to ACT MODE

When you and the user have agreed on a plan, ask the user to switch to the cline-act agent:
- Press Tab and select cline-act
- Or run: opencode --agent cline-act${yoloNote}

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
5. Use attempt_completion when finished${yoloNote}

---`;
    }
  }
}
