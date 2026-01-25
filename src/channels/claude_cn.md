# 路由分发模块 (Channels)

[根目录](../../CLAUDE.md) > [src](../) > **channels**

## 模块职责

路由分发模块是 Clawdbot 的消息路由中心，负责管理所有消息渠道的注册、配置解析、权限控制、消息格式化等共享逻辑。该模块为各个消息渠道提供统一的接口和行为规范。

## 入口与启动

### 主要入口点

- **dock.ts**: 渠道停靠站（渠道元数据中心）
- **registry.ts**: 渠道注册表
- **session.ts**: 会话管理

### 渠道注册

```typescript
// src/channels/registry.ts
const CHAT_CHANNEL_ORDER: ChatChannelId[] = [
  "telegram",
  "whatsapp",
  "discord",
  "slack",
  "signal",
  "imessage",
  "googlechat",
] as const;

function getChatChannelMeta(id: ChatChannelId): {
  id: ChatChannelId;
  label: string;
  order: number;
};

function listChannelDocks(): ChannelDock[];
function getChannelDock(id: ChannelId): ChannelDock | undefined;
```

## 对外接口

### 渠道停靠站

```typescript
// src/channels/dock.ts
interface ChannelDock {
  id: ChannelId;
  capabilities: ChannelCapabilities;
  commands?: ChannelCommandAdapter;
  outbound?: {
    textChunkLimit?: number;
  };
  streaming?: ChannelDockStreaming;
  elevated?: ChannelElevatedAdapter;
  config?: {
    resolveAllowFrom?: (params: {
      cfg: ClawdbotConfig;
      accountId?: string | null;
    }) => Array<string | number> | undefined;
    formatAllowFrom?: (params: {
      cfg: ClawdbotConfig;
      accountId?: string | null;
      allowFrom: Array<string | number>;
    }) => string[];
  };
  groups?: ChannelGroupAdapter;
  mentions?: ChannelMentionAdapter;
  threading?: ChannelThreadingAdapter;
  agentPrompt?: ChannelAgentPromptAdapter;
}

interface ChannelCapabilities {
  chatTypes: ("direct" | "group" | "channel" | "thread")[];
  polls?: boolean;
  reactions?: boolean;
  media?: boolean;
  nativeCommands?: boolean;
  threads?: boolean;
  blockStreaming?: boolean;
}
```

### 白名单匹配

```typescript
// src/channels/allowlist-match.ts
function allowListMatches(params: {
  allowList: Array<string | number>;
  target: string | number;
  normalize?: (value: string) => string;
}): boolean;
```

### 会话管理

```typescript
// src/channels/session.ts
interface ChannelSessionContext {
  accountId: string;
  channel: ChannelId;
  agentId: string;
  sessionKey: string;
  peerId?: string;
  chatType?: "direct" | "group" | "channel";
}

function createChannelSessionContext(params: {
  cfg: ClawdbotConfig;
  channel: ChannelId;
  accountId?: string;
  agentId?: string;
  peerId?: string;
}): ChannelSessionContext;
```

### 其他接口

```typescript
// src/channels/ack-reactions.ts
function buildAckReaction(params: {
  channel: ChannelId;
  emoji?: string;
}): { emoji: string; remove: boolean };

// src/channels/channel-config.ts
function resolveChannelConfig(params: {
  cfg: ClawdbotConfig;
  channel: ChannelId;
  accountId?: string;
}): ChannelConfig | undefined;

// src/channels/chat-type.ts
function resolveChatType(params: {
  channel: ChannelId;
  context: Record<string, unknown>;
}): "direct" | "group" | "channel" | "thread";

// src/channels/command-gating.ts
function isCommandAllowed(params: {
  channel: ChannelId;
  command: string;
  context: Record<string, unknown>;
  config: ClawdbotConfig;
}): boolean;

// src/channels/conversation-label.ts
function buildConversationLabel(params: {
  channel: ChannelId;
  context: Record<string, unknown>;
}): string;

// src/channels/location.ts
function resolveChannelLocation(params: {
  channel: ChannelId;
  context: Record<string, unknown>;
}): { type: string; id: string; label?: string };

// src/channels/reply-prefix.ts
function buildReplyPrefix(params: {
  channel: ChannelId;
  senderLabel: string;
}): string;

// src/channels/sender-identity.ts
function resolveSenderIdentity(params: {
  channel: ChannelId;
  context: Record<string, unknown>;
}): { id: string; label: string; anonymous?: boolean };

// src/channels/sender-label.ts
function buildSenderLabel(params: {
  channel: ChannelId;
  context: Record<string, unknown>;
}): string;

// src/channels/targets.ts
function resolveChannelTarget(params: {
  channel: ChannelId;
  target: string;
  config: ClawdbotConfig;
  accountId?: string;
}): { target: string; type: string } | null;

// src/channels/typing.ts
function sendTypingIndicator(params: {
  channel: ChannelId;
  target: string;
  accountId?: string;
  config: ClawdbotConfig;
}): Promise<void>;
```

## 关键依赖与配置

### 渠道插件

```typescript
// src/channels/plugins/
// 渠道插件系统，支持扩展渠道

interface ChannelPlugin {
  id: ChannelId;
  capabilities: ChannelCapabilities;
  commands?: ChannelCommandAdapter;
  outbound?: {
    textChunkLimit?: number;
  };
  streaming?: {
    blockStreamingCoalesceDefaults?: {
      minChars?: number;
      idleMs?: number;
    };
  };
  elevated?: ChannelElevatedAdapter;
  config?: {
    resolveAllowFrom?: (params: {
      cfg: ClawdbotConfig;
      accountId?: string | null;
    }) => Array<string | number> | undefined;
    formatAllowFrom?: (params: {
      cfg: ClawdbotConfig;
      accountId?: string | null;
      allowFrom: Array<string | number>;
    }) => string[];
  };
  groups?: ChannelGroupAdapter;
  mentions?: ChannelMentionAdapter;
  threading?: ChannelThreadingAdapter;
  agentPrompt?: ChannelAgentPromptAdapter;
  meta?: {
    label: string;
    order?: number;
    icon?: string;
    category?: string;
  };
}

// 加载渠道插件
function requireActivePluginRegistry(): {
  channels: Array<{
    plugin: ChannelPlugin;
    dock?: ChannelDock;
  }>;
};
```

### 插件工具

- **catalog.ts**: 插件目录
- **channel-config.ts**: 渠道配置
- **config-helpers.ts**: 配置辅助
- **config-schema.ts**: 配置模式
- **config-writes.ts**: 配置写入
- **directory-config.ts**: 目录配置
- **group-mentions.ts**: 群组提及
- **helpers.ts**: 辅助函数
- **index.ts**: 插件索引
- **load.ts**: 插件加载
- **message-actions.ts**: 消息动作
- **message-action-names.ts**: 消息动作名称
- **media-limits.ts**: 媒体限制
- **normalize/**: 规范化（各渠道）
- **onboarding-types.ts**: 入职类型
- **onboarding/**: 入职流程
- **outbound/**: 出站处理
- **pairing.ts**: 配对
- **pairing-message.ts**: 配对消息
- **setup-helpers.ts**: 设置辅助
- **status-issues.ts**: 状态问题
- **status.ts**: 状态
- **types.adapters.ts**: 适配器类型
- **types.core.ts**: 核心类型
- **types.plugin.ts**: 插件类型
- **types.ts**: 类型定义

### Web 渠道

```typescript
// src/channels/web/index.ts
// Web 渠道（用于 Gateway Web UI）
export * from "./web/index.js";
```

### 动作处理

```typescript
// src/channels/plugins/actions/discord.ts
async function handleDiscordAction(params: {
  action: DiscordAction;
  context: DiscordContext;
}): Promise<void>;

// src/channels/plugins/actions/signal.ts
async function handleSignalAction(params: {
  action: SignalAction;
  context: SignalContext;
}): Promise<void>;

// src/channels/plugins/actions/telegram.ts
async function handleTelegramAction(params: {
  action: TelegramAction;
  context: TelegramContext;
}): Promise<void>;

// src/channels/plugins/slack.actions.ts
async function handleSlackAction(params: {
  action: SlackAction;
  context: SlackContext;
}): Promise<void>;

// src/channels/plugins/bluebubbles-actions.ts
async function handleBlueBubblesAction(params: {
  action: BlueBubblesAction;
  context: BlueBubblesContext;
}): Promise<void>;
```

## 数据模型

### 渠道 ID

```typescript
type ChannelId =
  | "telegram"
  | "whatsapp"
  | "discord"
  | "slack"
  | "signal"
  | "imessage"
  | "googlechat"
  | string; // 插件渠道
```

### 聊天类型

```typescript
type ChatType = "direct" | "group" | "channel" | "thread";
```

### 渠道配置

```typescript
interface ChannelConfig {
  allowFrom?: Array<string | number>;
  groupAllowFrom?: Array<string | number>;
  requireMention?: boolean;
  toolPolicy?: string;
  replyToMode?: "off" | "first" | "last" | "all" | "smart";
  [key: string]: unknown;
}
```

## 测试与质量

### 测试文件

- **ack-reactions.test.ts**: 反应确认测试
- **allowlist-match.test.ts**: 白名单匹配测试
- **channel-config.test.ts**: 渠道配置测试
- **chat-type.test.ts**: 聊天类型测试
- **command-gating.test.ts**: 命令限制测试
- **conversation-label.test.ts**: 会话标签测试
- **location.test.ts**: 位置解析测试
- **plugins/catalog.test.ts**: 插件目录测试
- **plugins/config-writes.test.ts**: 配置写入测试
- **plugins/directory-config.test.ts**: 目录配置测试
- **plugins/index.test.ts**: 插件索引测试
- **plugins/load.test.ts**: 插件加载测试
- **plugins/message-actions/discord.test.ts**: Discord 动作测试
- **plugins/message-actions/signal.test.ts**: Signal 动作测试
- **plugins/message-actions/telegram.test.ts**: Telegram 动作测试
- **plugins/normalize/signal.test.ts**: Signal 规范化测试
- **plugins/slack.actions.test.ts**: Slack 动作测试
- **sender-identity.test.ts**: 发送者身份测试
- **sender-label.test.ts**: 发送者标签测试
- **targets.test.ts**: 目标解析测试
- **typing.test.ts**: 输入指示器测试
- **web/index.test.ts**: Web 渠道测试

### 测试覆盖

当前测试覆盖率约 90%。

## 常见问题 (FAQ)

### Q1: 如何添加新的消息渠道？

A: 通过插件系统添加新渠道。在 `extensions/` 中创建新插件，实现 `ChannelPlugin` 接口。

### Q2: 渠道配置优先级如何？

A: 特定账户配置 > 渠道默认配置 > 全局默认配置。

### Q3: 如何自定义渠道行为？

A: 通过 `ChannelDock` 接口自定义渠道能力、命令、线程等行为。

### Q4: 渠道白名单如何工作？

A: 每个渠道可以定义自己的白名单解析和格式化逻辑。

### Q5: 如何处理群组提及？

A: 通过 `ChannelMentionAdapter` 和 `ChannelGroupAdapter` 处理群组提及和工具策略。

## 相关文件清单

- `src/channels/dock.ts` - 渠道停靠站
- `src/channels/registry.ts` - 渠道注册表
- `src/channels/session.ts` - 会话管理
- `src/channels/ack-reactions.ts` - 反应确认
- `src/channels/allowlist-match.ts` - 白名单匹配
- `src/channels/channel-config.ts` - 渠道配置
- `src/channels/chat-type.ts` - 聊天类型
- `src/channels/command-gating.ts` - 命令限制
- `src/channels/conversation-label.ts` - 会话标签
- `src/channels/location.ts` - 位置解析
- `src/channels/logging.ts` - 日志
- `src/channels/mention-gating.ts` - 提及限制
- `src/channels/reply-prefix.ts` - 回复前缀
- `src/channels/sender-identity.ts` - 发送者身份
- `src/channels/sender-label.ts` - 发送者标签
- `src/channels/targets.ts` - 目标解析
- `src/channels/typing.ts` - 输入指示器
- `src/channels/plugins/*` - 插件系统

## 变更记录

### 2026-01-25

- 创建路由分发模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
