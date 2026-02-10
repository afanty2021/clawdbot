# 浏览器自动化模块 (src/browser/)

[根目录](../../CLAUDE.md) > [src](../CLAUDE.md) > **browser**

## 模块职责

提供基于 Playwright 的浏览器自动化能力，包括 Chrome/Chromium 浏览器控制、CDP（Chrome DevTools Protocol）桥接、页面快照、用户交互操作和文件上传下载。该模块是 AI 代理进行网页操作的核心工具集。

## 目录结构

```
src/browser/
├── routes/              # 工具路由（AI 工具暴露）
│   ├── screenshot.ts    # 截图路由
│   ├── navigate.ts      # 导航路由
│   ├── click.ts         # 点击路由
│   ├── type.ts          # 输入路由
│   └── ...
├── server.ts            # 浏览器服务器入口
├── client.ts            # 浏览器客户端
├── server-context.ts    # 服务器上下文管理
├── chrome.ts            # Chrome 启动和管理
├── chrome.executables.ts  # Chrome 可执行文件查找
├── chrome.profile-decoration.ts  # 配置文件装饰
├── cdp.ts               # CDP 协议实现
├── cdp.helpers.ts       # CDP 辅助函数
├── pw-session.ts        # Playwright 会话管理
├── pw-ai.ts             # Playwright AI 模块
├── pw-tools-core.ts     # Playwright 工具核心
├── pw-tools-core.interactions.ts  # 交互工具
├── pw-tools-core.snapshot.ts      # 快照工具
├── pw-tools-core.state.ts         # 状态工具
├── pw-tools-core.storage.ts       # 存储工具
├── pw-tools-core.downloads.ts     # 下载工具
├── client-actions-core.ts   # 客户端动作核心
├── client-actions-observe.ts  # 观察动作
├── client-actions-state.ts   # 状态动作
├── client-fetch.ts           # 客户端请求
├── extension-relay.ts        # 扩展中继
├── profiles.ts               # 浏览器配置
├── profiles-service.ts       # 配置服务
├── control-service.ts        # 控制服务
├── config.ts                 # 浏览器配置
├── screenshot.ts             # 截图功能
├── target-id.ts              # 目标 ID 管理
├── constants.ts              # 常量定义
└── trash.ts                  # 资源清理
```

## 入口与启动

### 主入口
- **`src/browser/server.ts`** - 浏览器服务器入口
- **`src/browser/client.ts`** - 浏览器客户端入口

### 启动流程
```typescript
import { BrowserServer } from "./browser/server.ts";

const browser = await BrowserServer.create({
  browser: "chromium",
  headless: false,
  profile: "default",
});

await browser.start();
```

### Chrome 启动选项
```typescript
interface BrowserOptions {
  browser: "chromium" | "chrome" | "firefox";
  headless: boolean;
  profile: string;
  extensions?: string[];
  args?: string[];
}
```

## 对外接口

### BrowserServer 接口
```typescript
interface BrowserServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getPage(targetId: string): Promise<Page>;
  takeScreenshot(targetId: string): Promise<string>;
  navigate(targetId: string, url: string): Promise<void>;
  click(targetId: string, selector: string): Promise<void>;
  type(targetId: string, selector: string, text: string): Promise<void>;
}
```

### PlaywrightSession 接口
```typescript
interface PlaywrightSession {
  id: string;
  browser: Browser;
  pages: Map<string, Page>;
  activePage: Page | null;

  newPage(): Promise<Page>;
  closePage(targetId: string): Promise<void>;
  getPage(targetId: string): Page | null;
}
```

### CDP 接口
```typescript
interface CDPConnection {
  sendCommand(method: string, params?: unknown): Promise<unknown>;
  onNotification(callback: (method: string, params: unknown) => void): void;
  close(): Promise<void>;
}
```

## 子模块详解

### 1. 服务器核心 (`server.ts`, `server-context.ts`)

**职责**：浏览器服务器生命周期管理、页面目标管理、上下文隔离

**关键文件**：
- `server.ts` - 服务器入口
- `server-context.ts` - 页面上下文管理

**接口**：
```typescript
class BrowserContext {
  pages: Map<string, Page>;
  async newPage(): Promise<string>;
  async closePage(targetId: string): Promise<void>;
  async getPage(targetId: string): Promise<Page>;
}
```

### 2. Chrome 管理 (`chrome.ts`, `chrome.executables.ts`)

**职责**：Chrome 浏览器实例管理、可执行文件定位、配置文件处理

**关键文件**：
- `chrome.ts` - Chrome 启动和管理
- `chrome.executables.ts` - Chrome 路径查找
- `chrome.profile-decoration.ts` - 配置增强

**功能**：
- 自动检测系统 Chrome 位置
- 支持自定义 Chrome 路径
- 配置文件隔离和管理

### 3. CDP 桥接 (`cdp.ts`, `cdp.helpers.ts`)

**职责**：Chrome DevTools Protocol 通信、DOM 操作、性能监控

**关键文件**：
- `cdp.ts` - CDP 主实现
- `cdp.helpers.ts` - CDP 辅助函数

### 4. Playwright 工具 (`pw-session.ts`, `pw-tools-core.*.ts`)

**职责**：提供 AI 可调用的浏览器操作工具

**关键文件**：
- `pw-session.ts` - Playwright 会话管理
- `pw-tools-core.interactions.ts` - 点击、滚动、拖拽等交互
- `pw-tools-core.snapshot.ts` - 页面快照和元素定位
- `pw-tools-core.state.ts` - 状态检查和等待
- `pw-tools-core.storage.ts` - Cookie 和 Storage 操作
- `pw-tools-core.downloads.ts` - 文件下载管理

### 5. 客户端动作 (`client-actions-*.ts`)

**职责**：响应式客户端动作处理

**关键文件**：
- `client-actions-core.ts` - 核心动作
- `client-actions-observe.ts` - 观察动作
- `client-actions-state.ts` - 状态动作

### 6. 工具路由 (`routes/`)

**职责**：将浏览器工具暴露给 AI 代理调用

**关键文件**：
- `screenshot.ts` - 截图工具
- `navigate.ts` - 导航工具
- `click.ts` - 点击工具
- `type.ts` - 输入工具

## 关键依赖与配置

### 核心依赖
```json
{
  "playwright-core": "1.58.2",
  "ws": "^8.18.0"
}
```

### 配置文件
```typescript
// src/browser/config.ts
interface BrowserConfig {
  defaultBrowser: "chromium" | "chrome" | "firefox";
  headless: boolean;
  profileDir: string;
  extensionsDir: string;
  maxPages: number;
  screenshotDir: string;
}
```

### 环境变量
```bash
BROWSER_PATH          # Chrome 可执行文件路径
PLAYWRIGHT_BROWSERS_PATH  # Playwright 浏览器路径
HEADLESS_MODE         # 默认无头模式
```

## 测试与质量

### 测试文件
- `src/browser/**/*.test.ts` - 单元测试
- `src/browser/**/*.live.test.ts` - 需要真实浏览器的测试

### 测试命令
```bash
pnpm test src/browser
pnpm test src/browser --browser=chromium
```

## 常见问题 (FAQ)

### Q: 如何指定 Chrome 路径？
A: 设置 `BROWSER_PATH` 环境变量或使用 `chrome.executables.ts` 中的配置。

### Q: 如何处理多个页面？
A: 每个页面通过唯一的 `targetId` 标识，使用 `server-context.ts` 进行管理。

### Q: 如何调试 CDP 命令？
A: 启用详细日志模式，或使用 Chrome 的远程调试端口手动检查。

## 相关文件清单

### 核心文件
- `src/browser/server.ts` - 浏览器服务器
- `src/browser/pw-session.ts` - Playwright 会话
- `src/browser/cdp.ts` - CDP 协议

### 工具文件
- `src/browser/pw-tools-core.interactions.ts` - 交互工具
- `src/browser/pw-tools-core.snapshot.ts` - 快照工具
- `src/browser/routes/*.ts` - 工具路由

### 测试文件
- `src/browser/**/*.test.ts` - 单元测试
- `src/browser/**/*.e2e.test.ts` - E2E 测试

## 变更记录

### 2026-02-10 - 创建浏览器模块文档
- ✅ 创建 `src/browser/CLAUDE.md` 文档
- 📋 记录 Playwright 和 CDP 集成
- 🔗 建立工具和路由导航


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 10, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #2188 | 10:20 AM | 🟣 | Created src/browser/CLAUDE.md with comprehensive Playwright/CDP documentation | ~321 |
</claude-mem-context>