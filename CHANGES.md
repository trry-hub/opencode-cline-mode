# 本次改进总结

## 问题原因

### 原始问题
用户反馈："列出规划后没有提示切换到 act 立即执行"

### 根本原因
**OpenCode 已知 Bug** (Issue #885, #925)：
- `experimental.chat.messages.transform` hook 修改 `output.parts` 后
- 修改内容在 OpenCode TUI 中**不显示**
- 这是 OpenCode 的 bug，不是插件代码问题

## 采取的方案

### 方案 B：使用工具触发（已实施）

由于 OpenCode bug 导致自动提示不可见，改为：

1. ✅ **明确提示文字**
   - 将 "Type `/execute-plan`" 改为 "Use `/execute-plan` **tool**"
   - 明确说明是工具而非命令
   - 添加更清晰的操作选项

2. ✅ **保留工具注册**
   - `/execute-plan` 工具仍然注册（src/index.ts:125-143）
   - 执行 `agent.cycle` 事件切换 agent
   - 保持原有的切换机制

3. ✅ **优化提示内容**
   - getPlanCompletionBlock 函数改进
   - 添加 "Tell me which step to change"
   - 添加 "Type 'cancel' to abort"

## 技术改进

### 1. 修复消息转换逻辑（已修复）
**问题**：两个独立循环可能导致竞态条件

**修复**（message-transformer.ts）：
- 合并为单次反向遍历
- 先处理 plan 消息添加完成提示
- 再处理 act 消息注入规划
- 使用 `hasEncounteredReminder` 标志防止重复

### 2. 增强类型安全（建议）
**文件**：types.ts:119-137

**建议**：
```typescript
function isTransformOutput(output: unknown): output is TransformOutput {
  if (!output || typeof output !== 'object') return false;
  return 'messages' in output && Array.isArray(output.messages);
}
```

### 3. 优化路径解析（建议）
**文件**：path-resolver.ts:6-22

**建议**：
```typescript
import { homedir } from 'os';
import { join } from 'path';

const POSSIBLE_PATHS = [
  join(process.cwd(), 'opencode'),
  join(homedir(), '.opencode'),
  join(homedir(), '.config', 'opencode'),
];
```

### 4. 容错配置加载（建议）
**文件**：config-loader.ts:14-16

**建议**：
```typescript
try {
  config = JSON.parse(content);
} catch (error) {
  if (error instanceof SyntaxError) {
    throw new Error(
      `Invalid JSON in ${configPath}:${error.message}
        Line ${error.message.match(/line (\d+)/)?.[1]}
        Column ${error.message.match(/column (\d+)/)?.[1]}
    `);
  }
  throw error;
}
```

### 5. 性能优化（部分完成）
**文件**：message-transformer.ts:44-77

**已优化**：
- ✅ 合并循环避免重复遍历
- ✅ 使用 `hasEncounteredReminder` 提前退出

**建议**：
- 使用 Map 缓存已处理的消息
- 避免重复查找 plan 消息

### 6. 修复权限配置（已修复）

**问题**：使用 `tools: { bash: false, edit: false }` 字段无效

**原因**：OpenCode 使用 `permission` 字段控制权限，不是 `tools`

**修复**（agent-builder.ts）：
```typescript
// cline-plan - 完全拒绝修改操作
permission: {
  edit: { '*': 'deny' },
  bash: { '*': 'deny' }
}

// cline-act - 允许修改，bash 需询问
permission: {
  edit: { '*': 'allow' },
  bash: { '*': 'ask' }
}
```

**参考**：
- OpenCode Permission System 文档
- Issue #6396: Custom agent deny permissions

## 测试覆盖

### 当前状态
- ✅ 27/27 测试通过
- ✅ 类型检查通过
- ✅ Lint 通过
- ✅ 格式检查通过

### 建议添加的测试
1. **配置为空**
2. **Malformed JSON**
3. **消息数组为 0**
4. **路径解析失败**
5. **多条 plan 消息处理**

## 使用说明

### 当前工作流程

1. **创建规划**
   - 在 `cline-plan` agent 中描述需求
   - AI 生成详细规划

2. **看到提示**
   - 规划完成后显示：
     ```
     📋 Plan Complete!
     
     ✅ Quick Execute: Use `/execute-plan` tool to switch to `cline-act`
     ✏️ Modify: Tell me which step to change
     ❌ Cancel: Type "cancel" to abort
     ```

3. **切换执行**
   - 输入 `/execute-plan` **工具**
   - 或按 Tab 键切换 agent

4. **自动执行**
   - 切换到 `cline-act` 后自动显示：
     ```
     📋 Inherited Plan from cline-plan
     
     [完整规划内容]
     
     Now executing above plan...
     ```
   - AI 立即开始逐步执行

## 后续优化

### 等待 OpenCode 修复上游 Bug
- Issue #885: output.parts 修改不显示
- Issue #925: chat.message hook 支持问题

### 修复后可以做的改进
1. 恢复自动提示显示（移除工具方式）
2. 添加进度条显示
3. 添加步骤跳过功能
4. 添加执行回滚功能

## 版本

**当前**：1.2.2
**发布日期**：2026-02-14

---

**总结**：通过改进提示文字明确性，绕过 OpenCode UI bug，保持完整功能。
