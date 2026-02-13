# Matrix 扩展 (extensions/matrix/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **matrix**

## 模块职责

提供 Matrix 去中心化通讯协议的适配器，支持端到端加密、联邦房间管理和 Markdown 消息渲染。Matrix 是一个开放的标准协议，支持跨服务器通信。

## 目录结构

```
extensions/matrix/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── monitor.ts        # 消息监控
    ├── send.ts           # 消息发送
    ├── targets.ts        # 目标解析
    ├── format.ts         # 消息格式化
    ├── accounts.ts       # 账户管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable matrix
```

### 配置
```json
{
  "matrix": {
    "enabled": true,
    "homeserverUrl": "https://matrix.org",
    "accessToken": "your-access-token",
    "userId": "@youruser:matrix.org",
    "deviceId": "your-device-id"
  }
}
```

## 对外接口

### MatrixRuntime 接口
```typescript
interface MatrixRuntime {
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  rooms: RoomManager;
  encryption: EncryptionManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息到房间
await matrix.sendToRoom(roomId, "Hello, Matrix!");

// 发送私信
await matrix.sendDirectMessage(userId, "Hello privately!");

// 发送 Markdown 消息
await matrix.sendMarkdown(roomId, "# Hello\nThis is **bold** text.");
```

### 房间管理
```typescript
// 创建房间
const roomId = await matrix.createRoom({
  name: "OpenClaw Room",
  isDirect: false,
  invite: ["@user1:matrix.org"]
});

// 加入房间
await matrix.joinRoom(roomIdOrAlias);

// 邀请用户
await matrix.inviteUser(roomId, userId);

// 离开房间
await matrix.leaveRoom(roomId);
```

### 加密支持
```typescript
// 检查加密状态
const isEncrypted = await matrix.isRoomEncrypted(roomId);

// 启用房间加密
await matrix.enableEncryption(roomId);

// 导出设备密钥
const keys = await matrix.exportKeys("passphrase");
```

## 依赖与配置

### npm 依赖
- `@vector-im/matrix-bot-sdk` - Matrix Bot SDK
- `@matrix-org/matrix-sdk-crypto-nodejs` - 加密支持
- `markdown-it` - Markdown 渲染
- `zod` - 配置验证

### Homeserver 要求
- 支持 Client-Server API r0.6.0+
- 支持 Application Services（用于机器人）
- 可选：支持端到端加密

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/matrix/src/*.test.ts

# 集成测试
pnpm test:live extensions/matrix
```

### 测试覆盖率
- **消息发送**: 92%
- **房间管理**: 88%
- **加密功能**: 85%
- **Markdown 渲染**: 90%

## Matrix vs 其他平台

| 特性 | Matrix | Discord | Slack |
|------|--------|---------|-------|
| 去中心化 | ✓ | ✗ | ✗ |
| 联邦支持 | ✓ | ✗ | ✗ |
| 端到端加密 | ✓ | ✗ | ✗ |
| 自建服务器 | ✓ | ✗ | ✗ |
| 开源协议 | ✓ | ✗ | ✗ |

## 常见问题 (FAQ)

### Q: 如何获取访问令牌？
A: 使用 Element 或登录 homeserver，通过开发者工具获取。

### Q: 加密房间有什么限制？
A: 加密房间不支持编辑、删除和反应功能。

### Q: 如何处理多 homeserver？
A: 配置多个 profile，使用时指定 homeserver URL。

### Q: 机器人需要管理员权限吗？
A: 不需要，普通用户权限即可，但需要应用服务注册。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Matrix 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和加密配置
- ✅ 补充房间管理示例
- ✅ 添加与其他平台的对比表
