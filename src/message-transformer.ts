import type { TransformOutput } from './types';

interface TransformOptions {
  enableExecuteCommand?: boolean;
}

function getPlanCompletionBlock(enableExecuteCommand: boolean): string {
  const executeHint = enableExecuteCommand
    ? 'Use the `/execute-plan` tool to switch to `cline-act`'
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
    console.log('[ClineMode] transformMessages: No messages or empty array');
    return;
  }

  const lastMessage = output.messages[output.messages.length - 1];

  console.log('[ClineMode] transformMessages: Last message structure', {
    hasInfo: !!lastMessage?.info,
    hasParts: !!lastMessage?.parts,
    partsIsArray: Array.isArray(lastMessage?.parts),
    partsLength: lastMessage?.parts?.length,
    role: lastMessage?.info?.role,
    agent: lastMessage?.info?.agent,
  });

  if (!lastMessage?.info || !Array.isArray(lastMessage?.parts)) {
    console.log('[ClineMode] transformMessages: Last message invalid - returning early');
    return;
  }

  const currentAgent = lastMessage.info.agent;
  const isFirstActMessage = currentAgent === 'cline-act' && output.messages.length >= 2;

  console.log('[ClineMode] transformMessages: Agent analysis', {
    currentAgent,
    isFirstActMessage,
    totalMessages: output.messages.length,
    enableExecuteCommand: options?.enableExecuteCommand,
  });

  let lastPlanContent: string | null = null;
  let planMessageToModify: { message: (typeof output.messages)[0]; index: number } | null = null;
  let hasEncounteredReminder = false;

  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (!msg?.info || !Array.isArray(msg?.parts)) {
      continue;
    }

    if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
      console.log('[ClineMode] Found cline-plan message at index', i);

      const hasReminder = msg.parts.some(
        part => part?.type === 'text' && part.text?.includes('<system-reminder>')
      );

      if (hasReminder) {
        console.log('[ClineMode] Message has system-reminder');
        hasEncounteredReminder = true;
      }

      if (!planMessageToModify) {
        const lastTextPartIndex = msg.parts.findLastIndex(part => part?.type === 'text');

        if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex]?.text) {
          planMessageToModify = { message: msg, index: i };
          console.log(
            '[ClineMode] Found plan message to modify at index',
            i,
            'part',
            lastTextPartIndex
          );
        }
      }

      const textParts = msg.parts
        .filter(part => part?.type === 'text' && part?.text)
        .map(part => part.text)
        .join('\n\n');

      if (textParts.trim() && lastPlanContent === null) {
        lastPlanContent = textParts;
        console.log('[ClineMode] Captured plan content, length:', textParts.length);
      }
    }
  }

  if (planMessageToModify && !hasEncounteredReminder) {
    console.log('[ClineMode] Injecting plan completion block');
    const { message } = planMessageToModify;
    const lastTextPartIndex = message.parts.findLastIndex(part => part?.type === 'text');

    if (lastTextPartIndex !== -1 && message.parts[lastTextPartIndex]?.text) {
      const completionBlock = getPlanCompletionBlock(options?.enableExecuteCommand ?? true);
      message.parts[lastTextPartIndex].text! += completionBlock;
      console.log('[ClineMode] Plan completion block added');
    }
  } else {
    console.log('[ClineMode] Skipped plan completion injection', {
      hasPlanMessage: !!planMessageToModify,
      hasEncounteredReminder,
    });
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

**To start execution**, use the \`/execute-plan\` tool or press \`Tab\` to switch agents.

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
