# Google Chat 扩展 (extensions/googlechat/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **googlechat**

## 模块职责

提供 Google Chat 平台适配器，支持 HTTP Webhook 和 Google Chat API 集成。Google Chat 是 Google Workspace 的一部分，与 Gmail、Docs 等工具深度集成。

## 目录结构

```
extensions/googlechat/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── webhook.ts        # Webhook 处理
    ├── cards.ts          # 卡片消息
    ├── spaces.ts         # 空间管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable googlechat
```

### 前置要求
- Google Cloud Console 项目
- 启用的 Google Chat API
- 服务账号或 OAuth 凭据

### 配置
```json
{
  "googlechat": {
    "enabled": true,
    "projectId": "your-project-id",
    "locationId": "spaces",
    "threadKey": null,
    "authType": "service_account", // service_account, oauth
    "credentials": {
      "type": "service_account",
      "privateKey": "-----BEGIN PRIVATE KEY-----\n...",
      "clientEmail": "service@project.iam.gserviceaccount.com"
    }
  }
}
```

## 对外接口

### GoogleChatRuntime 接口
```typescript
interface GoogleChatRuntime {
  webhook: WebhookManager;
  spaces: SpaceManager;
  cards: CardBuilder;
  members: MemberManager;
}
```

## 关键功能

### Webhook 消息
```typescript
// 通过 Webhook 发送消息
await googlechat.sendViaWebhook({
  webhookUrl: "https://chat.googleapis.com/...",
  text: "Hello, Google Chat!"
});

// 发送卡片消息
await googlechat.sendCard({
  webhookUrl: "https://chat.googleapis.com/...",
  cardsV2: {
    cardId: "openclaw-card",
    card: {
      header: {
        title: "OpenClaw Alert",
        subtitle: "AI Assistant",
        imageUrl: "https://example.com/icon.png"
      },
      sections: [
        {
          header: "Details",
          widgets: [
            { textParagraph: { text: "**Message:** Hello from OpenClaw!" } }
          ]
        }
      ]
    }
  }
});
```

### 空间（Space）管理
```typescript
// 列出空间
const spaces = await googlechat.listSpaces({
  pageSize: 10
});

// 获取空间详情
const space = await googlechat.getSpace({
  name: "spaces/space-id"
});

// 创建空间
const newSpace = await googlechat.createSpace({
  displayName: "OpenClaw Bot"
});
```

### 卡片消息
```typescript
// 构建卡片
const card = googlechat.buildCard({
  header: {
    title: "Card Title",
    subtitle: "Subtitle"
  },
  sections: [
    {
      header: "Section 1",
      widgets: [
        { textParagraph: { text: "Some text" } },
        { decoratedText: { text: "Value", startIcon: { icon: "STAR" } } }
      ]
    }
  ],
  actions: [
    {
      function: "openClawFunction",
      text: "Execute"
    }
  ]
});

// 发送卡片
await googlechat.sendCard({
  space: "spaces/space-id",
  card: card
});
```

### 成员管理
```typescript
// 列出成员
const members = await googlechat.listMembers({
  parent: "spaces/space-id"
});

// 邀请用户
await googlechat.inviteMember({
  parent: "spaces/space-id",
  member: {
    member: "user@domain.com"
  }
});
```

## 依赖与配置

### Google API 范围
| OAuth 范围 | 用途 |
|-----------|------|
| `https://www.googleapis.com/auth/chat.bot` | 机器人完整权限 |
| `https://www.googleapis.com/auth/chat.readonly` | 只读访问 |
| `https://www.googleapis.com/auth/chat.spaces` | 空间管理 |

### 卡片组件

| 组件 | 用途 |
|------|------|
| Header | 卡片标题 |
| Sections | 内容分区 |
| Widgets | 文本、按钮、输入 |
| DecoratedText | 带图标的文本 |
| KeyValue | 键值对 |
| ButtonList | 按钮列表 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/googlechat/src/*.test.ts

# 集成测试
pnpm test:live extensions/googlechat
```

### 测试覆盖率
- **Webhook 消息**: 92%
- **卡片构建**: 88%
- **空间管理**: 85%
- **成员管理**: 82%

## Google Chat vs Slack vs Microsoft Teams

| 特性 | Google Chat | Slack | Teams |
|------|-------------|-------|-------|
| Google 集成 | ✓ | ✗ | ✗ |
| 免费版 | ✓ | ✓(限制) | ✓(限制) |
| 线程 | ✓ | ✓ | ✓ |
| 卡片系统 | ✓ | Block Kit | Adaptive Card |
| Bot 框架 | Chat API | Bolt | Bot Framework |

## 常见问题 (FAQ)

### Q: 机器人不响应？
A: 检查 Google Chat API 是否启用，验证凭据权限。

### Q: 卡片消息不显示？
A: 确保 JSON 结构符合 Google Chat 规范，使用 cardsV2。

### Q: 如何获取 space ID？
A: 通过 listSpaces API 或 Google Chat 机器人设置页面。

### Q: 支持互动卡片吗？
A: 是的，使用 OnClick 动作和函数回调。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Google Chat 扩展 CLAUDE.md 文档
- ✅ 记录 Webhook 和 API 接口
- ✅ 补充卡片消息构建示例
- ✅ 添加 Google Chat 对比表
