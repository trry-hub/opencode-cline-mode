# 配置指南：使用原生 Cline Prompt

## 已完成的配置

已在 `~/.config/opencode/opencode-cline-mode.json` 创建配置文件：

```json
{
  "prompt_source": "github",
  "cline_version": "latest",
  "cache_ttl": 24,
  "fallback_to_local": true,
  "enable_execute_command": true,
  "replace_default_agents": true,
  "default_agent": "cline-plan"
}
```

## 配置说明

### `prompt_source: "github"`
- 从 Cline 官方 GitHub 仓库获取最新的 prompt
- 确保与原生 Cline 格式完全一致
- 首次启动时会从网络下载

### `cline_version: "latest"`
- 自动使用 Cline 的最新版本
- 也可以指定特定版本，如 `"main"` 或 `"v1.2.3"`

### `cache_ttl: 24`
- 缓存 24 小时
- 避免每次启动都从网络下载
- 缓存位置：`~/.config/opencode/.cline-cache/`

### `fallback_to_local: true`
- 如果 GitHub 无法访问，自动降级到本地 prompt
- 确保离线环境也能正常工作

## 验证配置是否生效

### 1. 清除旧缓存（可选）

```bash
rm -rf ~/.config/opencode/.cline-cache/
```

### 2. 启动 OpenCode 并查看日志

```bash
opencode --agent cline-plan --print-logs --log-level INFO 2>&1 | grep -i "prompt"
```

你应该看到类似的日志：

```
✅ 成功：
Fetching prompts from GitHub
Prompts loaded and adapted
source: github

❌ 失败（会降级到本地）：
GitHub fetch failed, falling back to local
source: local
```

### 3. 检查缓存文件

首次成功从 GitHub 获取后，会创建缓存：

```bash
ls -la ~/.config/opencode/.cline-cache/
```

你应该看到：
```
plan-latest-*.json
act-latest-*.json
```

### 4. 测试 prompt 格式

启动 OpenCode 并创建一个简单的计划：

```bash
cd ~/some-project
opencode --agent cline-plan
```

在 TUI 中输入：
```
帮我分析一下这个项目的结构
```

观察 AI 的响应格式是否与原生 Cline 一致。

## Prompt 差异对比

### 本地 Prompt（旧）
- 简化版，专注核心功能
- 工具名称已经是 OpenCode 格式
- 文件大小较小

### GitHub Prompt（新）
- 完整的原生 Cline prompt
- 包含所有 Cline 的特性和说明
- 工具名称会自动转换（Cline → OpenCode）
- 与 Cline VSCode 扩展完全一致

## 工具名称自动映射

即使使用原生 Cline prompt，插件也会自动转换工具名称：

| Cline 工具名 | OpenCode 工具名 |
|-------------|----------------|
| `execute_command` | `bash` |
| `write_to_file` | `write` |
| `read_file` | `read` |
| `list_files` | `glob` |
| `search_files` | `grep` |
| `list_code_definition_names` | `lsp_symbols` |

这个转换是自动的，你不需要做任何操作。

## 切换回本地 Prompt

如果你想切换回本地 prompt（更快，无需网络）：

编辑 `~/.config/opencode/opencode-cline-mode.json`：

```json
{
  "prompt_source": "local"
}
```

## 使用 Auto 模式（推荐）

最佳实践是使用 `auto` 模式：

```json
{
  "prompt_source": "auto",
  "cline_version": "latest",
  "cache_ttl": 24,
  "fallback_to_local": true
}
```

这样会：
1. 首先检查缓存（最快）
2. 缓存过期则从 GitHub 获取（保持最新）
3. GitHub 失败则使用本地（保证可用）

## 故障排查

### 问题：无法从 GitHub 获取

**症状**：日志显示 "GitHub fetch failed"

**解决方案**：
1. 检查网络连接
2. 检查是否能访问 `https://raw.githubusercontent.com`
3. 使用 `fallback_to_local: true` 确保降级可用
4. 或直接使用 `prompt_source: "local"`

### 问题：Prompt 格式还是不对

**可能原因**：
1. 缓存未清除，还在使用旧的 prompt
2. 配置文件位置不对

**解决方案**：
```bash
# 清除缓存
rm -rf ~/.config/opencode/.cline-cache/

# 确认配置文件位置
cat ~/.config/opencode/opencode-cline-mode.json

# 重启 OpenCode
opencode --agent cline-plan
```

### 问题：工具名称不对

**症状**：AI 使用了 Cline 的工具名（如 `execute_command`）而不是 OpenCode 的（如 `bash`）

**原因**：工具名称映射可能失败

**解决方案**：
1. 检查 `src/cline-tool-mapper.ts` 是否正确
2. 重新构建插件：`npm run build`
3. 查看日志确认映射是否执行

## 下一步

现在配置已完成，你可以：

1. **重启 OpenCode** 让配置生效
2. **测试 cline-plan** 查看 prompt 格式
3. **查看日志** 确认从 GitHub 获取成功
4. **创建计划** 验证功能是否正常

如果遇到问题，请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。
