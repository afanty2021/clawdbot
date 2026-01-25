# Slack Bot 模块

[根目录](../../CLAUDE.md) > [src](../) > **slack**

## 模块职责

Slack Bot 模块是 Clawdbot 的核心消息渠道之一，负责通过 Slack Bot API 与 Slack 工作区交互。该模块实现了完整的 Slack 机器人功能，包括消息监听、发送、斜杠命令、反应处理、线程管理等。

## 入口与启动

### 主要入口点

- **index.ts**: 模块导出中心
  - `monitorSlackProvider`: Slack 监听器提供者
  - `sendMessageSlack`: 发送消息到 Slack
  - `sendSlackMessage`: 发送消息（别名）
  - `deleteSlackMessage`, `editSlackMessage`, `reactSlackMessage` 等 API 操作

### 启动流程

```typescript
import { monitorSlackProvider } from "./slack/index.js";

// 启动 Slack 监听器
await monitorSlackProvider({
  runtime,
  abortSignal,
  account: "my-bot",
  accountId: "slack-account-id",
  config: clawdbotConfig,
  autoStart: true,
  receiveMode: "on-start",
});
```

### 监听器核心 (monitor/)

- **provider.ts**: Slack 监听器提供者实现
- **context.ts**: Slack 上下文管理
- **message-handler.ts**: 消息处理核心逻辑
- **events/**: Slack 事件处理
  - `messages.ts`: 消息事件
  - `channels.ts`: 频道事件
  - `reactions.ts`: 反应事件
  - `pins.ts`: 固定消息事件
  - `members.ts`: 成员事件

## 对外接口

### 消息监听接口

```typescript
interface MonitorSlackOpts {
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  account?: string;
  accountId?: string;
  config?: ClawdbotConfig;
  autoStart?: boolean;
  receiveMode?: "on-start" | "manual";
  startupTimeoutMs?: number;
}

function monitorSlackProvider(opts: MonitorSlackOpts): Promise<void>;
```

### 消息发送接口

```typescript
// 发送消息
function sendMessageSlack(params: {
  target: string; // 频道 ID 或 DM ID
  message: string;
  accountId?: string;
  config?: ClawdbotConfig;
  threadTs?: string; // 线程时间戳
  replyBroadcast?: boolean; // 是否广播回复
}): Promise<void>;

// 别名
function sendSlackMessage(params: SendMessageSlackParams): Promise<void>;
```

### API 操作接口

```typescript
// 消息操作
function deleteSlackMessage(channelId: string, messageTs: string): Promise<void>;
function editSlackMessage(channelId: string, messageTs: string, text: string): Promise<void>;

// 反应操作
function reactSlackMessage(channelId: string, messageTs: string, emoji: string): Promise<void>;
function removeSlackReaction(channelId: string, messageTs: string, emoji: string): Promise<void>;
function removeOwnSlackReactions(channelId: string, messageTs: string): Promise<void>;
function listSlackReactions(channelId: string, messageTs: string): Promise<Reaction[]>;

// 固定消息
function pinSlackMessage(channelId: string, messageTs: string): Promise<void>;
function unpinSlackMessage(channelId: string, messageTs: string): Promise<void>;
function listSlackPins(channelId: string): Promise<Message[]>;

// 其他
function getSlackMemberInfo(userId: string): Promise<Member>;
function listSlackEmojis(): Promise<Emoji[]>;
function readSlackMessages(channelId: string, options?: {
  limit?: number;
  oldest?: string;
  latest?: string;
}): Promise<Message[]>;
```

### 探测接口

```typescript
async function probeSlack(params: {
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
}): Promise<{ ok: boolean; error?: string }>;
```

## 关键依赖与配置

### Slack Token 配置

```typescript
// Slack Bot Token 存储位置
// ~/.config/clawdbot/slack_tokens.json

interface SlackToken {
  accountId: string;
  botToken: string; // xoxb- 开头的 Bot Token
  appToken?: string; // xapp- 开头的 App Token（用于 Socket Mode）
}

function resolveSlackBotToken(accountId: string): string | undefined;
function resolveSlackAppToken(accountId: string): string | undefined;
```

### 配置结构

```typescript
interface SlackConfig {
  slack?: {
    accounts?: Record<string, {
      botToken?: string; // xoxb- 开头的 Bot Token
      appToken?: string; // xapp- 开头的 App Token
      dm?: {
        allowFrom?: Array<string | number>; // 允许的用户 ID
      };
      channels?: Record<string, {
        allowList?: string[]; // 用户白名单
        requireMention?: boolean; // 是否需要 @ 提及
        toolPolicy?: string; // 工具策略
      }>;
      replyToMode?: "off" | "first" | "last" | "all" | "smart"; // 回复模式
      httpMode?: boolean; // HTTP 模式（vs Socket Mode）
    }>;
  };
}
```

### Slack Socket Mode

Slack 模块支持两种连接模式：

1. **Socket Mode** (默认): 使用 Slack App Token 通过 WebSocket 连接
2. **HTTP Mode**: 使用 Slack Events API 通过 HTTP 接收事件

```typescript
// Socket Mode 连接
const { App } = require("@slack/bolt");
const app = new App({
  token: botToken,
  appToken: appToken,
  socketMode: true,
});

// HTTP Mode 连接
const app = new App({
  token: botToken,
  signingSecret: signingSecret,
});
```

### 外部依赖

- `@slack/bolt`: Slack Bot 框架
- `@slack/web-api`: Slack Web API 客户端
- `@slack/socket-mode`: Slack Socket Mode 客户端

### 自定义 HTTP 服务器

Slack 模块支持自定义 HTTP 服务器（用于 HTTP Mode）：

```typescript
// src/slack/http/registry.ts
interface SlackHttpServer {
  host: string;
  port: number;
  server: http.Server;
}
```

## 数据模型

### Slack 消息事件

```typescript
interface SlackMessageEvent {
  // 消息内容
  text: string;
  blocks?: Block[];

  // 发送者信息
  user: string; // 用户 ID
  username?: string;
  bot_id?: string;

  // 频道信息
  channel: string; // 频道 ID
  channel_type?: "channel" | "group" | "im" | "mpim";

  // 线程信息
  thread_ts?: string; // 线程根消息时间戳
  parent_user_id?: string; // 线程发起者

  // 消息类型
  subtype?: string;
  hidden?: boolean;

  // 编辑信息
  edited?: {
    user: string;
    ts: string;
  };

  // 反应
  reactions?: Array<{
    name: string;
    users: string[];
    count: number;
  }>;

  // 附件
  attachments?: Attachment[];
  files?: File[];
}
```

### 频道配置

```typescript
interface SlackChannelConfig {
  allowList: string[]; // 用户白名单
  requireMention: boolean; // 是否需要 @ 提及
  toolPolicy: string; // 工具策略
  replyToMode: "off" | "first" | "last" | "all" | "smart";
}

interface SlackContext {
  accountId: string;
  teamId: string;
  channelId: string;
  channelType: "channel" | "group" | "im" | "mpim";
  userId: string;
  threadTs?: string;
  config: SlackChannelConfig;
}
```

### 斜杠命令

```typescript
interface SlackSlashCommand {
  command: string; // 命令名称（如 /agent）
  text: string; // 命令参数
  user_id: string;
  channel_id: string;
  team_id: string;
  response_url: string; // 用于延迟响应
}

function buildSlackSlashCommandMatcher(config: {
  commands?: Record<string, string>; // 命令映射
}): (command: string) => string | undefined;
```

### 动作处理

Slack 支持交互式消息（按钮、选择器等）：

```typescript
interface SlackAction {
  type: "button" | "select" | "static_select" | "users_select" | "conversations_select";
  action_id: string;
  block_id: string;
  value?: string;
  selected_option?: Option;
  selected_user?: string;
  selected_conversation?: string;
}

async function handleSlackAction(action: SlackAction, context: SlackContext): Promise<void>;
```

## 测试与质量

### 测试文件

- **monitor.test.ts**: Slack 监听器测试
- **monitor.threading.missing-thread-ts.test.ts**: 线程处理测试
- **monitor.tool-result.threads-top-level-replies-replytomode-is-all.test.ts**: 回复模式测试
- **client.test.ts**: Slack 客户端测试
- **format.test.ts**: 格式化测试
- **threading.test.ts**: 线程测试
- **actions.test.ts**: 动作处理测试
- **channel-migration.test.ts**: 频道迁移测试
- **probe.test.ts**: 连接探测测试

### 测试覆盖

当前测试覆盖率约 92%。

### 运行测试

```bash
# Slack 模块测试
pnpm test src/slack

# 特定测试
pnpm test src/slack/monitor.test.ts

# 实时测试（需要真实 Slack Token）
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/slack
```

## 常见问题 (FAQ)

### Q1: Slack Bot Token 和 App Token 有什么区别？

A:
- **Bot Token** (xoxb-): 用于调用 Slack Web API
- **App Token** (xapp-): 用于 Socket Mode 连接

### Q2: 如何创建 Slack App？

A:
1. 访问 https://api.slack.com/apps
2. 点击 "Create New App"
3. 选择 "From scratch"
4. 配置 OAuth Scopes: `chat:write`, `channels:read`, `groups:read`, `im:read`, `reactions:read`, `reactions:write`
5. 安装到工作区并复制 Token

### Q3: Slack 消息长度限制是多少？

A: Slack 消息最大长度为 40000 字符，但推荐保持在 4000 字符以内以获得最佳显示效果。

### Q4: Slack 线程支持如何？

A: Slack 模块完全支持线程，包括创建线程、回复线程、线程上下文等。支持多种回复模式（off, first, last, all, smart）。

### Q5: 如何处理 Slack 附件？

A: Slack 附件自动下载并保存到媒体存储。`files` 字段包含文件元数据，可通过 `url_private` 下载。

### Q6: Slack @here 和 @channel 如何处理？

A: 这些提及会被自动过滤，不会传递给 AI。

### Q7: Slack DM（私聊）如何配置？

A: 在 Slack 配置中设置 `dm.allowFrom` 白名单，只允许指定用户私聊。

### Q8: Socket Mode 和 HTTP Mode 如何选择？

A:
- **Socket Mode**: 适合开发和小规模部署，无需公网服务器
- **HTTP Mode**: 适合生产环境，需要公网服务器和 HTTPS

### Q9: 如何启用 Slack 斜杠命令？

A: 斜杠命令自动启用。Slack 模块会注册内置斜杠命令（如 `/agent`）。

### Q10: Slack Actions（按钮等）如何处理？

A: Slack 模块支持交互式消息，可通过 `actions.ts` 处理按钮点击、选择器选择等事件。

## 相关文件清单

### 核心文件

- `src/slack/index.ts` - 模块导出
- `src/slack/accounts.ts` - 账户管理
- `src/slack/token.ts` - Token 管理
- `src/slack/scopes.ts` - OAuth Scopes 定义
- `src/slack/client.ts` - Slack 客户端封装
- `src/slack/types.ts` - 类型定义

### 监听器 (monitor/)

- `src/slack/monitor.ts` - 监听器入口
- `src/slack/monitor/provider.ts` - 监听器提供者
- `src/slack/monitor/context.ts` - 上下文管理
- `src/slack/monitor/message-handler.ts` - 消息处理器
- `src/slack/monitor/policy.ts` - 策略检查
- `src/slack/monitor/replies.ts` - 回复管理
- `src/slack/monitor/thread-resolution.ts` - 线程解析
- `src/slack/monitor/format.ts` - 格式化
- `src/slack/monitor/slash.ts` - 斜杠命令
- `src/slack/monitor/channel-config.ts` - 频道配置
- `src/slack/monitor/commands.ts` - 命令处理
- `src/slack/monitor/media.ts` - 媒体处理
- `src/slack/monitor/auth.ts` - 认证管理
- `src/slack/monitor/allow-list.ts` - 白名单管理

### 事件处理 (monitor/events/)

- `src/slack/monitor/events/messages.ts` - 消息事件
- `src/slack/monitor/events/channels.ts` - 频道事件
- `src/slack/monitor/events/reactions.ts` - 反应事件
- `src/slack/monitor/events/pins.ts` - 固定消息事件
- `src/slack/monitor/events/members.ts` - 成员事件

### 消息处理 (monitor/message-handler/)

- `src/slack/monitor/message-handler/dispatch.ts` - 事件分发
- `src/slack/monitor/message-handler/prepare.ts` - 消息准备
- `src/slack/monitor/message-handler/types.ts` - 类型定义

### 动作与工具

- `src/slack/actions.ts` - 动作处理
- `src/slack/threading.ts` - 线程工具
- `src/slack/threading-tool-context.ts` - 线程上下文构建
- `src/slack/format.ts` - 格式化工具
- `src/slack/resolve-channels.ts` - 频道解析
- `src/slack/resolve-users.ts` - 用户解析
- `src/slack/targets.ts` - 目标解析

### HTTP 服务器 (http/)

- `src/slack/http/index.ts` - HTTP 服务器入口
- `src/slack/http/registry.ts` - HTTP 服务器注册表

### 工具

- `src/slack/send.ts` - 发送接口
- `src/slack/probe.ts` - 连接探测
- `src/slack/directory-live.ts` - 实时目录
- `src/slack/channel-migration.ts` - 频道迁移

### 测试

- `src/slack/**/*.test.ts` - 单元测试
- `src/slack/monitor.test-helpers.ts` - 测试辅助工具

## 变更记录

### 2026-01-25

- 创建 Slack Bot 模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
- 记录 Socket Mode 和 HTTP Mode 区别
