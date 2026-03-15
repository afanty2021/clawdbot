# Discord 适配器 (src/discord/)

[根目录](../CLAUDE.md) > **discord**

## 模块职责

Discord 平台的通信适配器，提供 Discord Bot API 的完整集成。支持消息收发、频道管理、线程操作、表情反应、组件交互等功能。

## 目录结构

```
src/discord/
├── monitor/               # 消息监控和事件处理
│   ├── gateway-registry.ts     # Gateway 注册表
│   ├── gateway-plugin.ts       # Gateway 插件
│   ├── message-handler.ts      # 消息处理器
│   ├── agent-components.ts     # Agent 组件
│   ├── reply-delivery.ts       # 回复传递
│   ├── presence-cache.ts       # 在线状态缓存
│   └── system-events.ts        # 系统事件
├── send.outbound.ts       # 出站消息发送
├── send.messages.ts       # 消息发送
├── send.channels.ts       # 频道消息
├── send.guild.ts          # 服务器消息
├── send.components.ts     # 组件发送
├── send.reactions.ts      # 表情反应
├── send.permissions.ts    # 权限检查
├── resolve-channels.ts    # 频道解析
├── resolve-users.ts       # 用户解析
├── targets.ts             # 目标地址解析
├── accounts.ts            # 账户管理
├── api.ts                 # Discord API 客户端
├── components.ts          # 组件构建器
├── chunk.ts               # 消息分块
├── probe.ts               # 连接探测
└── voice-message.ts       # 语音消息
```

## 核心功能

### 1. 消息监控 (`monitor/`)

**Gateway 连接管理**：
- WebSocket 连接建立和维护
- 心跳保活
- 重连机制
- 事件分发

**消息处理流程**：

```
Discord Gateway Event
    ↓
事件类型分发
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│ MESSAGE  │ REACTION │ COMMAND  │ COMPONENT │
└──────────┴──────────┴──────────┴──────────┘
    ↓          ↓          ↓          ↓
消息处理    反应处理    命令处理    组件处理
    ↓
转换为 OpenClaw 内部格式
    ↓
路由到 AI Agent
```

**关键文件**：
- `gateway-registry.ts` - Gateway 注册和生命周期
- `message-handler.ts` - 消息处理逻辑
- `presence-cache.ts` - 用户在线状态缓存
- `agent-components.ts` - Agent 组件渲染

### 2. 消息发送 (`send.*.ts`)

**发送流程**：

```
OpenClaw OutboundMessage
    ↓
格式转换 (format.ts)
    ↓
权限检查 (send.permissions.ts)
    ↓
消息分块 (chunk.ts)
    ↓
Discord API 调用
    ↓
返回结果
```

**支持的功能**：
- 文本消息（支持 Markdown）
- 嵌入消息（Embeds）
- 文件上传
- 表情反应
- 组件交互（按钮、下拉菜单、模态框）
- 线程创建
- 消息编辑和删除

### 3. 频道和用户解析

**频道解析** (`resolve-channels.ts`)：
- 频道 ID 解析
- 频道名称查找
- 频道类型验证
- 线程解析

**用户解析** (`resolve-users.ts`)：
- 用户 ID 解析
- 用户名查找
- 成员信息获取
- 角色解析

### 4. 组件系统 (`components.ts`)

Discord 交互组件的构建器：

```typescript
// 按钮行
{
  type: "action_row",
  components: [
    { type: "button", style: "primary", label: "Confirm" },
    { type: "button", style: "danger", label: "Cancel" }
  ]
}

// 下拉菜单
{
  type: "action_row",
  components: [
    {
      type: "string_select",
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" }
      ]
    }
  ]
}
```

### 5. 消息分块 (`chunk.ts`)

Discord 消息长度限制处理：

```typescript
// 自动分块长消息
const chunks = chunkMessage(message, 2000);

// 添加继续标记
"Message (1/3)..."
"...continued (2/3)..."
"...final part (3/3)"
```

### 6. 权限系统 (`send.permissions.ts`)

**权限检查**：
- 发送消息权限
- 管理消息权限
- 反应权限
- 组件交互权限
- 文件上传权限

### 7. 账户管理 (`accounts.ts`)

多账户支持：
- 账户列表
- 默认账户解析
- Bot Token 管理
- 账户状态检查

## 对外接口

### 主要导出

```typescript
// 监控器
export { monitorDiscordProvider } from "./monitor.js";

// 消息发送
export { sendMessageDiscord, sendPollDiscord } from "./send.js";
```

### API 客户端

```typescript
// Discord API 客户端
export class DiscordApiClient {
  sendMessage(channelId, message): Promise<Message>
  editMessage(channelId, messageId, message): Promise<Message>
  deleteMessage(channelId, messageId): Promise<void>
  addReaction(channelId, messageId, emoji): Promise<void>
  removeReaction(channelId, messageId, emoji, userId): Promise<void>
  createThread(channelId, messageId, name): Promise<Thread>
  // ... 更多方法
}
```

## 消息类型映射

| Discord | OpenClaw |
|---------|----------|
| `MESSAGE_CREATE` | `InboundMessage` |
| embeds | `media` |
| components | `keyboard` |
| sticker | `media` (sticker) |
| reaction | `reaction` |
| thread | `threadId` |

## 配置选项

```typescript
{
  discord: {
    enabled: true,
    token: "bot-token",
    gateway: {
      intents: ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"],
      presence: { status: "online", activities: [{ name: "AI Assistant" }] }
    },
    features: {
      components: true,
      threads: true,
      reactions: true
    }
  }
}
```

## 测试

### E2E 测试

- `send.sends-basic-channel-messages.test.ts` - 基本消息发送
- `send.creates-thread.test.ts` - 线程创建
- `send.permissions.authz.test.ts` - 权限检查

### 单元测试

- `resolve-channels.test.ts` - 频道解析
- `targets.test.ts` - 目标解析
- `chunk.test.ts` - 消息分块
- `components.test.ts` - 组件构建

## 常见问题 (FAQ)

### Q: 如何创建 Discord Bot？
A: 在 Discord Developer Portal 创建应用，生成 Bot Token，设置必要的 intents。

### Q: 需要哪些权限？
A: `GUILDS`, `GUILD_MESSAGES`, `MESSAGE_CONTENT` 等 intents。

### Q: 如何处理长消息？
A: 使用 `chunk.ts` 自动分块，每块最多 2000 字符。

### Q: 支持哪些消息类型？
A: 文本、嵌入、文件、贴纸、表情、组件、线程等。

## 相关模块

- **`extensions/discord/`** - Discord 扩展插件
- **`src/gateway/`** - Gateway 服务器
- **`src/channels/`** - 渠道系统

## 变更记录

### 2026-02-20 - 创建 Discord 适配器文档
- ✅ 创建 `src/discord/CLAUDE.md` 文档
- 📋 记录核心功能和文件结构
- 🔗 建立消息处理流程图
