# 如何测试 OpenCode Cline Mode 插件

## ✅ 插件已安装

插件已通过符号链接安装到:
```
~/.config/opencode/plugins/opencode-cline-mode
```

## 🎯 测试步骤

### 方式 1: 命令行启动 (推荐)

#### 测试 Plan Agent

```bash
# 进入任意项目目录
cd /Users/trry/6bt/project/xiaoyaojing-platform/web/pc

# 使用 cline-plan agent 启动
opencode --agent cline-plan
```

**预期效果:**
- OpenCode 启动
- 你会看到 agent 显示为 `cline-plan`
- 输入任何需求，AI 会创建详细计划但**不会修改代码**

**测试示例:**
```
我想添加一个用户登录功能
```

AI 应该:
- ✅ 分析现有代码结构
- ✅ 创建详细的实施计划
- ✅ 列出需要修改的文件
- ✅ 评估风险
- ❌ 不会创建或修改任何文件
- ❌ 不会执行任何命令

---

#### 测试 Act Agent

```bash
# 在同一个项目目录
opencode --agent cline-act
```

**预期效果:**
- OpenCode 启动
- 你会看到 agent 显示为 `cline-act`
- 输入任务，AI 会**实际执行**并修改代码

**测试示例:**
```
创建一个简单的 hello world 函数
```

AI 应该:
- ✅ 创建或修改文件
- ✅ 执行必要的命令
- ✅ 报告每一步的进度
- ✅ 验证结果

---

### 方式 2: TUI 中切换 Agent

1. 启动 OpenCode (任意 agent):
   ```bash
   cd /Users/trry/6bt/project/xiaoyaojing-platform/web/pc
   opencode
   ```

2. 在 TUI 中按 `Tab` 键

3. 你应该看到 agent 列表，包括:
   - `cline-plan` ← 新增的 Plan agent
   - `cline-act` ← 新增的 Act agent
   - 其他默认 agents (plan, build, 等)

4. 选择 `cline-plan` 或 `cline-act`

5. 开始新对话测试

---

## 🔍 验证插件是否正确加载

### 检查 1: 查看可用 agents

```bash
opencode --help | grep agent
```

或启动 OpenCode 后按 `Tab`，应该能看到 `cline-plan` 和 `cline-act`。

### 检查 2: 查看日志

OpenCode 启动时会输出日志，查找:
```
service: 'opencode-cline-mode'
message: 'Cline Mode Plugin initialized - registering agents'
```

### 检查 3: 测试工具限制

**在 cline-plan agent 中:**
```
请帮我创建一个 test.js 文件
```

AI 应该**拒绝**或说明无法执行，因为 plan 模式禁用了 `write` 工具。

**在 cline-act agent 中:**
```
请帮我创建一个 test.js 文件
```

AI 应该**成功创建**文件。

---

## 📊 完整测试场景

### 场景 1: 完整的 Plan → Act 工作流

```bash
# Step 1: 使用 plan agent 创建计划
opencode --agent cline-plan

# 输入需求
> 我想添加一个计算器功能，支持加减乘除

# AI 创建详细计划...

# Step 2: 切换到 act agent 执行
# 按 Tab，选择 cline-act，开始新会话

# 输入
> 请按照刚才的计划实施

# AI 开始执行...
```

### 场景 2: 直接使用 Act Agent

```bash
opencode --agent cline-act

# 输入简单任务
> 创建一个 utils.js 文件，包含一个 formatDate 函数

# AI 直接执行
```

### 场景 3: 对比默认 Agent

```bash
# 使用默认 agent
opencode

# 输入同样的需求，观察行为差异
```

---

## ✅ 测试清单

完成以下测试确认插件工作正常:

- [ ] 插件已安装 (`ls -la ~/.config/opencode/plugins/opencode-cline-mode`)
- [ ] 可以通过 `--agent cline-plan` 启动
- [ ] 可以通过 `--agent cline-act` 启动
- [ ] 在 TUI 中按 Tab 能看到两个新 agent
- [ ] `cline-plan` 不会修改代码
- [ ] `cline-plan` 不会执行命令
- [ ] `cline-plan` 会创建详细计划
- [ ] `cline-act` 可以修改代码
- [ ] `cline-act` 可以执行命令
- [ ] `cline-act` 会报告执行进度
- [ ] 日志中有插件初始化信息

---

## 🐛 常见问题

### 问题: 看不到 cline-plan 和 cline-act agents

**解决方案:**
1. 确认插件已安装:
   ```bash
   ls -la ~/.config/opencode/plugins/opencode-cline-mode
   ```

2. 重启 OpenCode

3. 检查插件语法:
   ```bash
   node --check ~/.config/opencode/plugins/opencode-cline-mode/index.js
   ```

### 问题: cline-plan 仍然可以修改代码

**可能原因:**
- 插件的 `config` hook 没有正确执行
- 工具限制没有生效

**解决方案:**
查看 OpenCode 日志，确认看到:
```
Agents registered successfully
planTools: { bash: false, edit: false, write: false }
```

### 问题: 提示词没有生效

**解决方案:**
1. 确认 prompt 文件存在:
   ```bash
   ls -lh ~/.config/opencode/plugins/opencode-cline-mode/prompts/
   ```

2. 检查文件内容:
   ```bash
   head -20 ~/.config/opencode/plugins/opencode-cline-mode/prompts/plan.md
   ```

---

## 🎉 测试成功的标志

如果你看到以下现象，说明插件工作正常:

1. ✅ 启动 OpenCode 时日志显示 "Cline Mode Plugin initialized"
2. ✅ 按 Tab 能看到 `cline-plan` 和 `cline-act`
3. ✅ `cline-plan` 创建计划但不修改代码
4. ✅ `cline-act` 可以执行并修改代码
5. ✅ AI 的回复风格符合 Cline 模式 (结构化、详细的计划和执行报告)

---

## 📝 反馈

测试中遇到问题？请提交 Issue:
https://github.com/trry-hub/opencode-cline-mode/issues

测试成功？欢迎分享你的使用体验！
