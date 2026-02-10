#!/bin/bash

# 快速测试 - 只检查插件状态，不启动 OpenCode

echo "🔍 OpenCode Cline Mode 插件快速检查"
echo "===================================="
echo ""

# 1. 检查符号链接
echo "1️⃣  检查插件安装..."
if [ -L ~/.config/opencode/plugins/opencode-cline-mode ]; then
    echo "   ✅ 插件已安装"
    ls -lh ~/.config/opencode/plugins/opencode-cline-mode
else
    echo "   ❌ 插件未安装"
    exit 1
fi

echo ""

# 2. 检查文件
echo "2️⃣  检查必需文件..."
PLUGIN_DIR="/Users/trry/6bt/myproject/opencode-cline-mode"

files=(
    "index.js:插件主文件"
    "package.json:包配置"
    "prompts/plan.md:Plan模式提示词"
    "prompts/act.md:Act模式提示词"
    "README.md:文档"
    "LICENSE:许可证"
)

for item in "${files[@]}"; do
    IFS=':' read -r file desc <<< "$item"
    if [ -f "$PLUGIN_DIR/$file" ]; then
        size=$(ls -lh "$PLUGIN_DIR/$file" | awk '{print $5}')
        echo "   ✅ $desc ($file) - $size"
    else
        echo "   ❌ $desc ($file) 缺失"
    fi
done

echo ""

# 3. 检查语法
echo "3️⃣  检查 JavaScript 语法..."
if node --check "$PLUGIN_DIR/index.js" 2>/dev/null; then
    echo "   ✅ 语法正确"
else
    echo "   ❌ 语法错误"
    node --check "$PLUGIN_DIR/index.js"
    exit 1
fi

echo ""

# 4. 检查依赖
echo "4️⃣  检查依赖..."
if [ -f "$PLUGIN_DIR/package.json" ]; then
    deps=$(grep -A 3 '"dependencies"' "$PLUGIN_DIR/package.json" | grep '@opencode-ai/plugin')
    if [ -n "$deps" ]; then
        echo "   ✅ 依赖配置正确"
        echo "      $deps"
    else
        echo "   ⚠️  未找到 @opencode-ai/plugin 依赖"
    fi
fi

echo ""

# 5. 显示命令列表
echo "5️⃣  可用命令:"
echo "   • /cline-plan  - 进入计划模式"
echo "   • /cline-act   - 进入执行模式"
echo "   • /execute     - 进入执行模式 (别名)"
echo "   • /cline-exit  - 退出 Cline 模式"

echo ""
echo "✅ 插件检查完成！"
echo ""
echo "📚 下一步:"
echo "   1. 阅读测试指南: cat TESTING.md"
echo "   2. 运行完整测试: bash test-plugin.sh"
echo "   3. 或直接启动 OpenCode 测试: opencode"
