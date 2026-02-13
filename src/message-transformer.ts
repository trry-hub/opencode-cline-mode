import type { TransformOutput } from './types';

const PLAN_COMPLETION_BLOCK = `

<system-reminder>
Your operational mode has changed from plan to build.
You are no longer in read-only mode.
You are permitted to make file changes, run shell commands, and utilize your arsenal of tools as needed.
</system-reminder>

---
**📋 Plan Complete!**

✅ **To execute**: Press \`Tab\` to switch to \`cline-act\` agent
✏️ **To modify**: Type "修改步骤 N"
❌ **To cancel**: Type "取消"`;

export function transformMessages(output: TransformOutput): void {
  if (!output.messages || output.messages.length === 0) {
    return;
  }

  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
      const hasReminder = msg.parts.some(
        part => part.type === 'text' && part.text?.includes('<system-reminder>')
      );

      if (hasReminder) {
        break;
      }

      const lastTextPartIndex = msg.parts.findLastIndex(
        part => part.type === 'text'
      );

      if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex].text) {
        msg.parts[lastTextPartIndex].text! += PLAN_COMPLETION_BLOCK;
      }

      break;
    }
  }
}
