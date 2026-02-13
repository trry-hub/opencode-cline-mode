# opencode-cline-mode 项目改进计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将项目从基础JavaScript实现升级为生产级别的TypeScript项目，添加完整测试、类型安全和更好的错误处理。

**Architecture:** 迁移到TypeScript，添加Vitest测试框架，实现配置验证系统，重构消息处理逻辑为可测试的独立模块。

**Tech Stack:** TypeScript 5.x, Vitest, ajv (JSON Schema验证), @opencode-ai/plugin SDK

---

## Task 1: 项目基础设施 - TypeScript 配置

**Files:**
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Modify: `package.json` (添加依赖和脚本)

**Step 1: 更新 package.json 添加 TypeScript 和测试依赖**

```json
{
  "name": "opencode-cline-mode",
  "version": "1.1.0",
  "description": "Cline-style plan and act workflow for OpenCode - structured implementation planning with step-by-step execution",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "opencode",
    "plugin",
    "cline",
    "plan",
    "act",
    "workflow",
    "ai-coding",
    "agent",
    "planning",
    "execution"
  ],
  "author": "trry",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/trry-hub/opencode-cline-mode.git"
  },
  "bugs": {
    "url": "https://github.com/trry-hub/opencode-cline-mode/issues"
  },
  "homepage": "https://github.com/trry-hub/opencode-cline-mode#readme",
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.53",
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0",
    "@vitest/coverage-v8": "^1.2.0"
  },
  "peerDependencies": {
    "opencode-ai": ">=1.0.0"
  },
  "files": [
    "dist/",
    "prompts/",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
```

**Step 4: 安装依赖**

Run: `npm install`

**Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: add TypeScript and Vitest configuration"
```

---

## Task 2: 创建类型定义

**Files:**
- Create: `src/types.ts`

**Step 1: 创建类型定义文件**

```typescript
/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  /** Replace OpenCode's default agents with Cline agents */
  replace_default_agents?: boolean;
  /** Default agent to use when starting OpenCode */
  default_agent?: 'cline-plan' | 'cline-act';
  /** Model for cline-plan agent */
  plan_model?: string;
  /** Model for cline-act agent */
  act_model?: string;
  /** Temperature for plan mode (lower = more focused) */
  plan_temperature?: number;
  /** Temperature for act mode */
  act_temperature?: number;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  mode: 'primary' | 'subagent';
  model: string;
  temperature: number;
  description: string;
  tools: {
    bash?: boolean;
    edit?: boolean;
    write?: boolean;
  };
  system: string[];
  hidden?: boolean;
}

/**
 * OpenCode config object
 */
export interface OpenCodeConfig {
  model?: string;
  agent?: Record<string, AgentConfig | undefined>;
  default_agent?: string;
}

/**
 * Plugin context
 */
export interface PluginContext {
  client: {
    app: {
      log: (params: { body: LogBody }) => Promise<void>;
    };
  };
  project: {
    name: string;
  };
  directory: string;
  worktree?: string;
  $: unknown;
}

/**
 * Log body structure
 */
export interface LogBody {
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  extra?: Record<string, unknown>;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  info: {
    role: 'assistant' | 'user';
    agent?: string;
  };
  parts: MessagePart[];
}

/**
 * Message part
 */
export interface MessagePart {
  type: 'text' | 'image' | 'code';
  text?: string;
}

/**
 * Transform output structure
 */
export interface TransformOutput {
  messages: ChatMessage[];
}

/**
 * Transform input/output parameters
 */
export interface TransformParams {
  input: unknown;
  output: TransformOutput;
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: 创建日志工具模块

**Files:**
- Create: `src/logger.ts`

**Step 1: 创建日志工具**

```typescript
import type { LogBody } from './types';

/**
 * Logger for opencode-cline-mode plugin
 */
export class Logger {
  private client: { app: { log: (params: { body: LogBody }) => Promise<void> } };
  private service: string = 'opencode-cline-mode';

  constructor(client: PluginContext['client']) {
    this.client = client;
  }

  /**
   * Log info message
   */
  async info(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('info', message, extra);
  }

  /**
   * Log warning message
   */
  async warn(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('warn', message, extra);
  }

  /**
   * Log error message
   */
  async error(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('error', message, extra);
  }

  /**
   * Log debug message
   */
  async debug(message: string, extra?: Record<string, unknown>): Promise<void> {
    await this.log('debug', message, extra);
  }

  /**
   * Internal log method
   */
  private async log(
    level: LogBody['level'],
    message: string,
    extra?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.client.app.log({
        body: {
          service: this.service,
          level,
          message,
          extra,
        },
      });
    } catch (error) {
      console.error(`[${this.service}] Failed to log:`, error);
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/logger.ts
git commit -m "feat: add unified logger module"
```

---

## Task 4: 创建配置验证模块

**Files:**
- Create: `src/config-validator.ts`
- Create: `src/config-validator.test.ts`

**Step 1: 编写配置验证测试**

```typescript
import { describe, it, expect } from 'vitest';
import { validateConfig, getDefaultConfig } from './config-validator';
import type { PluginConfig } from './types';

describe('config-validator', () => {
  describe('validateConfig', () => {
    it('should validate a valid config', () => {
      const config: PluginConfig = {
        replace_default_agents: true,
        default_agent: 'cline-plan',
        plan_model: 'claude-opus-4',
        act_model: 'claude-sonnet-4',
      };
      
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate an empty config', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
    });

    it('should reject invalid default_agent', () => {
      const config = {
        default_agent: 'invalid-agent',
      };
      
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid temperature (too high)', () => {
      const config: PluginConfig = {
        plan_temperature: 1.5,
      };
      
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid temperature (negative)', () => {
      const config: PluginConfig = {
        act_temperature: -0.1,
      };
      
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = getDefaultConfig();
      
      expect(config.replace_default_agents).toBe(true);
      expect(config.default_agent).toBe('cline-plan');
      expect(config.plan_temperature).toBe(0.1);
      expect(config.act_temperature).toBe(0.3);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test`

Expected: Tests fail (config-validator not implemented yet)

**Step 3: 实现配置验证**

```typescript
import Ajv from 'ajv';
import type { PluginConfig } from './types';

const ajv = new Ajv({ allErrors: true });

const configSchema = {
  type: 'object',
  properties: {
    replace_default_agents: {
      type: 'boolean',
      default: true,
    },
    default_agent: {
      type: 'string',
      enum: ['cline-plan', 'cline-act'],
      default: 'cline-plan',
    },
    plan_model: {
      type: 'string',
    },
    act_model: {
      type: 'string',
    },
    plan_temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    act_temperature: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
  },
  additionalProperties: false,
};

const validate = ajv.compile<PluginConfig>(configSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate plugin configuration
 */
export function validateConfig(config: unknown): ValidationResult {
  const valid = validate(config);
  
  if (valid) {
    return { valid: true, errors: [] };
  }
  
  const errors = validate.errors?.map(err => 
    `${err.instancePath} ${err.message}`
  ) || [];
  
  return { valid: false, errors };
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Required<PluginConfig> {
  return {
    replace_default_agents: true,
    default_agent: 'cline-plan',
    plan_model: '',
    act_model: '',
    plan_temperature: 0.1,
    act_temperature: 0.3,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(userConfig: PluginConfig): Required<PluginConfig> {
  const defaults = getDefaultConfig();
  
  return {
    replace_default_agents: userConfig.replace_default_agents ?? defaults.replace_default_agents,
    default_agent: userConfig.default_agent ?? defaults.default_agent,
    plan_model: userConfig.plan_model ?? defaults.plan_model,
    act_model: userConfig.act_model ?? defaults.act_model,
    plan_temperature: userConfig.plan_temperature ?? defaults.plan_temperature,
    act_temperature: userConfig.act_temperature ?? defaults.act_temperature,
  };
}
```

**Step 4: 运行测试确认通过**

Run: `npm test`

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/config-validator.ts src/config-validator.test.ts
git commit -m "feat: add config validation with ajv and tests"
```

---

## Task 5: 创建路径解析模块

**Files:**
- Create: `src/path-resolver.ts`
- Create: `src/path-resolver.test.ts`

**Step 1: 编写路径解析测试**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolvePromptsDir, resolveConfigPath } from './path-resolver';

describe('path-resolver', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'opencode-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('resolvePromptsDir', () => {
    it('should find prompts directory in plugin directory', async () => {
      const promptsDir = join(tempDir, 'prompts');
      await mkdir(promptsDir);
      
      const result = resolvePromptsDir(tempDir);
      expect(result).toBe(promptsDir);
    });

    it('should throw error when prompts directory not found', () => {
      expect(() => resolvePromptsDir(tempDir)).toThrow();
    });
  });

  describe('resolveConfigPath', () => {
    it('should find project-level config', async () => {
      const projectConfigDir = join(tempDir, '.opencode');
      await mkdir(projectConfigDir);
      const configPath = join(projectConfigDir, 'opencode-cline-mode.json');
      await writeFile(configPath, '{}');
      
      const result = resolveConfigPath(tempDir);
      expect(result).toBe(configPath);
    });

    it('should return null when no config found', () => {
      const result = resolveConfigPath(tempDir);
      expect(result).toBeNull();
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test src/path-resolver.test.ts`

**Step 3: 实现路径解析**

```typescript
import { existsSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { homedir } from 'os';

/**
 * Resolve prompts directory
 */
export function resolvePromptsDir(pluginDir: string): string {
  const possiblePaths = [
    join(pluginDir, 'prompts'),
    join(process.cwd(), 'prompts'),
    join(homedir(), '.config/opencode/plugins/opencode-cline-mode/prompts'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    `Could not find prompts directory. Searched paths:\n${possiblePaths.map(p => `  - ${p}`).join('\n')}`
  );
}

/**
 * Resolve configuration file path
 */
export function resolveConfigPath(directory: string): string | null {
  const configPaths = [
    join(directory, '.opencode', 'opencode-cline-mode.json'),
    join(homedir(), '.config', 'opencode', 'opencode-cline-mode.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Get plugin directory from meta URL
 */
export function getPluginDir(metaUrl: string): string {
  const __filename = fileURLToPath(metaUrl);
  return dirname(realpathSync(__filename));
}
```

**Step 4: 运行测试确认通过**

Run: `npm test src/path-resolver.test.ts`

**Step 5: Commit**

```bash
git add src/path-resolver.ts src/path-resolver.test.ts
git commit -m "feat: add path resolver module with tests"
```

---

## Task 6: 创建消息转换模块

**Files:**
- Create: `src/message-transformer.ts`
- Create: `src/message-transformer.test.ts`

**Step 1: 编写消息转换测试**

```typescript
import { describe, it, expect } from 'vitest';
import { transformMessages } from './message-transformer';
import type { ChatMessage, TransformOutput } from './types';

describe('message-transformer', () => {
  describe('transformMessages', () => {
    it('should add system-reminder to cline-plan messages', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan created' }],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[0].parts[0].text;
      expect(text).toContain('<system-reminder>');
      expect(text).toContain('Tab');
      expect(text).toContain('cline-act');
    });

    it('should not modify non-cline-plan messages', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-act' },
            parts: [{ type: 'text', text: 'Executing' }],
          },
        ],
      };

      transformMessages(output);

      expect(output.messages[0].parts[0].text).toBe('Executing');
    });

    it('should not duplicate reminders', () => {
      const output: TransformOutput = {
        messages: [
          {
            info: { role: 'assistant', agent: 'cline-plan' },
            parts: [{ type: 'text', text: 'Plan\n<system-reminder>already added' }],
          },
        ],
      };

      transformMessages(output);

      const text = output.messages[0].parts[0].text;
      expect(text.match(/<system-reminder>/g)).toHaveLength(1);
    });

    it('should handle empty messages array', () => {
      const output: TransformOutput = { messages: [] };
      
      expect(() => transformMessages(output)).not.toThrow();
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test src/message-transformer.test.ts`

**Step 3: 实现消息转换**

```typescript
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

/**
 * Transform messages to add system reminders
 */
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
```

**Step 4: 运行测试确认通过**

Run: `npm test src/message-transformer.test.ts`

**Step 5: Commit**

```bash
git add src/message-transformer.ts src/message-transformer.test.ts
git commit -m "feat: add message transformer module with tests"
```

---

## Task 7: 创建 Agent 构建器模块

**Files:**
- Create: `src/agent-builder.ts`
- Create: `src/agent-builder.test.ts`

**Step 1: 编写 agent 构建器测试**

```typescript
import { describe, it, expect } from 'vitest';
import { buildClineAgents, hideDefaultAgents } from './agent-builder';
import type { AgentConfig, OpenCodeConfig, PluginConfig } from './types';

describe('agent-builder', () => {
  const planPrompt = 'Plan mode prompt';
  const actPrompt = 'Act mode prompt';
  const defaultConfig: Required<PluginConfig> = {
    replace_default_agents: true,
    default_agent: 'cline-plan',
    plan_model: '',
    act_model: '',
    plan_temperature: 0.1,
    act_temperature: 0.3,
  };

  describe('buildClineAgents', () => {
    it('should build cline agents with default config', () => {
      const agents = buildClineAgents({
        planPrompt,
        actPrompt,
        config: defaultConfig,
        defaultModel: 'claude-3',
      });

      expect(agents['cline-plan']).toBeDefined();
      expect(agents['cline-act']).toBeDefined();
      expect(agents['cline-plan'].mode).toBe('primary');
      expect(agents['cline-plan'].tools.bash).toBe(false);
      expect(agents['cline-act'].tools.bash).toBe(true);
    });

    it('should use custom models when specified', () => {
      const config = {
        ...defaultConfig,
        plan_model: 'claude-opus',
        act_model: 'claude-sonnet',
      };

      const agents = buildClineAgents({
        planPrompt,
        actPrompt,
        config,
        defaultModel: 'claude-3',
      });

      expect(agents['cline-plan'].model).toBe('claude-opus');
      expect(agents['cline-act'].model).toBe('claude-sonnet');
    });
  });

  describe('hideDefaultAgents', () => {
    it('should hide default agents', () => {
      const originalAgents: Record<string, AgentConfig> = {
        build: {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Build agent',
          tools: { bash: true, edit: true, write: true },
          system: ['Build prompt'],
        },
        plan: {
          mode: 'primary',
          model: 'claude-3',
          temperature: 0.5,
          description: 'Plan agent',
          tools: { bash: false, edit: false, write: false },
          system: ['Plan prompt'],
        },
      };

      const hidden = hideDefaultAgents(originalAgents);

      expect(hidden['build'].mode).toBe('subagent');
      expect(hidden['build'].hidden).toBe(true);
      expect(hidden['plan'].mode).toBe('subagent');
      expect(hidden['plan'].hidden).toBe(true);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test src/agent-builder.test.ts`

**Step 3: 实现 agent 构建器**

```typescript
import type { AgentConfig, PluginConfig } from './types';

interface BuildAgentsParams {
  planPrompt: string;
  actPrompt: string;
  config: Required<PluginConfig>;
  defaultModel: string;
}

/**
 * Build Cline agent configurations
 */
export function buildClineAgents(params: BuildAgentsParams): Record<string, AgentConfig> {
  const { planPrompt, actPrompt, config, defaultModel } = params;

  const planModel = config.plan_model || defaultModel;
  const actModel = config.act_model || defaultModel;

  return {
    'cline-plan': {
      mode: 'primary',
      model: planModel,
      temperature: config.plan_temperature,
      description: 'Cline Plan Mode - Analysis and planning without code changes',
      tools: {
        bash: false,
        edit: false,
        write: false,
      },
      system: [planPrompt],
    },
    'cline-act': {
      mode: 'primary',
      model: actModel,
      temperature: config.act_temperature,
      description: 'Cline Act Mode - Execute plans with full tool access',
      tools: {
        bash: true,
        edit: true,
        write: true,
      },
      system: [actPrompt],
    },
  };
}

/**
 * Hide default agents by demoting to subagent
 */
export function hideDefaultAgents(
  agents: Record<string, AgentConfig | undefined>
): Record<string, AgentConfig> {
  const hidden: Record<string, AgentConfig> = {};

  for (const [name, agentConfig] of Object.entries(agents)) {
    if (agentConfig && typeof agentConfig === 'object') {
      hidden[name] = {
        ...agentConfig,
        mode: 'subagent',
        hidden: true,
      };
    }
  }

  return hidden;
}
```

**Step 4: 运行测试确认通过**

Run: `npm test src/agent-builder.test.ts`

**Step 5: Commit**

```bash
git add src/agent-builder.ts src/agent-builder.test.ts
git commit -m "feat: add agent builder module with tests"
```

---

## Task 8: 创建配置加载模块

**Files:**
- Create: `src/config-loader.ts`
- Create: `src/config-loader.test.ts`

**Step 1: 编写配置加载测试**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadPluginConfig } from './config-loader';

describe('config-loader', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'opencode-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('loadPluginConfig', () => {
    it('should load valid config from file', async () => {
      const configDir = join(tempDir, '.opencode');
      await mkdir(configDir);
      const configPath = join(configDir, 'opencode-cline-mode.json');
      
      await writeFile(configPath, JSON.stringify({
        replace_default_agents: false,
        default_agent: 'cline-act',
      }));

      const config = loadPluginConfig(tempDir);
      
      expect(config.replace_default_agents).toBe(false);
      expect(config.default_agent).toBe('cline-act');
    });

    it('should return defaults when no config file', async () => {
      const config = loadPluginConfig(tempDir);
      
      expect(config.replace_default_agents).toBe(true);
      expect(config.default_agent).toBe('cline-plan');
    });

    it('should handle malformed JSON gracefully', async () => {
      const configDir = join(tempDir, '.opencode');
      await mkdir(configDir);
      const configPath = join(configDir, 'opencode-cline-mode.json');
      
      await writeFile(configPath, '{ invalid json }');

      const config = loadPluginConfig(tempDir);
      
      expect(config.replace_default_agents).toBe(true);
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test src/config-loader.test.ts`

**Step 3: 实现配置加载**

```typescript
import { readFileSync } from 'fs';
import { join, homedir } from 'path';
import { existsSync } from 'fs';
import { validateConfig, mergeWithDefaults, getDefaultConfig } from './config-validator';
import { resolveConfigPath } from './path-resolver';
import type { PluginConfig } from './types';

/**
 * Load plugin configuration from file
 */
export function loadPluginConfig(directory: string): Required<PluginConfig> {
  const configPath = resolveConfigPath(directory);

  if (!configPath) {
    return getDefaultConfig();
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content) as PluginConfig;

    const validation = validateConfig(userConfig);
    
    if (!validation.valid) {
      console.warn(
        `Invalid config at ${configPath}:\n${validation.errors.join('\n')}\nUsing defaults.`
      );
      return getDefaultConfig();
    }

    return mergeWithDefaults(userConfig);
  } catch (error) {
    console.warn(`Failed to load config from ${configPath}:`, error);
    return getDefaultConfig();
  }
}
```

**Step 4: 运行测试确认通过**

Run: `npm test src/config-loader.test.ts`

**Step 5: Commit**

```bash
git add src/config-loader.ts src/config-loader.test.ts
git commit -m "feat: add config loader with validation and tests"
```

---

## Task 9: 迁移主文件到 TypeScript

**Files:**
- Create: `src/index.ts`
- Delete: `index.js`

**Step 1: 创建 TypeScript 主文件**

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PluginContext, OpenCodeConfig } from './types';
import { Logger } from './logger';
import { getPluginDir, resolvePromptsDir } from './path-resolver';
import { loadPluginConfig } from './config-loader';
import { buildClineAgents, hideDefaultAgents } from './agent-builder';
import { transformMessages } from './message-transformer';

/**
 * OpenCode Cline Mode Plugin
 * 
 * Registers two agents for Cline-style workflow:
 * - cline-plan: Analysis and planning mode (no code changes)
 * - cline-act: Execution mode (implements the plan)
 */
export default async function ClineModePlugin(context: PluginContext) {
  const { client, project, directory, worktree } = context;
  
  const logger = new Logger(client);
  const pluginDir = getPluginDir(import.meta.url);
  const promptsDir = resolvePromptsDir(pluginDir);
  const pluginConfig = loadPluginConfig(directory);

  const planPromptPath = join(promptsDir, 'plan.md');
  const actPromptPath = join(promptsDir, 'act.md');

  await logger.info('Cline Mode Plugin initialized', {
    directory,
    worktree,
    project: project.name,
    config: pluginConfig,
  });

  return {
    /**
     * Configure agents
     */
    config: async (config: OpenCodeConfig) => {
      const planPrompt = readFileSync(planPromptPath, 'utf-8');
      const actPrompt = readFileSync(actPromptPath, 'utf-8');

      const defaultModel = config.model || 'inherit';

      const clineAgents = buildClineAgents({
        planPrompt,
        actPrompt,
        config: pluginConfig,
        defaultModel,
      });

      const originalConfigAgent = config.agent || {};

      if (pluginConfig.replace_default_agents) {
        const hiddenAgents = hideDefaultAgents(originalConfigAgent);

        config.agent = {
          ...clineAgents,
          ...hiddenAgents,
        };

        if (!config.agent || Object.keys(config.agent).length === 0) {
          config.agent = { ...clineAgents };
        }

        config.default_agent = pluginConfig.default_agent || 'cline-plan';

        if (!config.agent[config.default_agent]) {
          config.default_agent = 'cline-plan';
        }

        await logger.info('Cline Mode: Default agents hidden, only Cline agents visible', {
          visibleAgents: Object.keys(clineAgents),
          hiddenAgents: Object.keys(hiddenAgents),
          defaultAgent: config.default_agent,
        });
      } else {
        config.agent = {
          ...originalConfigAgent,
          ...clineAgents,
        };

        await logger.info('Cline Mode: Cline agents added alongside default agents', {
          allAgents: Object.keys(config.agent),
        });
      }
    },

    /**
     * Transform messages to add system reminders
     */
    'experimental.chat.messages.transform': async (_input: unknown, output: { messages: unknown[] }) => {
      if (output && 'messages' in output) {
        transformMessages(output as Parameters<typeof transformMessages>[0]);
      }
    },

    /**
     * Log when agents are used
     */
    'chat.message': async (input: { agent?: string; sessionID?: string }) => {
      const { agent } = input;
      
      if (agent === 'cline-plan' || agent === 'cline-act') {
        await logger.info(`${agent} agent activated`, {
          sessionID: input.sessionID,
          agent,
        });
      }
    },
  };
}
```

**Step 2: 编译 TypeScript**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/index.ts
git rm index.js
git commit -m "refactor: migrate main file to TypeScript"
```

---

## Task 10: 更新 README 和文档

**Files:**
- Modify: `README.md`

**Step 1: 更新 README 添加开发信息**

在 README.md 的 Contributing 部分之前添加:

```markdown
## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/trry-hub/opencode-cline-mode.git
cd opencode-cline-mode
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### Project Structure

```
opencode-cline-mode/
├── src/
│   ├── index.ts              # Main plugin entry
│   ├── types.ts              # TypeScript definitions
│   ├── logger.ts             # Unified logging
│   ├── config-validator.ts   # Config validation
│   ├── config-loader.ts      # Config loading
│   ├── path-resolver.ts      # Path resolution
│   ├── agent-builder.ts      # Agent configuration
│   └── message-transformer.ts # Message processing
├── prompts/
│   ├── plan.md               # Plan mode prompt
│   └── act.md                # Act mode prompt
├── dist/                     # Compiled output
├── docs/                     # Documentation
└── package.json
```

```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with development info"
```

---

## Task 11: 运行完整测试套件

**Step 1: 运行所有测试**

Run: `npm test`

Expected: All tests pass

**Step 2: 运行覆盖率**

Run: `npm run test:coverage`

Expected: Coverage > 80%

**Step 3: 构建生产版本**

Run: `npm run build`

Expected: No errors, dist/ directory created

**Step 4: 最终 Commit**

```bash
git add .
git commit -m "chore: final cleanup and testing"
```

---

## 完成清单

- [ ] TypeScript 配置完成
- [ ] 所有模块有单元测试
- [ ] 测试覆盖率 > 80%
- [ ] 构建无错误
- [ ] 文档已更新
- [ ] README 包含开发指南

---

**预计完成时间:** 1-2 小时

**测试命令:**
```bash
npm test                 # 运行所有测试
npm run build            # 构建生产版本
npm run test:coverage    # 查看覆盖率报告
```
