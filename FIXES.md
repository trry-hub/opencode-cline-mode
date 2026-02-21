# 修复说明：Plan 模式命令提示问题

## 问题描述

在使用 `cline-plan` agent 完成计划后，没有显示命令提示和 `/start-act` 命令。

## 根本原因

1. **消息检测逻辑不准确**：原代码会遍历历史消息寻找 plan 消息，但没有直接检查当前最后一条消息
2. **日志级别过低**：使用 `debug` 级别导致关键信息不可见
3. **工具错误处理不足**：`/start-act` 工具缺少错误处理和用户友好的提示

## 修复内容

### 1. 改进消息转换逻辑 (`src/message-transformer.ts`)

**修改前**：
```typescript
if (planMessageToModify && !hasEncounteredReminder) {
  // 修改历史消息
}
```

**修改后**：
```typescript
const shouldAddCompletionBlock =
  currentAgent === 'cline-plan' &&
  lastMessage.info.role === 'assistant' &&
  !hasEncounteredReminder;

if (shouldAddCompletionBlock) {
  // 直接修改当前最后一条消息
  const lastTextPartIndex = lastMessage.parts.findLastIndex(part => part?.type === 'text');
  if (lastTextPartIndex !== -1 && lastMessage.parts[lastTextPartIndex]?.text) {
    const completionBlock = getPlanCompletionBlock(options?.enableExecuteCommand ?? true);
    lastMessage.parts[lastTextPartIndex].text! += completionBlock;
  }
}
```

**改进点**：
- ✅ 直接检查当前消息而不是遍历历史
- ✅ 明确的触发条件：agent 是 cline-plan + role 是 assistant + 没有已存在的提示
- ✅ 更清晰的逻辑流程

### 2. 增强日志输出

**修改**：
- 将关键日志从 `debug` 改为 `info` 级别
- 添加 emoji 标记便于识别
- 增加更详细的上下文信息

**新增日志**：
```typescript
logger?.info('🔍 transformMessages called', { ... });
logger?.info('📝 Message ${idx} details', { ... });
logger?.info('🎯 Message analysis', { ... });
logger?.info('✅ SUCCESS: Added plan completion block', { ... });
logger?.info('⏭️ SKIPPED: Did not add completion block', { reason: ... });
```

### 3. 改进工具实现 (`.opencode/tools/start-act.ts`)

**修改前**：
```typescript
async execute(args, context) {
  return '✅ Switching to cline-act agent...\n\nPlease press Tab...';
}
```

**修改后**：
```typescript
async execute(args, context) {
  const { client } = context;
  try {
    await client.app.event({
      body: {
        type: 'tui.command.execute',
        properties: { command: 'agent.cycle' },
      },
    });
    return '✅ Switching to cline-act agent...\n\n**Next Steps:**\n1. Press Tab...';
  } catch (error) {
    return '✅ Ready to switch...\n\n**Manual Steps:**\n1. Press Tab...';
  }
}
```

**改进点**：
- ✅ 尝试自动触发 agent 切换
- ✅ 添加错误处理和降级方案
- ✅ 提供清晰的步骤说明

### 4. 新增文档

- ✅ `opencode-cline-mode.example.json` - 配置文件示例
- ✅ `TROUBLESHOOTING.md` - 详细的故障排查指南
- ✅ `FIXES.md` - 本文档

## 测试方法

### 1. 重新构建插件

```bash
npm run build
```

### 2. 启动 OpenCode 并查看日志

```bash
opencode --agent cline-plan --verbose 2>&1 | tee opencode.log
```

### 3. 验证功能

1. 在 cline-plan 模式下创建一个计划
2. 等待 AI 完成计划
3. 检查是否显示：
   ```
   ---
   
   📋 Plan Complete!
   
   ✅ Quick Execute: Call the `/start-act` tool to switch to cline-act
   ✏️ Modify: Tell me which step to change
   ❌ Cancel: Type "cancel" to abort
   
   ---
   ```
4. 尝试调用 `/start-act` 工具
5. 切换到 cline-act 验证计划继承

### 4. 检查日志

查找以下关键日志确认修复生效：

```
🔍 transformMessages called
📝 Message 0 details
🎯 Message analysis
✅ SUCCESS: Added plan completion block to current message
```

## 预期效果

修复后，用户在 cline-plan 模式下完成计划时会：

1. ✅ 自动看到完成提示块
2. ✅ 可以使用 `/start-act` 工具快速切换
3. ✅ 看到详细的日志输出便于调试
4. ✅ 获得清晰的下一步操作指引

## 兼容性

- OpenCode >= 1.0.0
- Node.js >= 18.0.0
- 支持 `experimental.chat.messages.transform` hook

## 回滚方案

如果修复导致问题，可以：

1. 恢复到之前的版本：
   ```bash
   git checkout HEAD~1 src/message-transformer.ts
   npm run build
   ```

2. 或禁用功能：
   ```json
   {
     "enable_execute_command": false
   }
   ```

## 后续优化建议

1. 添加单元测试覆盖消息转换逻辑
2. 考虑添加配置选项控制提示块的显示时机
3. 支持自定义提示块内容
4. 添加遥测数据收集功能使用情况

## 相关 Issue

- 原始问题：执行 plan 后没有对应的命令提示和 /start-act 命令
- 修复版本：v2.1.1（待发布）
