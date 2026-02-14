# 诊断指南：为什么规划完成后没有切换提示

## 问题现象

- Plan mode 完成后，应该显示：
  ```
  ✅ **Quick Execute**: Type `/execute-plan` or press `Tab` to switch to `cline-act`
  ```
- 但实际上什么都没显示

## 可能原因

### 1. Transform Hook 未触发

**检查方法**：
```bash
# 查看 OpenCode 日志
opencode --log-level debug

# 查找日志中的 "Transform messages called"
```

**期望输出**：
```
[DEBUG] Transform messages called: {
  messageCount: 5,
  lastAgent: 'cline-plan',
  willModify: true
}
```

**如果没有**：说明 hook 没有被注册或调用

### 2. 消息结构不匹配

**检查方法**：
```bash
# 在日志中查找
grep "Message structure" <opencode-log>
```

**期望输出**：
```
[DEBUG] Last message: {
  role: 'assistant',
  agent: 'cline-plan',
  parts: [ [object], [object] ]
}
```

**如果 parts 不存在或不是数组**：说明 OpenCode 版本不兼容

### 3. Plan 消息已被修改

**检查方法**：
```bash
grep "hasReminder" <opencode-log>
```

**如果显示 true**：说明已经有提示了，不应该重复添加

### 4. 插件未正确加载

**检查方法**：
```bash
# 查找插件加载日志
grep "Cline Mode Plugin" <opencode-log>
```

**期望输出**：
```
[INFO] Cline Mode Plugin initialized
[INFO] Plugin config loaded: { enable_execute_command: true }
```

## 验证步骤

1. **确认插件已构建**
   ```bash
   ls -la dist/
   ```

2. **确认插件已安装**
   ```bash
   # 方法1：符号链接
   ls -la ~/.config/opencode/plugins/ | grep cline
   
   # 方法2：npm 链接
   npm list -g | grep cline
   ```

3. **重启 OpenCode**
   ```bash
   # 完全退出
   killall opencode
   
   # 重新启动
   opencode
   ```

4. **创建测试会话**
   ```
   在 cline-plan agent 中输入：
   "创建一个测试文件 test.txt，内容是 hello"
   
   等待规划完成
   ```

5. **检查日志**
   ```bash
   # 查看实时日志
   tail -f ~/.opencode/logs/opencode.log | grep -i "transform\|cline"
   ```

## 解决方案

### 如果 Hook 未触发

1. 检查 OpenCode 版本
   ```bash
   opencode --version
   # 需要 >= 1.1.53
   ```

2. 检查实验性 API 是否启用
   ```json
   // ~/.opencode/opencode.json
   {
     "experimental": {
       "chat": {
         "messages": {
           "transform": true
         }
       }
     }
   }
   ```

### 如果消息结构不匹配

1. 打印实际结构
   ```typescript
   // 在 message-transformer.ts:31 添加
   await logger.debug('Actual message structure', {
     type: typeof lastMessage,
     hasInfo: !!lastMessage?.info,
     infoKeys: lastMessage?.info ? Object.keys(lastMessage.info) : [],
     partsType: Array.isArray(lastMessage?.parts),
     partsLength: lastMessage?.parts?.length
   });
   ```

2. 适配不同版本
   ```typescript
   // 兼容处理
   const agent = lastMessage.info?.agent || 
                (lastMessage as any).agent ||
                'unknown';
   ```

### 如果提示被注入但不显示

可能是 OpenCode UI 渲染问题：

1. 尝试不同的注入位置
   ```typescript
   // 不使用 unshift，改用 push
   lastMessage.parts.push(planInjection);
   ```

2. 使用纯文本格式
   ```typescript
   // 避免 markdown 复杂性
   text: `\n📋 Plan Complete!\n\nType /execute-plan to continue\n`
   ```

## 获取帮助

如果以上都无法解决：

1. **收集日志**
   ```bash
   # 导出完整日志
   opencode --log-level debug > debug.log 2>&1
   ```

2. **创建最小复现**
   ```bash
   # 创建空项目测试
   mkdir /tmp/test-opencode-cline
   cd /tmp/test-opencode-cline
   opencode
   ```

3. **提交 Issue**
   - 包含：OpenCode 版本、插件版本、日志文件
   - 检查：https://github.com/anomalyco/opencode/issues
   - 检查：https://github.com/trry-hub/opencode-cline-mode/issues