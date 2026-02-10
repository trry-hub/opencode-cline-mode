#!/bin/bash

# OpenCode Cline Mode 插件实际测试脚本

echo "🧪 OpenCode Cline Mode 实际测试"
echo "================================"
echo ""

# 检查配置
echo "1️⃣  检查 opencode.json 配置..."
if grep -q '"opencode-cline-mode"' ~/.config/opencode/opencode.json 2>/dev/null; then
    echo "   ⚠️  警告: opencode.json 中包含 'opencode-cline-mode'"
    echo "   这会导致 BunInstallFailedError"
    echo "   请运行: 从 plugin 数组中移除它"
    exit 1
else
    echo "   ✅ 配置正确（plugin 数组中没有 opencode-cline-mode）"
fi

echo ""

# 检查符号链接
echo "2️⃣  检查插件符号链接..."
if [ -L ~/.config/opencode/plugins/opencode-cline-mode ]; then
    echo "   ✅ 符号链接存在"
    ls -lh ~/.config/opencode/plugins/opencode-cline-mode
else
    echo "   ❌ 符号链接不存在"
    exit 1
fi

echo ""

# 检查 OpenCode 版本
echo "3️⃣  检查 OpenCode 版本..."
version=$(opencode --version 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ OpenCode 版本: $version"
else
    echo "   ❌ OpenCode 无法运行"
    exit 1
fi

echo ""

# 创建临时测试目录
echo "4️⃣  创建测试环境..."
TEST_DIR="/tmp/opencode-cline-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 初始化 git
git init > /dev/null 2>&1
echo "console.log('test')" > index.js
git add .
git commit -m "init" > /dev/null 2>&1

echo "   ✅ 测试目录: $TEST_DIR"

echo ""
echo "================================"
echo "✅ 准备工作完成！"
echo ""
echo "📋 现在请手动测试:"
echo ""
echo "1. 在新终端中运行:"
echo "   cd $TEST_DIR"
echo "   opencode"
echo ""
echo "2. OpenCode 启动后，按 Tab 键"
echo ""
echo "3. 验证只看到以下 agents:"
echo "   • cline-plan"
echo "   • cline-act"
echo ""
echo "4. 测试 cline-plan (默认):"
echo "   输入: 创建一个 hello.js 文件"
echo "   预期: AI 创建计划但不创建文件"
echo ""
echo "5. 切换到 cline-act (按 Tab):"
echo "   输入: 创建一个 hello.js 文件"
echo "   预期: AI 实际创建文件"
echo ""
echo "6. 测试完成后，清理:"
echo "   rm -rf $TEST_DIR"
echo ""
echo "================================"
