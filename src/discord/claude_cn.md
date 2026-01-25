# Discord Bot 模块

[根目录](../../CLAUDE.md) > [src](../) > **discord**

## 模块职责

Discord Bot 模块是 Clawdbot 的核心消息渠道之一，负责通过 Discord Bot API 与 Discord 服务器交互。该模块实现了完整的 Discord 机器人功能，包括消息监听、发送、斜杠命令、反应处理、线程管理等。

## 入口与启动

### 主要入口点

- **index.ts**: 模块导出中心
  - `monitorDiscordProvider`: Discord 监听器提供者
  - `sendMessageDiscord`: 发送消息到 Discord
  - `sendPollDiscord`: 发送投票到 Discord

### 启动流程

```typescript
import { monitorDiscordProvider } from "./discord/index.js";

// 启动 Discord 监听器
await monitorDiscordProvider({
  runtime,
  abortSignal,
  account: "my-bot",
  accountId: "discord-account-id",
  config: clawdbotConfig,
  autoStart: true,
  receiveMode: "on-start",
});
```

### 监听器核心 (monitor/)

- **provider.ts**: Discord 监听器提供者实现
- **listeners.ts**: Discord 事件监听器注册与管理
- **message-handler.ts**: 消息处理核心逻辑
- **message-handler.process.ts**: 消息处理流程
- **message-handler.preflight.ts**: 消息预检查（权限、白名单等）

## 对外接口

### 消息监听接口

```typescript
interface MonitorDiscordOpts {
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  account?: string;
  accountId?: string;
  config?: ClawdbotConfig;
  autoStart?: boolean;
  receiveMode?: "on-start" | "manual";
  startupTimeoutMs?: number;
}

function monitorDiscordProvider(opts: MonitorDiscordOpts): Promise<void>;
```

### 消息发送接口

```typescript
// 发送文本消息
function sendMessageDiscord(params: {
  target: string; // 频道 ID 或 DM ID
  message: string;
  accountId?: string;
  config?: ClawdbotConfig;
  replyToId?: string;
}): Promise<void>;

// 发送投票
function sendPollDiscord(params: {
  target: string;
  question: string;
  options: string[];
  accountId?: string;
  config?: ClawdbotConfig;
}): Promise<void>;
```

### API 操作接口

```typescript
// Discord API 封装
interface DiscordAPI {
  deleteMessage(channelId: string, messageId: string): Promise<void>;
  editMessage(channelId: string, messageId: string, content: string): Promise<void>;
  addReaction(channelId: string, messageId: string, emoji: string): Promise<void>;
  removeReaction(channelId: string, messageId: string, emoji: string, userId?: string): Promise<void>;
  createThread(channelId: string, messageId: string, name: string): Promise<string>;
}
```

### 探测接口

```typescript
async function probeDiscord(params: {
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
}): Promise<{ ok: boolean; error?: string }>;
```

## 关键依赖与配置

### Discord Token 配置

```typescript
// Discord Bot Token 存储位置
// ~/.config/clawdbot/discord_tokens.json

interface DiscordToken {
  accountId: string;
  token: string; // Discord Bot Token（不包含前缀）
}

function resolveDiscordBotToken(accountId: string): string | undefined;
```

### 配置结构

```typescript
interface DiscordConfig {
  discord?: {
    accounts?: Record<string, {
      token?: string; // Discord Bot Token
      config?: {
        dm?: {
          allowFrom?: Array<string | number>; // 允许的用户 ID
        };
        guilds?: Record<string, {
          allowList?: string[]; // 频道白名单
          requireMention?: boolean; // 是否需要 @ 提及
          toolPolicy?: string; // 工具策略
        }>;
        replyToMode?: "off" | "first" | "last" | "smart"; // 回复模式
      };
    }>;
  };
}
```

### Discord Gateway 连接

使用 `discord.js` 库的 Gateway 连接：

```typescript
// Discord.js Gateway 配置
const gatewayClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});
```

### 外部依赖

- `discord.js`: Discord Bot API 客户端
- `@discordjs/rest`: Discord REST API 封装

## 数据模型

### Discord 消息事件

```typescript
interface DiscordMessageEvent {
  // 消息内容
  content: string;

  // 发送者信息
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };

  // 频道/服务器信息
  channelId: string;
  guildId?: string; // 服务器 ID（DM 时为空）

  // 消息类型
  type: MessageType;
  flags?: MessageFlags;

  // 回复/线程信息
  referencedMessage?: DiscordMessageEvent | null;
  thread?: {
    id: string;
    name: string;
  };

  // 附件
  attachments: Collection<string, Attachment>;

  // 反应
  reactions: Collection<string, MessageReaction>;
}
```

### 白名单配置

```typescript
interface DiscordAllowList {
  channels?: string[]; // 频道 ID 白名单
  categories?: string[]; // 分类 ID 白名单
  roles?: string[]; // 角色 ID 白名单
}

interface DiscordChannelConfigResolved {
  allowList: DiscordAllowList;
  requireMention: boolean;
  toolPolicy: string;
  replyToMode: "off" | "first" | "last" | "smart";
}

interface DiscordGuildEntryResolved {
  id: string;
  name: string;
  config: DiscordChannelConfigResolved;
}
```

### 反应通知

```typescript
interface DiscordReactionNotification {
  channelId: string;
  messageId: string;
  userId: string;
  emoji: string;
  isRemove?: boolean;
}
```

## 测试与质量

### 测试文件

- **monitor.gateway.test.ts**: Discord Gateway 监听器测试
- **monitor.slash.test.ts**: 斜杠命令测试
- **send.messages.ts**: 消息发送测试
- **send.reactions.ts**: 反应处理测试
- **send.creates-thread.test.ts**: 线程创建测试
- **probe.intents.test.ts**: Intent 配置测试

### 测试覆盖

当前测试覆盖率约 90%。

### 运行测试

```bash
# Discord 模块测试
pnpm test src/discord

# 特定测试
pnpm test src/discord/monitor.test.ts

# 实时测试（需要真实 Discord Token）
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/discord
```

## 常见问题 (FAQ)

### Q1: Discord Bot Token 如何配置？

A: 使用 `clawdbot channels auth discord` 命令配置，Token 存储在 `~/.config/clawdbot/discord_tokens.json`。

### Q2: 如何添加 Discord Bot 到服务器？

A: 使用 Discord OAuth2 URL 生成工具，添加以下权限：
- `bot`
- `applications.commands`
- Scope: `bot`, `applications.commands`
- Permissions: `Send Messages`, `Read Messages`, `Add Reactions`

### Q3: Discord 消息长度限制是多少？

A: Discord 消息最大长度为 2000 字符。超过此限制会自动分块发送。

### Q4: 如何启用 Discord 斜杠命令？

A: 斜杠命令自动启用。Discord 模块会注册内置斜杠命令（如 `/agent`）。

### Q5: Discord 线程支持如何？

A: Discord 模块完全支持线程，包括创建线程、回复线程、线程上下文等。

### Q6: 如何处理 Discord 附件？

A: Discord 附件自动下载并保存到媒体存储，可作为本地文件路径提供给 AI。

### Q7: Discord 反应通知如何工作？

A: 当用户对 AI 消息添加反应时，会生成系统事件通知 AI。可通过 `discord.reactionNotifications` 配置控制。

### Q8: Discord DM（私聊）如何配置？

A: 在 Discord 配置中设置 `dm.allowFrom` 白名单，只允许指定用户私聊。

## 相关文件清单

### 核心文件

- `src/discord/index.ts` - 模块导出
- `src/discord/accounts.ts` - 账户管理
- `src/discord/token.ts` - Token 管理
- `src/discord/api.ts` - Discord API 封装
- `src/discord/audit.ts` - 审计日志

### 监听器 (monitor/)

- `src/discord/monitor.ts` - 监听器入口
- `src/discord/monitor/provider.ts` - 监听器提供者
- `src/discord/monitor/listeners.ts` - 事件监听器
- `src/discord/monitor/message-handler.ts` - 消息处理器
- `src/discord/monitor/message-handler.process.ts` - 消息处理流程
- `src/discord/monitor/message-handler.preflight.ts` - 消息预检查
- `src/discord/monitor/native-command.ts` - 原生命令处理
- `src/discord/monitor/reply-context.ts` - 回复上下文
- `src/discord/monitor/threading.ts` - 线程管理
- `src/discord/monitor/typing.ts` - 输入状态
- `src/discord/monitor/format.ts` - 格式化
- `src/discord/monitor/allow-list.ts` - 白名单管理
- `src/discord/monitor/exec-approvals.ts` - 执行批准
- `src/discord/monitor/system-events.ts` - 系统事件

### 发送 (send.ts)

- `src/discord/send.ts` - 发送入口
- `src/discord/send.messages.ts` - 消息发送
- `src/discord/send.channels.ts` - 频道操作
- `src/discord/send.guild.ts` - 服务器操作
- `src/discord/send.reactions.ts` - 反应操作
- `src/discord/send.outbound.ts` - 出站消息
- `src/discord/send.permissions.ts` - 权限检查
- `src/discord/send.types.ts` - 类型定义
- `src/discord/send.shared.ts` - 共享工具
- `src/discord/send.emojis-stickers.ts` - 表情和贴纸

### 工具

- `src/discord/resolve-channels.ts` - 频道解析
- `src/discord/resolve-users.ts` - 用户解析
- `src/discord/targets.ts` - 目标解析
- `src/discord/chunk.ts` - 消息分块
- `src/discord/probe.ts` - 连接探测
- `src/discord/directory-live.ts` - 实时目录
- `src/discord/gateway-logging.ts` - Gateway 日志

### 测试

- `src/discord/**/*.test.ts` - 单元测试

## 变更记录

### 2026-01-25

- 创建 Discord Bot 模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
