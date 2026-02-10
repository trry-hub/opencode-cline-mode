#!/bin/bash

echo "🔧 OpenCode Cline Mode - 启动前检查"
echo "===================================="
echo ""

# 1. 检查符号链接
echo "1️⃣  检查插件安装..."
if [ -L ~/.config/opencode/plugins/opencode-cline-mode ]; then
    echo "   ✅ 插件符号链接存在"
else
    echo "   ❌ 插件未安装"
    echo "   运行: ln -s /Users/trry/6bt/myproject/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode"
    exit 1
fi

echo ""

# 2. 检查 opencode.json 配置
echo "2️⃣  检查 opencode.json 配置..."
if grep -q '"opencode-cline-mode"' ~/.config/opencode/opencode.json 2>/dev/null; then
    echo "   ❌ 错误：opencode.json 的 plugin 数组中包含 'opencode-cline-mode'"
    echo "   这会导致 BunInstallFailedError"
    echo ""
    echo "   修复方法："
    echo "   编辑 ~/.config/opencode/opencode.json"
    echo "   从 plugin 数组中移除 'opencode-cline-mode'"
    echo ""
    echo "   当前配置："
    grep -A 5 '"plugin"' ~/.config/opencode/opencode.json | head -10
    exit 1
else
    echo "   ✅ opencode.json 配置正确（plugin 数组中没有 opencode-cline-mode）"
fi

echo ""

# 3. 检查插件文件
echo "3️⃣  检查插件文件..."
PLUGIN_DIR="/Users/trry/6bt/myproject/opencode-cline-mode"
if [ -f "$PLUGIN_DIR/index.js" ]; then
    echo "   ✅ index.js 存在"
else
    echo "   ❌ index.js 缺失"
    exit 1
fi

if [ -f "$PLUGIN_DIR/prompts/plan.md" ] && [ -f "$PLUGIN_DIR/prompts/act.md" ]; then
    echo "   ✅ prompt 文件存在"
else
    echo "   ❌ prompt 文件缺失"
    exit 1
fi

echo ""

# 4. 检查 JavaScript 语法
echo "4️⃣  检查 JavaScript 语法..."
if node --check "$PLUGIN_DIR/index.js" 2>/dev/null; then
    echo "   ✅ 语法正确"
else
    echo "   ❌ 语法错误"
    node --check "$PLUGIN_DIR/index.js"
    exit 1
fi

echo ""

# 5. 测试 OpenCode 版本
echo "5️⃣  测试 OpenCode..."
if opencode --version >/dev/null 2>&1; then
    VERSION=$(opencode --version)
    echo "   ✅ OpenCode 可以运行 (版本: $VERSION)"
else
    echo "   ❌ OpenCode 无法运行"
    exit 1
fi

echo ""
echo "✅ 所有检查通过！可以启动 OpenCode 了"
echo ""
echo "🚀 启动命令:"
echo "   cd /Users/trry/6bt/project/xiaoyaojing-platform/web/pc"
echo "   opencode"
echo ""
echo "📝 测试步骤:"
echo "   1. 启动后按 Tab 键"
echo "   2. 应该只看到 cline-plan 和 cline-act"
echo "   3. 测试 plan 模式不修改代码"
echo "   4. 测试 act 模式可以修改代码"
