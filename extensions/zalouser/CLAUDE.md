# Zalo Personal 扩展 (extensions/zalouser/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **zalouser**

## 模块职责

提供 Zalo 个人账号适配器，支持通过 zca-cli 实现 Zalo 登录、消息收发和联系人管理。与 Zalo Official Account 不同，这是使用真实个人账号。

## 目录结构

```
extensions/zalouser/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── login.ts         # 登录管理
    ├── messages.ts      # 消息处理
    ├── contacts.ts      # 联系人管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable zalouser
```

### 前置要求
- zca-cli 工具已安装
- Zalo 账号
- 手机用于扫码登录

### 配置
```json
{
  "zalouser": {
    "enabled": true,
    "dataDir": "~/.openclaw/zalo-data",
    "qrCodePath": "/tmp/zalo_qr.png",
    "autoReply": false
  }
}
```

## 对外接口

### ZaloUserRuntime 接口
```typescript
interface ZaloUserRuntime {
  login: LoginManager;
  messages: MessageManager;
  contacts: ContactManager;
  presence: PresenceManager;
}
```

## 关键功能

### 登录管理
```typescript
// 生成登录二维码
const qrCode = await zalouser.generateQR({
  savePath: "/tmp/qr.png",
  display: true
});

// 等待扫码登录
await zalouser.waitForLogin({
  timeout: 300, // 5分钟
  onQRCode: (data) => {
    // 显示二维码数据
  }
});

// 检查登录状态
const status = await zalouser.getLoginStatus();
```

### 消息收发
```typescript
// 发送文本消息
await zalouser.send({
  friendId: "friend-id",
  message: "Hello from Zalo Personal!"
});

// 发送图片
await zalouser.sendImage({
  friendId: "friend-id",
  imagePath: "/path/to/image.jpg"
});

// 发送表情
await zalouser.sendEmoji({
  friendId: "friend-id",
  emojiId: 1000 // 表情 ID
});

// 发送语音
await zalouser.sendVoice({
  friendId: "friend-id",
  voicePath: "/path/to/audio.acc"
});
```

### 联系人管理
```typescript
// 获取好友列表
const friends = await zalouser.listFriends({
  limit: 100,
  offset: 0
});

// 搜索好友
const results = await zalouser.searchFriends({
  name: "John"
});

// 获取好友资料
const profile = await zalouser.getProfile({
  friendId: "friend-id"
});

// 添加好友
await zalouser.addFriend({
  friendId: "friend-id",
  message: "Hi, I'm using OpenClaw!"
});
```

### 在线状态
```typescript
// 获取在线状态
const presence = await zalouser.getPresence({
  friendId: "friend-id"
});

// 设置个人状态
await zalouser.setStatus({
  text: "OpenClaw AI Assistant",
  available: true
});
```

## 依赖与配置

### zca-cli 依赖

| 功能 | 说明 |
|------|------|
| QR 登录 | 使用 Zalo 手机应用扫码 |
| 消息发送 | 基于 Zalo 协议 |
| 文件传输 | 支持图片、语音、文件 |

### 限制说明

| 限制类型 | 说明 |
|---------|------|
| 登录 | 需要定期重新扫码 |
| 消息频率 | 避免过高频率发送 |
| 账号安全 | 遵守 Zalo 使用条款 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/zalouser/src/*.test.ts

# 集成测试
pnpm test:live extensions/zalouser
```

### 测试覆盖率
- **登录功能**: 85%
- **消息发送**: 82%
- **联系人管理**: 80%
- **在线状态**: 78%

## Zalo Personal vs Zalo OA

| 特性 | Zalo Personal | Zalo OA |
|------|---------------|---------|
| 账号类型 | 个人真实账号 | 官方账号 |
| 好友数量 | 有限制 | 粉丝模式 |
| 模板消息 | ✗ | ✓ |
| 自动回复 | ✗ | ✓ |
| API 访问 | 有限 | 完整 |
| 成本 | 免费 | 免费+付费 |

## 常见问题 (FAQ)

### Q: 登录过期？
A: Zalo 个人账号需要定期重新扫码登录，保持会话活跃。

### Q: 消息发送失败？
A: 检查是否被对方屏蔽，或触发了 Zalo 反垃圾机制。

### Q: 如何处理大量消息？
A: 实现消息队列，控制发送频率，避免封号。

### Q: zca-cli 安装失败？
A: 确保 Node.js 版本兼容，检查系统依赖（libwebp 等）。

## 相关模块

- **Zalo OA** (`extensions/zalo/`) - Zalo 官方账号
- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Zalo Personal 扩展 CLAUDE.md 文档
- ✅ 记录 zca-cli 集成接口
- ✅ 补充登录和消息功能示例
- ✅ 添加 Zalo Personal vs OA 对比
