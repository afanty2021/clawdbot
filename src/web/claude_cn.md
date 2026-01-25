# WhatsApp Web 模块

[根目录](../../CLAUDE.md) > [src](../) > **web**

## 模块职责

WhatsApp Web 模块是 Clawdbot 的核心消息渠道之一，负责通过 Baileys 库（WhatsApp Web 协议的 Node.js 实现）与 WhatsApp 网络交互。该模块实现了完整的 WhatsApp 消息功能，包括消息监听、发送、投票、反应处理、媒体处理等。

## 入口与启动

### 主要入口点

- **channel-web.ts**: 模块导出中心
  - `monitorWebChannel`: WhatsApp 监听器提供者
  - `monitorWebInbox`: WhatsApp 收件箱监听器
  - `sendMessageWhatsApp`: 发送消息到 WhatsApp
  - `loginWeb`: WhatsApp 登录
  - `logoutWeb`: WhatsApp 登出

### 启动流程

```typescript
import { monitorWebChannel } from "../channel-web.js";

// 启动 WhatsApp 监听器
await monitorWebChannel({
  runtime,
  abortSignal,
  account: "whatsapp",
  accountId: "whatsapp-account-id",
  config: clawdbotConfig,
  autoStart: true,
  receiveMode: "on-start",
});
```

### Baileys 客户端

WhatsApp 模块使用 Baileys 库连接：

```typescript
// 创建 WhatsApp Socket
async function createWaSocket(params: {
  account?: string;
  authDir?: string; // 认证目录（默认 ~/.config/clawdbot/web_auth）
  browser?: string; // 浏览器标识
  printQR?: boolean; // 是否打印 QR 码
  connectTimeoutMs?: number;
}): Promise<{
  socket: WASocket;
  authState: AuthenticationState;
}>;

// 等待连接
async function waitForWaConnection(params: {
  socket: WASocket;
  timeoutMs: number;
}): Promise<void>;
```

### 监听器核心

- **auto-reply.ts**: 自动回复监听器
- **auto-reply/monitor.ts**: 监听器实现
- **inbound.ts**: 入站消息处理
- **outbound.ts**: 出站消息处理

## 对外接口

### 消息监听接口

```typescript
interface WebMonitorTuning {
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  account?: string;
  accountId?: string;
  config?: ClawdbotConfig;
  autoStart?: boolean;
  receiveMode?: "on-start" | "manual";
  startupTimeoutMs?: number;
  heartbeatIntervalMs?: number; // 心跳间隔
  allowFrom?: Array<string | number>; // 允许的发送者
  groupAllowFrom?: Array<string | number>; // 允许的群组
  mediaMaxMb?: number; // 媒体大小限制（MB）
  alwaysActivateGroups?: string[]; // 始终激活的群组
  allowBroadcasts?: boolean; // 允许广播列表
}

function monitorWebChannel(opts: WebMonitorTuning): Promise<void>;
```

### 入站监听接口

```typescript
interface WebInboundMessage {
  // 消息内容
  text: string;
  attachments?: Array<{
    path: string;
    contentType: string;
    filename?: string;
  }>;

  // 发送者信息
  from: string; // 发送者 JID
  fromMe: boolean; // 是否为自己发送
  pushName?: string; // 推送名称

  // 接收者信息
  to: string; // 接收者 JID

  // 聊天信息
  chat: string; // 聊天 JID
  chatType: "direct" | "group"; // 聊天类型

  // 消息元数据
  id: string; // 消息 ID
  timestamp: number; // 时间戳（秒）
  ephemeralExpiration?: number; // 消息过期时间（秒）

  // 回复信息
  quotedMessageId?: string; // 回复的消息 ID
  quotedMessageSender?: string; // 回复的消息发送者

  // 群组信息
  participant?: string; // 群组中的参与者 JID
  groupMentioned?: boolean; // 是否被群组提及

  // 广播列表
  broadcast?: boolean; // 是否为广播列表
}

function monitorWebInbox(params: {
  socket: WASocket;
  onMessage: (message: WebInboundMessage) => void | Promise<void>;
  onError?: (error: Error) => void;
  onClose?: (reason: WebListenerCloseReason) => void;
}): () => void;
```

### 消息发送接口

```typescript
// 发送消息
function sendMessageWhatsApp(params: {
  target: string; // 电话号码或群组 ID
  message: string;
  accountId?: string;
  config?: ClawdbotConfig;
  replyToId?: string; // 回复的消息 ID
  linkPreview?: boolean; // 是否显示链接预览
  poll?: {
    name: string; // 投票名称
    values: string[]; // 选项
    selectableCount?: number; // 可选数量
  };
}): Promise<{ id: string }>;
```

### 认证接口

```typescript
// 登录（生成 QR 码）
async function loginWeb(params: {
  account?: string;
  runtime?: RuntimeEnv;
  authDir?: string;
  printQR?: boolean;
  timeoutMs?: number;
}): Promise<{
  success: boolean;
  phoneNumber?: string;
}>;

// 登出
async function logoutWeb(params: {
  account?: string;
  authDir?: string;
}): Promise<void>;

// 检查认证是否存在
function webAuthExists(params: {
  account?: string;
  authDir?: string;
}): boolean;

// 记录电话号码
function logWebSelfId(account: string, phoneNumber: string): void;
```

### 探测接口

```typescript
async function probeWeb(params: {
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  timeoutMs?: number;
}): Promise<{
  ok: boolean;
  error?: string;
  phoneNumber?: string;
}>;
```

## 关键依赖与配置

### Baileys 库

WhatsApp 模块使用 `@whiskeysockets/baileys` 库：

```typescript
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from "@whiskeysockets/baileys";
```

### 配置结构

```typescript
interface WebConfig {
  channels?: {
    whatsapp?: {
      accounts?: Record<string, {
        authDir?: string; // 认证目录
        linkPreview?: boolean; // 链接预览
        autoReply?: boolean; // 自动回复
        allowBroadcasts?: boolean; // 允许广播列表
        heartbeat?: {
          intervalMs?: number; // 心跳间隔
          recipients?: string[]; // 心跳接收者
        };
        allowFrom?: Array<string | number>; // 允许的发送者
        groupAllowFrom?: Array<string | number>; // 允许的群组 ID
        alwaysActivateGroups?: string[]; // 始终激活的群组
        requireMention?: boolean; // 群组是否需要 @ 提及
        toolPolicy?: string; // 工具策略
        mediaMaxMb?: number; // 媒体大小限制（MB）
      }>;
    };
  };
}
```

### 认证状态

```typescript
interface AuthenticationState {
  creds: {
    account: string; // 电话号码
    registrationId?: number;
    deviceIdentity?: Buffer;
  };
  keys: {
    get: (type: string, ids: string[]) => Promise<Buffer | undefined>;
    set: (type: string, ids: string[], value: Buffer) => Promise<void>;
  };
}
```

### 心跳机制

WhatsApp 模块支持心跳机制以保持连接活跃：

```typescript
const HEARTBEAT_PROMPT = "Heartbeat check";
const HEARTBEAT_TOKEN = "heartbeat_check";

function resolveHeartbeatRecipients(params: {
  config?: ClawdbotConfig;
  accountId?: string;
}): string[];

async function runWebHeartbeatOnce(params: {
  socket: WASocket;
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
}): Promise<void>;
```

### 媒体限制

```typescript
const DEFAULT_WEB_MEDIA_BYTES = 100 * 1024 * 1024; // 100MB

// 优化图片为 JPEG
async function optimizeImageToJpeg(params: {
  path: string;
  maxBytes: number;
  quality?: number; // JPEG 质量 (1-100)
}): Promise<{
  path: string;
  contentType: string;
  size: number;
}>;
```

## 数据模型

### WhatsApp 消息事件

```typescript
interface WhatsAppMessageEvent {
  // 消息 ID
  key: {
    remoteJid: string; // 远程 JID (phone@s.whatsapp.net 或 group@g.us)
    fromMe: boolean; // 是否为自己发送
    id: string; // 消息 ID
    participant?: string; // 群组参与者 JID
  };

  // 消息内容
  message: {
    conversation?: string; // 文本消息
    extendedTextMessage?: {
      text: string;
      preview?: {
        title?: string;
        description?: string;
        thumbnail?: Buffer;
      };
    };
    pollCreationMessage?: {
      name: string; // 投票名称
      options: Array<{
        optionName: string;
        localId: string;
      }>;
      selectableCount?: number; // 可选数量
    };
    imageMessage?: {
      url: string;
      mimetype: string;
      caption?: string;
      fileSha256: Buffer;
      fileLength: number;
    };
    videoMessage?: { /* ... */ };
    audioMessage?: { /* ... */ };
    documentMessage?: { /* ... */ };
    stickerMessage?: { /* ... */ };
  };

  // 消息元数据
  messageTimestamp?: number; // 时间戳（秒）
  pushName?: string; // 推送名称
  broadcast?: boolean; // 是否为广播
}

// JID (Jabber ID) 格式
// 单聊: phone@s.whatsapp.net
// 群聊: group@g.us
// 频道: channel@newsletter
// 服务器: 0@s.whatsapp.net (WhatsApp 服务器)
```

### 投票消息

```typescript
interface PollMessage {
  name: string; // 投票名称
  values: string[]; // 选项列表
  selectableCount?: number; // 可选数量（默认 1）
}

// 发送投票
await sendMessageWhatsApp({
  target: "group@g.us",
  message: "What's your favorite color?",
  poll: {
    name: "Favorite Color",
    values: ["Red", "Green", "Blue"],
    selectableCount: 1,
  },
});
```

### 反应消息

```typescript
interface ReactionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  text?: string; // emoji
}

// WhatsApp 支持完整的 emoji 反应
```

### 会话快照

```typescript
interface WebSessionSnapshot {
  accountId: string;
  socketState: ConnectionState;
  phoneNumber?: string;
  connectedAt?: number;
  lastHeartbeatAt?: number;
  messagesReceived: number;
  messagesSent: number;
}

// 获取会话快照
function getWebSessionSnapshot(accountId: string): WebSessionSnapshot | undefined;
```

### 访问控制

```typescript
interface WebAccessControl {
  allowFrom?: Array<string | number>; // 允许的发送者
  groupAllowFrom?: Array<string | number>; // 允许的群组 ID
  pairingHistory?: Array<{
    timestamp: number;
    jid: string;
    type: "qr" | "link";
  }>;
}

// 检查消息是否被允许
function isWebMessageAllowed(params: {
  message: WebInboundMessage;
  accessControl: WebAccessControl;
}): boolean;
```

## 测试与质量

### 测试文件

- **auto-reply.web-auto-reply.prefixes-body-same-phone-marker-from.test.ts**: 发送者前缀测试
- **auto-reply.web-auto-reply.requires-mention-group-chats-injects-history-replying.test.ts**: 群组提及测试
- **auto-reply.web-auto-reply.supports-always-group-activation-silent-token-preserves.test.ts**: 群组激活测试
- **auto-reply.web-auto-reply.uses-per-agent-mention-patterns-group-gating.test.ts**: 提及模式测试
- **auto-reply.web-auto-reply.reconnects-after-connection-close.test.ts**: 重连测试
- **inbound.test.ts**: 入站消息测试
- **inbound.media.test.ts**: 媒体处理测试
- **login.test.ts**: 登录测试
- **logout.test.ts**: 登出测试
- **probe.test.ts**: 探测测试
- **media.test.ts**: 媒体测试
- **outbound.test.ts**: 出站消息测试

### 测试覆盖

当前测试覆盖率约 93%。

### 运行测试

```bash
# Web 模块测试
pnpm test src/web

# 特定测试
pnpm test src/web/auto-reply.test.ts

# 实时测试（需要真实 WhatsApp 账户）
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/web
```

## 常见问题 (FAQ)

### Q1: WhatsApp Web 模块如何配置？

A:
1. 运行 `clawdbot channels auth whatsapp` 生成 QR 码
2. 用手机 WhatsApp 扫描 QR 码
3. 认证信息保存在 `~/.config/clawdbot/web_auth`
4. 重启监听器以自动连接

### Q2: WhatsApp 消息长度限制是多少？

A: WhatsApp 消息最大长度为 4096 字符。超过此限制会自动分块发送。

### Q3: WhatsApp 群组支持如何？

A: WhatsApp 模块完全支持群组消息，包括群组白名单、群组提及、群组激活等。

### Q4: WhatsApp 附件大小限制是多少？

A: 默认限制 100MB，可通过 `mediaMaxMb` 配置调整。

### Q5: WhatsApp 投票支持如何？

A: WhatsApp 原生支持投票功能，可创建投票并收集结果。

### Q6: WhatsApp 反应支持如何？

A: WhatsApp 支持完整的 emoji 反应功能。

### Q7: WhatsApp 链接预览如何工作？

A: WhatsApp 自动生成链接预览（Open Graph），可通过 `linkPreview` 配置控制。

### Q8: 如何保持 WhatsApp 连接活跃？

A: 使用心跳机制定期发送消息以保持连接活跃：

```typescript
heartbeat: {
  intervalMs: 300000, // 5 分钟
  recipients: ["1234567890@s.whatsapp.net"],
}
```

### Q9: WhatsApp 广播列表支持吗？

A: WhatsApp 模块支持广播列表，可通过 `allowBroadcasts` 配置控制。

### Q10: 如何处理 WhatsApp 多设备？

A: Baileys 支持多设备，认证信息包含设备身份信息。

### Q11: WhatsApp 频道支持吗？

A: WhatsApp 模块支持订阅频道（Channels），但只读（无法发送消息）。

### Q12: 如何调试 WhatsApp 连接问题？

A:
1. 检查认证文件是否存在: `ls ~/.config/clawdbot/web_auth`
2. 使用 `clawdbot channels status --probe` 探测连接
3. 查看 Baileys 日志
4. 重新登录（删除认证文件并重新扫码）

## 相关文件清单

### 核心文件

- `src/channel-web.ts` - 模块导出
- `src/web/accounts.ts` - 账户管理
- `src/web/auth-store.ts` - 认证存储
- `src/web/session.ts` - 会话管理

### 自动回复 (auto-reply/)

- `src/web/auto-reply.ts` - 自动回复入口
- `src/web/auto-reply.impl.ts` - 自动回复实现
- `src/web/auto-reply/monitor.ts` - 监听器
- `src/web/auto-reply/deliver-reply.ts` - 回复传递
- `src/web/auto-reply/heartbeat-runner.ts` - 心跳运行器
- `src/web/auto-reply/mentions.ts` - 提及处理
- `src/web/auto-reply/util.ts` - 工具函数
- `src/web/auto-reply/types.ts` - 类型定义
- `src/web/auto-reply/monitor/*.ts` - 监听器子模块

### 入站处理 (inbound/)

- `src/web/inbound.ts` - 入站入口
- `src/web/inbound/extract.ts` - 消息提取
- `src/web/inbound/media.ts` - 媒体处理
- `src/web/inbound/access-control.ts` - 访问控制
- `src/web/inbound/dedupe.ts` - 消息去重
- `src/web/inbound/monitor.ts` - 入站监听器
- `src/web/inbound/send-api.ts` - 发送 API
- `src/web/inbound/types.ts` - 类型定义

### 出站处理

- `src/web/outbound.ts` - 出站消息处理

### 登录/登出

- `src/web/login.ts` - 登录
- `src/web/login-qr.ts` - QR 码生成
- `src/web/logout.ts` - 登出
- `src/web/reconnect.ts` - 重连逻辑

### 媒体

- `src/web/media.ts` - 媒体处理
- `src/web/qr-image.ts` - QR 码图像

### 工具

- `src/web/active-listener.ts` - 活跃监听器
- `src/web/formatError.ts` - 错误格式化
- `src/web/getStatusCode.ts` - 状态码获取
- `src/web/test-helpers.ts` - 测试辅助
- `src/web/vcard.ts` - 联系人名片

### 测试

- `src/web/**/*.test.ts` - 单元测试

## 变更记录

### 2026-01-25

- 创建 WhatsApp Web 模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
- 记录 Baileys 依赖和配置步骤
