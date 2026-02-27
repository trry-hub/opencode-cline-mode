import type { TransformOutput } from './types.js';

interface TransformOptions {
  enableExecuteCommand?: boolean;
}

/**
 * Get plan completion block with instructions for switching to act mode
 */
function getPlanCompletionBlock(enableExecuteCommand: boolean): string {
  const executeHint = enableExecuteCommand
    ? 'Use the `/start-act` tool to switch to `cline-act`'
    : 'Press `Tab` to switch to `cline-act`';

  return `

---

**📋 Plan Complete!**

✅ **Quick Execute**: ${executeHint}
✏️ **Modify**: Tell me which step to change
❌ **Cancel**: Type "cancel" to abort`;
}

/**
 * Transform messages to add plan completion notification and plan inheritance
 */
export function transformMessages(output: TransformOutput, options?: TransformOptions): void {
  if (!output?.messages || output.messages.length === 0) {
    return;
  }

  const lastMessage = output.messages[output.messages.length - 1];

  if (!lastMessage?.info || !Array.isArray(lastMessage?.parts)) {
    return;
  }

  const currentAgent = lastMessage.info.agent;
  const isFirstActMessage = currentAgent === 'cline-act' && output.messages.length >= 2;

  let lastPlanContent: string | null = null;
  let planMessageToModify: { message: (typeof output.messages)[0]; index: number } | null = null;
  let hasEncounteredReminder = false;

  // Find the last cline-plan message and its content
  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (!msg?.info || !Array.isArray(msg?.parts)) {
      continue;
    }

    if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
      const hasReminder = msg.parts.some(
        (part) => part?.type === 'text' && part.text?.includes('📋 Plan Complete!')
      );

      if (hasReminder) {
        hasEncounteredReminder = true;
      }

      if (!planMessageToModify) {
        const lastTextPartIndex = msg.parts.findLastIndex((part) => part?.type === 'text');

        if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex]?.text) {
          planMessageToModify = { message: msg, index: i };
        }
      }

      // Extract plan content for inheritance
      const textParts = msg.parts
        .filter((part) => part?.type === 'text' && part?.text)
        .map((part) => part.text)
        .join('\n\n');

      if (textParts.trim() && lastPlanContent === null) {
        lastPlanContent = textParts;
      }
    }
  }

  // Add completion block to the last cline-plan message
  if (planMessageToModify && !hasEncounteredReminder) {
    const { message } = planMessageToModify;
    const lastTextPartIndex = message.parts.findLastIndex((part) => part?.type === 'text');

    if (lastTextPartIndex !== -1 && message.parts[lastTextPartIndex]?.text) {
      const completionBlock = getPlanCompletionBlock(options?.enableExecuteCommand ?? true);
      message.parts[lastTextPartIndex].text! += completionBlock;
    }
  }

  // Inject plan content into first cline-act message
  if (isFirstActMessage && lastPlanContent) {
    const alreadyInjected = lastMessage.parts.some(
      (part) => part?.type === 'text' && part.text?.includes('📋 **Inherited Plan from cline-plan**')
    );

    if (!alreadyInjected) {
      const planInjection = {
        type: 'text' as const,
        text: `📋 **Inherited Plan from cline-plan**

The following plan was created in the previous planning session.

**To start execution**, use the \`/start-act\` tool or press \`Tab\` to switch agents.

---

${lastPlanContent}

---

**Starting step-by-step execution...**
`,
      };

      lastMessage.parts.unshift(planInjection);
    }
  }
}
