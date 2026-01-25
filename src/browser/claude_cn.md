# 浏览器控制模块 (Browser Control)

[根目录](../../CLAUDE.md) > [src](../) > **browser**

## 模块职责

浏览器控制模块提供基于 Playwright 的浏览器自动化功能，支持 Puppeteer 兼容层、CDP (Chrome DevTools Protocol)、浏览器扩展中继、会话管理等。

## 主要功能

### 浏览器服务器 (server.ts)

```typescript
// 浏览器服务器
interface BrowserServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): BrowserServerStatus;
}

async function createBrowserServer(params: {
  config?: BrowserConfig;
}): Promise<BrowserServer>;
```

### 浏览器客户端 (client.ts)

```typescript
// 浏览器客户端
interface BrowserClient {
  getPage(targetId: string): Promise<Page>;
  execute(targetId: string, action: BrowserAction): Promise<unknown>;
  screenshot(targetId: string, options?: ScreenshotOptions): Promise<Buffer>;
}

async function createBrowserClient(params: {
  serverUrl: string;
}): Promise<BrowserClient>;
```

### Playwright 会话 (pw-session.ts)

```typescript
// Playwright 会话管理
interface PWSession {
  getPage(targetId: string): Promise<Page>;
  closePage(targetId: string): Promise<void>;
  listPages(): Promise<PageInfo[]>;
}

async function createPWSession(params: {
  browserType?: "chromium" | "firefox" | "webkit";
  headless?: boolean;
}): Promise<PWSession>;
```

### CDP 工具 (cdp.ts)

```typescript
// Chrome DevTools Protocol 工具
async function createCDPClient(params: {
  browserURL?: string;
  targetId?: string;
}): Promise<CDPSession>;

async function executeCDPCommand(params: {
  client: CDPSession;
  method: string;
  params?: Record<string, unknown>;
}): Promise<unknown>;
```

### 浏览器配置 (config.ts)

```typescript
interface BrowserConfig {
  chromium?: {
    executablePath?: string;
    headless?: boolean;
    args?: string[];
  };
  profiles?: Record<string, {
    path?: string;
    incognito?: boolean;
  }>;
}
```

## 测试与质量

当前测试覆盖率约 87%。

## 常见问题 (FAQ)

### Q1: 如何启动浏览器服务器？

A: 使用 `clawdbot browser serve` 命令。

### Q2: 如何使用浏览器工具？

A: Agent 可以使用 `browser_navigate`, `browser_click`, `browser_screenshot` 等工具。

### Q3: 支持哪些浏览器？

A: Chromium (Chrome/Edge)、Firefox、WebKit (Safari)。

## 相关文件清单

- `src/browser/server.ts`
- `src/browser/client.ts`
- `src/browser/pw-session.ts`
- `src/browser/cdp.ts`
- `src/browser/config.ts`
- `src/browser/profiles.ts`
- `src/browser/extension-relay.ts`
- `src/browser/client-actions.ts`
- `src/browser/pw-tools.ts`
- `src/browser/routes/*.ts`

## 变更记录

### 2026-01-25

- 创建浏览器控制模块文档
