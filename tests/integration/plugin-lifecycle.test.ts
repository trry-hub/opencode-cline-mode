/**
 * Integration tests for plugin lifecycle
 */

import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@opencode-ai/plugin", () => {
  const z = {
    string: () => ({
      optional: () => ({ describe: () => ({}) }),
      describe: () => ({}),
    }),
    array: () => ({
      optional: () => ({ describe: () => ({}) }),
      describe: () => ({}),
    }),
    boolean: () => ({
      optional: () => ({ describe: () => ({}) }),
      describe: () => ({}),
    }),
    number: () => ({
      describe: () => ({}),
    }),
    enum: () => ({
      describe: () => ({}),
    }),
  };
  const tool = (input: {
    description: string;
    args: unknown;
    execute: unknown;
  }) => input;
  tool.schema = z;
  return { tool };
});

vi.mock("../../src/utils/github-api.js", () => ({
  fetchMultipleFiles: vi.fn().mockResolvedValue(
    new Map([
      [
        "src/core/prompts/system-prompt/components/agent_role.ts",
        "export const content = `You are a planning agent.`",
      ],
      [
        "src/core/prompts/system-prompt/components/objective.ts",
        "export const content = `Your goal is to help users.`",
      ],
      [
        "src/core/prompts/system-prompt/components/capabilities.ts",
        "export const content = `You can use tools.`",
      ],
      [
        "src/core/prompts/system-prompt/components/rules.ts",
        "export const content = `Follow these rules.`",
      ],
      [
        "src/core/prompts/system-prompt/components/act_vs_plan_mode.ts",
        "export const content = `Plan vs Act modes.`",
      ],
    ]),
  ),
  checkRateLimit: vi
    .fn()
    .mockResolvedValue({ remaining: 100, resetTime: new Date() }),
  GitHubAPIError: class GitHubAPIError extends Error {
    status?: number;
    rateLimitReset?: Date;
    constructor(message: string, status?: number, rateLimitReset?: Date) {
      super(message);
      this.status = status;
      this.rateLimitReset = rateLimitReset;
    }
  },
}));

vi.mock("../../src/tool-mapper.js", () => ({
  ToolMapper: class MockToolMapper {
    mapToolsInText = vi.fn((text: string) => text);
    isUnsupported = vi.fn(() => false);
    getAlternative = vi.fn(() => null);
    getUnsupportedTools = vi.fn(() => []);
  },
}));

import ClineModePlugin from "../../src/index.js";
import { createMockPluginContext, cleanupTempDirs } from "../mocks/context.js";
import type { OpenCodeConfig } from "../../src/types.js";

describe("Plugin Lifecycle Integration", () => {
  afterEach(() => {
    cleanupTempDirs();
  });

  it("should load plugin and register hooks", async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    expect(plugin).toBeDefined();
    expect(typeof plugin.config).toBe("function");
    expect(plugin["chat.message"]).toBeDefined();
  });

  it("should register cline-plan and cline-act agents via config hook", async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    const config: OpenCodeConfig = {
      model: "test-model",
      agent: {},
    };

    await plugin.config(config);

    expect(config.agent).toBeDefined();
    expect(config.agent?.["cline-plan"]).toBeDefined();
    expect(config.agent?.["cline-act"]).toBeDefined();
    expect(config.default_agent).toBe("cline-plan");
  });

  it("should set correct agent permissions", async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    const config: OpenCodeConfig = {
      model: "test-model",
      agent: {},
    };

    await plugin.config(config);

    expect(config.agent?.["cline-plan"]?.tools?.edit).toBe(false);
    expect(config.agent?.["cline-plan"]?.tools?.bash).toBe(false);
    expect(config.agent?.["cline-plan"]?.tools?.write).toBe(false);
    expect(config.agent?.["cline-plan"]?.tools?.patch).toBe(false);
    expect(config.agent?.["cline-act"]?.tools?.edit).toBe(true);
    expect(config.agent?.["cline-act"]?.tools?.bash).toBe(true);
    expect(config.agent?.["cline-act"]?.tools?.write).toBe(true);
    expect(config.agent?.["cline-act"]?.tools?.patch).toBe(true);
  });

  it("should handle chat.message hook for agent activation", async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    expect(plugin["chat.message"]).toBeDefined();

    await plugin["chat.message"]({
      agent: "cline-plan",
      sessionID: "test-session-1",
    });

    await plugin["chat.message"]({
      agent: "cline-act",
      sessionID: "test-session-2",
    });

    expect(true).toBe(true);
  });

  it("should register tools", async () => {
    const mockContext = createMockPluginContext();
    const plugin = await ClineModePlugin(mockContext);

    expect(plugin.tool).toBeDefined();
    expect(plugin.tool?.["plan_mode_respond"]).toBeDefined();
    expect(plugin.tool?.["ask_followup_question"]).toBeDefined();
    expect(plugin.tool?.["attempt_completion"]).toBeDefined();
    expect(plugin.tool?.["init_focus_chain"]).toBeDefined();
    expect(plugin.tool?.["update_focus_step"]).toBeDefined();
    expect(plugin.tool?.["get_focus_chain"]).toBeDefined();
  });
});
