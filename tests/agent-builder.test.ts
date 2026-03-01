/**
 * Unit tests for agent-builder
 */

import { describe, it, expect } from "vitest";
import { buildClineAgents } from "../src/agent-builder.js";
import type { AdaptedPrompt } from "../src/prompt-adapter.js";

const mockPlanPrompt: AdaptedPrompt = {
  systemPrompt: "Mock plan prompt content",
  mode: "plan",
};

const mockActPrompt: AdaptedPrompt = {
  systemPrompt: "Mock act prompt content",
  mode: "act",
};

const baseParams = {
  config: {
    replace_default_agents: true,
    default_agent: "cline-plan" as const,
    plan_model: "",
    act_model: "",
    plan_temperature: 0.1,
    act_temperature: 0.3,
    show_completion_toast: true,
    enable_execute_command: true,
  },
  defaultModel: "inherit",
  planPrompt: mockPlanPrompt,
  actPrompt: mockActPrompt,
};

describe("Agent Builder", () => {
  it("should return cline-plan and cline-act agents", () => {
    const result = buildClineAgents(baseParams);

    expect(Object.keys(result)).toEqual(["cline-plan", "cline-act"]);
  });

  it("should set correct permissions for cline-plan", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-plan"].tools?.edit).toBe(false);
    expect(result["cline-plan"].tools?.bash).toBe(false);
    expect(result["cline-plan"].tools?.write).toBe(false);
    expect(result["cline-plan"].tools?.patch).toBe(false);
  });

  it("should set correct permissions for cline-act", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-act"].tools?.edit).toBe(true);
    expect(result["cline-act"].tools?.bash).toBe(true);
    expect(result["cline-act"].tools?.write).toBe(true);
    expect(result["cline-act"].tools?.patch).toBe(true);
  });

  it("should set correct temperatures", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-plan"].temperature).toBe(0.1);
    expect(result["cline-act"].temperature).toBe(0.3);
  });

  it("should use provided prompts in system field", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-plan"].system).toContain(mockPlanPrompt.systemPrompt);
    expect(result["cline-act"].system).toContain(mockActPrompt.systemPrompt);
  });

  it("should use custom models when provided", () => {
    const paramsWithModels = {
      ...baseParams,
      config: {
        ...baseParams.config,
        plan_model: "anthropic/claude-opus-4",
        act_model: "anthropic/claude-sonnet-4",
      },
    };

    const result = buildClineAgents(paramsWithModels);

    expect(result["cline-plan"].model).toBe("anthropic/claude-opus-4");
    expect(result["cline-act"].model).toBe("anthropic/claude-sonnet-4");
  });

  it("should use defaultModel when custom models not provided", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-plan"].model).toBe("inherit");
    expect(result["cline-act"].model).toBe("inherit");
  });

  it("should set correct descriptions", () => {
    const result = buildClineAgents(baseParams);

    expect(result["cline-plan"].description).toContain("Plan Mode");
    expect(result["cline-act"].description).toContain("Act Mode");
  });
});
