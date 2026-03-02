import { tool } from "@opencode-ai/plugin";
import { StateManager } from "../state-manager.js";

export const approvePlanTool = tool({
  description:
    "Request user approval for the current plan. After approval, asks if user wants to switch to Act Mode or stay in Plan Mode.",
  args: {
    plan_summary: tool.schema
      .string()
      .optional()
      .describe("Optional summary of the plan being approved"),
  },
  execute: async (args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    if (stateManager) {
      stateManager.setAwaitingPlanResponse(true);
      if (args.plan_summary) {
        stateManager.setLastPlan(args.plan_summary);
      }
    }

    await context.ask({
      permission: "plan_approval",
      patterns: ["cline-plan:approve"],
      always: [],
      metadata: {
        agent: context.agent,
        sessionID: context.sessionID,
        planSummary: args.plan_summary,
      },
    });

    if (stateManager) {
      stateManager.setAwaitingPlanResponse(false);
      stateManager.setModeSwitched(true);
    }

    context.metadata({
      title: "Plan Approved - What's Next?",
      metadata: {
        status: "approved",
        agent: context.agent,
        yoloMode: stateManager?.isYoloMode() || false,
        options: ["Switch to Act Mode", "Stay in Plan Mode"],
      },
    });

    // YOLO 模式：直接提示切换
    if (stateManager?.isYoloMode()) {
      return `[PLAN APPROVED]

The plan has been approved!

**YOLO Mode**: Automatically switching to ACT MODE.

**Switching to ACT MODE**:
- Press \`Tab\` and select \`cline-act\`
- Or run: \`opencode --agent cline-act\`

The approved plan will be executed step by step in ACT MODE.`;
    }

    // 标准模式：提供两个选项
    return `[PLAN APPROVED]

The plan has been approved!

**What would you like to do next?**

**Option 1: Switch to Act Mode** ✅
Execute the plan now by switching to the \`cline-act\` agent:
- Press \`Tab\` and select \`cline-act\`
- Or run: \`opencode --agent cline-act\`

**Option 2: Stay in Plan Mode** 📋
Continue in \`cline-plan\` to:
- Review the plan in more detail
- Make modifications before execution
- Discuss alternative approaches

**Your choice**: Reply with "switch" or "act" to execute now, or continue the conversation to stay in plan mode.`;
  },
});

export const planModeRespondTool = tool({
  description:
    "Respond to the user in PLAN MODE. Use this to share thoughts, analysis, or present plans directly without using thinking tags. This is the primary way to communicate in PLAN MODE.",
  args: {
    response: tool.schema.string().describe("The response to share with user"),
    options: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe(
        "Optional list of suggested answers for the user to choose from",
      ),
    needs_more_exploration: tool.schema
      .boolean()
      .optional()
      .describe(
        "Set to true if you need to gather more information before finalizing the plan",
      ),
  },
  execute: async (args, context) => {
    const { response, options, needs_more_exploration } = args;

    // Validate response parameter
    if (!response || typeof response !== 'string') {
      return "❌ Error: Invalid response parameter. Response must be a non-empty string.";
    }

    context.metadata({
      title: "📋 Plan Created",
      metadata: {
        mode: "plan",
        type: "plan_response",
        hasOptions: !!options,
        needsMoreExploration: needs_more_exploration,
      },
    });

    // Create visual box for plan response
    const boxWidth = 65;
    const topBorder = "╔" + "═".repeat(boxWidth - 2) + "╗";
    const bottomBorder = "╚" + "═".repeat(boxWidth - 2) + "╝";
    const separator = "╠" + "═".repeat(boxWidth - 2) + "╣";
    
    const createLine = (text: string) => {
      const padding = boxWidth - 4 - text.length;
      return "║ " + text + " ".repeat(Math.max(0, padding)) + " ║";
    };

    if (needs_more_exploration) {
      return `${topBorder}
${createLine("🔍 继续探索")}
${separator}

${response}

**注意**: 需要更多信息来完善计划。继续使用只读工具收集信息。

${bottomBorder}`;
    }

    let formattedResponse = `${topBorder}
${createLine("📋 实施计划")}
${separator}

${response}`;

    if (options && options.length > 0) {
      formattedResponse += "\n\n**选项**:";
      options.forEach((opt, i) => {
        formattedResponse += `\n${i + 1}. ${opt}`;
      });
    }

    formattedResponse += `\n\n${bottomBorder}`;

    return formattedResponse;
  },
});

export const askFollowupQuestionTool = tool({
  description:
    "Ask the user a clarifying question to better understand their requirements. Use this in PLAN MODE when you need more information.",
  args: {
    question: tool.schema.string().describe("The question to ask the user"),
    options: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Optional list of suggested answers"),
  },
  execute: async (args, context) => {
    context.metadata({
      title: "Question",
      metadata: { question: args.question, options: args.options },
    });

    let response = `❓ **Question**: ${args.question}`;

    if (args.options && args.options.length > 0) {
      response += "\n\n**Options**:";
      args.options.forEach((opt, i) => {
        response += `\n${i + 1}. ${opt}`;
      });
    }

    return response;
  },
});

export const attemptCompletionTool = tool({
  description:
    "Present the completed task result to the user. Use this in ACT MODE when the task is finished.",
  args: {
    result: tool.schema.string().describe("The result or summary of the task"),
    command: tool.schema
      .string()
      .optional()
      .describe("Optional command to run to demonstrate the result"),
  },
  execute: async (args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    // Mark all remaining steps as completed
    if (stateManager) {
      const focusChain = stateManager.getFocusChain();
      if (focusChain) {
        focusChain.steps.forEach((step, index) => {
          if (step.status === "pending" || step.status === "in_progress") {
            stateManager.completeStep(index);
          }
        });
      }
    }

    context.metadata({
      title: "Task Complete",
      metadata: {
        hasCommand: !!args.command,
        progress: stateManager?.formatProgress(),
      },
    });

    let response = `✅ **Task Completed**\n\n${args.result}`;

    if (stateManager) {
      const progress = stateManager.getProgress();
      if (progress.total > 0) {
        response += `\n\n${stateManager.formatProgress()}`;
      }
    }

    if (args.command) {
      response += `\n\n**Suggested command**: \`${args.command}\``;
    }

    return response;
  },
});

// Focus Chain tools
export const initFocusChainTool = tool({
  description:
    "Initialize a focus chain (task progress tracker) with a list of steps. Use this at the beginning of ACT MODE to track plan execution.",
  args: {
    steps: tool.schema
      .array(tool.schema.string())
      .describe("List of steps to execute in the plan"),
  },
  execute: async (args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    if (!stateManager) {
      return "⚠️ Warning: Session state not available. Progress tracking disabled.";
    }

    stateManager.initializeFocusChain(args.steps);

    const progress = stateManager.getProgress();

    context.metadata({
      title: "Focus Chain Initialized",
      metadata: {
        totalSteps: progress.total,
        steps: args.steps,
      },
    });

    return `📋 **Focus Chain Initialized**

${args.steps.map((step, i) => `${i + 1}. ⏳ ${step}`).join("\n")}

**Total**: ${progress.total} steps
**Status**: Ready to execute

Use \`update_focus_step\` to mark steps as in_progress, completed, or failed.`;
  },
});

export const updateFocusStepTool = tool({
  description:
    "Update the status of a step in the focus chain. Use this in ACT MODE to track progress as you execute the plan.",
  args: {
    step_index: tool.schema.number().describe("Index of the step (0-based)"),
    status: tool.schema
      .enum(["in_progress", "completed", "failed"])
      .describe("New status for the step"),
    notes: tool.schema
      .string()
      .optional()
      .describe("Optional notes about this step"),
  },
  execute: async (args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    if (!stateManager) {
      return "⚠️ Warning: Session state not available. Cannot update step.";
    }

    const focusChain = stateManager.getFocusChain();
    if (!focusChain) {
      return "⚠️ Warning: No focus chain initialized. Use `init_focus_chain` first.";
    }

    if (args.step_index < 0 || args.step_index >= focusChain.steps.length) {
      return `❌ Error: Invalid step index ${args.step_index}. Valid range: 0-${focusChain.steps.length - 1}`;
    }

    const step = focusChain.steps[args.step_index];

    switch (args.status) {
      case "in_progress":
        stateManager.startStep(args.step_index);
        break;
      case "completed":
        stateManager.completeStep(args.step_index, args.notes);
        break;
      case "failed":
        stateManager.failStep(args.step_index, args.notes);
        break;
    }

    const progress = stateManager.getProgress();
    const statusEmoji = {
      in_progress: "🔄",
      completed: "✅",
      failed: "❌",
    };

    context.metadata({
      title: "Step Updated",
      metadata: {
        stepIndex: args.step_index,
        stepDescription: step.description,
        status: args.status,
        progress: progress,
      },
    });

    let response = `${statusEmoji[args.status]} **Step ${args.step_index + 1}: ${args.status.toUpperCase()}**

${step.description}`;

    if (args.notes) {
      response += `\n\n**Notes**: ${args.notes}`;
    }

    response += `\n\n${stateManager.formatProgress()}`;

    // Check if all steps completed
    if (progress.completed === progress.total && progress.total > 0) {
      response +=
        "\n\n🎉 **All steps completed!** Consider using `attempt_completion` to present the final result.";
    }

    return response;
  },
});

export const getFocusChainTool = tool({
  description:
    "Get the current focus chain status. Use this to check progress in ACT MODE.",
  args: {},
  execute: async (_args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    if (!stateManager) {
      return "⚠️ Warning: Session state not available.";
    }

    const focusChain = stateManager.getFocusChain();
    if (!focusChain) {
      return "📋 No focus chain initialized. Use `init_focus_chain` to create one.";
    }

    const progress = stateManager.getProgress();
    const statusEmoji = {
      pending: "⏳",
      in_progress: "🔄",
      completed: "✅",
      failed: "❌",
    };

    let response = `📋 **Focus Chain Status**\n\n`;

    response += focusChain.steps
      .map(
        (step, i) =>
          `${i + 1}. ${statusEmoji[step.status]} ${step.description}${step.notes ? ` (${step.notes})` : ""}`,
      )
      .join("\n");

    response += `\n\n${stateManager.formatProgress()}`;
    response += `\n\n**Details**:
- Total: ${progress.total}
- Completed: ${progress.completed}
- Failed: ${progress.failed}
- Pending: ${progress.total - progress.completed - progress.failed}`;

    return response;
  },
});

export const startActTool = tool({
  description:
    "Switch from PLAN MODE to ACT MODE to execute the approved plan. Use this when you have presented a complete plan and the user is ready to execute it.",
  args: {},
  execute: async (_args, context) => {
    const stateManager = context.sessionID
      ? StateManager.getInstance(context.sessionID)
      : null;

    if (stateManager) {
      stateManager.setModeSwitched(true);
    }

    context.metadata({
      title: "Switching to ACT MODE",
      metadata: {
        fromAgent: context.agent,
        targetAgent: "cline-act",
        sessionID: context.sessionID,
        yoloMode: stateManager?.isYoloMode() || false,
      },
    });

    const yoloNote = stateManager?.isYoloMode()
      ? "\n\n**YOLO Mode**: Auto-approval enabled. Plan will be executed automatically."
      : "";

    return `🔄 **Switching to ACT MODE**

You are about to switch from PLAN MODE to ACT MODE to execute the approved plan.

**How to switch**:
1. Press \`Tab\` to open agent selector
2. Select \`cline-act\` from the list
3. The approved plan will be executed step by step

**Alternative methods**:
- Run: \`opencode --agent cline-act\`
- Or restart OpenCode with: \`opencode\` and select cline-act agent

**What happens in ACT MODE**:
- ✅ File modifications (write, edit, patch)
- ✅ Command execution (bash)
- ✅ Plan execution with progress tracking
- ✅ Verification of changes${yoloNote}

**Ready to execute!** Switch to \`cline-act\` agent now to begin implementation.`;
  },
});

export function getClineTools() {
  return {
    plan_mode_respond: planModeRespondTool,
    ask_followup_question: askFollowupQuestionTool,
    attempt_completion: attemptCompletionTool,
    init_focus_chain: initFocusChainTool,
    update_focus_step: updateFocusStepTool,
    get_focus_chain: getFocusChainTool,
  };
}
