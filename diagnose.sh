#!/bin/bash

echo "🔍 OpenCode Cline Mode 诊断工具"
echo "================================"
echo ""

# 检查 1: 构建状态
echo "📦 检查 1: 构建状态"
if [ -d "dist" ]; then
    echo "✅ dist 目录存在"
    if [ -f "dist/message-transformer.js" ]; then
        echo "✅ message-transformer.js 已编译"
        echo "   最后修改时间: $(stat -f "%Sm" dist/message-transformer.js 2>/dev/null || stat -c "%y" dist/message-transformer.js 2>/dev/null)"
    else
        echo "❌ message-transformer.js 未找到"
    fi
    
    if [ -f "dist/index.js" ]; then
        echo "✅ index.js 已编译"
    else
        echo "❌ index.js 未找到"
    fi
else
    echo "❌ dist 目录不存在 - 需要运行 npm run build"
fi
echo ""

# 检查 2: 配置文件
echo "⚙️  检查 2: 配置文件"
CONFIG_FILE="$HOME/.config/opencode/opencode-cline-mode.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ 配置文件存在: $CONFIG_FILE"
    echo "   内容:"
    cat "$CONFIG_FILE" | sed 's/^/   /'
    
    # 检查关键配置
    if grep -q '"enable_execute_command".*true' "$CONFIG_FILE"; then
        echo "✅ enable_execute_command: true"
    else
        echo "⚠️  enable_execute_command 未设置为 true"
    fi
    
    if grep -q '"prompt_source".*"github"' "$CONFIG_FILE"; then
        echo "✅ prompt_source: github"
    elif grep -q '"prompt_source".*"local"' "$CONFIG_FILE"; then
        echo "ℹ️  prompt_source: local"
    fi
else
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    echo "   将使用默认配置"
fi
echo ""

# 检查 3: 工具文件
echo "🔧 检查 3: 工具文件"
TOOL_FILE=".opencode/tools/start-act.ts"
if [ -f "$TOOL_FILE" ]; then
    echo "✅ start-act.ts 存在"
else
    echo "❌ start-act.ts 不存在"
fi
echo ""

# 检查 4: 插件安装
echo "📍 检查 4: 插件安装"
if [ -d "$HOME/.config/opencode/plugins/opencode-cline-mode" ]; then
    echo "✅ 插件已通过 symlink 安装"
    ls -la "$HOME/.config/opencode/plugins/opencode-cline-mode" | head -1
elif npm list -g opencode-cline-mode 2>/dev/null | grep -q opencode-cline-mode; then
    echo "✅ 插件已全局安装"
    npm list -g opencode-cline-mode
else
    echo "⚠️  插件可能未安装"
fi
echo ""

# 检查 5: OpenCode 配置
echo "🔧 检查 5: OpenCode 主配置"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
if [ -f "$OPENCODE_CONFIG" ]; then
    echo "✅ OpenCode 配置存在"
    if grep -q "opencode-cline-mode" "$OPENCODE_CONFIG"; then
        echo "✅ 插件已在配置中注册"
    else
        echo "⚠️  插件未在 opencode.json 中注册"
    fi
else
    echo "ℹ️  OpenCode 配置文件不存在（可能使用默认配置）"
fi
echo ""

# 检查 6: 缓存
echo "💾 检查 6: 缓存状态"
CACHE_DIR="$HOME/.config/opencode/.cline-cache"
if [ -d "$CACHE_DIR" ]; then
    echo "✅ 缓存目录存在"
    CACHE_COUNT=$(ls -1 "$CACHE_DIR" 2>/dev/null | wc -l)
    echo "   缓存文件数: $CACHE_COUNT"
    if [ $CACHE_COUNT -gt 0 ]; then
        echo "   最新缓存:"
        ls -lt "$CACHE_DIR" | head -3 | tail -2 | sed 's/^/   /'
    fi
else
    echo "ℹ️  缓存目录不存在（首次运行时会创建）"
fi
echo ""

# 检查 7: 源代码修改
echo "📝 检查 7: 关键代码修改"
if grep -q "shouldAddCompletionBlock" src/message-transformer.ts; then
    echo "✅ message-transformer.ts 包含最新修复"
else
    echo "❌ message-transformer.ts 可能未包含最新修复"
fi

if grep -q "🔍 transformMessages called" src/message-transformer.ts; then
    echo "✅ 包含增强的日志输出"
else
    echo "⚠️  可能缺少增强的日志输出"
fi
echo ""

# 总结
echo "================================"
echo "📊 诊断总结"
echo "================================"
echo ""

ISSUES=0

if [ ! -d "dist" ] || [ ! -f "dist/message-transformer.js" ]; then
    echo "❌ 需要重新构建: npm run build"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  建议创建配置文件"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "$TOOL_FILE" ]; then
    echo "❌ 工具文件缺失"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ 所有检查通过！"
    echo ""
    echo "如果仍然没有看到 /start-act 提示，请："
    echo "1. 重启 OpenCode"
    echo "2. 运行: opencode --agent cline-plan --print-logs --log-level INFO"
    echo "3. 查看日志中是否有 'transformMessages called' 和 'Added plan completion block'"
else
    echo "⚠️  发现 $ISSUES 个问题需要修复"
    echo ""
    echo "建议执行:"
    echo "1. npm run build"
    echo "2. 重启 OpenCode"
fi
echo ""
