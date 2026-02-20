# Signal 适配器 (src/signal/)

[根目录](../CLAUDE.md) > **signal**

## 模块职责

Signal 平台适配器，基于 signal-cli 守护进程。支持端到端加密消息、群组、反应、输入状态、已读回执等功能。

## 目录结构

```
src/signal/
├── monitor/               # 监控器
│   ├── event-handler.ts   # 事件处理器
│   └── mentions.ts        # 提及处理
├── client.ts              # Signal 客户端
├── daemon.ts              # 守护进程管理
├── format.ts              # 消息格式化
├── identity.ts            # 身份验证
├── send.ts                # 消息发送
├── send-reactions.ts      # 反应发送
├── probe.ts               # 连接探测
├── accounts.ts            # 账户管理
├── monitor.ts             # 监控器入口
└── sse-reconnect.ts       # SSE 重连
```

## 核心功能

### 1. Signal 客户端 (`client.ts`)

基于 signal-cli 的 RPC 客户端：

```typescript
// 客户端接口
interface SignalClient {
  sendReaction(phoneNumber, reaction): Promise<void>
  sendMessage(phoneNumber, message): Promise<void>
  getProfile(phoneNumber): Promise<Profile>
  receiveMessages(): AsyncIterable<SignalEvent>
}
```

### 2. 消息格式化 (`format.ts`)

```typescript
// 消息分块
function chunkMessage(message: string, maxSize: number): string[]

// 链接格式化
function formatLinks(text: string): string

// 视觉元素处理
function formatVisualElements(content: any): FormattedContent
```

### 3. 身份验证 (`identity.ts`)

Signal 安全号码验证：

```typescript
// 验证身份
async function verifyIdentity(
  phoneNumber: string,
  safetyNumber: string
): Promise<boolean>
```

### 4. 反应处理 (`send-reactions.ts`)

```typescript
// 发送反应
async function sendSignalReaction(
  phoneNumber: string,
  targetMessage: { timestamp: number },
  emoji: string
): Promise<void>

// 移除反应
async function removeSignalReaction(
  phoneNumber: string,
  targetMessage: { timestamp: number },
  emoji: string
): Promise<void>
```

### 5. 提及处理 (`monitor/mentions.ts`)

```typescript
// 解析提及
function parseMentions(
  text: string,
  members: Member[]
): { text: string; mentions: Mention[] }
```

### 6. SSE 重连 (`sse-reconnect.ts`)

处理 Server-Sent Events 的重连逻辑：

```typescript
// 重连策略
async function reconnectWithBackoff(
  url: string,
  maxRetries: number
): Promise<EventSource>
```

### 7. 事件处理 (`monitor/event-handler.ts`)

```
Signal Event
    ↓
事件类型分发
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│ MESSAGE  │ REACTION │ TYPING   │ RECEIPT  │
└──────────┴──────────┴──────────┴──────────┘
    ↓
消息处理
    ↓
Agent 处理
```

## 对外接口

### 主要导出

```typescript
// 监控器
export { monitorSignalProvider } from "./monitor.js";

// 消息发送
export { sendMessageSignal } from "./send.js";

// 反应操作
export {
  sendSignalReaction,
  removeSignalReaction
} from "./send-reactions.js";
```

## 消息类型映射

| Signal | OpenClaw |
|--------|----------|
| `message` | `InboundMessage` |
| `reaction` | `reaction` |
| `typing` | `typing` |
| `receipt` | `receipt` |
| `attachment` | `media` |

## 配置选项

```typescript
{
  signal: {
    enabled: true,
    phone: "+1234567890",
    signalCliPath: "/path/to/signal-cli",
    features: {
      reactions: true,
      typing: true,
      receipts: true
    }
  }
}
```

## 常见问题 (FAQ)

### Q: 需要安装 signal-cli 吗？
A: 是的，需要安装并运行 signal-cli 守护进程。

### Q: 如何注册 Signal 号码？
A: 使用 `signal-cli register -v <phone>` 命令。

### Q: 支持哪些消息类型？
A: 文本、附件、反应、输入状态、已读回执。

### Q: 如何处理媒体文件？
A: 通过附件消息处理，signal-cli 会自动下载。

## 相关模块

- **`extensions/signal/`** - Signal 扩展插件

## 变更记录

### 2026-02-20 - 创建 Signal 适配器文档
- ✅ 创建 `src/signal/CLAUDE.md` 文档
- 📋 记录核心功能
- 🔗 建立 signal-cli 集成说明
