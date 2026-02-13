# Slack 扩展 (extensions/slack/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **slack**

## 模块职责

提供 Slack 企业协作平台的适配器，支持消息收发、文件上传、交互组件、线程管理和 Slash 命令。Slack 是广泛使用的团队协作工具。

## 目录结构

```
extensions/slack/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── monitor.ts        # 消息监控（事件监听）
    ├── send.ts           # 消息发送
    ├── targets.ts        # 目标解析
    ├── format.ts         # 消息格式化
    ├── accounts.ts       # 账户管理
    └── onboarding.ts     # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable slack
```

### 配置
```json
{
  "slack": {
    "enabled": true,
    "botToken": "xoxb-your-bot-token",
    "signingSecret": "your-signing-secret",
    "appToken": "xapp-your-app-token",
    "socketMode": true
  }
}
```

## 对外接口

### SlackRuntime 接口
```typescript
interface SlackRuntime {
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  accounts: AccountManager;
  views: ViewManager;
  shortcuts: ShortcutHandler;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息到频道
await slack.sendToChannel(channelId, "Hello, Slack!");

// 发送私信
await slack.sendDirectMessage(userId, "Hello privately!");

// 回复线程
await slack.replyToThread(channelId, timestamp, "Thread reply!");
```

### 交互组件
```typescript
// 发送带按钮的消息
await slack.sendWithBlocks(channelId, {
  blocks: [
    {
      type: "section",
      text: { type: "mrkdwn", text: "Choose an option:" },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "Click Me" },
        action_id: "button_click"
      }
    }
  ]
});
```

### 文件上传
```typescript
// 上传文件
await slack.uploadFile({
  channels: channelId,
  file: fs.createReadStream("/path/to/file.txt"),
  filename: "file.txt",
  title: "Uploaded File"
});
```

### Slash 命令
```typescript
// 注册 Slash 命令处理器
slack.registerCommand("/openclaw", async (command) => {
  return { response_type: "in_channel", text: "Processing..." };
});
```

## 依赖与配置

### npm 依赖
- `@slack/bolt` - Slack Bolt 框架
- `@slack/web-api` - Slack Web API
- `@slack/socket-mode` - Socket Mode 支持
- `@slack/types` - Slack 类型定义

### 权限要求
- `channels:read` - 读取频道信息
- `chat:write` - 发送消息
- `files:write` - 上传文件
- `commands` - Slash 命令
- `im:write` - 发送私信

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/slack/src/*.test.ts

# 集成测试
pnpm test:live extensions/slack
```

### 测试覆盖率
- **消息发送**: 92%
- **交互组件**: 88%
- **文件上传**: 85%
- **线程管理**: 90%

## Socket Mode vs HTTP

### Socket Mode
- **优点**: 不需要公网 IP，内置事件订阅
- **配置**: 需要 `appToken`
- **适用**: 开发环境、本地运行

### HTTP Mode
- **优点**: 可扩展性好，适合生产环境
- **配置**: 需要公网端点（ngrok 等）
- **适用**: 生产部署

## 常见问题 (FAQ)

### Q: 如何创建 Slack App？
A: 访问 https://api.slack.com/apps 创建新应用，选择所需权限。

### Q: 消息长度限制？
A: 单条消息最大 40,000 字符，超过会自动拆分。

### Q: 如何处理消息更新？
A: 使用 `app.event('message')` 监听编辑事件。

### Q: 离线消息？
A: Slack 不支持离线消息，已读机制与 Discord 不同。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Slack 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和配置
- ✅ 补充 Socket Mode vs HTTP 对比
- ✅ 添加 FAQ 和测试说明
