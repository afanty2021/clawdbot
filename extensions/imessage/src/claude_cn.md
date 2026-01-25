# iMessage Bridge 模块

[根目录](../../CLAUDE.md) > [src](../) > **imessage**

## 模块职责

iMessage Bridge 模块是 Clawdbot 的核心消息渠道之一，负责通过第三方桥接服务（如 BlueBubbles）与 Apple iMessage/SMS 网络交互。该模块实现了完整的 iMessage 消息功能，包括消息监听、发送、反应处理、媒体处理等。

## 入口与启动

### 主要入口点

- **index.ts**: 模块导出中心
  - `monitorIMessageProvider`: iMessage 监听器提供者
  - `sendMessageIMessage`: 发送消息到 iMessage

### 启动流程

```typescript
import { monitorIMessageProvider } from "./imessage/index.js";

// 启动 iMessage 监听器
await monitorIMessageProvider({
  runtime,
  abortSignal,
  account: "my-iphone",
  accountId: "imessage-account-id",
  config: clawdbotConfig,
  autoStart: true,
  receiveMode: "on-start",
  baseUrl: "http://localhost:9180",
  apiKey: "bluebubbles-api-key",
});
```

### BlueBubbles 桥接

iMessage 模块依赖 BlueBubbles 服务器（macOS/iOS 上的第三方桥接服务）：

```typescript
// iMessage 客户端
async function createIMessageClient(params: {
  baseUrl: string; // BlueBubbles 服务器地址
  apiKey?: string; // API 密钥
  accountId?: string;
}): Promise<IMessageClient>;

interface IMessageClient {
  // 监听消息
  listen(callback: (message: IMessageEvent) => void): Promise<void>;

  // 发送消息
  send(target: string, text: string, options?: SendOptions): Promise<void>;

  // 获取聊天列表
  listChats(): Promise<Chat[]>;
}
```

### 监听器核心 (monitor/)

- **monitor.ts**: iMessage 监听器实现
- **monitor/monitor-provider.ts**: 监听器提供者
- **monitor/runtime.ts**: 运行时管理
- **monitor/deliver.ts**: 消息传递

## 对外接口

### 消息监听接口

```typescript
interface MonitorIMessageOpts {
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  account?: string;
  accountId?: string;
  config?: ClawdbotConfig;
  baseUrl?: string; // BlueBubbles 服务器地址
  apiKey?: string; // BlueBubbles API 密钥
  autoStart?: boolean;
  receiveMode?: "on-start" | "manual";
  startupTimeoutMs?: number;
  allowFrom?: Array<string | number>; // 允许的发送者
  groupAllowFrom?: Array<string | number>; // 允许的群组
  mediaMaxMb?: number; // 媒体大小限制（MB）
}

function monitorIMessageProvider(opts: MonitorIMessageOpts): Promise<void>;
```

### 消息发送接口

```typescript
// 发送文本消息
function sendMessageIMessage(params: {
  target: string; // 电话号码或邮箱
  message: string;
  accountId?: string;
  config?: ClawdbotConfig;
  attachments?: Array<{
    filename?: string;
    contentType?: string;
    path: string;
  }>;
}): Promise<{ guid: string }>;
```

### 探测接口

```typescript
async function probeIMessage(params: {
  accountId?: string;
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  baseUrl?: string;
}): Promise<{ ok: boolean; error?: string }>;
```

## 关键依赖与配置

### BlueBubbles 服务器

iMessage 模块依赖 BlueBubbles 桥接服务：

```bash
# 1. 在 macOS 或 iOS 设备上安装 BlueBubbles
# macOS: 从 https://bluebubbles.app/download 下载
# iOS: 从 App Store 下载 BlueBubbles

# 2. 配置 BlueBubbles 服务器
# - 启用 "Private API"（需要 macOS）
# - 启用 "Server"
# - 配置端口（默认 9180）
# - 生成 API 密钥

# 3. 测试连接
curl -H "X-Api-Key: YOUR_API_KEY" http://localhost:9180/api/v1/about
```

### 配置结构

```typescript
interface IMessageConfig {
  imessage?: {
    accounts?: Record<string, {
      baseUrl?: string; // BlueBubbles 服务器地址
      apiKey?: string; // API 密钥
      autoReply?: boolean; // 自动回复（用于 Web 模式）
      skipGroupMessagesWithoutMention?: boolean; // 跳过未提及的群组消息
      config?: {
        allowFrom?: Array<string | number>; // 允许的发送者
        groupAllowFrom?: Array<string | number>; // 允许的群组 ID
        requireMention?: boolean; // 群组是否需要 @ 提及
        toolPolicy?: string; // 工具策略
        mediaMaxMb?: number; // 媒体大小限制（MB）
      };
    }>;
  };
}
```

### 账户管理

```typescript
// 解析 iMessage 账户
function resolveIMessageAccount(params: {
  cfg: ClawdbotConfig;
  accountId?: string;
}): {
  baseUrl: string;
  apiKey?: string;
  autoReply?: boolean;
  skipGroupMessagesWithoutMention?: boolean;
  config?: {
    allowFrom?: Array<string | number>;
    groupAllowFrom?: Array<string | number>;
    requireMention?: boolean;
    toolPolicy?: string;
    mediaMaxMb?: number;
  };
};

// 列出启用的 iMessage 账户
function listEnabledIMessageAccounts(cfg: ClawdbotConfig): string[];
```

### 目标解析

```typescript
// 解析 iMessage 目标（电话号码或邮箱）
async function resolveIMessageTarget(params: {
  target: string;
  accountId?: string;
  config?: ClawdbotConfig;
}): Promise<{
  address: string; // 规范化的目标地址
  type: "phone" | "email";
}>;
```

## 数据模型

### iMessage 消息事件

```typescript
interface IMessageEvent {
  // 消息 ID
  guid: string; // 全局唯一标识符
  messageGuid?: string; // 消息 GUID（别名）

  // 发送者信息
  source: {
    identifier: string; // 电话号码或邮箱
    countryCode?: string; // 国家代码
    type: "phone" | "email"; // 类型
  };

  // 接收者信息
  destination: {
    identifier: string;
    type: "phone" | "email";
  };

  // 聊天信息
  chat: {
    guid: string; // 聊天 GUID
    displayName?: string; // 聊天名称
    group?: boolean; // 是否为群组
    participants?: Array<{
      identifier: string;
      type: "phone" | "email";
    }>;
  };

  // 消息内容
  text?: string;
  attachments?: IMessageAttachment[];

  // 消息元数据
  date?: number; // 时间戳（毫秒）
  dateRead?: number; // 已读时间
  dateDelivered?: number; // 送达时间

  // 消息状态
  isFromMe?: boolean; // 是否为自己发送
  isRead?: boolean; // 是否已读
  isDelivered?: boolean; // 是否已送达
  isSent?: boolean; // 是否已发送
  isFailed?: boolean; // 是否发送失败

  // 消息类型
  itemType?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // iMessage 类型
  groupAction?: number; // 群组操作
  groupTitle?: string; // 群组标题
  associate?: string; // 关联消息

  // 反应
  reactions?: Array<{
    key: string; // emoji
    value?: number; // 反应类型
    associatedMessageGuid: string; // 关联消息 GUID
    associatedMessageGuidString?: string;
    fromMe?: boolean;
  }>;

  // 回复
  replyToMessage?: {
    guid: string;
    partCount?: number;
  };
}

interface IMessageAttachment {
  guid: string;
  transferName?: string; // 文件名
  mimeType?: string; // MIME 类型
  totalBytes?: number; // 文件大小
  isOutgoing?: boolean;
}
```

### 聊天对象

```typescript
interface IMessageChat {
  guid: string;
  chatIdentifier?: string; // 聊天标识符
  displayName?: string; // 显示名称
  group?: boolean; // 是否为群组
  participants?: Array<{
    identifier: string;
    type: "phone" | "email";
  }>;
  lastMessage?: string; // 最后一条消息
  lastReadMessage?: number; // 最后已读消息时间戳
}
```

### 目标解析

```typescript
interface IMessageTarget {
  address: string; // 电话号码或邮箱
  type: "phone" | "email";
  displayName?: string; // 显示名称（来自联系人）
}
```

## 测试与质量

### 测试文件

- **monitor.skips-group-messages-without-mention-by-default.test.ts**: 群组提及测试
- **monitor.updates-last-route-chat-id-direct-messages.test.ts**: 直达消息路由测试
- **probe.test.ts**: 连接探测测试
- **send.test.ts**: 发送测试
- **targets.test.ts**: 目标解析测试

### 测试覆盖

当前测试覆盖率约 85%。

### 运行测试

```bash
# iMessage 模块测试
pnpm test src/imessage

# 特定测试
pnpm test src/imessage/monitor.test.ts

# 实时测试（需要 BlueBubbles 服务器）
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/imessage
```

### 测试辅助

```typescript
// src/imessage/test-helpers.ts (如果存在)
// 提供测试用的 mock 对象和辅助函数
```

## 常见问题 (FAQ)

### Q1: iMessage 模块如何安装和配置？

A:
1. 在 macOS 或 iOS 设备上安装 BlueBubbles
2. 启用 BlueBubbles 服务器和 Private API（macOS）
3. 生成 API 密钥
4. 在 Clawdbot 配置中添加账户

### Q2: 为什么需要 BlueBubbles？

A: Apple 不提供官方的 iMessage API，BlueBubbles 是唯一可靠的第三方桥接解决方案。

### Q3: iMessage 消息长度限制是多少？

A: iMessage 消息最大长度为 4000 字符。超过此限制会自动分块发送。

### Q4: iMessage 群组支持如何？

A: iMessage 模块完全支持群组消息，包括群组白名单、群组提及等。

### Q5: iMessage 反应支持如何？

A: iMessage 支持完整的 emoji 反应功能（通过 BlueBubbles Private API）。

### Q6: iMessage 附件大小限制是多少？

A: 默认限制 100MB，可通过 `mediaMaxMb` 配置调整。

### Q7: iMessage 群组提及如何工作？

A:
- 私聊和 1:1 群组：无需提及
- 多人群组：默认需要 `@` 提及（可通过 `requireMention` 配置）

### Q8: 如何区分 iMessage 和 SMS？

A: iMessage 模块同时支持 iMessage（蓝色气泡）和 SMS（绿色气泡），BlueBubbles 会自动处理。

### Q9: 如何调试 BlueBubbles 连接问题？

A:
1. 检查 BlueBubbles 服务器是否运行
2. 测试 HTTP API: `curl -H "X-Api-Key: YOUR_KEY" http://localhost:9180/api/v1/about`
3. 使用 `clawdbot channels status --probe` 探测连接
4. 查看 BlueBubbles 日志

### Q10: iMessage 支持哪些功能？

A:
- 文本消息
- 群组消息
- 附件（图片、视频、文件）
- 反应（需要 BlueBubbles Private API）
- 已读回执
- 送达回执
- 输入指示器（typing indicators）

### Q11: macOS 和 iOS 有什么区别？

A:
- **macOS**: 支持 Private API（完整功能，包括反应）
- **iOS**: 功能受限，但可以发送和接收消息

## 相关文件清单

### 核心文件

- `src/imessage/index.ts` - 模块导出
- `src/imessage/accounts.ts` - 账户管理
- `src/imessage/client.ts` - iMessage 客户端
- `src/imessage/targets.ts` - 目标解析
- `src/imessage/format.ts` - 格式化

### 监听器

- `src/imessage/monitor.ts` - 监听器实现
- `src/imessage/monitor/monitor-provider.ts` - 监听器提供者
- `src/imessage/monitor/runtime.ts` - 运行时管理
- `src/imessage/monitor/deliver.ts` - 消息传递

### 发送

- `src/imessage/send.ts` - 发送接口

### 探测

- `src/imessage/probe.ts` - 连接探测

### 测试

- `src/imessage/**/*.test.ts` - 单元测试

## 变更记录

### 2026-01-25

- 创建 iMessage Bridge 模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
- 记录 BlueBubbles 依赖和安装步骤
