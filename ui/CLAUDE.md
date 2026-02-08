# Web UI 模块 (ui/)

[根目录](../CLAUDE.md) > **ui**

## 模块职责

基于 Web 的控制界面和 WebChat，提供用户与 OpenClaw 系统的交互界面。

## 目录结构

```
ui/
├── src/
│   ├── main.ts              # 应用入口
│   ├── styles/              # 样式文件
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── chat.css
│   │   └── config.css
│   └── ui/                  # UI 组件和控制器
│       ├── navigation.ts            # 导航系统
│       ├── markdown.ts              # Markdown 渲染
│       ├── theme.ts                 # 主题管理
│       ├── icons.ts                 # 图标定义
│       ├── format.ts                # 格式化工具
│       ├── gateway.ts               # 网关连接
│       ├── storage.ts               # 本地存储
│       ├── device-auth.ts           # 设备认证
│       ├── device-identity.ts       # 设备身份
│       ├── assistant-identity.ts    # 助手身份
│       ├── app-events.ts            # 应用事件
│       ├── app-gateway.ts           # 网关应用
│       ├── app-settings.ts          # 设置应用
│       ├── app-channels.ts          # 渠道应用
│       ├── app-polling.ts           # 轮询应用
│       ├── app-tool-stream.ts       # 工具流应用
│       ├── controllers/             # 控制器
│       │   ├── chat.ts              # 聊天控制器
│       │   ├── config.ts            # 配置控制器
│       │   ├── sessions.ts          # 会话控制器
│       │   ├── agents.ts            # 代理控制器
│       │   ├── channels.ts          # 渠道控制器
│       │   ├── devices.ts           # 设备控制器
│       │   ├── logs.ts              # 日志控制器
│       │   ├── skills.ts            # 技能控制器
│       │   ├── nodes.ts             # 节点控制器
│       │   └── ...
│       ├── views/                   # 视图组件
│       │   ├── agents.ts
│       │   ├── channels.config.ts
│       │   ├── channels.discord.ts
│       │   └── ...
│       ├── chat/                    # 聊天相关
│       │   ├── message-normalizer.ts
│       │   ├── message-extract.ts
│       │   ├── grouped-render.ts
│       │   ├── tool-cards.ts
│       │   └── tool-helpers.ts
│       └── types.ts                 # 类型定义
├── public/                 # 静态资源
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── ...
├── index.html              # HTML 入口
└── package.json            # 包配置
```

## 入口与启动

### 应用入口
- **`ui/src/main.ts`** - 应用主入口点

### 构建配置
- **`ui/vite.config.ts`** - Vite 构建配置
- **`ui/vitest.config.ts`** - Vitest 测试配置

### 启动命令
```bash
# 开发模式
pnpm ui:dev

# 构建
pnpm ui:build

# 测试
pnpm test:ui
```

## 对外接口

### UI 控制器接口
```typescript
interface UIController {
  init(): Promise<void>;
  destroy(): void;
}
```

### 导航接口
```typescript
interface Navigation {
  navigate(path: string): void;
  currentPath(): string;
}
```

### 网关连接接口
```typescript
interface GatewayConnection {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: GatewayMessage): void;
  onMessage(handler: (message: GatewayMessage) => void): void;
}
```

## 关键依赖与配置

### 核心依赖
```json
{
  "lit": "^3.3.2",
  "marked": "^17.0.1",
  "dompurify": "^3.3.1",
  "@noble/ed25519": "3.0.0"
}
```

### 开发依赖
```json
{
  "vite": "7.3.1",
  "vitest": "4.0.18",
  "playwright": "^1.58.2",
  "@vitest/browser-playwright": "4.0.18"
}
```

### 样式系统
- **基础样式**: `src/styles/base.css`
- **布局样式**: `src/styles/layout.css`
- **聊天样式**: `src/styles/chat/*.css`
- **移动样式**: `src/styles/layout.mobile.css`

## 子模块详解

### 1. 导航系统 (`ui/src/ui/navigation.ts`)
**职责**：应用路由和导航管理
**特点**：
- 基于哈希的路由
- 自动滚动到聊天最新消息
- 历史记录管理

### 2. 聊天控制器 (`ui/src/ui/controllers/chat.ts`)
**职责**：聊天界面和消息管理
**特点**：
- 实时消息流
- 消息分组
- 工具卡片显示
- Markdown 渲染

### 3. 配置控制器 (`ui/src/ui/controllers/config.ts`)
**职责**：配置表单和验证
**特点**：
- 动态表单生成
- Zod schema 验证
- 配置预览

### 4. 会话控制器 (`ui/src/ui/controllers/sessions.ts`)
**职责**：会话管理
**特点**：
- 会话列表
- 会话切换
- 转录查看

### 5. 代理控制器 (`ui/src/ui/controllers/agents.ts`)
**职责**：AI 代理管理
**特点**：
- 代理列表
- 代理配置
- 技能管理

### 6. 渠道控制器 (`ui/src/ui/controllers/channels.ts`)
**职责**：通信渠道管理
**特点**：
- 渠道列表
- 渠道配置
- 连接状态

### 7. Markdown 渲染 (`ui/src/ui/markdown.ts`)
**职责**：Markdown 到 HTML 转换
**特点**：
- 安全渲染（DOMPurify）
- 代码高亮
- 链接处理

### 8. 主题管理 (`ui/src/ui/theme.ts`)
**职责**：主题切换和管理
**特点**：
- 亮色/暗色主题
- 系统主题跟随
- 主题过渡动画

### 9. 聊天组件 (`ui/src/ui/chat/`)
**职责**：聊天界面组件
**组件**：
- 消息标准化
- 消息提取
- 分组渲染
- 工具卡片

## 测试与质量

### 测试框架
- **Vitest** - 单元测试
- **Playwright** - 浏览器测试

### 测试文件
- `ui/src/ui/**/*.test.ts` - 单元测试
- `ui/src/ui/**/*.browser.test.ts` - 浏览器测试
- `ui/playwright-report/` - 测试报告

### 覆盖率目标
- **行覆盖率**: 75%
- **函数覆盖率**: 75%
- **分支覆盖率**: 75%
- **语句覆盖率**: 75%

## 常见问题 (FAQ)

### Q: 如何添加新的视图？
A: 在 `ui/src/ui/views/` 创建新视图，并在导航系统中注册。

### Q: 如何自定义主题？
A: 修改 `ui/src/ui/theme.ts` 或通过设置界面切换。

### Q: 如何调试连接问题？
A: 检查 `ui/src/ui/gateway.ts` 中的连接日志。

### Q: 如何添加新的控制器？
A: 在 `ui/src/ui/controllers/` 创建新控制器，实现 `UIController` 接口。

## 相关文件清单

### 核心文件
- `ui/src/main.ts` - 应用入口
- `ui/src/ui/navigation.ts` - 导航系统
- `ui/src/ui/gateway.ts` - 网关连接
- `ui/src/ui/controllers/chat.ts` - 聊天控制器
- `ui/src/ui/theme.ts` - 主题管理

### 样式文件
- `ui/src/styles/base.css`
- `ui/src/styles/layout.css`
- `ui/src/styles/chat/*.css`

### 测试文件
- `ui/src/ui/**/*.test.ts`
- `ui/src/ui/**/*.browser.test.ts`

### 配置文件
- `ui/package.json` - 包配置
- `ui/vite.config.ts` - Vite 配置
- `ui/vitest.config.ts` - Vitest 配置

## 变更记录

### 2026-02-08 - 初始化 Web UI 文档
- ✅ 创建 `ui/CLAUDE.md` 文档
- 📋 记录核心组件和控制器
- 🔗 建立导航结构
