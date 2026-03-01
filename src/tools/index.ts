import { tool } from "@opencode-ai/plugin";

export const approvePlanTool = tool({
  description:
    "Request user approval for the current plan. This will show a permission dialog for the user to approve or reject the plan.",
  args: {},
  execute: async (_args, context) => {
    await context.ask({
      permission: "plan_approval",
      patterns: ["cline-plan:approve"],
      always: [],
      metadata: {
        agent: context.agent,
        sessionID: context.sessionID,
      },
    });

    context.metadata({
      title: "Plan Approved",
      metadata: { status: "approved", agent: context.agent },
    });

    return `[PLAN APPROVED]

The plan has been approved!

**Next Step**: Switch to \`cline-act\` agent to execute this plan:
- Press \`Tab\` and select \`cline-act\`
- Or run: \`opencode --agent cline-act\`

The approved plan will be executed step by step in ACT MODE.`;
  },
});

export const planModeRespondTool = tool({
  description:
    "Respond to the user in PLAN MODE. Use this to share thoughts, analysis, or present plans directly without using thinking tags. This is the primary way to communicate in PLAN MODE.",
  args: {
    response: tool.schema.string().describe("The response to share with user"),
  },
  execute: async (args, context) => {
    context.metadata({
      title: "Plan Mode Response",
      metadata: { mode: "plan" },
    });

    return args.response;
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
    context.metadata({
      title: "Task Complete",
      metadata: { hasCommand: !!args.command },
    });

    let response = `✅ **Task Completed**\n\n${args.result}`;

    if (args.command) {
      response += `\n\n**Suggested command**: \`${args.command}\``;
    }

    return response;
  },
});

export function getClineTools() {
  return {
    "cline-approve": approvePlanTool,
    plan_mode_respond: planModeRespondTool,
    ask_followup_question: askFollowupQuestionTool,
    attempt_completion: attemptCompletionTool,
  };
}
