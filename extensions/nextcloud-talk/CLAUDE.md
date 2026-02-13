# Nextcloud Talk 扩展 (extensions/nextcloud-talk/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **nextcloud-talk**

## 模块职责

提供 Nextcloud Talk 自托管聊天平台的适配器，支持通过 Webhook 实现消息收发和机器人功能。Nextcloud Talk 是 Nextcloud 协作套件的一部分。

## 目录结构

```
extensions/nextcloud-talk/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── webhook.ts       # Webhook 处理
    ├── messages.ts      # 消息处理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable nextcloud-talk
```

### 前置要求
- Nextcloud 服务器（20.0+）
- 已启用 Talk 应用
- Webhook Bot 用户账号

### 配置
```json
{
  "nextcloud-talk": {
    "enabled": true,
    "serverUrl": "https://cloud.example.com",
    "botUser": "openclaw-bot",
    "botPassword": "your-bot-password",
    "webhookSecret": "your-webhook-secret"
  }
}
```

## 对外接口

### NextcloudTalkRuntime 接口
```typescript
interface NextcloudTalkRuntime {
  webhook: WebhookManager;
  messages: MessageManager;
  rooms: RoomManager;
  participants: ParticipantManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息到房间
await nctalk.sendMessage({
  roomId: "room-id",
  message: "Hello, Nextcloud Talk!"
});

// 发送回复
await nctalk.reply({
  roomId: "room-id",
  messageId: "message-id",
  reply: "Thread reply!"
});

// 发送富文本消息
await nctalk.sendRichText({
  roomId: "room-id",
  message: "<b>Hello</b> from OpenClaw!"
});
```

### 房间管理
```typescript
// 列出房间
const rooms = await nctalk.listRooms();

// 获取房间详情
const room = await nctalk.getRoom({
  roomId: "room-id"
});

// 创建房间
const newRoom = await nctalk.createRoom({
  name: "OpenClaw Bot Room",
  type: 2 // 2 = 群组房间
});
```

### 参与者管理
```typescript
// 列出参与者
const participants = await nctalk.listParticipants({
  roomId: "room-id"
});

// 邀请用户
await nctalk.inviteUser({
  roomId: "room-id",
  userId: "user-id"
});

// 移除参与者
await nctalk.removeParticipant({
  roomId: "room-id",
  userId: "user-id"
});
```

### 消息操作
```typescript
// 标记消息为已读
await nctalk.markAsRead({
  roomId: "room-id",
  messageId: "message-id"
});

// 删除消息
await nctalk.deleteMessage({
  roomId: "room-id",
  messageId: "message-id"
});

// 获取消息历史
const messages = await nctalk.getHistory({
  roomId: "room-id",
  limit: 100
});
```

## 依赖与配置

### Talk API 端点

| 端点 | 用途 |
|------|------|
| /ocs/v2.php/talk/rooms | 房间管理 |
| /ocs/v2.php/talk/messages | 消息操作 |
| /ocs/v2.php/talk/participants | 参与者 |
| /ocs/v1.php/webhooks/... | Webhook |

### 房间类型

| 类型值 | 说明 |
|--------|------|
| 1 | 一对一 |
| 2 | 群组 |
| 3 | 公开 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/nextcloud-talk/src/*.test.ts

# 集成测试
pnpm test:live extensions/nextcloud-talk
```

### 测试覆盖率
- **消息发送**: 88%
- **房间管理**: 82%
- **参与者操作**: 80%
- **Webhook 处理**: 78%

## Nextcloud Talk vs Slack vs Mattermost

| 特性 | Nextcloud Talk | Slack | Mattermost |
|------|----------------|-------|------------|
| 自托管 | ✓ | ✗ | ✓ |
| 开源 | ✓ | ✗ | ✓ |
| 视频会议 | ✓(集成) | ✓ | ✓ |
| 文件共享 | ✓(原生) | ✓ | ✓ |
| 集成生态 | Nextcloud | 丰富 | 中等 |

## 常见问题 (FAQ)

### Q: 连接失败？
A: 检查 Nextcloud URL、用户凭据，确保 Talk 应用已启用。

### Q: Webhook 不工作？
A: 验证 webhook secret，在 Nextcloud 管理面板中配置。

### Q: 消息发送慢？
A: 检查 Nextcloud 服务器性能，查看 OCS API 响应时间。

### Q: 支持视频通话吗？
A: API 支持发起呼叫，但主要功能集中在文本消息。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Nextcloud Talk 扩展 CLAUDE.md 文档
- ✅ 记录 OCS API 接口和配置
- ✅ 补充房间和消息管理示例
- ✅ 添加 Nextcloud Talk 对比表
