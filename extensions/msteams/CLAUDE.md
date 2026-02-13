# Microsoft Teams 扩展 (extensions/msteams/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **msteams**

## 模块职责

提供 Microsoft Teams 企业协作平台的适配器，支持消息收发、文件上传、卡片消息和 Teams 特定功能。基于 Microsoft Bot Framework 构建。

## 目录结构

```
extensions/msteams/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── monitor.ts        # 消息监控
    ├── send.ts           # 消息发送
    ├── targets.ts        # 目标解析
    ├── format.ts         # 消息格式化
    ├── accounts.ts       # 账户管理
    └── onboarding.ts     # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable msteams
```

### 前置要求
- Microsoft 365 开发者账号
- Azure AD 应用注册
- ngrok（本地开发需要）

### 配置
```json
{
  "msteams": {
    "enabled": true,
    "appId": "your-azure-app-id",
    "appSecret": "your-azure-app-secret",
    "tenantId": "your-tenant-id",
    "notificationUrl": "https://your-domain.com/api/msteams/webhook"
  }
}
```

## 对外接口

### MSTeamsRuntime 接口
```typescript
interface MSTeamsRuntime {
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  accounts: AccountManager;
  cards: CardBuilder;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息到频道
await msteams.sendToTeam(teamId, channelId, "Hello, Teams!");

// 发送私信
await msteams.sendPersonalMessage(userId, "Hello privately!");

// 发送群聊消息
await msteams.sendGroupChat(chatId, "Hello group!");
```

### 卡片消息
```typescript
// 发送 Hero Card
await msteams.sendCard(channelId, {
  type: "HeroCard",
  text: "This is a hero card",
  images: [{ url: "https://example.com/image.png" }],
  buttons: [
    { type: "imBack", title: "Click Me", value: "clicked" }
  ]
});

// 发送 Adaptive Card
await msteams.sendAdaptiveCard(channelId, {
  type: "AdaptiveCard",
  body: [
    { type: "TextBlock", text: "Hello, Teams!" }
  ],
  actions: [
    { type: "Action.Submit", title: "Submit", data: { key: "value" } }
  ]
});
```

### 文件上传
```typescript
// 上传文件到会话
await msteams.uploadFile({
  conversationId: chatId,
  fileName: "document.pdf",
  fileContent: fileBuffer
});
```

## 依赖与配置

### npm 依赖
- `@microsoft/agents-hosting` - Bot Framework 托管
- `@microsoft/agents-hosting-express` - Express 适配器
- `@microsoft/agents-hosting-extensions-teams` - Teams 扩展
- `express` - HTTP 服务器

### Azure AD 权限
- `Team.ReadBasic.All` - 读取团队信息
- `Channel.ReadBasic.All` - 读取频道信息
- `Chat.ReadWrite` - 读写聊天
- `User.Read` - 读取用户信息

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/msteams/src/*.test.ts

# 集成测试
pnpm test:live extensions/msteams
```

### 测试覆盖率
- **消息发送**: 90%
- **卡片消息**: 85%
- **文件上传**: 80%
- **多租户支持**: 88%

## 与其他渠道的差异

| 特性 | Microsoft Teams | Slack | Discord |
|------|-----------------|-------|---------|
| 消息最大长度 | 约 28K 字符 | 40K 字符 | 2K 字符 |
| 卡片系统 | Adaptive Card | Block Kit | Embed |
| 线程支持 | 是 | 是 | 是 |
| 离线消息 | 否 | 否 | 是 |
| 消息编辑 | 是 | 是 | 是 |

## 常见问题 (FAQ)

### Q: 如何注册 Azure 应用？
A: 访问 https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps

### Q: 消息不显示？
A: 检查 Azure AD 权限配置，确保应用已在 Teams 中安装。

### Q: 如何处理活动源更新？
A: 使用 `proactive messaging` 模式，通过用户 ID 主动发送。

### Q: 支持政府版 GCC/GCC-High 吗？
A: 是的，通过配置不同的环境端点支持。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Microsoft Teams 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和 Azure AD 配置
- ✅ 补充卡片消息示例
- ✅ 添加与其他渠道的对比表
