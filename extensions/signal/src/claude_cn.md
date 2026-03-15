# Signal Client 模块

[根目录](../../CLAUDE.md) > [src](../) > **signal**

## 模块职责

Signal Client 模块是 Clawdbot 的核心消息渠道之一，负责通过 Signal CLI 守护进程与 Signal 网络交互。该模块实现了完整的 Signal 消息功能，包括消息监听、发送、反应处理、媒体处理等。

## 入口与启动

### 主要入口点

- **index.ts**: 模块导出中心
  - `monitorSignalProvider`: Signal 监听器提供者
  - `sendMessageSignal`: 发送消息到 Signal
  - `sendReactionSignal`, `removeReactionSignal`: 反应操作

### 启动流程

```typescript
import { monitorSignalProvider } from "./signal/index.js";

// 启动 Signal 监听器
await monitorSignalProvider({
  runtime,
  abortSignal,
  account: "+1234567890",
  accountId: "signal-account-id",
  config: clawdbotConfig,
  autoStart: true,
  receiveMode: "on-start",
  cliPath: "/path/to/signal-cli", // signal-cli 路径
  httpHost: "localhost",
  httpPort: 8080,
});
```

### Signal 守护进程

Signal 模块依赖外部 `signal-cli` 守护进程：

```typescript
// 启动 signal-cli 守护进程
async function spawnSignalDaemon(params: {
  cliPath: string;
  account: string;
  httpHost: string;
  httpPort: number;
  runtime: RuntimeEnv;
}): Promise ChildProcess;

// 通过 HTTP 与 signal-cli 通信
async function signalRpcRequest<T>(method: string, params: unknown, options: {
  baseUrl: string;
  timeout?: number;
}): Promise<T>;
```

### 监听器核心

- **monitor.ts**: Signal 监听器实现
- **monitor/event-handler.ts**: Signal 事件处理器
- **sse-reconnect.ts**: SSE（Server-Sent Events）重连逻辑

## 对外接口

### 消息监听接口

```typescript
interface MonitorSignalOpts {
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  account?: string; // Signal 电话号码
  accountId?: string;
  config?: ClawdbotConfig;
  baseUrl?: string; // signal-cli HTTP API 地址
  autoStart?: boolean;
  receiveMode?: "on-start" | "manual";
  startupTimeoutMs?: number;
  cliPath?: string; // signal-cli 可执行文件路径
  httpHost?: string; // signal-cli HTTP 主机
  httpPort?: number; // signal-cli HTTP 端口
  ignoreAttachments?: boolean; // 忽略附件
  ignoreStories?: boolean; // 忽略动态
  sendReadReceipts?: boolean; // 发送已读回执
  allowFrom?: Array<string | number>; // 允许的发送者
  groupAllowFrom?: Array<string | number>; // 允许的群组
  mediaMaxMb?: number; // 媒体大小限制（MB）
}

function monitorSignalProvider(opts: MonitorSignalOpts): Promise<void>;
```

### 消息发送接口

```typescript
// 发送文本消息
function sendMessageSignal(params: {
  target: string; // 电话号码或群组 ID
  message: string;
  accountId?: string;
  config?: ClawdbotConfig;
  attachments?: Array<{
    filename?: string;
    contentType?: string;
    path: string;
  }>;
}): Promise<{ timestamp: number }>;
```

### 反应操作接口

```typescript
// 发送反应
function sendReactionSignal(params: {
  target: string;
  emoji: string;
  targetAuthor: string; // 原消息作者
  targetSentTimestamp: number; // 原消息时间戳
  remove?: boolean; // 是否删除反应
  accountId?: string;
  config?: ClawdbotConfig;
}): Promise<void>;

// 删除反应（别名）
function removeReactionSignal(params: SendReactionSignalParams): Promise<void>;
```

### 探测接口

```typescript
async function probeSignal(params: {
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  baseUrl?: string;
}): Promise<{ ok: boolean; error?: string }>;
```

## 关键依赖与配置

### Signal CLI 安装

Signal 模块依赖 `signal-cli` 守护进程：

```bash
# macOS
brew install signal-cli

# Linux
# 下载 signal-cli 从 https://github.com/AsamK/signal-cli/releases

# 启动守护进程
signal-cli -a +1234567890 daemon --http 8080
```

### 配置结构

```typescript
interface SignalConfig {
  signal?: {
    accounts?: Record<string, {
      account?: string; // Signal 电话号码
      cliPath?: string; // signal-cli 可执行文件路径
      httpHost?: string; // 默认 "localhost"
      httpPort?: number; // 默认 8080
      config?: {
        allowFrom?: Array<string | number>; // 允许的发送者
        groupAllowFrom?: Array<string | number>; // 允许的群组 ID
        reactionNotifications?: "off" | "own" | "all" | "allowlist"; // 反应通知模式
        sendReadReceipts?: boolean; // 发送已读回执
        ignoreAttachments?: boolean; // 忽略附件
        ignoreStories?: boolean; // 忽略动态
        mediaMaxMb?: number; // 媒体大小限制（MB）
      };
    }>;
  };
}
```

### 反应级别配置

```typescript
// 反应级别控制
type SignalReactionLevel = "full" | "emoji-only" | "none";

function resolveSignalReactionLevel(config?: SignalConfig): SignalReactionLevel;

// "full": 完整反应支持（默认）
// "emoji-only": 只支持 emoji，不包含 Unicode 名称
// "none": 禁用反应
```

### 信号身份处理

Signal 使用 UUID 和电话号码双身份系统：

```typescript
// Signal 发送者解析
function resolveSignalSender(params: {
  sender: string; // UUID 或电话号码
  account?: string; // 当前账户号码
  groupId?: string; // 群组 ID
}): {
  kind: "uuid" | "phone";
  id: string;
  display: string;
} | null;

// 发送者白名单检查
function isSignalSenderAllowed(
  sender: ReturnType<typeof resolveSignalSender>,
  allowlist: string[],
): boolean;
```

### SSE 重连逻辑

Signal 使用 SSE（Server-Sent Events）接收实时消息：

```typescript
// src/signal/sse-reconnect.ts
async function runSignalSseLoop(params: {
  baseUrl: string;
  account: string;
  abortSignal?: AbortSignal;
  onMessage: (data: unknown) => void | Promise<void>;
  onError?: (error: Error) => void;
}): Promise<void>;
```

## 数据模型

### Signal 消息事件

```typescript
interface SignalMessageEvent {
  // 发送者信息
  source: string; // UUID（电话号码需要查询）
  sourceNumber?: string; // 电话号码（如果有）
  sourceName?: string; // 联系人名称

  // 接收者信息
  destinationNumber?: string;

  // 群组信息
  group?: {
    groupId: string;
    groupName?: string;
    groupMembers?: string[]; // 成员 UUID 列表
  };

  // 消息内容
  text?: string;
  attachments?: SignalAttachment[];

  // 消息元数据
  timestamp: number; // 毫秒时间戳
  serverTimestamp?: number;

  // 消息类型
  isStory?: boolean; // 是否为动态

  // 回复信息
  quote?: {
    id: string; // 回复的消息 ID
    author: string; // 原作者 UUID
    text: string; // 原消息文本
  };

  // 反应信息
  reactions?: Array<{
    emoji: string;
    remove: boolean; // true = 删除反应
    targetAuthor: string; // 原作者 UUID
    targetSentTimestamp: number; // 原消息时间戳
  }>;

  // 已读回执
  isReadReceipt?: boolean;
  readTimestamps?: number[];
}

interface SignalAttachment {
  id?: string;
  contentType?: string;
  filename?: string;
  size?: number;
  storedFilename?: string;
}
```

### 反应消息

```typescript
interface SignalReactionMessage {
  emoji?: string | null;
  targetAuthor?: string | null; // 原作者 UUID
  targetAuthorUuid?: string | null; // 原作者 UUID（别名）
  targetSentTimestamp?: number | null;
  isRemove?: boolean | null;
  groupInfo?: {
    groupId?: string | null;
    groupName?: string | null;
  } | null;
}
```

### 附件处理

```typescript
// 下载 Signal 附件
async function fetchSignalAttachment(params: {
  baseUrl: string;
  account?: string;
  attachment: SignalAttachment;
  sender?: string;
  groupId?: string;
  maxBytes: number;
}): Promise<{ path: string; contentType?: string } | null>;
```

### 身份信息

```typescript
// Signal 联系人查询
async function signalCheck(params: {
  baseUrl: string;
  account?: string;
  timeout?: number;
}): Promise<{ ok: boolean; error?: string }>;

// 获取联系人信息
async function getSignalContact(params: {
  baseUrl: string;
  account?: string;
  recipient: string; // UUID 或电话号码
}): Promise<{
  number?: string;
  uuid?: string;
  name?: string;
  profileName?: string;
} | null>;
```

## 测试与质量

### 测试文件

- **monitor.test.ts**: Signal 监听器测试
- **monitor.event-handler.sender-prefix.test.ts**: 发送者前缀测试
- **monitor.event-handler.typing-read-receipts.test.ts**: 输入和已读回执测试
- **monitor.event-handler.inbound-contract.test.ts**: 入站合约测试
- **monitor.tool-result.pairs-uuid-only-senders-uuid-allowlist-entry.test.ts**: UUID 白名单测试
- **probe.test.ts**: 连接探测测试
- **daemon.test.ts**: 守护进程测试
- **send-reactions.test.ts**: 反应发送测试

### 测试覆盖

当前测试覆盖率约 88%。

### 运行测试

```bash
# Signal 模块测试
pnpm test src/signal

# 特定测试
pnpm test src/signal/monitor.test.ts

# 实时测试（需要 signal-cli 和真实账户）
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/signal
```

### 测试辅助

```typescript
// src/signal/test-helpers.ts (如果存在)
// 提供测试用的 mock 对象和辅助函数
```

## 常见问题 (FAQ)

### Q1: Signal 模块如何安装和配置？

A:
1. 安装 `signal-cli`（macOS: `brew install signal-cli`）
2. 注册 Signal 账户: `signal-cli -a +1234567890 register`
3. 验证: `signal-cli -a +1234567890 verify CODE`
4. 启动守护进程: `signal-cli -a +1234567890 daemon --http 8080`
5. 在 Clawdbot 配置中添加账户

### Q2: Signal 消息长度限制是多少？

A: Signal 消息最大长度为 4000 字符。超过此限制会自动分块发送。

### Q3: Signal 群组支持如何？

A: Signal 模块完全支持群组消息，包括群组白名单、群组上下文等。

### Q4: Signal 附件大小限制是多少？

A: 默认限制 100MB，可通过 `mediaMaxMb` 配置调整。

### Q5: Signal 反应支持如何？

A: Signal 支持完整的 emoji 反应功能，包括添加和删除反应。

### Q6: Signal UUID 和电话号码有什么区别？

A:
- **UUID**: Signal 的唯一标识符，永久不变
- **电话号码**: 用户注册时使用的号码，可以更改

Signal 优先使用 UUID，电话号码用于显示和查询。

### Q7: 如何处理 Signal 已读回执？

A: 通过 `sendReadReceipts` 配置控制。默认不发送已读回执。

### Q8: Signal 动态（Stories）支持吗？

A: Signal 模块可以接收动态，但默认忽略（`ignoreStories: true`）。

### Q9: 如何调试 Signal 连接问题？

A:
1. 检查 signal-cli 守护进程是否运行: `ps aux | grep signal-cli`
2. 测试 HTTP API: `curl http://localhost:8080/v1/about`
3. 使用 `clawdbot channels status --probe` 探测连接
4. 查看 signal-cli 日志

### Q10: Signal 支持哪些功能？

A:
- 文本消息
- 群组消息
- 附件（图片、视频、文件）
- 反应
- 回复消息
- 已读回执
- 输入指示器（typing indicators）

## 相关文件清单

### 核心文件

- `src/signal/index.ts` - 模块导出
- `src/signal/accounts.ts` - 账户管理
- `src/signal/client.ts` - Signal CLI 客户端
- `src/signal/daemon.ts` - 守护进程管理
- `src/signal/identity.ts` - 身份处理
- `src/signal/format.ts` - 格式化
- `src/signal/reaction-level.ts` - 反应级别

### 监听器

- `src/signal/monitor.ts` - 监听器实现
- `src/signal/monitor/event-handler.ts` - 事件处理器
- `src/signal/monitor/event-handler.types.ts` - 事件类型定义

### 发送

- `src/signal/send.ts` - 发送接口
- `src/signal/send-reactions.ts` - 反应发送

### 连接

- `src/signal/sse-reconnect.ts` - SSE 重连逻辑
- `src/signal/probe.ts` - 连接探测

### 测试

- `src/signal/**/*.test.ts` - 单元测试

## 变更记录

### 2026-01-25

- 创建 Signal Client 模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
- 记录 signal-cli 依赖和安装步骤
