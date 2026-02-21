# 故障排查指南

## 问题：执行 plan 后没有命令提示和 `/start-act` 命令

### 可能的原因

1. **消息转换 hook 未触发**
2. **工具注册失败**
3. **配置文件问题**
4. **OpenCode 版本不兼容**

### 解决方案

#### 1. 检查日志输出

插件现在会输出详细的调试日志。运行 OpenCode 时查看日志：

```bash
# 启动 OpenCode 并查看日志
opencode --agent cline-plan --verbose
```

查找以下关键日志：
- `🔍 transformMessages called` - 消息转换被调用
- `✅ SUCCESS: Added plan completion block` - 成功添加完成提示
- `⏭️ SKIPPED: Did not add completion block` - 跳过添加（查看原因）

#### 2. 验证配置文件

创建配置文件 `~/.config/opencode/opencode-cline-mode.json`：

```json
{
  "enable_execute_command": true,
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
```

或在项目根目录创建 `.opencode/opencode-cline-mode.json`。

#### 3. 手动测试工具

在 cline-plan 模式下，尝试直接调用工具：

```
/start-act
```

如果工具不可用，检查：
- `.opencode/tools/start-act.ts` 文件是否存在
- OpenCode 是否正确加载了插件

#### 4. 检查 OpenCode 版本

确保使用的 OpenCode 版本支持以下特性：
- `experimental.chat.messages.transform` hook
- 插件工具注册

```bash
opencode --version
```

推荐版本：>= 1.0.0

#### 5. 重新构建插件

如果修改了源代码，需要重新构建：

```bash
npm run build
```

#### 6. 清除缓存

有时缓存可能导致问题：

```bash
rm -rf ~/.config/opencode/.cline-cache
```

### 调试步骤

1. **启用详细日志**：
   ```bash
   opencode --agent cline-plan --verbose 2>&1 | tee opencode.log
   ```

2. **检查消息结构**：
   日志会显示每条消息的详细信息，包括：
   - agent 名称
   - role（user/assistant）
   - parts 数量
   - 文本预览

3. **验证触发条件**：
   完成提示只会在以下条件下添加：
   - 当前 agent 是 `cline-plan`
   - 消息 role 是 `assistant`
   - 之前没有添加过完成提示

### 常见问题

#### Q: 看到日志但没有完成提示

**A**: 检查日志中的 `reason` 字段：
- `reminder already exists` - 已经添加过，刷新页面试试
- `not from cline-plan agent` - 当前不是 cline-plan agent
- `not assistant role` - 消息不是来自 assistant

#### Q: `/start-act` 工具不可用

**A**: 确保：
1. `enable_execute_command` 配置为 `true`
2. `.opencode/tools/start-act.ts` 文件存在
3. 重启 OpenCode

#### Q: 工具调用后没有切换 agent

**A**: 这是正常的，工具只是提示你手动切换：
1. 按 Tab 键
2. 选择 `cline-act`
3. 计划会自动继承

### 手动切换方法

如果自动提示不工作，可以手动切换：

1. 在 cline-plan 中完成计划
2. 按 `Tab` 键
3. 选择 `cline-act` agent
4. 计划会自动传递到 act 模式

### 报告问题

如果以上方法都无法解决问题，请提供以下信息：

1. OpenCode 版本
2. 插件版本
3. 完整的日志输出
4. 配置文件内容
5. 重现步骤

提交 issue：https://github.com/trry-hub/opencode-cline-mode/issues
