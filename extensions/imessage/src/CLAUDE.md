# iMessage 适配器 (src/imessage/)

[根目录](../CLAUDE.md) > **imessage**

## 模块职责

Apple iMessage 平台适配器，通过 App Server 实现。支持消息收发、效果、群组、输入状态等功能。

## 目录结构

```
src/imessage/
├── monitor/               # 监控器
│   ├── inbound-processing.ts  # 入站处理
│   ├── deliver.ts              # 消息传递
│   ├── abort-handler.ts        # 中止处理
│   ├── runtime.ts              # 运行时
│   └── types.ts                # 类型定义
├── client.ts              # 客户端
├── send.ts                # 消息发送
├── targets.ts             # 目标解析
├── probe.ts               # 连接探测
├── accounts.ts            # 账户管理
├── constants.ts           # 常量定义
└── monitor.ts             # 监控器入口
```

## 核心功能

### 1. App Server 集成 (`client.ts`)

与 macOS App Server 通信：

```typescript
// App 客户端接口
interface AppClient {
  sendMessage(target: string, message: Message): Promise<void>
  observeMessages(): AsyncObservable<Message>
  observeEffects(): AsyncObservable<Effect>
}
```

### 2. 消息发送 (`send.ts`)

```typescript
// 发送消息
async function sendMessageiMessage(
  target: OutboundTarget,
  message: OutboundMessage
): Promise<SendResult>

// 支持的效果
type Effect =
  | "shake"
  | "boom"
  | "confetti"
  | "love"
  | "lasers"
  | "fireworks"
  | "shimmer"
```

### 3. 目标解析 (`targets.ts`)

```typescript
// 解析目标地址
function parseiMessageTarget(
  targetString: string
): OutboundTarget

// 目标格式
// "email@example.com" - iMessage (邮箱)
// "+1234567890" - iMessage (电话)
// "chat123" - 群组 ID
```

### 4. 入站处理 (`monitor/inbound-processing.ts`)

```typescript
// 处理入站消息
async function processInboundMessage(
  message: iMessageEvent
): Promise<InboundMessage>

// 消息过滤
function shouldProcessMessage(message: iMessageEvent): boolean
```

### 5. 消息传递 (`monitor/deliver.ts`)

```typescript
// 消息传递确认
async function deliverToAgent(
  message: InboundMessage
): Promise<void>
```

### 6. 中止处理 (`monitor/abort-handler.ts`)

```typescript
// 处理中止请求
function handleAbortRequest(
  message: InboundMessage
): boolean
```

### 7. 常量定义 (`constants.ts`)

```typescript
// 平台常量
const PLATFORM = "imessage";
const MAX_MESSAGE_LENGTH = 1000;
const SUPPORTED_EFFECTS = [...];
```

## 对外接口

### 主要导出

```typescript
// 监控器
export { monitoriMessageProvider } from "./monitor.js";

// 消息发送
export { sendMessageiMessage } from "./send.js";

// 目标解析
export { parseiMessageTarget } from "./targets.js";
```

## 消息类型映射

| iMessage | OpenClaw |
|----------|----------|
| `message` | `InboundMessage` |
| `attachment` | `media` |
| `effect` | `effect` |
| `tapback` | `reaction` |
| `group` | `groupId` |

## 配置选项

```typescript
{
  imessage: {
    enabled: true,
    appServer: {
      host: "localhost",
      port: 8080
    },
    features: {
      effects: true,
      tapbacks: true,
      groups: true
    }
  }
}
```

## 常见问题 (FAQ)

### Q: 需要运行 App Server 吗？
A: 是的，需要运行 macOS App Server。

### Q: 如何获取群组 ID？
A: 从入站消息中解析，或使用 App Server API 获取。

### Q: 支持哪些效果？
A: shake, boom, confetti, love, lasers, fireworks, shimmer。

### Q: 如何处理附件？
A: 通过 App Server 的文件传输功能。

## 相关模块

- **`extensions/imessage/`** - iMessage 扩展插件
- **`extensions/bluebubbles/`** - BlueBubbles (iMessage) 适配器

## 变更记录

### 2026-02-20 - 创建 iMessage 适配器文档
- ✅ 创建 `src/imessage/CLAUDE.md` 文档
- 📋 记录核心功能
- 🔗 建立 App Server 集成说明
