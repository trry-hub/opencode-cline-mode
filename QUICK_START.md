# 快速开始指南

## ✅ 当前状态

根据诊断结果，所有组件都已正确配置：

- ✅ 代码已修复并构建（Feb 22 01:20:37 2026）
- ✅ 配置文件已创建（使用 GitHub 原生 Cline prompt）
- ✅ 工具文件存在（/start-act）
- ✅ 插件已通过 symlink 安装
- ✅ 缓存已从 GitHub 获取

## 🚀 测试步骤

### 方法 1：直接测试（推荐）

```bash
# 1. 在项目目录启动 OpenCode
cd ~/your-project
opencode --agent cline-plan --print-logs --log-level INFO 2>&1 | tee /tmp/opencode-test.log

# 2. 在 OpenCode TUI 中输入任务
# 例如："帮我分析一下这个项目的结构"

# 3. 等待 AI 完成响应，查看是否显示：
#    📋 Plan Complete!
#    ✅ Quick Execute: Call the `/start-act` tool to switch to cline-act

# 4. 如果看到提示，尝试输入：
/start-act

# 5. 按 Tab 切换到 cline-act agent
```

### 方法 2：使用测试脚本

```bash
# 运行测试脚本（需要手动操作）
cd /Users/trry/6bt/myproject/opencode-cline-mode
./test-transform.sh
```

## 🔍 验证日志

在日志中查找以下关键信息：

### ✅ 成功的标志

```
🔍 transformMessages called
📝 Message 0 details
🎯 Message analysis
✅ SUCCESS: Added plan completion block to current message
```

### ❌ 失败的标志

```
⏭️ SKIPPED: Did not add completion block
reason: not from cline-plan agent
```

或者根本没有 `transformMessages called` 日志。

## 🐛 故障排查

### 问题 1：没有看到任何 transform 日志

**原因**：`experimental.chat.messages.transform` hook 未触发

**解决方案**：
1. 检查 OpenCode 版本是否支持此 hook
2. 查看插件加载日志是否有错误
3. 尝试重新安装插件

### 问题 2：看到 transform 日志但没有添加完成提示

**原因**：触发条件不满足

**检查日志中的 reason**：
- `not from cline-plan agent` - 当前不是 cline-plan
- `not assistant role` - 消息不是来自 assistant
- `reminder already exists` - 已经添加过

**解决方案**：
- 确保使用 `--agent cline-plan` 启动
- 等待 AI 完成响应（role 必须是 assistant）
- 刷新或重启 OpenCode

### 问题 3：看到提示但 /start-act 不可用

**原因**：工具未正确注册

**解决方案**：
```bash
# 检查工具文件
ls -la .opencode/tools/start-act.ts

# 重新构建
npm run build

# 重启 OpenCode
```

## 📊 诊断工具

### 运行完整诊断

```bash
cd /Users/trry/6bt/myproject/opencode-cline-mode
./diagnose.sh
```

### 查看配置

```bash
cat ~/.config/opencode/opencode-cline-mode.json
```

### 查看缓存

```bash
ls -la ~/.config/opencode/.cline-cache/
```

### 清除缓存（如果需要）

```bash
rm -rf ~/.config/opencode/.cline-cache/
```

## 🎯 预期行为

### 在 cline-plan 模式下

1. **输入任务**：描述你想要做的事情
2. **AI 分析**：AI 会分析代码并创建详细计划
3. **完成提示**：计划完成后会显示：
   ```
   ---
   
   📋 Plan Complete!
   
   ✅ Quick Execute: Call the `/start-act` tool to switch to cline-act
   ✏️ Modify: Tell me which step to change
   ❌ Cancel: Type "cancel" to abort
   
   ---
   ```
4. **切换执行**：
   - 输入 `/start-act` 或
   - 按 Tab 键选择 `cline-act`

### 在 cline-act 模式下

1. **自动继承计划**：从 cline-plan 切换过来时，计划会自动传递
2. **逐步执行**：AI 会按照计划逐步执行
3. **进度跟踪**：显示当前执行到哪一步

## 🔧 配置选项

当前配置（`~/.config/opencode/opencode-cline-mode.json`）：

```json
{
  "prompt_source": "github",        // 使用原生 Cline prompt
  "cline_version": "latest",        // 最新版本
  "cache_ttl": 24,                  // 缓存 24 小时
  "fallback_to_local": true,        // 失败时降级到本地
  "enable_execute_command": true,   // 启用 /start-act 命令
  "replace_default_agents": true,   // 只显示 cline-plan 和 cline-act
  "default_agent": "cline-plan"     // 默认使用 plan 模式
}
```

### 切换到本地 prompt（更快）

```json
{
  "prompt_source": "local"
}
```

### 使用 auto 模式（推荐）

```json
{
  "prompt_source": "auto"
}
```

## 📚 相关文档

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 详细故障排查
- [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md) - 配置指南
- [FIXES.md](./FIXES.md) - 修复说明
- [README.md](./README.md) - 完整文档

## 💡 提示

1. **首次使用**：首次启动会从 GitHub 下载 prompt，可能需要几秒钟
2. **离线使用**：如果网络不可用，会自动降级到本地 prompt
3. **日志调试**：始终使用 `--print-logs --log-level INFO` 查看详细日志
4. **重启生效**：修改配置后需要重启 OpenCode

## 🆘 需要帮助？

如果问题仍然存在：

1. 运行诊断脚本：`./diagnose.sh`
2. 运行测试脚本：`./test-transform.sh`
3. 查看日志文件：`/tmp/opencode-test.log`
4. 提交 issue：https://github.com/trry-hub/opencode-cline-mode/issues

提交 issue 时请包含：
- OpenCode 版本（`opencode --version`）
- 诊断脚本输出
- 完整的日志文件
- 配置文件内容
