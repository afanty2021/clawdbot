# 兼容性包模块 (packages/)

[根目录](../CLAUDE.md) > **packages**

## 模块职责

为旧项目名称提供兼容性垫片，确保从 clawdbot/moltbot 到 openclaw 的平滑迁移。

## 目录结构

```
packages/
├── clawdbot/          # clawdbot 兼容垫片
│   ├── package.json
│   ├── index.js
│   └── bin/
│       └── clawdbot.js
└── moltbot/           # moltbot 兼容垫片
    ├── package.json
    ├── index.js
    └── bin/
        └── moltbot.js
```

## 包详解

### 1. clawdbot (`packages/clawdbot/`)

**职责**: clawdbot 命令的兼容性垫片

**配置**:
```json
{
  "name": "clawdbot",
  "version": "2026.1.27-beta.1",
  "description": "Compatibility shim that forwards to openclaw",
  "bin": {
    "clawdbot": "./bin/clawdbot.js"
  },
  "exports": {
    ".": "./index.js",
    "./cli-entry": "./bin/clawdbot.js"
  },
  "dependencies": {
    "openclaw": "workspace:*"
  }
}
```

**用法**:
```bash
# 使用 clawdbot 命令（等同于 openclaw）
clawdbot gateway
clawdbot agent --message "Hello"
```

**实现**:
- `bin/clawdbot.js` - 转发到 openclaw CLI
- `index.js` - 导出 openclaw 模块

### 2. moltbot (`packages/moltbot/`)

**职责**: moltbot 命令的兼容性垫片

**配置**:
```json
{
  "name": "moltbot",
  "version": "2026.1.27-beta.1",
  "description": "Compatibility shim that forwards to openclaw",
  "bin": {
    "moltbot": "./bin/moltbot.js"
  },
  "exports": {
    ".": "./index.js",
    "./cli-entry": "./bin/moltbot.js"
  },
  "dependencies": {
    "openclaw": "workspace:*"
  }
}
```

**用法**:
```bash
# 使用 moltbot 命令（等同于 openclaw）
moltbot gateway
moltbot agent --message "Hello"
```

**实现**:
- `bin/moltbot.js` - 转发到 openclaw CLI
- `index.js` - 导出 openclaw 模块

## 迁移指南

### 从 clawdbot 迁移

#### 安装变更
```bash
# 旧
npm install -g clawdbot

# 新
npm install -g openclaw
```

#### 命令变更
```bash
# 旧
clawdbot gateway
clawdbot agent --message "Hello"

# 新（但 clawdbot 仍然可用）
openclaw gateway
openclaw agent --message "Hello"
```

#### 配置路径
```bash
# 旧（如果适用）
~/.config/clawdbot/

# 新
~/.config/openclaw/
```

### 从 moltbot 迁移

#### 安装变更
```bash
# 旧
npm install -g moltbot

# 新
npm install -g openclaw
```

#### 命令变更
```bash
# 旧
moltbot gateway
moltbot agent --message "Hello"

# 新（但 moltbot 仍然可用）
openclaw gateway
openclaw agent --message "Hello"
```

## 兼容性策略

### 支持的旧命令
- `clawdbot gateway` → `openclaw gateway`
- `clawdbot agent` → `openclaw agent`
- `clawdbot message` → `openclaw message`
- `moltbot gateway` → `openclaw gateway`
- `moltbot agent` → `openclaw agent`
- `moltbot message` → `openclaw message`

### 弃用计划
1. **当前**: 兼容垫片完全可用
2. **未来**: 可能发出弃用警告
3. **最终**: 移除兼容垫片

## 开发说明

### 添加新的兼容垫片

1. 创建新目录:
```bash
mkdir -p packages/oldname/bin
```

2. 创建 `package.json`:
```json
{
  "name": "oldname",
  "version": "2026.1.27-beta.1",
  "description": "Compatibility shim that forwards to openclaw",
  "bin": {
    "oldname": "./bin/oldname.js"
  },
  "exports": {
    ".": "./index.js",
    "./cli-entry": "./bin/oldname.js"
  },
  "dependencies": {
    "openclaw": "workspace:*"
  }
}
```

3. 创建 `bin/oldname.js`:
```javascript
#!/usr/bin/env node
import { spawn } from 'child_process';

// 转发到 openclaw
const args = process.argv.slice(2);
const result = spawn('openclaw', args, {
  stdio: 'inherit'
});

result.on('exit', (code) => {
  process.exit(code ?? 0);
});
```

4. 更新 `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

## 测试

### 测试兼容垫片
```bash
# 安装
pnpm install --filter clawdbot
pnpm install --filter moltbot

# 测试命令
clawdbot --version
moltbot --version

# 验证转发
clawdbot doctor
moltbot doctor
```

## 相关文件清单

### 核心文件
- `packages/clawdbot/package.json`
- `packages/clawdbot/bin/clawdbot.js`
- `packages/moltbot/package.json`
- `packages/moltbot/bin/moltbot.js`

### 配置文件
- `pnpm-workspace.yaml` - 工作区配置

## 变更记录

### 2026-02-08 - 初始化兼容性包文档
- ✅ 创建 `packages/CLAUDE.md` 文档
- 📋 记录兼容性策略
- 🔗 提供迁移指南
