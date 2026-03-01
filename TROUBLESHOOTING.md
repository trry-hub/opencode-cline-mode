# 故障排除指南 (Troubleshooting Guide)

本文档提供 opencode-cline-mode 插件常见问题的解决方案。

---

## 目录

1. [插件无法加载](#插件无法加载)
2. [智能体不显示](#智能体不显示)
3. [计划继承不工作](#计划继承不工作)
4. [/start-act 命令找不到](#start-act-命令找不到)
5. [配置问题](#配置问题)

---

## 插件无法加载

### 症状

- OpenCode 启动后，默认智能体（plan, build 等）仍然可见
- 按 `Tab` 键看不到 `cline-plan` 和 `cline-act` 智能体
- 插件似乎没有任何效果

### 解决方案

#### 1. 检查 npm 全局安装

```bash
# 检查插件是否已安装
npm list -g opencode-cline-mode

# 如果未安装，执行安装
npm install -g opencode-cline-mode
```

#### 2. 检查 OpenCode 配置文件

确保 `~/.config/opencode/opencode.json` 包含正确的插件配置：

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

#### 3. 检查 OpenCode 版本

```bash
opencode --version
```

确保版本 >= 1.0.0

#### 4. 如果使用本地符号链接安装

**重要**：使用符号链接时，**不要**在 `opencode.json` 中添加插件配置！

```bash
# 创建符号链接
ln -s $(pwd) ~/.config/opencode/plugins/opencode-cline-mode
```

正确的配置（使用符号链接时）：

```json
{
  "plugin": []
}
```

错误的配置（会导致安装错误）：

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

#### 5. 检查 Node.js 版本

```bash
node --version
```

确保版本 >= 18.0.0

#### 6. 重新构建插件（本地开发）

```bash
cd opencode-cline-mode
npm run build
```

---

## 智能体不显示

### 症状

- 插件加载了，但按 `Tab` 键只看到默认智能体
- `cline-plan` 和 `cline-act` 智能体不在列表中

### 解决方案

#### 1. 检查配置文件中的 `replace_default_agents` 设置

创建或编辑 `~/.config/opencode/opencode-cline-mode.json`：

```json
{
  "replace_default_agents": true
}
```

#### 2. 检查是否有配置文件冲突

配置文件可能在以下位置：
- `~/.config/opencode/opencode-cline-mode.json`
- `.opencode/opencode-cline-mode.json`（项目目录）

确保只有一个配置文件，或者两者配置一致。

#### 3. 验证插件是否正确注册

重启 OpenCode 并检查启动日志：

```bash
opencode --debug
```

查看是否有插件加载错误信息。

---

## 计划继承不工作

### 症状

- 从 `cline-plan` 切换到 `cline-act` 时，计划内容没有传递
- `cline-act` 智能体不知道之前的计划内容

### 解决方案

#### 1. 确保先完成计划

在 `cline-plan` 模式下，必须先完成一个计划（看到 "📋 Plan Complete!" 通知），然后切换到 `cline-act` 才能继承计划。

#### 2. 检查消息转换钩子是否注册

启用调试模式查看日志：

```bash
opencode --debug
```

查找类似以下的消息：
```
[opencode-cline-mode] Message transform hook registered
```

#### 3. 验证消息结构

确保在 `cline-plan` 中有实际的消息内容。如果计划为空，则没有内容可以继承。

#### 4. 尝试手动复制计划

如果自动继承不工作，可以：
1. 在 `cline-plan` 中复制计划内容
2. 切换到 `cline-act`
3. 粘贴计划并请求执行

---

## /start-act 命令找不到

### 症状

- 在 `cline-plan` 模式下输入 `/start-act` 没有反应
- 工具未在列表中显示

### 解决方案

#### 1. 检查配置设置

确保 `enable_execute_command` 设置为 `true`（默认值）：

```json
{
  "enable_execute_command": true
}
```

#### 2. 检查工具钩子是否注册

启用调试模式：

```bash
opencode --debug
```

查找类似以下的消息：
```
[opencode-cline-mode] Tool hook registered for /start-act
```

#### 3. 使用手动切换

如果 `/start-act` 命令不工作，可以手动切换：
1. 按 `Tab` 键
2. 选择 `cline-act` 智能体

#### 4. 检查 .opencode/tools/ 目录

确保项目的 `.opencode/tools/` 目录存在且包含必要的工具定义。

---

## 配置问题

### 症状

- 配置似乎不生效
- 设置被忽略
- 出现意外行为

### 解决方案

#### 1. 验证 JSON 语法

使用 JSON 验证器检查配置文件语法：

```bash
# 使用 Node.js 验证 JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('~/.config/opencode/opencode-cline-mode.json')))"
```

#### 2. 检查配置文件位置

配置文件可以在以下位置（按优先级排序）：
1. `.opencode/opencode-cline-mode.json`（项目目录，最高优先级）
2. `~/.config/opencode/opencode-cline-mode.json`（全局配置）

#### 3. 检查配置选项

有效的配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `replace_default_agents` | boolean | `true` | 是否替换默认智能体 |
| `default_agent` | string | `"cline-plan"` | 默认智能体 |
| `plan_model` | string | `null` | plan 模式使用的模型 |
| `act_model` | string | `null` | act 模式使用的模型 |
| `plan_temperature` | number | `0.1` | plan 模式的温度参数 |
| `act_temperature` | number | `0.3` | act 模式的温度参数 |
| `show_completion_toast` | boolean | `true` | 计划完成时显示通知 |
| `enable_execute_command` | boolean | `true` | 启用 /start-act 命令 |

#### 4. 配置示例

**保留默认智能体**：

```json
{
  "replace_default_agents": false
}
```

**使用不同模型**：

```json
{
  "replace_default_agents": true,
  "plan_model": "anthropic/claude-opus-4",
  "act_model": "anthropic/claude-sonnet-4"
}
```

**禁用快速执行命令**：

```json
{
  "enable_execute_command": false
}
```

#### 5. 验证配置

使用 schema 验证配置文件：

```bash
# 使用 ajv 验证
npx ajv validate -s opencode-cline-mode.schema.json -d ~/.config/opencode/opencode-cline-mode.json
```

---

## 其他常见问题

### 权限被拒绝

**症状**：`cline-plan` 模式下尝试编辑文件被拒绝

**说明**：这是预期行为！`cline-plan` 是只读模式，不允许修改文件。请切换到 `cline-act` 模式进行修改。

### Bash 命令需要确认

**症状**：`cline-act` 模式下执行 bash 命令时总是请求权限

**说明**：这是安全特性。bash 命令需要用户确认才能执行，防止意外操作。

### 智能体响应缓慢

**解决方案**：
1. 检查网络连接
2. 考虑使用更快的模型（在配置中设置 `plan_model` 和 `act_model`）
3. 减少 `plan_temperature` 值以获得更聚焦的响应

---

## 报告问题

如果以上解决方案都无法解决您的问题，请：

1. 保存聊天日志
2. 记录 OpenCode 版本：`opencode --version`
3. 记录插件版本：`npm list -g opencode-cline-mode`
4. 在 GitHub 创建 Issue：https://github.com/trry-hub/opencode-cline-mode/issues

请在 Issue 中包含：
- 问题描述
- 预期行为 vs 实际行为
- 相关聊天日志
- OpenCode 和插件版本信息
- 您的操作系统和 Node.js 版本

---

**最后更新**：2025-02-27
