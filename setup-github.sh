#!/bin/bash

# GitHub 仓库创建和推送脚本
# 使用方法: bash setup-github.sh

echo "🚀 OpenCode Cline Mode - GitHub 仓库设置"
echo "=========================================="
echo ""

# 检查是否已经有 remote
if git remote get-url origin &> /dev/null; then
    echo "✅ Git remote 'origin' 已存在"
    git remote -v
else
    echo "📝 请先在 GitHub 创建仓库，然后运行以下命令："
    echo ""
    echo "方式 1: 使用 HTTPS (推荐)"
    echo "git remote add origin https://github.com/trry/opencode-cline-mode.git"
    echo ""
    echo "方式 2: 使用 SSH"
    echo "git remote add origin git@github.com:trry/opencode-cline-mode.git"
    echo ""
    read -p "是否已经创建了 GitHub 仓库并添加了 remote? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 请先创建 GitHub 仓库"
        exit 1
    fi
fi

echo ""
echo "📤 准备推送代码到 GitHub..."
echo ""

# 确保在 main 分支
git branch -M main

# 推送代码
echo "正在推送..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功！代码已推送到 GitHub"
    echo ""
    echo "📦 下一步:"
    echo "1. 访问你的仓库: https://github.com/trry/opencode-cline-mode"
    echo "2. 发布到 npm: npm publish"
    echo "3. 提交到 OpenCode 生态: https://github.com/anomalyco/opencode"
else
    echo ""
    echo "❌ 推送失败，请检查:"
    echo "1. GitHub 仓库是否已创建"
    echo "2. Git remote 是否正确配置"
    echo "3. 是否有推送权限"
fi
