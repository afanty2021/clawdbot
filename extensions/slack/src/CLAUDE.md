# Slack 适配器 (src/slack/)

[根目录](../CLAUDE.md) > **slack**

## 模块职责

Slack 平台的完整适配器，支持 RTM 和 Events API。提供消息收发、块套件 (Block Kit) 交互、线程操作、文件上传、Slash 命令等功能。

## 目录结构

```
src/slack/
├── monitor/               # 消息监控
│   ├── message-handler/   # 消息处理器
│   ├── commands.ts        # Slash 命令
│   ├── events.ts          # 事件处理
│   ├── allow-list.ts      # 白名单
│   ├── policy.ts          # 消息策略
│   └── context.ts         # 上下文
├── send.ts                # 消息发送
├── send.blocks.ts         # 块套件发送
├── actions.ts             # 交互操作
├── format.ts              # 格式化
├── accounts.ts            # 账户管理
├── targets.ts             # 目标解析
├── resolve-channels.ts    # 频道解析
├── resolve-users.ts       # 用户解析
├── scopes.ts              # 权限范围
├── token.ts               # Token 管理
├── streaming.ts           # 流式响应
└── threading.ts           # 线程处理
```

## 核心功能

### 1. 消息监控 (`monitor/`)

**事件处理**：

```
Slack Events API / WebSocket
    ↓
事件类型分发
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│ MESSAGE  │ APP_MENTION │ COMMAND │ BLOCK    │
└──────────┴──────────┴──────────┴──────────┘
    ↓
白名单检查 (allow-list.ts)
    ↓
消息策略应用 (policy.ts)
    ↓
消息处理 (message-handler/)
    ↓
Agent 处理
```

**Slash 命令处理** (`commands.ts`)：
- 命令注册
- 参数解析
- 权限检查
- 响应发送

### 2. 消息发送 (`send.ts`)

**支持的功能**：
- 文本消息
- 块套件 (Block Kit)
- 文件上传
- 线程回复
- 表情反应
- 消息编辑
- 消息删除
- Ephemeral 消息

### 3. 块套件 (`send.blocks.ts`)

Slack Block Kit 组件构建器：

```typescript
// 段落块
{
  type: "section",
  text: { type: "mrkdwn", text: "Hello *World*" }
}

// 按钮块
{
  type: "actions",
  elements: [
    { type: "button", text: { type: "plain_text", text: "Click me" }, action_id: "btn1" }
  ]
}

// 输入块
{
  type: "input",
  label: { type: "plain_text", text: "Enter text" },
  element: { type: "plain_text_input", action_id: "input1" }
}
```

**块构建工具**：
- `blocks-fallback.ts` - 回退文本生成
- `blocks-input.ts` - 输入块构建
- `modal-metadata.ts` - 模态框元数据

### 4. 交互操作 (`actions.ts`)

支持的交互类型：
- 按钮点击
- 下拉菜单选择
- 日期选择器
- 对话框提交
- 快捷键触发

### 5. 格式化 (`format.ts`)

```typescript
// Slack Mrkdown 格式化
{
  text: "Hello <@U12345678>!",
  blocks: [...]
}

// 链接格式化
<https://example.com|Link Text>
<!subteam^S12345678>@group
```

### 6. 流式响应 (`streaming.ts`)

实时流式输出支持：

```typescript
// 流式发送
async function streamMessageSlack(
  target: OutboundTarget,
  message: AsyncIterable<string>
): Promise<void>
```

### 7. 线程处理 (`threading.ts`)

```typescript
// 线程上下文
interface ThreadContext {
  channel: string;
  threadTs: string;
  replyCount: number;
  lastReplyTs: string;
}
```

### 8. 权限范围 (`scopes.ts`)

```typescript
// Bot 权限
const botScopes = [
  "chat:write",
  "chat:write.public",
  "channels:read",
  "groups:read",
  "im:read",
  "reactions:read",
  "reactions:write",
  "files:write"
];

// 用户权限
const userScopes = [
  "chat:write",
  "files:write"
];
```

## 对外接口

### 主要导出

```typescript
// 监控器
export { monitorSlackProvider } from "./monitor.js";

// 消息发送
export { sendMessageSlack } from "./send.js";

// 交互操作
export {
  sendSlackMessage,
  editSlackMessage,
  deleteSlackMessage,
  reactSlackMessage,
  removeSlackReaction
} from "./actions.js";

// 账户管理
export {
  listEnabledSlackAccounts,
  resolveDefaultSlackAccountId,
  resolveSlackAccount
} from "./accounts.js";

// Token 解析
export { resolveSlackBotToken, resolveSlackAppToken } from "./token.js";
```

## 消息类型映射

| Slack | OpenClaw |
|-------|----------|
| `message` | `InboundMessage` |
| `file` | `media` |
| `blocks` | `components` |
| `reaction_added` | `reaction` |
| `thread_ts` | `threadId` |
| `app_mention` | `mention` |

## 配置选项

```typescript
{
  slack: {
    enabled: true,
    botToken: "xoxb-bot-token",
    appToken: "xapp-app-token",
    scopes: ["chat:write", "channels:read", ...],
    features: {
      blocks: true,
      threading: true,
      reactions: true
    },
    limits: {
      messageLength: 40000,
      blockSize: 100
    }
  }
}
```

## 测试

### 单元测试

- `format.test.ts` - 格式化
- `send.blocks.test.ts` - 块发送
- `actions.blocks.test.ts` - 块操作
- `channel-migration.test.ts` - 频道迁移

### 测试工具

- `monitor.test-helpers.ts` - 监控测试辅助
- `blocks.test-helpers.ts` - 块测试辅助

## 常见问题 (FAQ)

### Q: 如何创建 Slack App？
A: 在 Slack API 控制台创建 App，配置 Bot Token 和权限范围。

### Q: 需要哪些权限？
A: `chat:write`, `channels:read`, `groups:read`, `im:read`, `reactions:write` 等。

### Q: 如何使用块套件？
A: 使用 `send.blocks.ts` 中的块构建器，参考 Slack Block Kit 文档。

### Q: 支持线程消息吗？
A: 支持，通过 `thread_ts` 字段。

## 相关模块

- **`extensions/slack/`** - Slack 扩展插件
- **`src/gateway/`** - Gateway 服务器
- **`src/channels/`** - 渠道系统

## 变更记录

### 2026-02-20 - 创建 Slack 适配器文档
- ✅ 创建 `src/slack/CLAUDE.md` 文档
- 📋 记录核心功能和文件结构
- 🔗 建立块套件说明
