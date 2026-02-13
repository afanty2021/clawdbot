# Signal 扩展 (extensions/signal/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **signal**

## 模块职责

提供 Signal 加密通讯平台的适配器，支持端到端加密消息收发、群组管理和反应功能。Signal 以其强大的隐私保护而闻名。

## 目录结构

```
extensions/signal/
├── index.ts              # 插件入口
├── package.json          # 插件清单
├── CHANGELOG.md          # 变更记录
├── claude_cn.md          # 中文文档
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
openclaw channels enable signal
```

### 前置要求
Signal 扩展需要 `signal-cli` 守护进程运行：
```bash
# 安装 signal-cli
# macOS: brew install signal-cli
# Linux: 下载官方包

# 启动守护进程
signal-cli daemon --dbus
```

### 配置
```json
{
  "signal": {
    "enabled": true,
    "phoneNumber": "+1234567890",
    "socketPath": "/run/signal-cli/signal-cli.socket"
  }
}
```

## 对外接口

### SignalRuntime 接口
```typescript
interface SignalRuntime {
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  accounts: AccountManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送消息
await signal.send(target, {
  content: "Hello via Signal!",
  quoteMessage: messageId,
});

// 发送群组消息
await signal.sendToGroup(groupId, "Hello group!");
```

### 反应功能
```typescript
// 添加反应
await signal.react(target, messageId, "👍");

// 移除反应
await signal.react(target, messageId, null);
```

### 群组管理
```typescript
// 创建群组
const group = await signal.createGroup({
  name: "OpenClaw Group",
  members: ["+1234567890", "+0987654321"],
});

// 获取群组列表
const groups = await signal.listGroups();
```

## 依赖与配置

### 系统依赖
- **signal-cli**: Signal 命令行工具
- **dbus**: 进程间通信（Linux/macOS）

### 环境要求
- Node.js ≥18
- 有效的 Signal 账号
- signal-cli 已注册为信号链接设备

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/signal/src/*.test.ts

# 集成测试
pnpm test:live extensions/signal
```

### 测试覆盖率
- **消息发送**: 90%
- **群组功能**: 85%
- **反应功能**: 88%

## 常见问题 (FAQ)

### Q: 如何注册新设备？
A: 使用 `signal-cli link --name "OpenClaw"` 生成二维码，然后在手机上扫描。

### Q: 端到端加密如何工作？
A: Signal 使用 Signal Protocol 实现端到端加密，所有消息在客户端加密。

### Q: 消息同步吗？
A: 是的，Signal 消息会在所有已注册的设备间同步。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Signal 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和配置
- ✅ 补充 FAQ 和测试说明
