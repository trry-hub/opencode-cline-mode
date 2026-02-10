# 🎉 准备好测试了！

## 当前状态

✅ 插件已安装并配置完成
✅ 默认配置：**只显示 Cline agents**（类似 oh-my-opencode）

---

## 🚀 立即测试

### 方式 1: 命令行启动（最简单）

```bash
# 进入你的项目
cd /Users/trry/6bt/project/xiaoyaojing-platform/web/pc

# 启动 OpenCode（会自动使用 cline-plan agent）
opencode
```

**预期效果：**
- OpenCode 启动
- 默认 agent 是 `cline-plan`
- 按 `Tab` 键只会看到 `cline-plan` 和 `cline-act` 两个选项
- ❌ 不会看到 `plan`、`build` 等默认 agents

---

### 方式 2: 指定 Agent 启动

```bash
# 使用 Plan Agent
opencode --agent cline-plan

# 或使用 Act Agent
opencode --agent cline-act
```

---

## 🧪 测试场景

### 测试 1: 验证只有 Cline Agents

```bash
opencode
```

1. 启动后按 `Tab` 键
2. 你应该**只**看到：
   - `cline-plan`
   - `cline-act`
3. ❌ 不应该看到：
   - `plan`
   - `build`
   - 其他默认 agents

**如果看到默认 agents，说明插件没有正确加载。**

---

### 测试 2: Plan Agent 不能修改代码

```bash
opencode --agent cline-plan
```

输入：
```
请帮我创建一个 test.js 文件，内容是 console.log('hello')
```

**预期结果：**
- AI 会创建一个详细的计划
- AI 会说明需要创建什么文件
- ❌ AI **不会**实际创建文件
- ❌ 你的项目目录中**不会**出现 test.js

验证：
```bash
ls test.js  # 应该显示 "No such file or directory"
```

---

### 测试 3: Act Agent 可以修改代码

```bash
opencode --agent cline-act
```

输入：
```
请帮我创建一个 test.js 文件，内容是 console.log('hello')
```

**预期结果：**
- AI 会实际创建文件
- ✅ 你的项目目录中会出现 test.js
- AI 会报告执行进度

验证：
```bash
ls test.js  # 应该显示文件存在
cat test.js # 应该显示 console.log('hello')
```

清理：
```bash
rm test.js
```

---

### 测试 4: 在 TUI 中切换 Agent

```bash
opencode
```

1. 按 `Tab` 键
2. 选择 `cline-act`
3. 输入一个任务
4. 观察 AI 是否可以修改代码

---

## ⚙️ 可选：测试配置功能

### 如果你想保留默认 Agents

创建配置文件：
```bash
cat > ~/.config/opencode/opencode-cline-mode.json << 'EOF'
{
  "replace_default_agents": false
}
EOF
```

重启 OpenCode：
```bash
opencode
```

按 `Tab`，现在你应该看到：
- `cline-plan`
- `cline-act`
- `plan` (OpenCode 默认)
- `build` (OpenCode 默认)
- 等等...

恢复默认行为（只显示 Cline agents）：
```bash
rm ~/.config/opencode/opencode-cline-mode.json
```

---

## ✅ 测试清单

完成以下测试确认插件工作正常：

- [ ] OpenCode 启动成功
- [ ] 按 Tab 只看到 `cline-plan` 和 `cline-act`
- [ ] 默认 agent 是 `cline-plan`
- [ ] `cline-plan` 不会修改代码
- [ ] `cline-plan` 会创建详细计划
- [ ] `cline-act` 可以修改代码
- [ ] `cline-act` 可以执行命令
- [ ] 可以在 TUI 中切换 agents
- [ ] (可选) 配置文件可以控制行为

---

## 🎯 快速验证命令

```bash
# 1. 检查插件状态
bash /Users/trry/6bt/myproject/opencode-cline-mode/quick-check.sh

# 2. 启动测试
cd /Users/trry/6bt/project/xiaoyaojing-platform/web/pc
opencode

# 3. 按 Tab 查看 agents
# 应该只看到 cline-plan 和 cline-act

# 4. 测试 plan 模式
# 输入: 创建一个 hello.js 文件
# 预期: AI 创建计划但不创建文件

# 5. 切换到 act 模式 (按 Tab)
# 输入: 创建一个 hello.js 文件
# 预期: AI 实际创建文件
```

---

## 🐛 遇到问题？

### 问题 1: 仍然看到默认 agents

**原因：** 插件可能没有正确加载

**解决：**
```bash
# 检查插件是否存在
ls -la ~/.config/opencode/plugins/opencode-cline-mode

# 重启 OpenCode
# 查看启动日志，应该看到：
# "Cline Mode Plugin initialized"
# "Default agents replaced with Cline agents"
```

### 问题 2: cline-plan 仍然可以修改代码

**原因：** 工具限制没有生效

**解决：**
查看日志确认看到：
```
planTools: { bash: false, edit: false, write: false }
```

### 问题 3: 想要恢复默认 agents

**临时方案：**
```bash
# 禁用插件
rm ~/.config/opencode/plugins/opencode-cline-mode

# 重启 OpenCode
```

**永久方案：**
创建配置文件设置 `replace_default_agents: false`

---

## 📚 更多信息

- 完整文档: `cat README.md`
- 详细测试: `cat HOW-TO-TEST.md`
- 配置示例: `cat opencode-cline-mode.example.json`

---

**现在就开始测试吧！** 🚀

有任何问题随时告诉我！
