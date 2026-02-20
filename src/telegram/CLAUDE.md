# Telegram 适配器 (src/telegram/)

[根目录](../CLAUDE.md) > **telegram**

## 模块职责

Telegram Bot API 的完整适配器实现。基于 Grammy 框架，支持消息收发、内联键盘、文件处理、群组管理、Webhook 和长轮询模式。

## 目录结构

```
src/telegram/
├── bot/                   # Bot 运行时
│   └── helpers.ts         # 辅助函数
├── bot.ts                 # Bot 主入口
├── bot-handlers.ts        # 事件处理器
├── bot-message.ts         # 消息处理
├── bot-message-dispatch.ts # 消息分发
├── bot-message-context.ts # 消息上下文
├── bot-native-commands.ts # 原生命令
├── bot-access.ts          # 访问控制
├── send.ts                # 消息发送
├── format.ts              # 格式化
├── accounts.ts            # 账户管理
├── targets.ts             # 目标解析
├── monitor.ts             # 监控器
├── probe.ts               # 探测工具
├── webhook.ts             # Webhook 处理
├── draft-stream.ts        # 草稿流
├── sticker-cache.ts       # 贴纸缓存
├── update-offset-store.ts # Update 偏移存储
├── group-access.ts        # 群组访问
├── group-migration.ts     # 群组迁移
└── reaction-level.ts      # 反应级别
```

## 核心功能

### 1. Bot 运行时 (`bot.ts`)

**Bot 初始化**：

```typescript
export type TelegramBotOptions = {
  token: string;
  accountId?: string;
  runtime?: RuntimeEnv;
  requireMention?: boolean;          // 群组中需要 @ 提及
  allowFrom?: Array<string | number>; // 允许的用户/群组
  groupAllowFrom?: Array<string | number>;
  mediaMaxMb?: number;               // 媒体文件大小限制
  replyToMode?: ReplyToMode;         // 回复模式
  proxyFetch?: typeof fetch;         // 代理 fetch
  config?: OpenClawConfig;
  updateOffset?: {                   // Update 偏移
    lastUpdateId?: number | null;
    onUpdateId?: (updateId: number) => void | Promise<void>;
  };
};
```

**Grammy Runner 集成**：
- 顺序处理保证
- API 限流器
- 错误重试
- Webhook/长轮询模式切换

### 2. 消息处理流程

```
Telegram Update
    ↓
去重 (bot-updates.ts)
    ↓
┌────────────┬────────────┬────────────┐
│  Message   │   Callback │   Query    │
└────────────┴────────────┴────────────┘
    ↓
访问控制检查 (bot-access.ts)
    ↓
群组策略检查 (group-access.ts)
    ↓
消息上下文构建 (bot-message-context.ts)
    ↓
原生命令处理 (bot-native-commands.ts)
    ↓
消息分发 (bot-message-dispatch.ts)
    ↓
Agent 处理
```

### 3. 消息发送 (`send.ts`)

**支持的功能**：
- 文本消息（支持 Markdown/HTML）
- 照片发送
- 文档上传
- 音频/语音
- 视频/视频笔记
- 贴纸
- 动画
- 位置
- 联系人
- 场所
- 游戏分数
- 内联键盘
- 回复标记
- 编辑和删除

**消息格式化** (`format.ts`)：
- Markdown V2 解析
- HTML 解析
- 实体转义
- 链接解析
- 提及解析

### 4. 内联键盘 (`inline-buttons.ts`)

```typescript
{
  inline_keyboard: [
    [
      { text: "Button 1", callback_data: "btn1" },
      { text: "Button 2", callback_data: "btn2" }
    ],
    [
      { text: "URL", url: "https://example.com" },
      { text: "Web App", url: "https://webapp.com" }
    ]
  ]
}
```

### 5. 原生命令 (`bot-native-commands.ts`)

支持的 Telegram Bot 命令：
- `/start` - 启动机器人
- `/help` - 帮助信息
- `/settings` - 配置设置
- `/status` - 状态查询
- `/cancel` - 取消操作

### 6. 群组管理

**群组访问控制** (`group-access.ts`)：
- 白名单检查
- 提及要求
- 权限验证

**群组迁移** (`group-migration.ts`)：
- 群组 ID 迁移处理
- Supergroup 转换

### 7. 消息去重 (`bot-updates.ts`)

```typescript
// Update 去重键
function buildTelegramUpdateKey(params: {
  updateId: number;
  chatId: number;
  userId?: number;
  messageId?: number;
  callbackQueryId?: string;
}): string

// 去重缓存
function createTelegramUpdateDedupe(): (key: string) => boolean
```

### 8. Update 偏移存储 (`update-offset-store.ts`)

持久化存储 Update ID，防止消息丢失：

```typescript
interface UpdateOffsetStore {
  getLastUpdateId(): number | null;
  setLastUpdateId(updateId: number): void | Promise<void>;
}
```

### 9. 贴纸缓存 (`sticker-cache.ts`)

```typescript
// 贴纸信息缓存
interface StickerCache {
  get(setName: string): StickerSet | null;
  set(setName: string, set: StickerSet): void;
}
```

### 10. Webhook 支持 (`webhook.ts`)

```typescript
// Webhook 配置
{
  url: string;
  secret_token?: string;
  max_connections?: number;
  allowed_updates?: string[];
}
```

## 对外接口

### 主要导出

```typescript
// Bot 创建
export function createTelegramBot(options: TelegramBotOptions): Promise<TelegramBotRuntime>

// 消息发送
export async function sendMessageTelegram(
  bot: Bot,
  target: OutboundTarget,
  message: OutboundMessage
): Promise<SendResult>

// 账户管理
export {
  listEnabledTelegramAccounts,
  resolveDefaultTelegramAccountId,
  resolveTelegramAccount
} from "./accounts.js"
```

## 消息类型映射

| Telegram | OpenClaw |
|----------|----------|
| `message` | `InboundMessage` |
| `photo` | `media` (image) |
| `document` | `media` (file) |
| `sticker` | `media` (sticker) |
| `voice` | `media` (audio) |
| `video_note` | `media` (video) |
| `callback_query` | `interaction` |
| `inline_keyboard` | `keyboard` |

## 配置选项

```typescript
{
  telegram: {
    enabled: true,
    botToken: "bot-token",
    webhook: {
      url: "https://example.com/webhook",
      secretToken: "secret"
    },
    features: {
      nativeCommands: true,
      inlineKeyboard: true,
      groups: true
    },
    limits: {
      mediaMaxMb: 50,
      messageLength: 4096
    }
  }
}
```

## 测试

### E2E 测试

- `bot.create-telegram-bot.test.ts` - Bot 创建流程
- `bot.media.includes-location-text-ctx-fields-pins.e2e.test.ts` - 媒体处理
- `send.test.ts` - 消息发送

### 单元测试

- `accounts.test.ts` - 账户管理
- `targets.test.ts` - 目标解析
- `format.test.ts` - 格式化
- `probe.test.ts` - 连接探测

## 常见问题 (FAQ)

### Q: 如何获取 Bot Token？
A: 通过 @BotFather 创建机器人，获取 Token。

### Q: Webhook 和长轮询如何选择？
A: 生产环境推荐 Webhook，开发环境可用长轮询。

### Q: 如何处理大文件？
A: 使用 `mediaMaxMb` 限制大小，Telegram 限制 50MB。

### Q: 支持哪些消息类型？
A: 文本、照片、文档、音频、视频、贴纸、位置、联系人等。

### Q: 如何处理群组消息？
A: 配置 `requireMention` 和 `allowFrom` 控制群组访问。

## 相关模块

- **`extensions/telegram/`** - Telegram 扩展插件
- **`src/gateway/`** - Gateway 服务器
- **`src/channels/`** - 渠道系统

## 变更记录

### 2026-02-20 - 创建 Telegram 适配器文档
- ✅ 创建 `src/telegram/CLAUDE.md` 文档
- 📋 记录核心功能和文件结构
- 🔗 建立消息处理流程图
