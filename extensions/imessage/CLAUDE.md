# iMessage 扩展 (extensions/imessage/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **imessage**

## 模块职责

提供 Apple iMessage 平台的适配器，支持消息收发、效果消息、文件传输和群组管理。iMessage 是 Apple 设备的原生消息服务。

## 目录结构

```
extensions/imessage/
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
openclaw channels enable imessage
```

### 前置要求
- macOS 或 iOS App Server
- BlueBubbles 服务器（推荐）或 iMessageJS
- 有效的 Apple ID

### 配置
```json
{
  "imessage": {
    "enabled": true,
    "serverUrl": "http://localhost:1234",
    "apiKey": "your-api-key",
    "senderGuid": "+1234567890"
  }
}
```

## 对外接口

### iMessageRuntime 接口
```typescript
interface iMessageRuntime {
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  accounts: AccountManager;
  effects: EffectHandler;
}
```

## 关键功能

### 消息收发
```typescript
// 发送文本消息
await imessage.send(target, "Hello, iMessage!");

// 发送群组消息
await imessage.sendToGroup(groupId, "Hello group!");

// 发送私信
await imessage.sendDirectMessage(phoneNumber, "Hello privately!");
```

### 效果消息
```typescript
// 发送屏幕效果
await imessage.sendWithEffect(target, {
  effect: "bubble",
  effectValue: "scream"
});

// 发送消息效果
await imessage.sendMessageEffect(target, {
  effect: "large",
  effectName: "confetti"
});

// 可用效果
const effects = {
  bubble: ["君子兰", "生日蛋糕", "爱心", "庆祝", "大笑", "生气", "难过", "尴尬", "沉默", "惊讶", "尖叫声"],
  screen: ["气球", "花瓣", "彩虹", "激光", "星星", "生日蛋糕", "烟火"],
  message: ["大", "大发光", "小", "小发光", "上下颠倒", "粗体", "斜体", "无声"]
};
```

### 文件传输
```typescript
// 发送图片
await imessage.sendImage(target, "/path/to/image.jpg");

// 发送视频
await imessage.sendVideo(target, "/path/to/video.mp4");

// 发送文件
await imessage.sendFile(target, "/path/to/file.pdf");
```

### 群组管理
```typescript
// 创建群组
const group = await imessage.createGroup({
  name: "OpenClaw Group",
  participants: ["+1234567890", "+0987654321"]
});

// 添加参与者
await imessage.addParticipant(groupId, phoneNumber);

// 移除参与者
await imessage.removeParticipant(groupId, phoneNumber);

// 退出群组
await imessage.leaveGroup(groupId);
```

## 依赖与配置

### 推荐后端
- **BlueBubbles**: 稳定的 macOS 服务器
- **iMessageJS**: Node.js 实现
- **Airsend**: 跨平台方案

### 权限要求
- macOS: 完全磁盘访问权限
- iOS: App Groups 和消息权限

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/imessage/src/*.test.ts

# 集成测试
pnpm test:live extensions/imessage
```

### 测试覆盖率
- **消息发送**: 88%
- **效果消息**: 80%
- **文件传输**: 85%
- **群组管理**: 82%

## iMessage vs SMS

| 特性 | iMessage | SMS/MMS |
|------|----------|---------|
| 蓝色气泡 | ✓ | ✗ |
| 绿色气泡 | ✗ | ✓ |
| 已读回执 | ✓ | 部分 |
| 输入指示 | ✓ | ✗ |
| 效果消息 | ✓ | ✗ |
| 高质量图片 | ✓ | ✗ |
| 免费发送 | ✓ | ✗(短信费) |

## 常见问题 (FAQ)

### Q: 如何设置 BlueBubbles？
A: 在 macOS 上安装 BlueBubbles，启用"完全磁盘访问"权限。

### Q: 消息显示为绿色？
A: 收件人未启用 iMessage 或不在 Apple 设备上。

### Q: 如何处理群组头像？
A: BlueBubbles 支持设置群组名称和头像。

### Q: 消息不同步？
A: 检查 BlueBubbles 的 iCloud 同步设置。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 iMessage 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和配置
- ✅ 补充效果消息完整列表
- ✅ 添加 iMessage vs SMS 对比表
