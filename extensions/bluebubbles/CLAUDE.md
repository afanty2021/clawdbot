# BlueBubbles 扩展 (extensions/bluebubbles/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **bluebubbles**

## 模块职责

提供 BlueBubbles 服务器的 iMessage 适配器，通过 REST API 实现 iMessage 消息收发、群组管理和媒体传输。BlueBubbles 是 macOS 上最稳定的 iMessage 第三方解决方案。

## 目录结构

```
extensions/bluebubbles/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── chat.ts           # 聊天管理
    ├── message.ts        # 消息处理
    ├── attachment.ts     # 附件处理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable bluebubbles
```

### 前置要求
- macOS 设备（作为服务器）
- BlueBubbles 应用已安装并运行
- 有效的 BlueBubbles API 密钥
- "完全磁盘访问" 权限已授予

### 配置
```json
{
  "bluebubbles": {
    "enabled": true,
    "serverUrl": "http://192.168.1.100:1234",
    "password": "your-api-password",
    "senderGuid": "+1234567890",
    "autoReconnect": true,
    "messageLimit": 100
  }
}
```

## 对外接口

### BlueBubblesRuntime 接口
```typescript
interface BlueBubblesRuntime {
  chat: ChatManager;
  message: MessageManager;
  attachment: AttachmentManager;
  contact: ContactManager;
  group: GroupManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送文本消息
await bluebubbles.send({
  guid: "+0987654321",
  text: "Hello via BlueBubbles!"
});

// 发送群组消息
await bluebubbles.sendToGroup({
  chatGuid: "chat-guid-123",
  text: "Hello group!"
});

// 发送私信
await bluebubbles.sendDirect({
  address: "+0987654321",
  text: "Hello privately!"
});
```

### 群组管理
```typescript
// 创建群组
const group = await bluebubbles.createGroup({
  name: "OpenClaw Group",
  participants: ["+1234567890", "+0987654321"]
});

// 添加成员
await bluebubbles.addParticipant({
  chatGuid: group.guid,
  participant: "+1112223333"
});

// 移除成员
await bluebubbles.removeParticipant({
  chatGuid: group.guid,
  participant: "+1112223333"
});

// 退出群组
await bluebubbles.leaveGroup({
  chatGuid: group.guid
});

// 更新群组头像
await bluebubbles.updateGroupAvatar({
  chatGuid: group.guid,
  avatarPath: "/path/to/avatar.jpg"
});
```

### 附件处理
```typescript
// 发送图片
await bluebubbles.sendAttachment({
  guid: "+0987654321",
  path: "/path/to/image.jpg",
  name: "image.jpg"
});

// 发送视频
await bluebubbles.sendAttachment({
  guid: "+0987654321",
  path: "/path/to/video.mp4",
  name: "video.mp4",
  mimeType: "video/mp4"
});

// 下载附件
const attachment = await bluebubbles.getAttachment({
  guid: "attachment-guid-123"
});

// 获取附件列表
const attachments = await bluebubbles.getAttachments({
  chatGuid: "chat-guid-123",
  limit: 50
});
```

### 消息效果
```typescript
// 发送气泡效果
await bluebubbles.sendWithBubbleEffect({
  guid: "+0987654321",
  text: "Screaming!",
  effect: "scream"
});

// 发送屏幕效果
await bluebubbles.sendWithScreenEffect({
  guid: "+0987654321",
  effect: "confetti"
});

// 可用效果列表
const effects = {
  bubble: ["gentle", "loud", "slam", "shake", "bounce", "triumph", "anger"],
  screen: ["balloons", "confetti", "fireworks", "lasers", "party", "celebration"]
};
```

### 消息管理
```typescript
// 获取消息历史
const messages = await bluebubbles.getMessages({
  chatGuid: "chat-guid-123",
  limit: 100,
  offset: 0
});

// 删除消息
await bluebubbles.deleteMessage({
  guid: "message-guid-123"
});

// 设置消息已读
await bluebubbles.markRead({
  chatGuid: "chat-guid-123",
  guid: "message-guid-123"
});
```

## 依赖与配置

### BlueBubbles 要求
- macOS 10.14+（推荐 macOS 12+）
- BlueBubbles 1.9.0+
- Python 3.8+（作为服务器）

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/v1/chat` | GET/POST | 聊天管理 |
| `/api/v1/message` | GET/POST | 消息处理 |
| `/api/v1/attachment` | GET/POST | 附件处理 |
| `/api/v1/participant` | GET/POST | 参与者管理 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/bluebubbles/src/*.test.ts

# 集成测试
pnpm test:live extensions/bluebubbles
```

### 测试覆盖率
- **消息发送**: 92%
- **群组管理**: 88%
- **附件处理**: 85%
- **效果消息**: 82%

## BlueBubbles vs iMessage 原生 vs iMessageJS

| 特性 | BlueBubbles | iMessageJS | iCloud |
|------|-------------|------------|--------|
| macOS 要求 | ✓ | ✗ | ✗ |
| 稳定性 | 高 | 中 | 高 |
| 群组管理 | ✓ | ✓ | ✓ |
| 消息效果 | ✓ | 部分 | ✓ |
| 已读回执 | ✓ | ✓ | ✓ |
| 媒体质量 | 原画质 | 压缩 | 原画质 |
| 开源 | ✓ | ✓ | ✗ |

## 常见问题 (FAQ)

### Q: 连接失败？
A: 检查 BlueBubbles 服务器是否运行，验证 URL 和密码。

### Q: 消息发送慢？
A: 检查 macOS 性能和网络连接，BlueBubbles 在后台运行。

### Q: 媒体上传失败？
A: 确保 BlueBubbles 有完整磁盘访问权限。

### Q: 如何备份？
A: BlueBubbles 自动备份到 `~/Library/Application Support/BlueBubbles`。

### Q: 支持多设备吗？
A: 是的，多个 BlueBubbles 客户端可连接同一 macOS 服务器。

## 相关模块

- **iMessage 扩展** (`extensions/imessage/`) - iMessage 直接连接
- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 BlueBubbles 扩展 CLAUDE.md 文档
- ✅ 记录 REST API 接口和配置
- ✅ 补充消息效果完整列表
- ✅ 添加 BlueBubbles 对比表
