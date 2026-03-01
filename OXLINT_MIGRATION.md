# Oxlint 迁移指南

## 概述

本项目已从 ESLint 迁移到 oxlint,以获得更好的性能和更简单的配置。

## 变更内容

### 1. 依赖变更

**移除的依赖:**
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint`
- `eslint-config-prettier`
- `typescript-eslint`

**新增的依赖:**
- `oxlint@^0.16.0`

### 2. 配置文件变更

**删除:**
- `eslint.config.js`

**新增:**
- `.oxlintrc.json` - oxlint 配置文件

### 3. 脚本命令变更

```json
{
  "lint": "oxlint src",
  "lint:fix": "oxlint src --fix"
}
```

### 4. 性能对比

- **ESLint**: 约 2-3 秒
- **oxlint**: 约 15ms

**性能提升**: 约 50-100 倍

## 使用方法

### 检查代码
```bash
npm run lint
```

### 自动修复
```bash
npm run lint:fix
```

### 完整验证
```bash
npm run validate
```

## 配置说明

`.oxlintrc.json` 配置文件包含以下规则:

- **correctness**: 警告级别
- **perf**: 警告级别
- **suspicious**: 警告级别
- **style**: 关闭
- **no-unused-vars**: 错误级别,忽略以 `_` 开头的参数
- **no-explicit-any**: 警告级别
- **no-console**: 关闭

## 忽略文件

以下文件和目录被忽略:
- `dist/`
- `node_modules/`
- `tests/`
- `*.config.js`

## 注意事项

1. oxlint 目前不支持所有 ESLint 规则,但对于大多数项目已经足够
2. oxlint 的自动修复功能有限,某些问题需要手动修复
3. oxlint 不支持 TypeScript 类型检查,仍需使用 `tsc --noEmit`

## 迁移建议

对于其他项目,可以参考以下步骤:

1. 安装 oxlint: `npm install -D oxlint`
2. 创建配置文件: `.oxlintrc.json`
3. 更新 package.json 脚本
4. 运行 `npm run lint` 检查代码
5. 手动修复无法自动修复的问题
6. 移除 ESLint 相关依赖

## 参考资源

- [oxlint 官方文档](https://oxlint.rs/)
- [oxlint GitHub](https://github.com/oxc-project/oxc)
- [ESLint 到 oxlint 迁移指南](https://oxlint.rs/docs/guide/usage/linter.html)
