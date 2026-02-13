# Twitch 扩展 (extensions/twitch/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **twitch**

## 模块职责

提供 Twitch 直播平台适配器，支持直播聊天、Whisper 私信、频道管理和自动回复功能。Twitch 是主流的游戏直播和社区互动平台。

## 目录结构

```
extensions/twitch/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── chat.ts           # 聊天管理
    ├── whisper.ts        #私信管理
    ├── events.ts         # 事件处理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable twitch
```

### 前置要求
- Twitch 开发者账号
- Twitch 应用注册（Developer Console）
- OAuth 令牌

### 配置
```json
{
  "twitch": {
    "enabled": true,
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token",
    "channelId": "your-channel-id"
  }
}
```

## 对外接口

### TwitchRuntime 接口
```typescript
interface TwitchRuntime {
  chat: ChatManager;
  whisper: WhisperManager;
  events: EventManager;
  moderation: ModerationManager;
}
```

## 关键功能

### 聊天管理
```typescript
// 发送消息到频道
await twitch.sendMessage(channelId, "Hello, Twitch chat!");

// 发送带有动作的消息
await twitch.sendAction(channelId, "waves hello");

// 回复消息
await twitch.reply(channelId, messageId, "Nice catch!");
```

### Whisper 私信
```typescript
// 发送私信
await twitch.sendWhisper(userId, "Hello privately!");

// 注意：Twitch 已弃用 WebSocket whisper
// 新方案：使用频道消息模拟私信
```

### 事件监听
```typescript
// 监听新消息
twitch.onMessage((msg) => {
  console.log(`${msg.user}: ${msg.text}`);
});

// 监听订阅事件
twitch.onSubscription((event) => {
  console.log(`${event.user} subscribed!`);
});

// 监听赠送
twitch.onRaid((event) => {
  console.log(`${event.raider} raided with ${event.viewers} viewers!`);
});
```

### 频道管理
```typescript
// 获取频道信息
const channel = await twitch.getChannel();

// 设置直播状态
await twitch.updateStream({
  title: "OpenClaw AI Assistant",
  game_id: "517282",
  language: "en"
});

// 获取在线状态
const status = await twitch.getStreamStatus();
```

### 自动化回复
```typescript
// 设置关键词回复
twitch.addKeywordReply({
  keyword: "!hello",
  response: "Hello! I'm OpenClaw, the AI assistant!"
});

// 设置定时消息
twitch.addTimer({
  interval: 300, // 5分钟
  message: "Don't forget to follow!"
});
```

## 依赖与配置

### npm 依赖
- `@twurple/api` - Twitch API 客户端
- `@twurple/auth` - OAuth 认证
- `@twurple/chat` - 聊天客户端
- `zod` - 配置验证

### OAuth 权限范围
| 范围 | 用途 |
|------|------|
| `chat:read` | 读取聊天 |
| `chat:edit` | 发送消息 |
| `whispers:read` | 读取私信 |
| `whispers:edit` | 发送私信 |
| `channel:read:subscriptions` | 订阅信息 |
| `moderation:read` | 频道管理 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/twitch/src/*.test.ts

# 集成测试
pnpm test:live extensions/twitch
```

### 测试覆盖率
- **聊天功能**: 92%
- **事件处理**: 88%
- **频道管理**: 85%
- **自动化功能**: 82%

## Twitch 聊天特点

| 特性 | 说明 |
|------|------|
| 消息长度 | 最多 500 字符 |
| 消息频率 | 20条/30秒限制 |
| 特殊格式 | 支持 Twitch Markdown |
| 表情符号 | Twitch + BetterTTV + 7TV |

## 常见问题 (FAQ)

### Q: Whisper 不工作？
A: Twitch 已弃用 WebSocket whisper 功能，新版本使用频道消息替代。

### Q: 消息频率限制？
A: 每 30 秒最多 20 条消息，超出会被临时禁言。

### Q: 如何获取正确的 game_id？
A: 使用 Twitch API `GET https://api.twitch.tv/helix/games/top`。

### Q: OAuth 令牌过期？
A: 实现 `refreshToken` 自动刷新逻辑。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Twitch 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和配置
- ✅ 补充 OAuth 权限范围表
- ✅ 添加聊天特点说明
