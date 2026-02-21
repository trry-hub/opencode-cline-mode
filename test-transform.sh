#!/bin/bash

echo "🧪 测试消息转换功能"
echo "================================"
echo ""

echo "📝 步骤 1: 启动 OpenCode 并捕获日志"
echo "请在另一个终端运行以下命令："
echo ""
echo "  opencode --agent cline-plan --print-logs --log-level INFO 2>&1 | tee /tmp/opencode-test.log"
echo ""
echo "然后："
echo "1. 在 OpenCode 中输入一个简单的任务，例如："
echo "   '帮我分析一下当前目录的文件结构'"
echo ""
echo "2. 等待 AI 完成响应"
echo ""
echo "3. 按 Ctrl+C 退出 OpenCode"
echo ""
echo "4. 回到这个终端，按回车继续分析日志"
echo ""
read -p "完成后按回车继续..."

echo ""
echo "🔍 分析日志..."
echo ""

LOG_FILE="/tmp/opencode-test.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ 日志文件不存在: $LOG_FILE"
    echo "请确保按照上述步骤运行 OpenCode"
    exit 1
fi

echo "📊 日志统计:"
echo "  总行数: $(wc -l < "$LOG_FILE")"
echo ""

# 检查关键日志
echo "🔍 检查关键日志:"
echo ""

if grep -q "transformMessages called" "$LOG_FILE"; then
    echo "✅ 消息转换被调用"
    grep "transformMessages called" "$LOG_FILE" | tail -1
else
    echo "❌ 消息转换未被调用"
    echo "   这意味着 experimental.chat.messages.transform hook 没有触发"
fi
echo ""

if grep -q "Message.*details" "$LOG_FILE"; then
    echo "✅ 消息详情日志存在"
    echo "   消息数量: $(grep -c "Message.*details" "$LOG_FILE")"
else
    echo "❌ 没有消息详情日志"
fi
echo ""

if grep -q "Added plan completion block" "$LOG_FILE"; then
    echo "✅ 成功添加完成提示块"
    grep "Added plan completion block" "$LOG_FILE" | tail -1
else
    echo "❌ 未添加完成提示块"
    
    if grep -q "SKIPPED.*Did not add completion block" "$LOG_FILE"; then
        echo "   原因: 被跳过"
        grep "SKIPPED.*Did not add completion block" "$LOG_FILE" | tail -1
    fi
fi
echo ""

if grep -q "cline-plan" "$LOG_FILE"; then
    echo "✅ cline-plan agent 被使用"
else
    echo "⚠️  未检测到 cline-plan agent"
fi
echo ""

echo "================================"
echo "📋 完整的 transform 相关日志:"
echo "================================"
grep -i "transform\|completion block\|cline-plan" "$LOG_FILE" | tail -20
echo ""

echo "================================"
echo "💡 建议"
echo "================================"
echo ""

if ! grep -q "transformMessages called" "$LOG_FILE"; then
    echo "❌ 消息转换 hook 未触发"
    echo ""
    echo "可能的原因："
    echo "1. OpenCode 版本不支持 experimental.chat.messages.transform"
    echo "2. 插件的 hook 注册失败"
    echo "3. OpenCode 配置问题"
    echo ""
    echo "建议："
    echo "1. 检查 OpenCode 版本: opencode --version"
    echo "2. 查看完整日志中是否有插件加载错误"
    echo "3. 尝试重新安装插件"
elif ! grep -q "Added plan completion block" "$LOG_FILE"; then
    echo "⚠️  消息转换被调用，但未添加完成提示"
    echo ""
    echo "请检查日志中的 SKIPPED 原因"
    echo "可能是："
    echo "- 当前 agent 不是 cline-plan"
    echo "- 消息 role 不是 assistant"
    echo "- 已经存在完成提示"
else
    echo "✅ 功能正常！"
    echo ""
    echo "如果你在 OpenCode 中没有看到提示，可能是："
    echo "1. UI 渲染问题"
    echo "2. 提示被添加到了错误的位置"
    echo "3. 需要刷新或重启 OpenCode"
fi
echo ""
