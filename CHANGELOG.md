# 更新日志 (Changelog)

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [5.0.1] - 2026-03-02

### 🐛 修复 (Fixed)

- **修复 plan_mode_respond 工具参数验证错误** - 添加了 response 参数的类型和空值检查，防止 `text9.split is not a function` 错误
- **更新测试用例** - 移除了已废弃的 `cline-approve` 工具测试，添加了新的 focus chain 工具测试

### 技术细节

**修改的文件**:
- `src/tools/index.ts`: 在 `planModeRespondTool` 的 execute 函数中添加参数验证
- `tests/integration/plugin-lifecycle.test.ts`: 更新工具注册测试用例

**修复内容**:
```typescript
// 添加参数验证
if (!response || typeof response !== 'string') {
  return "❌ Error: Invalid response parameter. Response must be a non-empty string.";
}
```

这个修复确保了当 `plan_mode_respond` 工具被调用时，response 参数必须是一个非空字符串，避免了在后续处理中出现 undefined 导致的错误。

---

## [5.0.0] - 2026-02-28

### 🎉 重大更新 (Major Changes)

- **🎯 完整官方 Prompt** - 现在包含 `system-prompt/index.ts`,使用完整的官方 Cline Prompt 结构
- **📝 提升 Plan 模式准确性** - 移除自定义 Mode Intro,让官方 Cline Plan 指导完全生效
- **🔧 最小化覆盖** - 仅添加 OpenCode 集成说明,不覆盖官方 Prompt 逻辑
- **✅ 更贴近原生体验** - Plan 模式现在与原生 Cline 完全一致

### 变更 (Changed)

- **Prompt 结构**:
  - ✅ 添加 `system-prompt/index.ts` 到获取列表
  - ✅ 移除自定义的 `getModeIntro()` 详细指导
  - ✅ 替换为轻量级的 `getModeNote()` 仅说明集成信息
- **优先级调整**: 官方 Prompt 内容优先,自定义内容最小化

### 技术细节

**修改的文件**:

- `src/prompt-fetcher.ts`: 添加 `system-prompt/index.ts`
- `src/prompt-adapter.ts`: 重构 `combineSections()` 和 `getModeIntro()`
- `README.md`: 更新版本说明

**Prompt 层级**:

```
之前:
[自定义 Mode Intro (详细)] → [官方 Prompt Sections]
问题: 自定义内容覆盖了官方指导

现在:
[OpenCode 集成说明 (简短)] → [完整官方 Prompt]
优势: 官方 Cline Plan/Act 指导完全生效
```

---

## [4.0.0] - 2026-02-28

### 🔄 重大变更 (Breaking Changes)

- **移除计划审批机制** - 不再需要 `/approve-plan` 和 `/reject-plan` 工具
- **简化工作流程** - 可以直接从 `cline-plan` 切换到 `cline-act`，与原生 Cline 保持一致
- **移除计划状态** - 删除 `draft`、`approved`、`rejected`、`executing` 状态管理
- **简化配置** - 移除 `enable_execute_command` 和 `show_completion_toast` 配置选项

### 变更 (Changed)

- **工作流程简化**：`cline-plan` → 直接切换到 `cline-act`（无需审批）
- **计划完成提示**：更新为直接提示切换模式
- **PlanManager**：移除审批相关方法，仅保留基础计划管理
- **配置 Schema**：移除未使用的配置选项

### 移除 (Removed)

- `/approve-plan` 工具
- `/reject-plan` 工具
- 计划审批状态管理
- `PlanStatus` 类型
- 计划元数据中的审批字段

### 与原生 Cline 一致性

此次更新使插件与原生 Cline 的行为完全一致：

- ✅ 无需批准计划即可切换到执行模式
- ✅ 直接在 plan 和 act 模式间自由切换
- ✅ 简化的用户体验

---

## [3.2.0] - 2026-02-28

### 🎉 新增 (Added)

- **oxlint 集成** - 使用 oxlint 替代 ESLint 进行代码检查
- **性能提升** - oxlint 比 ESLint 快 50-100 倍
- **简化依赖** - 移除了大量 ESLint 相关依赖

### 变更 (Changed)

- **Linter 迁移** - 从 ESLint 迁移到 oxlint
- **配置简化** - 使用 `.oxlintrc.json` 替代 `eslint.config.js`
- **依赖更新** - 移除了 `@typescript-eslint/*`、`eslint`、`eslint-config-prettier` 等

### 技术细节

**移除的依赖**:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint`
- `eslint-config-prettier`
- `typescript-eslint`

**新增的依赖**:

- `oxlint` (v0.16.0)

**配置文件变更**:

- 删除: `eslint.config.js`
- 新增: `.oxlintrc.json`

**脚本命令变更**:

- `npm run lint` - 现在使用 `oxlint src`
- `npm run lint:fix` - 现在使用 `oxlint src --fix`

---

## [3.1.0] - 2026-02-28

### 🎉 新增 (Added)

- **Plan 审批机制** - 添加与原生 Cline 一致的 plan 审批流程
- **`/approve-plan` 工具** - 批准当前 plan 后才能执行
- **`/reject-plan` 工具** - 拒绝当前 plan
- **Plan 状态管理** (`src/plan-manager.ts`) - 管理 plan 的审批状态
- **审批验证** - `/start-act` 现在会检查 plan 是否已批准

### 变更 (Changed)

- **Plan 完成提示** - 更新为包含审批要求的提示信息
- **`/start-act` 行为** - 现在需要先批准 plan 才能切换到执行模式
- **Message Transformer** - 添加审批相关的提示文本

### 审批流程

1. **创建 Plan** - 使用 `cline-plan` 创建详细计划
2. **审批 Plan** - 使用 `/approve-plan` 批准计划
3. **执行 Plan** - 使用 `/start-act` 切换到执行模式
4. **验证** - 插件自动验证 plan 已批准

### 技术细节

**新增文件**:

- `src/plan-manager.ts` - Plan 状态管理模块
- 导出 `PlanStatus` 和 `PlanInfo` 类型

**Plan 状态**:

- `draft` - 初始状态,未批准
- `approved` - 已批准,可以执行
- `rejected` - 已拒绝,需要重新创建

**状态文件**:

- `.opencode/plans/plan-status.json` - 存储 plan 审批状态

---

## [3.0.0] - 2026-02-28

### 🎉 重大更新 (Breaking Changes)

- **动态 Prompt 获取**: 插件现在从 Cline 官方 GitHub 仓库动态获取最新的 prompt 文件
- **启动验证**: 如果无法获取 prompt,插件将启动失败并显示明确的错误信息
- **完全重构**: 使用全新的架构,确保与官方 Cline 保持同步

### 新增 (Added)

- **GitHub API 集成** (`src/utils/github-api.ts`) - 从 Cline 仓库获取 prompt 文件
- **Prompt 适配器** (`src/prompt-adapter.ts`) - 自动适配 Cline prompt 到 OpenCode 格式
- **工具映射系统** (`src/tool-mapper.ts`) - 智能转换 Cline 工具名称到 OpenCode 等价工具
- **缓存管理** (`src/utils/cache.ts`) - 本地缓存 prompt 文件以提高性能
- **配置文件** (`config/tool-mapping.json`) - 可配置的工具映射规则
- **速率限制检查** - 自动检查 GitHub API 速率限制并提供友好提示
- **详细错误信息** - 网络错误时显示格式化的错误消息和解决方案

### 变更 (Changed)

- **Prompt 来源**: 从本地硬编码改为从 GitHub 动态获取
- **版本号**: 升级到 3.0.0 以反映重大架构变更
- **Agent 描述**: 更新为 "prompts from official Cline repository"
- **文件结构**: 移除 `src/prompts/` 目录,添加 `config/` 和 `src/utils/` 目录

### 移除 (Removed)

- **本地 Prompt 文件**: 删除 `src/prompts/` 目录及其所有子文件
- **静态 Prompt 模板**: 不再使用硬编码的 prompt 内容

### 修复 (Fixed)

- **工具名称不匹配**: 通过工具映射系统自动转换 Cline 工具名称
- **MCP 不兼容**: 自动移除 OpenCode 不支持的 MCP 相关内容
- **Prompt 过时**: 始终使用最新的官方 Cline prompt

### 技术细节

#### 获取的 Prompt 文件

从 `cline/cline` 仓库的 `main` 分支获取以下文件:

- `src/core/prompts/system_prompt.ts`
- `src/core/prompts/sections/act_vs_plan_mode.ts`
- `src/core/prompts/sections/tool_use.ts`
- `src/core/prompts/sections/capabilities.ts`
- `src/core/prompts/sections/rules.ts`
- `src/core/prompts/sections/context_management.ts`

#### 工具映射

| Cline 工具        | OpenCode 工具 |
| ----------------- | ------------- |
| `read_file`       | `read`        |
| `write_to_file`   | `write`       |
| `list_files`      | `glob`        |
| `search_files`    | `grep`        |
| `replace_in_file` | `edit`        |
| `execute_command` | `bash`        |

#### 不支持的功能及替代方案

| Cline 功能              | OpenCode 替代方案                       |
| ----------------------- | --------------------------------------- |
| `browser_action`        | `remote-browser` 或 `browser-use` skill |
| `ask_followup_question` | AI 直接在响应中提问                     |

---

## [2.0.0] - 2025-02-27

### 修复 (Fixed)

- **移除不存在的 GitHub 获取功能文档** - 从文档中删除了关于从 GitHub 动态获取 prompts 的功能描述
- **更正项目结构说明** - 修正了 README 中的项目结构
- **创建缺失的 schema.json 文件** - 添加了配置验证文件

### 变更 (Changed)

- 简化插件架构,使用本地 TypeScript prompts 模块
- 更新文档以反映实际的插件功能和架构

---

## [1.0.0] - 2025-01-XX

### 新增 (Added)

- 初始发布版本
- **cline-plan 智能体** - 只读模式,用于分析代码库和创建详细实施计划
- **cline-act 智能体** - 执行模式,用于逐步执行已批准的计划
- **自动计划继承** - 从 plan 模式切换到 act 模式时自动传递计划内容
- **干净的智能体列表** - 默认只显示 `cline-plan` 和 `cline-act`
- **结构化输出** - 清晰、可操作的计划
- **/start-act 快速执行命令** - 快速从计划模式切换到执行模式
- **零配置** - 开箱即用

### 权限控制

- **cline-plan（只读）**：
  - ✅ 读取文件
  - ✅ 搜索代码库
  - ❌ 编辑文件（拒绝）
  - ❌ 执行 bash 命令（拒绝）

- **cline-act（完全访问）**：
  - ✅ 编辑文件（允许）
  - ⚠️ 执行 bash 命令（请求权限）
  - ✅ 所有其他工具

---

## 版本说明

- **[3.1.0]** - Plan 审批机制,与原生 Cline 审批流程一致
- **[3.0.0]** - 动态 Prompt 获取,与官方 Cline 完全同步
- **[2.0.0]** - 文档修正和结构优化版本
- **[1.0.0]** - 初始发布版本

---

[3.1.0]: https://github.com/trry-hub/opencode-cline-mode/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/trry-hub/opencode-cline-mode/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/trry-hub/opencode-cline-mode/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/trry-hub/opencode-cline-mode/releases/tag/v1.0.0
