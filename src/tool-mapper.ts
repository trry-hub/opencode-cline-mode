/**
 * Tool mapper for converting Cline tool names to OpenCode equivalents
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

export interface ToolMapping {
  tools: Record<string, string>;
  unsupported: string[];
  alternatives: Record<string, string>;
}

export class ToolMapper {
  private mapping: ToolMapping;

  constructor() {
    this.mapping = this.loadMapping();
  }

  private loadMapping(): ToolMapping {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const configPath = path.join(
      __dirname,
      "..",
      "..",
      "config",
      "tool-mapping.json",
    );

    try {
      const content = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(content) as ToolMapping;
    } catch (error) {
      throw new Error(
        `Failed to load tool mapping configuration: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Map a Cline tool name to OpenCode equivalent
   */
  mapTool(clineTool: string): string | null {
    if (this.isUnsupported(clineTool)) {
      return null;
    }

    return this.mapping.tools[clineTool] || clineTool;
  }

  /**
   * Check if a tool is unsupported
   */
  isUnsupported(tool: string): boolean {
    return this.mapping.unsupported.includes(tool);
  }

  /**
   * Get alternative for an unsupported tool
   */
  getAlternative(tool: string): string | null {
    return this.mapping.alternatives[tool] || null;
  }

  /**
   * Map all tool references in a text
   */
  mapToolsInText(text: string): string {
    let result = text;

    for (const [clineTool, openCodeTool] of Object.entries(
      this.mapping.tools,
    )) {
      const patterns = [
        new RegExp(`\\b${clineTool}\\b`, "g"),
        new RegExp(`\`${clineTool}\``, "g"),
        new RegExp(`\\*\\*${clineTool}\\*\\*`, "g"),
      ];

      for (const pattern of patterns) {
        result = result.replace(pattern, (match) => {
          if (match.includes("`")) {
            return `\`${openCodeTool}\``;
          }
          if (match.includes("**")) {
            return `**${openCodeTool}**`;
          }
          return openCodeTool;
        });
      }
    }

    for (const unsupportedTool of this.mapping.unsupported) {
      const alternative = this.getAlternative(unsupportedTool);
      if (alternative) {
        const patterns = [
          new RegExp(`\\b${unsupportedTool}\\b`, "g"),
          new RegExp(`\`${unsupportedTool}\``, "g"),
          new RegExp(`\\*\\*${unsupportedTool}\\*\\*`, "g"),
        ];

        for (const pattern of patterns) {
          result = result.replace(pattern, (match) => {
            if (match.includes("`")) {
              return `\`${alternative}\``;
            }
            if (match.includes("**")) {
              return `**${alternative}**`;
            }
            return alternative;
          });
        }
      }
    }

    return result;
  }

  /**
   * Get all supported tools
   */
  getSupportedTools(): string[] {
    return Object.keys(this.mapping.tools);
  }

  /**
   * Get all unsupported tools
   */
  getUnsupportedTools(): string[] {
    return this.mapping.unsupported;
  }
}
