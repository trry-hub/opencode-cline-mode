import type { TransformOutput } from './types';

interface TransformOptions {
  enableExecuteCommand?: boolean;
}

function getPlanCompletionBlock(enableExecuteCommand: boolean): string {
  const executeHint = enableExecuteCommand
    ? 'Use the `/start-act` tool to switch to `cline-act`'
    : 'Press `Tab` to switch to `cline-act`';

  return `

<system-reminder>
Your operational mode has changed from plan to build.
You are no longer in read-only mode.
You are permitted to make file changes, run shell commands, and utilize your arsenal of tools as needed.
</system-reminder>

---

**📋 Plan Complete!**

✅ **Quick Execute**: ${executeHint}
✏️ **Modify**: Tell me which step to change
❌ **Cancel**: Type "cancel" to abort`;
}

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

  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (!msg?.info || !Array.isArray(msg?.parts)) {
      continue;
    }

    if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
      const hasReminder = msg.parts.some(
        part => part?.type === 'text' && part.text?.includes('<system-reminder>')
      );

      if (hasReminder) {
        hasEncounteredReminder = true;
      }

      if (!planMessageToModify) {
        const lastTextPartIndex = msg.parts.findLastIndex(part => part?.type === 'text');

        if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex]?.text) {
          planMessageToModify = { message: msg, index: i };
        }
      }

      const textParts = msg.parts
        .filter(part => part?.type === 'text' && part?.text)
        .map(part => part.text)
        .join('\n\n');

      if (textParts.trim() && lastPlanContent === null) {
        lastPlanContent = textParts;
      }
    }
  }

  if (planMessageToModify && !hasEncounteredReminder) {
    const { message } = planMessageToModify;
    const lastTextPartIndex = message.parts.findLastIndex(part => part?.type === 'text');

    if (lastTextPartIndex !== -1 && message.parts[lastTextPartIndex]?.text) {
      const completionBlock = getPlanCompletionBlock(options?.enableExecuteCommand ?? true);
      message.parts[lastTextPartIndex].text! += completionBlock;
    }
  }

  if (isFirstActMessage && lastPlanContent) {
    const alreadyInjected = lastMessage.parts.some(
      part => part?.type === 'text' && part.text?.includes('📋 **Inherited Plan from cline-plan**')
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
