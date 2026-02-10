# 测试指南

## 快速测试

### 方法 1: 使用测试脚本 (推荐)

```bash
cd /Users/trry/6bt/myproject/opencode-cline-mode
bash test-plugin.sh
```

这个脚本会：
- ✅ 检查插件安装状态
- ✅ 验证文件完整性
- ✅ 检查 JavaScript 语法
- ✅ 创建临时测试项目
- ✅ 启动 OpenCode 进行测试

### 方法 2: 手动测试

#### 1. 确认插件已安装

```bash
ls -la ~/.config/opencode/plugins/opencode-cline-mode
```

应该看到符号链接指向项目目录。

#### 2. 创建测试项目

```bash
mkdir -p /tmp/cline-test
cd /tmp/cline-test
git init
echo "console.log('test')" > test.js
git add . && git commit -m "init"
```

#### 3. 启动 OpenCode

```bash
opencode
```

#### 4. 测试命令

在 OpenCode 中依次测试以下命令：

---

## 详细测试用例

### 测试用例 1: Plan 模式基础功能

**输入:**
```
/cline-plan 我想添加一个用户认证功能，使用 JWT token
```

**预期结果:**
- ✅ 看到 "🎯 **Cline Plan Mode Activated**" 消息
- ✅ AI 开始分析需求
- ✅ AI 创建详细的实施计划，包括:
  - 📊 Overview (概述)
  - 📁 Impact Scope (影响范围)
  - 📝 Detailed Plan (详细步骤)
  - ⚠️ Risk Warnings (风险警告)
- ✅ AI **不会**修改任何代码
- ✅ AI **不会**执行任何命令

**验证方法:**
```bash
# 检查是否有文件被修改
git status
# 应该显示 "nothing to commit, working tree clean"
```

---

### 测试用例 2: Plan 模式迭代

**输入 (在 Plan 模式下):**
```
能否在计划中加入数据库迁移的步骤？
```

**预期结果:**
- ✅ AI 更新计划，添加数据库迁移步骤
- ✅ 仍然不修改代码

---

### 测试用例 3: Act 模式执行

**输入:**
```
/cline-act
```

或

```
/execute
```

**预期结果:**
- ✅ 看到 "⚡ **Cline Act Mode Activated**" 消息
- ✅ AI 开始逐步执行计划
- ✅ 每完成一步都会报告:
  - ✅ Step N Complete
  - 文件变更列表
  - 验证结果
  - 下一步预览
- ✅ 显示进度: "Progress: N/Total steps completed"

**验证方法:**
```bash
# 检查文件是否被修改
git status
git diff
```

---

### 测试用例 4: 错误处理

**场景:** 在 Act 模式下遇到错误

**预期结果:**
- ✅ AI 停止执行
- ✅ 显示错误信息
- ✅ 提供 2-3 个解决方案
- ✅ 等待用户决策 (retry/skip/fix/abort)

---

### 测试用例 5: 退出 Cline 模式

**输入:**
```
/cline-exit
```

**预期结果:**
- ✅ 看到 "👋 **Cline Mode Deactivated**" 消息
- ✅ 恢复正常对话模式
- ✅ AI 不再遵循 Plan/Act 模式的约束

---

### 测试用例 6: 直接进入 Act 模式

**输入 (不先执行 /cline-plan):**
```
/cline-act 创建一个 hello world 函数
```

**预期结果:**
- ✅ 进入 Act 模式
- ✅ AI 直接执行任务（因为没有预先的计划）

---

### 测试用例 7: 命令别名

**输入:**
```
/execute
```

**预期结果:**
- ✅ 与 `/cline-act` 效果相同

---

## 日志检查

### 查看插件日志

OpenCode 的日志会显示插件活动。查找以下信息:

```
service: 'opencode-cline-mode'
level: 'info'
message: 'Cline Mode Plugin initialized'
```

```
service: 'opencode-cline-mode'
level: 'info'
message: 'Plan mode activated'
```

```
service: 'opencode-cline-mode'
level: 'info'
message: 'Act mode activated'
```

---

## 常见问题排查

### 问题 1: 命令不生效

**症状:** 输入 `/cline-plan` 后没有反应

**排查步骤:**
1. 检查插件是否已安装:
   ```bash
   ls -la ~/.config/opencode/plugins/opencode-cline-mode
   ```

2. 检查 OpenCode 是否加载了插件:
   - 查看启动日志
   - 或重启 OpenCode

3. 检查 JavaScript 语法:
   ```bash
   node --check /Users/trry/6bt/myproject/opencode-cline-mode/index.js
   ```

### 问题 2: 提示词没有生效

**症状:** AI 的行为不符合 Plan/Act 模式

**排查步骤:**
1. 检查 prompt 文件是否存在:
   ```bash
   ls -lh /Users/trry/6bt/myproject/opencode-cline-mode/prompts/
   ```

2. 检查文件内容是否完整:
   ```bash
   wc -l /Users/trry/6bt/myproject/opencode-cline-mode/prompts/*.md
   ```

3. 检查文件编码:
   ```bash
   file /Users/trry/6bt/myproject/opencode-cline-mode/prompts/*.md
   ```

### 问题 3: 插件加载失败

**症状:** OpenCode 启动时报错

**排查步骤:**
1. 查看错误信息
2. 检查依赖是否安装:
   ```bash
   cd /Users/trry/6bt/myproject/opencode-cline-mode
   npm install
   ```

3. 检查 Node.js 版本:
   ```bash
   node --version
   # 应该 >= 18.0.0
   ```

---

## 性能测试

### 测试插件对性能的影响

1. **启动时间测试:**
   ```bash
   time opencode --version
   ```

2. **内存使用测试:**
   - 启动 OpenCode
   - 使用 Activity Monitor (macOS) 或 `top` 查看内存使用

3. **响应时间测试:**
   - 测量从输入命令到 AI 响应的时间
   - 对比启用/禁用插件的差异

---

## 集成测试

### 与其他插件的兼容性

测试 `opencode-cline-mode` 与其他插件的兼容性:

```bash
# 查看已安装的插件
ls -la ~/.config/opencode/plugins/

# 测试与 oh-my-opencode 的兼容性
# 测试与其他插件的兼容性
```

---

## 自动化测试 (未来)

可以考虑添加自动化测试:

```javascript
// test/plugin.test.js
import { describe, it, expect } from 'vitest';
import ClineModePlugin from '../index.js';

describe('ClineModePlugin', () => {
  it('should initialize correctly', async () => {
    // 测试插件初始化
  });

  it('should handle /cline-plan command', async () => {
    // 测试 plan 命令
  });

  it('should handle /cline-act command', async () => {
    // 测试 act 命令
  });
});
```

---

## 测试清单

完成以下测试后，插件即可认为通过测试:

- [ ] 插件成功加载
- [ ] `/cline-plan` 命令生效
- [ ] Plan 模式不修改代码
- [ ] `/cline-act` 命令生效
- [ ] Act 模式可以修改代码
- [ ] `/execute` 别名生效
- [ ] `/cline-exit` 命令生效
- [ ] 错误处理正常
- [ ] 日志输出正确
- [ ] 与其他插件兼容
- [ ] 性能影响可接受

---

## 反馈

测试过程中发现问题？请提交 Issue:
https://github.com/trry-hub/opencode-cline-mode/issues
