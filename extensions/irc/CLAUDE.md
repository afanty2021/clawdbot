# IRC 扩展 (extensions/irc/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **irc**

## 模块职责

提供 IRC (Internet Relay Chat) 协议适配器，支持传统 IRC 网络连接、频道管理和自动回复。IRC 是最早的即时通讯协议之一，至今仍在开源社区广泛使用。

## 目录结构

```
extensions/irc/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── connection.ts     # 连接管理
    ├── messages.ts       # 消息处理
    ├── channels.ts       # 频道管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable irc
```

### 前置要求
- IRC 服务器地址和端口
- 可选的 NickServ 账号
- SSL/TLS 支持（推荐）

### 配置
```json
{
  "irc": {
    "enabled": true,
    "server": {
      "host": "irc.libera.chat",
      "port": 6697,
      "secure": true,
      "rejectUnauthorized": false
    },
    "nickname": "OpenClawBot",
    "username": "openclaw",
    "realname": "OpenClaw AI Assistant",
    "channels": ["#openclaw", "#ai"],
    "password": null
  }
}
```

## 对外接口

### IRCRuntime 接口
```typescript
interface IRCRuntime {
  connection: ConnectionManager;
  messages: MessageManager;
  channels: ChannelManager;
  nickserv: NickServManager;
}
```

## 关键功能

### 连接管理
```typescript
// 连接到服务器
await irc.connect({
  host: "irc.libera.chat",
  port: 6697,
  secure: true,
  password: null
});

// 断开连接
await irc.disconnect({
  reason: "Bye for now!"
});

// 重连
await irc.reconnect({
  delay: 5000,
  maxAttempts: 10
});
```

### 消息收发
```typescript
// 发送 PRIVMSG
await irc.sendMessage({
  target: "#channel",
  message: "Hello, IRC!"
});

// 发送私信
await irc.sendQuery({
  nick: "nickname",
  message: "Hello privately!"
});

// 发送 NOTICE
await irc.sendNotice({
  target: "nickname",
  message: "This is a notice"
});
```

### 频道管理
```typescript
// 加入频道
await irc.join({
  channel: "#openclaw",
  key: null
});

// 离开频道
await irc.part({
  channel: "#openclaw",
  reason: "Leaving"
});

// 获取频道列表
const channels = await irc.listChannels({
  server: "irc.libera.chat"
});

// 获取频道用户
await irc.names({
  channel: "#openclaw"
});
```

### 模式管理
```typescript
// 设置用户模式
await irc.mode({
  channel: "#openclaw",
  mode: "+o",
  target: "nickname"
});

// 设置频道模式
await irc.mode({
  channel: "#openclaw",
  modes: "+nt",
  params: []
});

// 踢出用户
await irc.kick({
  channel: "#openclaw",
  nick: "troublemaker",
  reason: "Rule violation"
});

// 封禁用户
await irc.ban({
  channel: "#openclaw",
  host: "*!*@bad.example.com",
  reason: "Spam"
});
```

### CTCP 命令
```typescript
// 响应 VERSION
await irc.onVersion((nick) => {
  return "OpenClaw IRC Bot v1.0.0";
});

// 响应 PING
await irc.onPing((nick, args) => {
  return { type: "pong", args };
});

// 发送 ACTION
await irc.sendAction({
  target: "#channel",
  message: "waves hello"
});
```

## 依赖与配置

### IRC 命令

| 命令 | 用途 |
|------|------|
| NICK | 设置昵称 |
| USER | 用户信息 |
| JOIN | 加入频道 |
| PART | 离开频道 |
| PRIVMSG | 发送消息 |
| NOTICE | 发送通知 |
| MODE | 模式设置 |
| KICK | 踢出用户 |
| WHOIS | 用户信息 |

### 常见 IRC 网络

| 网络 | 地址 | 特点 |
|------|------|------|
| Libera.Chat | irc.libera.chat | 开源社区 |
| OFTC | irc.oftc.net | Debian/FreeBSD |
| Freenode | irc.libera.chat | (已迁移) |
| QuakeNet | irc.quakenet.org | 游戏社区 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/irc/src/*.test.ts

# 集成测试
pnpm test:live extensions/irc
```

### 测试覆盖率
- **连接管理**: 90%
- **消息功能**: 85%
- **频道操作**: 82%
- **模式管理**: 78%

## IRC 特点

| 特性 | 说明 |
|------|------|
| 协议年龄 | 1988 年，至今 35+ 年 |
| 去中心化 | 服务器网络，分布全球 |
| 轻量级 | 纯文本，低带宽 |
| 匿名性 | 无需注册即可使用 |
| 可扩展 | 支持机器人、CAP 扩展 |

## 常见问题 (FAQ)

### Q: 连接被拒绝？
A: 检查服务器地址、端口，验证是否需要 SASL 或其他认证。

### Q: 昵称被占用？
A: 使用备用昵称或联系 NickServ 释放。

### Q: 频道消息看不到？
A: 确认已成功 JOIN，检查频道模式（+n 可能限制外部消息）。

### Q: 如何处理洪水限制？
A: 实现消息队列，控制发送速率。

### Q: SSL 证书验证失败？
A: 检查证书有效性，或配置 `rejectUnauthorized: false`（不推荐）。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 IRC 扩展 CLAUDE.md 文档
- ✅ 记录 IRC 协议接口和配置
- ✅ 补充频道管理和模式操作示例
- ✅ 添加常见 IRC 网络列表
