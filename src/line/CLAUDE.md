# LINE 适配器 (src/line/)

[根目录](../CLAUDE.md) > **line**

## 模块职责

LINE Messaging API 的完整适配器。支持消息收发、Flex 消息、模板消息、Rich Menu、Webhook 签名验证等功能。

## 目录结构

```
src/line/
├── flex-templates/        # Flex 消息模板
│   ├── basic-cards.ts
│   ├── schedule-cards.ts
│   ├── media-control-cards.ts
│   └── message.ts
├── bot.ts                 # Bot 主入口
├── bot-handlers.ts        # 事件处理器
├── bot-message-context.ts # 消息上下文
├── bot-access.ts          # 访问控制
├── send.ts                # 消息发送
├── reply-chunks.ts        # 回复分块
├── template-messages.ts   # 模板消息
├── rich-menu.ts           # Rich Menu
├── markdown-to-line.ts    # Markdown 转换
├── download.ts            # 媒体下载
├── webhook.ts             # Webhook 处理
├── webhook-node.ts        # Webhook 节点
├── signature.ts           # 签名验证
├── accounts.ts            # 账户管理
├── monitor.ts             # 监控器
└── config-schema.ts       # 配置模式
```

## 核心功能

### 1. Bot 运行时 (`bot.ts`)

LINE Bot 的核心运行时，处理所有传入事件。

### 2. 消息类型支持

| 类型 | 说明 |
|------|------|
| `text` | 文本消息 |
| `image` | 图片 |
| `video` | 视频 |
| `audio` | 音频 |
| `location` | 位置 |
| `sticker` | 贴纸 |
| `flex` | Flex 消息 |
| `template` | 模板消息 |

### 3. Flex 消息 (`flex-templates/`)

LINE Flex Message 组件：

```typescript
// 卡片组件
{
  type: "bubble",
  body: {
    type: "box",
    contents: [
      { type: "text", text: "Hello" }
    ]
  }
}

// 按钮组件
{
  type: "button",
  action: {
    type: "message",
    label: "Click",
    text: "clicked"
  }
}
```

### 4. 模板消息 (`template-messages.ts`)

```typescript
// 按钮模板
{
  type: "buttons",
  title: "Menu",
  text: "Select action",
  actions: [
    { type: "message", label: "OK", text: "ok" }
  ]
}

// 确认模板
{
  type: "confirm",
  text: "Are you sure?",
  actions: [
    { type: "message", label: "Yes", text: "yes" },
    { type: "message", label: "No", text: "no" }
  ]
}
```

### 5. Rich Menu (`rich-menu.ts`)

富菜单管理，设置固定菜单：

```typescript
{
  size: { width: 2500, height: 1686 },
  selected: true,
  name: "Main Menu",
  chatBarText: "Menu",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 1250, height: 1686 },
      action: { type: "message", text: "Action 1" }
    }
  ]
}
```

### 6. Markdown 转换 (`markdown-to-line.ts`)

将 Markdown 转换为 LINE 格式：

```typescript
// 输入
"**bold** and _italic_"

// 输出
{
  type: "text",
  text: "bold and italic",
  styles: {
    bold: [0, 4],
    italic: [9, 16]
  }
}
```

### 7. Webhook 处理 (`webhook.ts`)

```typescript
// Webhook 签名验证
function verifySignature(body: string, signature: string, channelSecret: string): boolean

// Webhook 事件处理
async function handleWebhookEvent(event: LineEvent): Promise<void>
```

### 8. 媒体下载 (`download.ts`)

```typescript
// 下载媒体文件
async function downloadLineMedia(messageId: string, token: string): Promise<Buffer>
```

### 9. 回复分块 (`reply-chunks.ts`)

LINE 回复有 5 条消息限制，分块处理：

```typescript
// 分块回复
async function replyInChunks(
  replyToken: string,
  messages: Message[],
  token: string
): Promise<void>
```

## 对外接口

### 主要导出

```typescript
// 消息发送
export async function sendMessageLine(
  target: OutboundTarget,
  message: OutboundMessage
): Promise<SendResult>

// 账户管理
export {
  listEnabledLineAccounts,
  resolveDefaultLineAccountId
} from "./accounts.js"
```

## 消息类型映射

| LINE | OpenClaw |
|------|----------|
| `message` | `InboundMessage` |
| `image` | `media` |
| `video` | `media` |
| `audio` | `media` |
| `location` | `location` |
| `sticker` | `media` |
| `flex` | `components` |
| `postback` | `interaction` |

## 配置选项

```typescript
{
  line: {
    enabled: true,
    channelAccessToken: "channel-access-token",
    channelSecret: "channel-secret",
    webhook: {
      url: "https://example.com/webhook",
      verifySignature: true
    },
    features: {
      flex: true,
      templates: true,
      richMenu: true
    }
  }
}
```

## 常见问题 (FAQ)

### Q: 如何获取 Channel Access Token？
A: 在 LINE Developers Console 创建 Messaging API channel。

### Q: Webhook 签名验证是必须的吗？
A: 强烈推荐，用于验证请求来源。

### Q: Flex 消息有什么限制？
A: 最大 50KB JSON，气泡最多 10 个。

### Q: 如何处理媒体文件？
A: 使用 `download.ts` 下载，通过 `messageId` 获取。

## 相关模块

- **`extensions/line/`** - LINE 扩展插件

## 变更记录

### 2026-02-20 - 创建 LINE 适配器文档
- ✅ 创建 `src/line/CLAUDE.md` 文档
- 📋 记录核心功能
- 🔗 建立 Flex 消息说明
