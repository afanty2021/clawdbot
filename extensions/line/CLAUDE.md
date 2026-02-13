# LINE 扩展 (extensions/line/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **line**

## 模块职责

提供 LINE 消息平台适配器，支持 LINE Messaging API 的消息收发、Flex 消息、按钮模板和 LINE Mini App 集成。LINE 是日本、台湾和泰国最流行的即时通讯平台。

## 目录结构

```
extensions/line/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── messages.ts       # 消息处理
    ├── webhook.ts        # Webhook 处理
    ├── richmenu.ts       # 富菜单管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable line
```

### 前置要求
- LINE Developer 账号
- LINE Messaging API 频道
- 频道访问令牌

### 配置
```json
{
  "line": {
    "enabled": true,
    "channelId": "1234567890",
    "channelSecret": "your-channel-secret",
    "channelAccessToken": "your-access-token",
    "userId": "your-user-id",
    "replyMode": "full" // full, none
  }
}
```

## 对外接口

### LINERuntime 接口
```typescript
interface LINERuntime {
  messages: MessageManager;
  webhook: WebhookHandler;
  richmenu: RichMenuManager;
  profile: ProfileManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送文本消息
await line.send({
  to: "U1234567890abcdef",
  messages: [{
    type: "text",
    text: "Hello, LINE!"
  }]
});

// 批量推送
await line.pushMessage({
  to: "U1234567890abcdef",
  messages: [
    { type: "text", text: "Message 1" },
    { type: "text", text: "Message 2" }
  ]
});

// 回复消息
await line.reply({
  replyToken: "reply-token-123",
  messages: [{
    type: "text",
    text: "Reply from OpenClaw!"
  }]
});
```

### Flex 消息
```typescript
// 发送 Flex 消息
await line.sendFlex({
  to: "U1234567890abcdef",
  altText: "Flex Message",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "Hello!" },
        { type: "button", action: { type: "message", label: "Click me", text: "clicked" } }
      ]
    }
  }
});
```

### 按钮模板
```typescript
// 发送按钮模板
await line.sendTemplate({
  to: "U1234567890abcdef",
  altText: "Button Template",
  template: {
    type: "buttons",
    title: "Menu",
    text: "Choose an option",
    actions: [
      { type: "message", label: "Option 1", text: "opt1" },
      { type: "message", label: "Option 2", text: "opt2" },
      { type: "uri", label: "Website", uri: "https://example.com" }
    ]
  }
});
```

### 富菜单
```typescript
// 创建富菜单
await line.createRichMenu({
  name: "OpenClaw Menu",
  chatBarText: "Menu",
  selected: true,
  areas: [
    {
      bounds: { x: 0, y: 0, width: 2500, height: 840 },
      action: { type: "message", text: "/help" }
    }
  ]
});

// 绑定富菜单到用户
await line.linkRichMenu({
  richMenuId: "rich-menu-id",
  userId: "U1234567890abcdef"
});
```

### 用户资料
```typescript
// 获取用户资料
const profile = await line.getProfile({
  userId: "U1234567890abcdef"
});

// 用户资料结构
interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
```

## 依赖与配置

### LINE API 限制
| 限制类型 | 数值 | 说明 |
|---------|------|------|
| 推送消息 | 500/用户/月 | 免费额度 |
| 响应消息 | 60次/会话/30秒 | |
| 多cast | 150次/时间窗口 | |

### Webhook 配置
- 需要 HTTPS 端点
- 支持 POST 请求
- 验证签名确保安全

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/line/src/*.test.ts

# 集成测试
pnpm test:live extensions/line
```

### 测试覆盖率
- **消息发送**: 92%
- **模板消息**: 88%
- **Flex 消息**: 85%
- **富菜单管理**: 82%

## LINE vs 其他平台

| 特性 | LINE | Telegram | WhatsApp |
|------|------|----------|----------|
| 消息最大 | 5,000 字 | 4,096 字 | 65,536 字 |
| 群组上限 | 500 人 | 200,000 人 | 1,024 人 |
| 机器人平台 | ✓ | ✓ | ✗ |
| Flex 消息 | ✓ | ✗ | ✗ |
| 官方账号 | ✓ | ✗ | ✗ |

## 常见问题 (FAQ)

### Q: 消息发送失败？
A: 检查 access token 是否过期，channel secret 是否正确。

### Q: Webhook 收不到消息？
A: 验证签名，确保服务器可公网访问，使用 ngrok 测试。

### Q: Flex 消息不显示？
A: 检查 JSON 结构是否正确，参考 LINE 官方文档。

### Q: 如何创建 LINE Bot？
A: 访问 https://developers.line.me，创建 Provider 和 Channel。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 LINE 扩展 CLAUDE.md 文档
- ✅ 记录 Messaging API 接口和配置
- ✅ 补充 Flex 消息和模板示例
- ✅ 添加 API 限制说明
