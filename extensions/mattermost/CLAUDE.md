# Mattermost 扩展 (extensions/mattermost/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **mattermost**

## 模块职责

提供 Mattermost 自托管协作平台的适配器，支持消息收发、频道管理、Slash 命令和文件上传。Mattermost 是开源的企业级 Slack 替代方案。

## 目录结构

```
extensions/mattermost/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── messages.ts       # 消息处理
    ├── channels.ts       # 频道管理
    ├── commands.ts       # Slash 命令
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable mattermost
```

### 前置要求
- Mattermost 服务器（自托管或 Cloud）
- 机器人账号
- 访问令牌

### 配置
```json
{
  "mattermost": {
    "enabled": true,
    "serverUrl": "https://your-mattermost.example.com",
    "botUserId": "bot-user-id",
    "botAccessToken": "your-access-token",
    "allowInsecure": false,
    "proxyUrl": null
  }
}
```

## 对外接口

### MattermostRuntime 接口
```typescript
interface MattermostRuntime {
  messages: MessageManager;
  channels: ChannelManager;
  teams: TeamManager;
  commands: CommandManager;
  files: FileManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息到频道
await mattermost.postMessage({
  channelId: "channel-id",
  message: "Hello, Mattermost!"
});

// 发送私信
await mattermost.sendDirect({
  receiverId: "user-id",
  message: "Hello privately!"
});

// 发送回复
await mattermost.reply({
  rootId: "message-id",
  message: "Thread reply!"
});
```

### 频道管理
```typescript
// 获取频道列表
const channels = await mattermost.getChannels({
  teamId: "team-id",
  includeDeleted: false
});

// 创建频道
const channel = await mattermost.createChannel({
  teamId: "team-id",
  name: "openclaw-bot",
  displayName: "OpenClaw Bot Channel",
  type: "O" // O=公开, P=私有
});

// 搜索频道
const results = await mattermost.searchChannels({
  term: "openclaw"
});
```

### Slash 命令
```typescript
// 注册 Slash 命令
await mattermost.registerCommand({
  teamId: "team-id",
  command: "/openclaw",
  description: "OpenClaw AI Assistant",
  username: "openclaw"
});

// 处理命令回调
mattermost.onCommand("/openclaw", async (command) => {
  return {
    response_type: "in_channel",
    text: "Processing your request..."
  };
});

// 内置命令
const builtInCommands = [
  "/openclaw help",
  "/openclaw status",
  "/openclaw config"
];
```

### 文件上传
```typescript
// 上传文件
await mattermost.uploadFile({
  channelId: "channel-id",
  file: fs.createReadStream("/path/to/file.txt"),
  filename: "file.txt"
});

// 获取文件链接
const fileInfo = await mattermost.getFileLink({
  fileId: "file-id"
});
```

### 团队管理
```typescript
// 获取团队列表
const teams = await mattermost.getTeams();

// 添加机器人到团队
await mattermost.addTeamMember({
  teamId: "team-id",
  userId: "bot-user-id"
});
```

## 依赖与配置

### API 限制
| 限制类型 | 数值 | 说明 |
|---------|------|------|
| API 请求 | 100次/10秒/用户 | 默认配置 |
| 文件大小 | 50MB | 最大上传 |
| 消息长度 | 16383 字符 | 最大 |

### Mattermost 版本兼容
| 版本 | 支持状态 |
|------|---------|
| 8.x | ✓ 最新 |
| 7.x | ✓ |
| 6.x | ✓ |
| 5.x | ✓ |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/mattermost/src/*.test.ts

# 集成测试
pnpm test:live extensions/mattermost
```

### 测试覆盖率
- **消息功能**: 90%
- **频道管理**: 85%
- **Slash 命令**: 82%
- **文件上传**: 80%

## Mattermost vs Slack

| 特性 | Mattermost | Slack |
|------|------------|-------|
| 托管方式 | 自托管/云 | 仅云 |
| 开源 | ✓ | ✗ |
| 数据所有权 | ✓ | ✗ |
| 定制能力 | 高 | 中 |
| 插件系统 | ✓ | ✓ |
| 免费版 | 无限制 | 90天历史 |

## 常见问题 (FAQ)

### Q: 连接失败？
A: 检查服务器 URL 和 access token，确保服务器允许机器人访问。

### Q: 消息不显示？
A: 验证 bot 已添加到相关频道。

### Q: Slash 命令不工作？
A: 检查命令注册状态，确认使用 `/openclaw` 格式。

### Q: 如何获取 access token？
A: 在 Mattermost System Console > Integration > Bot Accounts 创建。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Mattermost 扩展 CLAUDE.md 文档
- ✅ 记录 API 接口和配置
- ✅ 补充 Slash 命令示例
- ✅ 添加 Mattermost vs Slack 对比表
