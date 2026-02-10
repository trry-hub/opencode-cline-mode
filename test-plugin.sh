#!/bin/bash

# OpenCode Cline Mode 插件测试脚本
# 使用方法: bash test-plugin.sh

echo "🧪 OpenCode Cline Mode 插件测试"
echo "=================================="
echo ""

# 检查插件是否已安装
echo "📦 检查插件安装状态..."
if [ -L ~/.config/opencode/plugins/opencode-cline-mode ]; then
    echo "✅ 插件已通过符号链接安装"
    ls -lh ~/.config/opencode/plugins/opencode-cline-mode
else
    echo "❌ 插件未安装"
    echo "运行: ln -s /Users/trry/6bt/myproject/opencode-cline-mode ~/.config/opencode/plugins/opencode-cline-mode"
    exit 1
fi

echo ""
echo "📝 插件文件检查..."
PLUGIN_DIR="/Users/trry/6bt/myproject/opencode-cline-mode"

files=("index.js" "package.json" "prompts/plan.md" "prompts/act.md")
for file in "${files[@]}"; do
    if [ -f "$PLUGIN_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
    fi
done

echo ""
echo "🔍 检查 JavaScript 语法..."
node --check "$PLUGIN_DIR/index.js"
if [ $? -eq 0 ]; then
    echo "✅ index.js 语法正确"
else
    echo "❌ index.js 语法错误"
    exit 1
fi

echo ""
echo "📋 创建测试项目..."
TEST_DIR="/tmp/opencode-cline-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 创建一个简单的测试项目
cat > test.js << 'EOF'
// 简单的测试文件
function hello() {
    console.log("Hello, OpenCode!");
}

hello();
EOF

git init > /dev/null 2>&1
git add .
git commit -m "Initial commit" > /dev/null 2>&1

echo "✅ 测试项目已创建: $TEST_DIR"
echo ""

echo "🚀 启动 OpenCode 进行手动测试..."
echo ""
echo "测试步骤:"
echo "=========="
echo ""
echo "1️⃣  测试 Plan 模式:"
echo "   输入: /cline-plan 添加一个计算两数之和的函数"
echo "   预期: AI 进入 Plan 模式，创建详细计划但不修改代码"
echo ""
echo "2️⃣  测试 Act 模式:"
echo "   输入: /cline-act"
echo "   预期: AI 进入 Act 模式，开始执行计划"
echo ""
echo "3️⃣  测试退出:"
echo "   输入: /cline-exit"
echo "   预期: 退出 Cline 模式，恢复正常对话"
echo ""
echo "4️⃣  检查日志:"
echo "   查看 OpenCode 日志中是否有 'opencode-cline-mode' 相关信息"
echo ""
echo "按 Enter 启动 OpenCode..."
read

cd "$TEST_DIR"
opencode

echo ""
echo "🧹 清理测试项目..."
rm -rf "$TEST_DIR"
echo "✅ 测试完成"
