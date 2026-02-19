import type { TransformOutput, MessagePart } from './types';
import type { Logger } from './logger';

interface TransformOptions {
  enableExecuteCommand?: boolean;
  enablePlanApproval?: boolean;
  logger?: Logger;
}

function getPlanCompletionBlock(
  enableExecuteCommand: boolean,
  enablePlanApproval: boolean
): string {
  const executeHint = enableExecuteCommand
    ? 'Call the `/start-act` tool to switch to cline-act'
    : 'Press Tab to switch to cline-act';

  const approvalHint = enablePlanApproval
    ? '\n✅ **Approve**: Call the `/approve-plan` tool to approve the plan'
    : '';

  const approvalWarning = enablePlanApproval
    ? '\n> ⚠️ **Approval Required**: You must approve the plan using `/approve-plan` before switching to ACT MODE.'
    : '';

  return `

---

**📋 Plan Complete!**

✅ **Quick Execute**: ${executeHint}${approvalHint}
✏️ **Modify**: Tell me which step to change
❌ **Cancel**: Type "cancel" to abort${approvalWarning}

---`;
}

export function transformMessages(output: TransformOutput, options?: TransformOptions): void {
  const logger = options?.logger;

  logger?.debug('transformMessages called', {
    messageCount: output?.messages?.length || 0,
    hasOutput: !!output,
    enableExecuteCommand: options?.enableExecuteCommand,
    enablePlanApproval: options?.enablePlanApproval,
  });

  if (!output?.messages || output.messages.length === 0) {
    logger?.warn('No messages to transform', { output });
    return;
  }

  output.messages.forEach((msg, idx) => {
    const agentName = msg.info?.agent || 'no-agent';
    const role = msg.info?.role || 'no-role';
    const partsCount = msg.parts?.length || 0;
    const textPreview =
      msg.parts
        ?.filter((p: MessagePart) => p?.type === 'text')
        ?.map((p: MessagePart) => p.text?.substring(0, 50))
        ?.join('; ') || 'no-text';

    logger?.debug(`Message ${idx} details`, {
      agent: agentName,
      role: role,
      partsCount,
      textPreview: textPreview.substring(0, 100),
      isClinerPlan: agentName.toLowerCase() === 'cline-plan',
      isAssistant: role === 'assistant',
    });
  });

  const lastMessage = output.messages[output.messages.length - 1];

  if (!lastMessage?.info || !Array.isArray(lastMessage?.parts)) {
    logger?.warn('Invalid last message structure', {
      hasInfo: !!lastMessage?.info,
      hasParts: Array.isArray(lastMessage?.parts),
    });
    return;
  }

  const currentAgent = lastMessage.info.agent?.toLowerCase();
  const isFirstActMessage = currentAgent === 'cline-act' && output.messages.length >= 2;

  logger?.debug('Message analysis', {
    currentAgent,
    isFirstActMessage,
    lastMessageRole: lastMessage.info.role,
  });

  let lastPlanContent: string | null = null;
  let planMessageToModify: { message: (typeof output.messages)[0]; index: number } | null = null;
  let hasEncounteredReminder = false;

  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (!msg?.info || !Array.isArray(msg?.parts)) {
      logger?.debug(`Skipping message ${i}: invalid structure`, {
        hasInfo: !!msg?.info,
        hasParts: Array.isArray(msg?.parts),
      });
      continue;
    }

    const agentName = msg.info.agent?.toLowerCase() || '';
    const isClinerPlan = agentName === 'cline-plan';
    const role = msg.info.role;

    logger?.debug(`Checking message ${i}`, {
      agent: agentName || 'undefined',
      role: role || 'undefined',
      isClinerPlan,
      isAssistant: role === 'assistant',
    });

    if (isClinerPlan) {
      const hasReminder = msg.parts.some(
        part => part?.type === 'text' && part.text?.includes('📋 Plan Complete!')
      );

      if (hasReminder) {
        hasEncounteredReminder = true;
        logger?.debug('Found existing plan completion block', { messageIndex: i });
      }

      if (!planMessageToModify) {
        const lastTextPartIndex = msg.parts.findLastIndex(part => part?.type === 'text');

        if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex]?.text) {
          planMessageToModify = { message: msg, index: i };
          logger?.debug('Found plan message to modify', {
            messageIndex: i,
            textPartIndex: lastTextPartIndex,
          });
        }
      }

      const textParts = msg.parts
        .filter(part => part?.type === 'text' && part?.text)
        .map(part => part.text)
        .join('\n\n');

      if (textParts.trim() && lastPlanContent === null) {
        lastPlanContent = textParts;
        logger?.debug('Captured plan content', { contentLength: textParts.length });
      }
    }
  }

  logger?.debug('Final check before adding completion block', {
    hasPlanMessageToModify: !!planMessageToModify,
    hasEncounteredReminder,
    planMessageIndex: planMessageToModify?.index,
  });

  if (planMessageToModify && !hasEncounteredReminder) {
    const { message, index } = planMessageToModify;
    const lastTextPartIndex = message.parts.findLastIndex(part => part?.type === 'text');

    logger?.debug('Attempting to add completion block', {
      messageIndex: index,
      lastTextPartIndex,
      hasText: !!message.parts[lastTextPartIndex]?.text,
    });

    if (lastTextPartIndex !== -1 && message.parts[lastTextPartIndex]?.text) {
      const completionBlock = getPlanCompletionBlock(
        options?.enableExecuteCommand ?? true,
        options?.enablePlanApproval ?? true
      );
      message.parts[lastTextPartIndex].text! += completionBlock;
      logger?.info('✅ SUCCESS: Added plan completion block', {
        messageIndex: index,
        textPartIndex: lastTextPartIndex,
        enableExecuteCommand: options?.enableExecuteCommand ?? true,
        completionBlockLength: completionBlock.length,
      });
    } else {
      logger?.warn('❌ FAILED: Could not add completion block - no valid text part found', {
        messageIndex: index,
        lastTextPartIndex,
        partsLength: message.parts.length,
      });
    }
  } else {
    logger?.debug('❌ SKIPPED: Did not add completion block', {
      hasPlanMessage: !!planMessageToModify,
      hasEncounteredReminder,
      reason: !planMessageToModify ? 'no plan message found' : 'reminder already exists',
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

**To start execution**, use the \`/start-act\` tool or press \`Tab\` to switch agents.

---

${lastPlanContent}

---

**Starting step-by-step execution...**
`,
      };

      lastMessage.parts.unshift(planInjection);
      logger?.info('Injected plan content into act message', {
        planContentLength: lastPlanContent.length,
      });
    } else {
      logger?.debug('Plan already injected, skipping');
    }
  } else {
    logger?.debug('Skipped plan injection', {
      isFirstActMessage,
      hasLastPlanContent: !!lastPlanContent,
    });
  }
}
