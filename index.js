import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * OpenCode Cline Mode Plugin
 * 
 * Provides Cline-style plan and act workflow for OpenCode.
 * 
 * Commands:
 * - /cline-plan - Enter plan mode (analysis only, no code changes)
 * - /cline-act or /execute - Enter act mode (execute approved plan)
 * 
 * @param {Object} ctx - Plugin context
 * @param {Object} ctx.client - OpenCode SDK client
 * @param {Object} ctx.project - Current project info
 * @param {string} ctx.directory - Current working directory
 * @param {string} ctx.worktree - Git worktree path
 * @param {Object} ctx.$ - Bun shell API
 * @returns {Promise<Object>} Plugin hooks
 */
export default async function ClineModePlugin({ client, project, directory, worktree, $ }) {
  // Load prompt files
  const planPrompt = readFileSync(join(__dirname, 'prompts/plan.md'), 'utf-8');
  const actPrompt = readFileSync(join(__dirname, 'prompts/act.md'), 'utf-8');

  // Session state management
  const sessionModes = new Map();

  await client.app.log({
    body: {
      service: 'opencode-cline-mode',
      level: 'info',
      message: 'Cline Mode Plugin initialized',
      extra: { 
        directory,
        worktree,
        project: project.name 
      },
    },
  });

  return {
    /**
     * Intercept command execution to handle Cline mode commands
     */
    'command.execute.before': async (input, output) => {
      const { command, sessionID, arguments: args } = input;

      if (command === 'cline-plan') {
        sessionModes.set(sessionID, 'plan');
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Plan mode activated',
            extra: { sessionID },
          },
        });

        output.parts.push({
          type: 'text',
          text: `🎯 **Cline Plan Mode Activated**

You are now in **PLAN MODE**. In this mode:
- ✅ You can analyze the codebase
- ✅ You can create detailed implementation plans
- ❌ You cannot make any code changes
- ❌ You cannot execute commands

${args || '请描述你想要实现的功能，我会为你创建详细的实施计划。'}

---

**提示**: 计划完成后，输入 \`/cline-act\` 或 \`/execute\` 来执行计划。`
        });
      } else if (command === 'cline-act' || command === 'execute') {
        sessionModes.set(sessionID, 'act');
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Act mode activated',
            extra: { sessionID },
          },
        });

        output.parts.push({
          type: 'text',
          text: `⚡ **Cline Act Mode Activated**

You are now in **ACT MODE**. In this mode:
- ✅ You can execute the approved plan step by step
- ✅ You can make code changes
- ✅ You can run commands
- ⚠️ You must follow the plan exactly

${args || '开始执行计划...'}

---

**提示**: 我会逐步执行计划，每完成一步都会向你报告进度。`
        });
      } else if (command === 'cline-exit' || command === 'exit-cline') {
        const currentMode = sessionModes.get(sessionID);
        sessionModes.delete(sessionID);
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'info',
            message: 'Cline mode deactivated',
            extra: { sessionID, previousMode: currentMode },
          },
        });

        output.parts.push({
          type: 'text',
          text: `👋 **Cline Mode Deactivated**

已退出 ${currentMode === 'plan' ? 'Plan' : currentMode === 'act' ? 'Act' : 'Cline'} 模式，恢复正常对话模式。`
        });
      }
    },

    /**
     * Inject system prompts based on current mode
     */
    'experimental.chat.system.transform': async (input, output) => {
      const { sessionID } = input;
      const mode = sessionModes.get(sessionID);

      if (mode === 'plan') {
        output.system.push(planPrompt);
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'debug',
            message: 'Plan prompt injected',
            extra: { sessionID },
          },
        });
      } else if (mode === 'act') {
        output.system.push(actPrompt);
        
        await client.app.log({
          body: {
            service: 'opencode-cline-mode',
            level: 'debug',
            message: 'Act prompt injected',
            extra: { sessionID },
          },
        });
      }
    },

    /**
     * Clean up session state when session is deleted
     */
    'event': async ({ event }) => {
      if (event.type === 'session.deleted') {
        const hadMode = sessionModes.has(event.sessionID);
        sessionModes.delete(event.sessionID);
        
        if (hadMode) {
          await client.app.log({
            body: {
              service: 'opencode-cline-mode',
              level: 'debug',
              message: 'Session state cleaned up',
              extra: { sessionID: event.sessionID },
            },
          });
        }
      }
    },
  };
}
