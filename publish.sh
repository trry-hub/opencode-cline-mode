#!/bin/bash

# OpenCode Cline Mode - NPM 发布脚本
# 使用方法: ./publish.sh [patch|minor|major]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否登录 NPM
print_info "检查 NPM 登录状态..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "未登录 NPM，请先运行: npm login"
    exit 1
fi
print_success "已登录为: $(npm whoami)"

# 检查工作目录是否干净
print_info "检查 Git 工作目录..."
if [[ -n $(git status -s) ]]; then
    print_warning "工作目录有未提交的更改"
    git status -s
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "发布已取消"
        exit 1
    fi
fi

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "当前版本: $CURRENT_VERSION"

# 确定版本更新类型
VERSION_TYPE=${1:-patch}
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "无效的版本类型: $VERSION_TYPE"
    echo "使用方法: ./publish.sh [patch|minor|major]"
    exit 1
fi

# 更新版本号
print_info "更新版本号 ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
print_success "新版本: $NEW_VERSION"

# 构建项目
print_info "构建项目..."
npm run build
print_success "构建完成"

# 显示将要发布的文件
print_info "将要发布的文件:"
npm pack --dry-run 2>&1 | grep -E "^\s+\d+\.\d+\s+[kB]+\s+" || true

# 确认发布
echo ""
print_warning "准备发布 opencode-cline-mode@$NEW_VERSION 到 NPM"
read -p "请输入 OTP 验证码 (6位数字): " OTP

if [[ ! "$OTP" =~ ^[0-9]{6}$ ]]; then
    print_error "无效的 OTP 验证码"
    # 恢复版本号
    git checkout package.json package-lock.json 2>/dev/null || true
    exit 1
fi

# 发布到 NPM
print_info "正在发布到 NPM..."
if npm publish --access public --otp=$OTP; then
    print_success "发布成功! 🎉"
    
    # 提交版本更新
    print_info "提交版本更新到 Git..."
    git add package.json package-lock.json
    git commit -m "chore: bump version to $NEW_VERSION"
    git tag "v$NEW_VERSION"
    
    print_success "已创建 Git 标签: v$NEW_VERSION"
    
    # 询问是否推送
    read -p "是否推送到远程仓库? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main
        git push origin "v$NEW_VERSION"
        print_success "已推送到远程仓库"
    fi
    
    echo ""
    print_success "发布完成!"
    echo ""
    echo "📦 包信息:"
    echo "   名称: opencode-cline-mode"
    echo "   版本: $NEW_VERSION"
    echo "   链接: https://www.npmjs.com/package/opencode-cline-mode"
    echo ""
    echo "🚀 用户可以通过以下命令安装:"
    echo "   npm install -g opencode-cline-mode"
    
else
    print_error "发布失败"
    # 恢复版本号
    print_info "恢复版本号..."
    git checkout package.json package-lock.json 2>/dev/null || true
    exit 1
fi
