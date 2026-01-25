# 钩子系统模块 (Hooks)

[根目录](../../CLAUDE.md) > [src](../) > **hooks**

## 模块职责

钩子系统模块允许在 Clawdbot 的各个生命周期事件中插入自定义逻辑。用户可以编写自己的钩子函数，在消息发送、接收、Agent 运行等事件发生时执行自定义代码。

## 入口与启动

### 主要入口点

- **hooks.ts**: 钩子系统入口
- **internal-hooks.ts**: 内部钩子实现
- **loader.ts**: 钩子加载器
- **install.ts**: 钩子安装
- **config.ts**: 钩子配置

### 内置钩子

```typescript
// src/hooks/bundled/
// boot-md/ - 启动消息钩子
// command-logger/ - 命令日志钩子
// session-memory/ - 会话记忆钩子
// soul-evil/ - 示例钩子
```

## 对外接口

### 钩子注册

```typescript
// src/hooks/hooks.ts
type HookEventType =
  | "agent:before"
  | "agent:after"
  | "message:inbound"
  | "message:outbound"
  | "tool:before"
  | "tool:after"
  | "error"
  | string; // 自定义事件

type HookHandler = (event: HookEvent) => void | Promise<void>;

type HookEvent = {
  type: HookEventType;
  timestamp: number;
  data: Record<string, unknown>;
};

function registerHook(
  eventType: HookEventType,
  handler: HookHandler,
): void;

function unregisterHook(
  eventType: HookEventType,
  handler: HookHandler,
): void;

function clearHooks(eventType?: HookEventType): void;

function getRegisteredHookEventKeys(): HookEventType[];

function triggerHook(event: HookEvent): Promise<void>;

function createHookEvent(params: {
  type: HookEventType;
  data: Record<string, unknown>;
}): HookEvent;
```

### 钩子加载

```typescript
// src/hooks/loader.ts
interface HookLoadResult {
  path: string;
  handler: HookHandler;
  eventType: HookEventType;
}

async function loadHook(params: {
  path: string;
  eventType?: string;
}): Promise<HookLoadResult>;

async function loadHooks(params: {
  hooks: Array<{
    path: string;
    event?: string;
  }>;
  hookDir?: string;
}): Promise<HookLoadResult[]>;
```

### 钩子安装

```typescript
// src/hooks/install.ts
async function installHook(params: {
  name: string;
  template?: string;
  targetDir?: string;
}): Promise<void>;

async function uninstallHook(params: {
  name: string;
  hookDir?: string;
}): Promise<void>;

async function listInstalledHooks(params: {
  hookDir?: string;
}): Promise<string[]>;
```

### Gmail 钩子

```typescript
// src/hooks/gmail.ts
async function watchGmail(params: {
  credentialsPath: string;
  watchOptions?: {
    labelIds?: string[];
    topicName?: string;
  };
}): Promise<void>;

async function setupGmailWatcher(params: {
  credentialsPath: string;
  runtime?: RuntimeEnv;
}): Promise<void>;
```

### 钩子状态

```typescript
// src/hooks/hooks-status.ts
async function getHooksStatus(): Promise<{
  hooks: Array<{
    path: string;
    event: string;
    enabled: boolean;
    lastRun?: number;
  }>;
}>;
```

## 关键依赖与配置

### 钩子配置

```typescript
// src/hooks/config.ts
interface HooksConfig {
  hooks?: Array<{
    path?: string;
    event?: string;
    handler?: string;
    enabled?: boolean;
  }>;
  hooksDir?: string;
}

function resolveHooksConfig(params: {
  config: ClawdbotConfig;
}): HooksConfig;
```

### 钩子目录

```typescript
// src/hooks/bundled-dir.ts
function resolveBundledHooksDir(): string;

function listBundledHooks(): string[];
```

### 工作区钩子

```typescript
// src/hooks/workspace.ts
async function loadWorkspaceHooks(params: {
  workspaceDir?: string;
}): Promise<HookLoadResult[]>;
```

## 数据模型

### 钩子事件

```typescript
interface AgentBeforeEvent {
  type: "agent:before";
  data: {
    agentId: string;
    sessionKey: string;
    input: string;
  };
}

interface AgentAfterEvent {
  type: "agent:after";
  data: {
    agentId: string;
    sessionKey: string;
    input: string;
    output: string;
    duration: number;
  };
}

interface MessageInboundEvent {
  type: "message:inbound";
  data: {
    channel: string;
    from: string;
    text: string;
    attachments?: Array<{ path: string; contentType: string }>;
  };
}

interface MessageOutboundEvent {
  type: "message:outbound";
  data: {
    channel: string;
    to: string;
    text: string;
    attachments?: Array<{ path: string; contentType: string }>;
  };
}

interface ToolBeforeEvent {
  type: "tool:before";
  data: {
    toolName: string;
    params: Record<string, unknown>;
  };
}

interface ToolAfterEvent {
  type: "tool:after";
  data: {
    toolName: string;
    params: Record<string, unknown>;
    result: unknown;
    duration: number;
  };
}

interface ErrorEvent {
  type: "error";
  data: {
    error: Error;
    context?: Record<string, unknown>;
  };
}
```

### 钩子前端

```typescript
// src/hooks/frontmatter.ts
interface HookFrontmatter {
  event?: string;
  enabled?: boolean;
  description?: string;
  version?: string;
  author?: string;
}

function parseHookFrontmatter(content: string): {
  frontmatter: HookFrontmatter;
  code: string;
};
```

## 测试与质量

### 测试文件

- **internal-hooks.test.ts**: 内部钩子测试
- **hooks-install.e2e.test.ts**: 钩子安装 E2E 测试
- **loader.test.ts**: 加载器测试
- **gmail.test.ts**: Gmail 钩子测试
- **gmail-watcher.test.ts**: Gmail 监听器测试
- **gmail-setup-utils.test.ts**: Gmail 设置工具测试
- **soul-evil.test.ts**: 示例钩子测试

### 测试覆盖

当前测试覆盖率约 88%。

## 常见问题 (FAQ)

### Q1: 如何创建自定义钩子？

A: 在 `~/.config/clawdbot/hooks/` 目录创建 `.ts` 或 `.js` 文件，导出钩子函数。

### Q2: 钩子支持哪些事件？

A: `agent:before`, `agent:after`, `message:inbound`, `message:outbound`, `tool:before`, `tool:after`, `error` 等。

### Q3: 如何安装内置钩子？

A: 使用 `clawdbot hooks install <hook-name>`。

### Q4: 钩子可以异步吗？

A: 可以，钩子函数可以是异步的。

### Q5: 如何调试钩子？

A: 在钩子函数中添加 `console.log` 或使用 `--debug` 选项。

### Q6: 钩子执行顺序如何？

A: 按注册顺序执行。先注册的先执行。

### Q7: 钩子可以阻止操作吗？

A: 可以通过抛出错误阻止操作。

### Q8: 如何禁用钩子？

A: 在配置中设置 `enabled: false` 或使用 `clawdbot hooks uninstall`。

## 相关文件清单

- `src/hooks/hooks.ts` - 钩子系统入口
- `src/hooks/internal-hooks.ts` - 内部钩子实现
- `src/hooks/loader.ts` - 钩子加载器
- `src/hooks/install.ts` - 钩子安装
- `src/hooks/config.ts` - 钩子配置
- `src/hooks/bundled-dir.ts` - 内置钩子目录
- `src/hooks/workspace.ts` - 工作区钩子
- `src/hooks/frontmatter.ts` - 钩子前端
- `src/hooks/hooks-status.ts` - 钩子状态
- `src/hooks/installs.ts` - 钩子安装
- `src/hooks/plugin-hooks.ts` - 插件钩子
- `src/hooks/gmail.ts` - Gmail 钩子
- `src/hooks/gmail-ops.ts` - Gmail 操作
- `src/hooks/gmail-watcher.ts` - Gmail 监听器
- `src/hooks/gmail-setup-utils.ts` - Gmail 设置工具
- `src/hooks/soul-evil.ts` - 示例钩子
- `src/hooks/llm-slug-generator.ts` - LLM slug 生成器
- `src/hooks/bundled/**/` - 内置钩子
- `src/hooks/*.test.ts` - 测试文件

## 变更记录

### 2026-01-25

- 创建钩子系统模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
