# OpenCode-Cline-Mode Bug 修复与功能增强计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复现有 bug，参考 Cline 实现增强 plan→act 模式切换体验，确保不影响 OpenCode 正常启动

**Architecture:** 分两阶段实施：阶段 1 为安全改进（零风险），阶段 2 为功能增强（需要验证 OpenCode API 支持）。核心改动集中在 message-transformer.ts 和测试文件，保持向后兼容。

**Tech Stack:** TypeScript, Vitest, Ajv (JSON Schema 验证)

**Status:** ✅ 阶段 1 已完成 | ⏸️ 阶段 2 待 OpenCode API 支持

---

## 完成状态

### ✅ 阶段 1：安全改进（已完成）

| 任务 | 状态 | 说明 |
|------|------|------|
| Task 1 | ✅ 完成 | 添加了 3 个 plan→act 测试用例 |
| Task 2 | ✅ 完成 | path-resolver.test.ts 已存在且通过 |
| Task 3 | ✅ 完成 | config-loader.test.ts 已存在且通过 |
| Task 4 | ✅ 完成 | config-validator.ts 支持 $schema 属性 |
| Task 5 | ✅ 完成 | message-transformer.ts 添加防御性检查 |
| Task 6 | ✅ 完成 | path-resolver.ts 改进错误信息 |
| Task 7 | ✅ 完成 | package.json 添加 test:watch, test:coverage, lint 脚本 |
| Task 8 | ✅ 完成 | 添加 eslint.config.mjs 和 typescript-eslint |

**测试结果:** 27 个测试全部通过

### ⏸️ 阶段 2：功能增强（暂停 - 需要 OpenCode 核心支持）

**验证结果:** 经过对 `@opencode-ai/plugin` API 分析，以下功能在当前插件 API 下**不可行**：

| 任务 | 状态 | 原因 |
|------|------|------|
| Task 9 | ⏸️ 暂停 | OpenCode 插件 API 没有文件上传处理接口 |
| Task 10 | ⏸️ 暂停 | OpenCode 插件 API 没有 `switchToActMode` 回调或状态持久化 API |

**可用的 OpenCode Hooks:**
- `experimental.chat.messages.transform` - ✅ 已使用
- `chat.message` - ✅ 已使用
- `tool.execute.before/after` - ✅ 可用于自定义工具

**不可用的功能:**
- ❌ 文件上传处理
- ❌ 模式切换回调
- ❌ 跨消息状态持久化

---

## 风险评估

### ✅ 阶段 1：安全改进（零风险，不影响启动）

| 任务 | 风险级别 | 原因 |
|------|----------|------|
| Task 1-3 | 无风险 | 仅添加测试用例 |
| Task 4 | 无风险 | 类型安全修复 |
| Task 5-6 | 无风险 | 防御性编程/错误信息改进 |
| Task 7-8 | 无风险 | 文档/配置修复 |

### ⚠️ 阶段 2：功能增强（需要验证）

| 任务 | 风险级别 | 依赖条件 |
|------|----------|----------|
| Task 9 | 中风险 | 需验证 OpenCode 是否支持 `processFilesIntoText` |
| Task 10 | 高风险 | 需要 OpenCode 提供状态管理 API |

**重要**: 阶段 2 任务在实施前需要先验证 OpenCode 插件 API 是否支持所需功能。

---

## 阶段 1：安全改进（已完成）

### Task 1: 添加 plan→act 自动继承计划的测试用例

**Files:**
- Modify: `src/message-transformer.test.ts:40-54`

**Step 1: 编写 plan→act 切换场景的测试**

```typescript
it('should inject inherited plan when switching from cline-plan to cline-act', () => {
  const output: TransformOutput = {
    messages: [
      {
        info: { role: 'assistant', agent: 'cline-plan' },
        parts: [{ type: 'text', text: 'Plan step 1\nPlan step 2' }],
      },
      {
        info: { role: 'user', agent: 'cline-act' },
        parts: [{ type: 'text', text: 'Start execution' }],
      },
      {
        info: { role: 'assistant', agent: 'cline-act' },
        parts: [{ type: 'text', text: 'I will execute' }],
      },
    ],
  };

  transformMessages(output);

  const lastActMessage = output.messages[2];
  expect(lastActMessage.parts[0].text).toContain('📋 **Inherited Plan from cline-plan**');
  expect(lastActMessage.parts[0].text).toContain('Plan step 1');
  expect(lastActMessage.parts[0].text).toContain('Plan step 2');
});

it('should not duplicate plan injection', () => {
  const output: TransformOutput = {
    messages: [
      {
        info: { role: 'assistant', agent: 'cline-plan' },
        parts: [{ type: 'text', text: 'Plan content' }],
      },
      {
        info: { role: 'assistant', agent: 'cline-act' },
        parts: [{ type: 'text', text: '📋 **Inherited Plan from cline-plan**\n\nPlan content' }],
      },
    ],
  };

  transformMessages(output);

  const text = output.messages[1].parts[0].text;
  expect(text.match(/📋 \*\*Inherited Plan/g)).toHaveLength(1);
});
```

**Step 2: 运行测试验证**

Run: `npm test src/message-transformer.test.ts`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add src/message-transformer.test.ts
git commit -m "test: add plan inheritance test cases"
```

---

### Task 2: 添加 path-resolver 单元测试

**Files:**
- Create: `src/path-resolver.test.ts`

**Step 1: 编写 path-resolver 测试**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolvePromptsDir, resolveConfigPath, getPluginDir } from './path-resolver';

describe('path-resolver', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `opencode-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('resolvePromptsDir', () => {
    it('should find prompts directory when it exists', () => {
      const promptsDir = join(tempDir, 'prompts');
      mkdirSync(promptsDir);
      
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);
        const result = resolvePromptsDir(tempDir);
        expect(result).toBe(promptsDir);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should throw error when prompts directory not found', () => {
      expect(() => resolvePromptsDir(tempDir)).toThrow('Could not find prompts directory');
    });
  });

  describe('resolveConfigPath', () => {
    it('should find project-level config', () => {
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(opencodeDir);
      const configPath = join(opencodeDir, 'opencode-cline-mode.json');
      writeFileSync(configPath, '{}');
      
      const result = resolveConfigPath(tempDir);
      expect(result).toBe(configPath);
    });

    it('should return null when no config found', () => {
      const result = resolveConfigPath(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('getPluginDir', () => {
    it('should resolve plugin directory from file URL', () => {
      const fileUrl = 'file:///path/to/plugin/dist/index.js';
      const result = getPluginDir(fileUrl);
      expect(result).toMatch(/plugin$/);
    });
  });
});
```

**Step 2: 运行测试**

Run: `npm test src/path-resolver.test.ts`
Expected: 测试通过或部分通过（根据实际环境）

**Step 3: Commit**

```bash
git add src/path-resolver.test.ts
git commit -m "test: add path-resolver unit tests"
```

---

### Task 3: 添加 config-loader 单元测试

**Files:**
- Create: `src/config-loader.test.ts`

**Step 1: 编写 config-loader 测试**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadPluginConfig } from './config-loader';

describe('config-loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `opencode-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('loadPluginConfig', () => {
    it('should return default config when no config file exists', () => {
      const config = loadPluginConfig(tempDir);
      
      expect(config.replace_default_agents).toBe(true);
      expect(config.default_agent).toBe('cline-plan');
      expect(config.plan_temperature).toBe(0.1);
      expect(config.act_temperature).toBe(0.3);
    });

    it('should load and merge user config', () => {
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(opencodeDir);
      const configPath = join(opencodeDir, 'opencode-cline-mode.json');
      writeFileSync(configPath, JSON.stringify({
        plan_model: 'claude-opus-4',
        act_model: 'claude-sonnet-4',
      }));
      
      const config = loadPluginConfig(tempDir);
      
      expect(config.plan_model).toBe('claude-opus-4');
      expect(config.act_model).toBe('claude-sonnet-4');
      expect(config.replace_default_agents).toBe(true); // default preserved
    });

    it('should use defaults for invalid config', () => {
      const opencodeDir = join(tempDir, '.opencode');
      mkdirSync(opencodeDir);
      const configPath = join(opencodeDir, 'opencode-cline-mode.json');
      writeFileSync(configPath, '{ invalid json }');
      
      const consoleSpy = vi.spyOn(console, 'warn');
      const config = loadPluginConfig(tempDir);
      
      expect(config.replace_default_agents).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
```

**Step 2: 运行测试**

Run: `npm test src/config-loader.test.ts`
Expected: 测试通过

**Step 3: Commit**

```bash
git add src/config-loader.test.ts
git commit -m "test: add config-loader unit tests"
```

---

### Task 4: 修复 index.ts 类型安全问题

**Files:**
- Modify: `src/index.ts:54-68`

**Step 1: 修复 config.agent undefined 检查**

```typescript
// 原代码 (line 54-68)
config.agent = {
  ...clineAgents,
  ...hiddenAgents,
};

if (!config.agent || Object.keys(config.agent).length === 0) {
  config.agent = { ...clineAgents };
}

// 修改后
const mergedAgents: Record<string, AgentConfig> = {
  ...clineAgents,
  ...hiddenAgents,
};

if (Object.keys(mergedAgents).length === 0) {
  config.agent = { ...clineAgents };
} else {
  config.agent = mergedAgents;
}
```

**Step 2: 运行类型检查**

Run: `npm run build`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "fix: improve type safety in agent assignment"
```

---

### Task 5: 改进 message-transformer 边界条件处理

**Files:**
- Modify: `src/message-transformer.ts:18-106`

**Step 1: 添加防御性检查**

```typescript
export function transformMessages(output: TransformOutput): void {
  if (!output?.messages || output.messages.length === 0) {
    return;
  }

  // Check if current agent is cline-act and this is the first message
  const lastMessage = output.messages[output.messages.length - 1];
  
  if (!lastMessage?.info || !lastMessage?.parts) {
    return;
  }

  const currentAgent = lastMessage.info.agent;
  const isFirstActMessage = currentAgent === 'cline-act' && output.messages.length >= 2;

  if (isFirstActMessage) {
    let lastPlanContent: string | null = null;

    for (let i = output.messages.length - 2; i >= 0; i--) {
      const msg = output.messages[i];
      
      if (!msg?.info || !msg?.parts) {
        continue;
      }

      if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
        const textParts = msg.parts
          .filter(part => part?.type === 'text' && part?.text)
          .map(part => part.text)
          .join('\n\n');

        if (textParts.trim()) {
          lastPlanContent = textParts;
          break;
        }
      }
    }

    if (lastPlanContent) {
      const alreadyInjected = lastMessage.parts.some(
        part => part?.type === 'text' && part.text?.includes('📋 **Inherited Plan from cline-plan**')
      );

      if (!alreadyInjected) {
        const planInjection = {
          type: 'text' as const,
          text: `📋 **Inherited Plan from cline-plan**

The following plan was created in the previous planning session. Execute it step by step:

---

${lastPlanContent}

---

**Now executing the above plan...**
`,
        };

        lastMessage.parts.unshift(planInjection);
      }
    }
  }

  // Add completion reminder to cline-plan messages
  for (let i = output.messages.length - 1; i >= 0; i--) {
    const msg = output.messages[i];

    if (!msg?.info || !msg?.parts) {
      continue;
    }

    if (msg.info.role === 'assistant' && msg.info.agent === 'cline-plan') {
      const hasReminder = msg.parts.some(
        part => part?.type === 'text' && part.text?.includes('<system-reminder>')
      );

      if (hasReminder) {
        break;
      }

      const lastTextPartIndex = msg.parts.findLastIndex(
        part => part?.type === 'text'
      );

      if (lastTextPartIndex !== -1 && msg.parts[lastTextPartIndex]?.text) {
        msg.parts[lastTextPartIndex].text! += PLAN_COMPLETION_BLOCK;
      }

      break;
    }
  }
}
```

**Step 2: 运行测试**

Run: `npm test src/message-transformer.test.ts`
Expected: 所有测试通过

**Step 3: Commit**

```bash
git add src/message-transformer.ts
git commit -m "fix: add defensive checks for undefined values in message transformer"
```

---

### Task 6: 改进 path-resolver 错误信息

**Files:**
- Modify: `src/path-resolver.ts:6-22`

**Step 1: 改进错误信息**

```typescript
export function resolvePromptsDir(pluginDir: string): string {
  const possiblePaths = [
    join(pluginDir, 'prompts'),
    join(process.cwd(), 'prompts'),
    join(homedir(), '.config/opencode/plugins/opencode-cline-mode/prompts'),
  ];

  const searchedPaths: string[] = [];

  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        return path;
      }
      searchedPaths.push(path);
    } catch (error) {
      searchedPaths.push(`${path} (error: ${error instanceof Error ? error.message : 'unknown'})`);
    }
  }

  throw new Error(
    `Could not find prompts directory. Searched paths:\n${searchedPaths.map(p => `  - ${p}`).join('\n')}\n\nPlease ensure:\n1. The plugin is installed correctly\n2. The 'prompts' directory exists in one of the above locations`
  );
}
```

**Step 2: 运行测试**

Run: `npm test src/path-resolver.test.ts`
Expected: 测试通过

**Step 3: Commit**

```bash
git add src/path-resolver.ts
git commit -m "fix: improve error messages in path-resolver"
```

---

### Task 7: 修复 package.json 缺失的脚本

**Files:**
- Modify: `package.json:50-53`

**Step 1: 添加缺失的测试脚本**

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 2: 验证脚本**

Run: `npm run test:watch -- --run`
Expected: 测试运行并退出

**Step 3: Commit**

```bash
git add package.json
git commit -m "fix: add missing test scripts to package.json"
```

---

### Task 8: 添加 ESLint 配置

**Files:**
- Create: `.eslintrc.json`
- Modify: `package.json` (添加 devDependencies 和 scripts)

**Step 1: 安装 ESLint**

Run: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`

**Step 2: 创建 ESLint 配置**

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "ignorePatterns": ["dist", "node_modules", "*.test.ts"]
}
```

**Step 3: 添加 lint 脚本到 package.json**

```json
{
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  }
}
```

**Step 4: 运行 lint**

Run: `npm run lint`
Expected: 无错误或警告

**Step 5: Commit**

```bash
git add .eslintrc.json package.json package-lock.json
git commit -m "chore: add ESLint configuration"
```

---

## 阶段 2：功能增强（需要验证 OpenCode API）

> **警告**: 以下任务需要先验证 OpenCode 插件 API 是否支持所需功能。在验证前不要实施。

### Task 9: 添加文件内容处理功能（需验证）

**前置条件验证:**
1. 检查 OpenCode PluginContext 是否提供文件上传处理能力
2. 验证是否可以访问用户上传的文件内容

**Files:**
- Modify: `src/types.ts` (如果需要扩展 PluginContext)
- Modify: `src/message-transformer.ts` (添加文件处理逻辑)

**实施步骤（仅在验证通过后）:**

```typescript
// 在 message-transformer.ts 中添加
interface FileInfo {
  path: string;
  content?: string;
}

export function transformMessages(
  output: TransformOutput,
  uploadedFiles?: FileInfo[]
): void {
  // ... existing code ...
  
  if (uploadedFiles && uploadedFiles.length > 0) {
    const fileContentSection = `
---
**Attached Files:**
${uploadedFiles.map(f => `- \`${f.path}\``).join('\n')}
`;
    // Append to last message
  }
}
```

---

### Task 10: 实现模式切换状态追踪（需验证）

**前置条件验证:**
1. 检查 OpenCode 是否支持跨消息状态持久化
2. 验证是否可以检测用户手动切换 agent 的行为
3. 确认是否有 `switchToActMode` 类似的回调

**Files:**
- Modify: `src/index.ts` (如果 OpenCode 提供相关 API)
- Modify: `src/message-transformer.ts` (添加状态追踪)

**实施步骤（仅在验证通过后）:**

```typescript
// 在 index.ts 中
let lastActiveAgent: string | null = null;

return {
  'chat.message': async (input: { agent?: string; sessionID?: string }) => {
    const { agent } = input;

    if (agent === 'cline-act' && lastActiveAgent === 'cline-plan') {
      // User switched from plan to act mode
      await logger.info('Mode switch detected: plan → act', { sessionID: input.sessionID });
    }

    lastActiveAgent = agent || null;
  },
};
```

---

## 验证检查清单

### 阶段 1 完成验证

- [ ] 所有测试通过 (`npm test`)
- [ ] 类型检查通过 (`npm run build`)
- [ ] Lint 检查通过 (`npm run lint`)
- [ ] 插件可以正常加载到 OpenCode
- [ ] cline-plan agent 可以正常工作
- [ ] cline-act agent 可以正常工作
- [ ] plan → act 自动继承功能正常

### 阶段 2 前置验证

- [ ] 确认 OpenCode PluginContext 接口定义
- [ ] 测试文件上传功能是否可用
- [ ] 测试状态持久化是否可用
- [ ] 测试 agent 切换事件是否可监听

---

## 执行顺序

1. **阶段 1** (Task 1-8) - 可以立即执行，零风险
2. **验证阶段** - 研究 OpenCode API 文档和源码
3. **阶段 2** (Task 9-10) - 仅在验证通过后执行

---

## 回滚计划

如果任何修改导致问题：

```bash
# 回滚单个 commit
git revert <commit-hash>

# 回滚到阶段 1 之前
git checkout <stage1-start-commit>

# 紧急回滚：删除 dist 并重新构建
rm -rf dist && npm run build
```

---

**计划完成时间估计:**
- 阶段 1: 2-3 小时
- 验证阶段: 1-2 小时
- 阶段 2: 1-2 小时（如果可行）

**总计: 4-7 小时**
