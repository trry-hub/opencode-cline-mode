# 快速安装指南

## 方法1：本地开发安装（推荐用于测试）

```bash
# 1. 在插件目录下构建并链接
cd /Users/trry/6bt/myproject/opencode-cline-mode
npm run build
npm link

# 2. 在你的项目目录下链接插件
cd /Users/trry/6bt/myproject/your-project
npm link opencode-cline-mode
```

## 方法2：通过符号链接安装（最简单）

```bash
# 创建符号链接到 OpenCode 插件目录
ln -s /Users/trry/6bt/myproject/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode
```

**重要**：使用符号链接时，**不要**在 `opencode.json` 中添加 `"opencode-cline-mode"` 到 `plugin` 数组。

## 方法3：从 npm 安装（生产环境）

```bash
npm install -g opencode-cline-mode
```

## 配置文件

在项目的 `.opencode` 或 `~/.config/opencode/opencode.json` 中添加：

```json
{
  "plugin": ["opencode-cline-mode"]
}
```

## Verify Tool is Working

After installation, test the tool:

1. Start OpenCode with cline-plan agent
2. Create a plan and wait for completion
3. Look for the prompt mentioning `/execute-plan` **tool**
4. Type `/execute-plan` to test agent switching
5. Verify it switches to cline-act and shows inherited plan

## 验证安装

运行 OpenCode 并检查：
- 默认 agent 是否是 `cline-plan`
- `/execute-plan` 命令是否可用

## 故障排除

### 插件未加载
- 检查 `opencode.json` 中 `plugin` 数组
- 检查插件是否已构建（`dist/` 目录存在）
- 查看 OpenCode 日志

### 提示未显示
- 检查 `enable_execute_command` 是否为 `true`（默认）
- 重启 OpenCode
- 清除缓存并重试