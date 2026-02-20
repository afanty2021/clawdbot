---
summary: "Channels 命令实现 - 添加、列出、移除通信渠道"
read_when:
  - 理解渠道管理命令
  - 调试渠道配置问题
  - 添加新的通信平台
title: "Channels 命令子模块"
---

# Channels 命令子模块

> 更新时间：2026-02-20

本模块实现 `openclaw channels` 命令，用于管理通信渠道（WhatsApp、Telegram、Slack 等）。

## 模块概览

```
src/commands/channels/
├── add.ts                  # 添加渠道
├── add-mutators.ts         # 添加配置变更
├── capabilities.ts         # 渠道能力探测
├── list.ts                 # 列出渠道
├── logs.ts                 # 查看渠道日志
├── remove.ts               # 移除渠道
├── resolve.ts              # 解析目标
├── shared.ts               # 共享工具
└── status.ts               # 渠道状态
```

## 核心功能

### 1. 命令入口

**命令**: `openclaw channels`

**子命令**:
- `openclaw channels` - 列出渠道（默认）
- `openclaw channels add` - 添加渠道
- `openclaw channels remove` - 移除渠道
- `openclaw channels status` - 渠道状态
- `openclaw channels capabilities` - 探测能力
- `openclaw channels logs` - 查看日志
- `openclaw channels resolve` - 解析目标

### 2. 添加渠道 (`add.ts`)

**导出**: `channelsAddCommand(opts, runtime, params)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 渠道类型 |
| `--account` | string | 账户 ID |
| `--phone` | string | 手机号（WhatsApp） |
| `--api-id` | string | API ID（Telegram） |
| `--api-hash` | string | API Hash（Telegram） |
| `--token` | string | Bot Token |
| `--initial-sync-limit` | number | 初始同步限制 |
| `--group-channels` | string | 群组白名单 |
| `--dm-allowlist` | string | DM 白名单 |

**支持的渠道**:
- `whatsapp` - WhatsApp
- `telegram` - Telegram
- `slack` - Slack
- `discord` - Discord
- `signal` - Signal
- `imessage` - iMessage
- `line` - LINE
- 等等...

```bash
# 交互式添加
openclaw channels add

# 直接添加 Telegram
openclaw channels add telegram --phone +1234567890

# 添加 Slack Bot
openclaw channels add slack --token xoxb-...
```

### 3. 列出渠道 (`list.ts`)

**导出**: `channelsListCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--all` | boolean | 显示禁用的渠道 |
| `--json` | boolean | JSON 输出 |
| `--plain` | boolean | 纯文本输出 |

**显示信息**:
- 渠道类型
- 账户 ID
- 账户名称
- 状态（已配置/已启用/已连接）
- 支持的功能

### 4. 移除渠道 (`remove.ts`)

**导出**: `channelsRemoveCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 渠道类型 |
| `--account` | string | 账户 ID |
| `--purge` | boolean | 清除所有数据 |

**清理数据**:
- 配置文件
- 会话数据
- 认证凭证
- 更新偏移（Telegram）

```bash
# 移除特定账户
openclaw channels remove --channel telegram --account default

# 移除渠道并清除所有数据
openclaw channels remove --channel slack --purge
```

### 5. 渠道状态 (`status.ts`)

**导出**: `channelsStatusCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 过滤渠道 |
| `--account` | string | 过滤账户 |
| `--json` | boolean | JSON 输出 |

**状态信息**:
- 连接状态
- 认证状态
- 最后活动时间
- 错误信息
- 配置问题

### 6. 能力探测 (`capabilities.ts`)

**导出**: `channelsCapabilitiesCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 渠道类型 |
| `--account` | string | 账户 ID |
| `--target` | string | 目标地址 |
| `--timeout` | string | 探测超时 |
| `--json` | boolean | JSON 输出 |

**探测项目**:
- 支持的聊天类型
- 反应支持
- 编辑支持
- 回复支持
- 轮询支持
- 文件上传
- 权限检查

**平台特定探测**:
- **Discord**: 权限检查
- **Slack**: Scope 验证
- **Teams**: Graph 权限

```bash
# 探测渠道能力
openclaw channels capabilities --channel discord --account default

# 探测特定目标
openclaw channels capabilities --channel telegram --target @username
```

### 7. 日志查看 (`logs.ts`)

**导出**: `channelsLogsCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 渠道类型 |
| `--account` | string | 账户 ID |
| `--tail` | number | 显示最后 N 行 |
| `--follow` | boolean | 持续监控 |

### 8. 目标解析 (`resolve.ts`)

**导出**: `channelsResolveCommand(opts, runtime)`

**功能**: 解析目标地址为标准化格式

**解析结果**:
- 渠道类型
- 账户 ID
- 目标 ID
- 目标类型（用户/频道/群组）

```bash
# 解析目标
openclaw channels resolve telegram:@username
openclaw channels resolve whatsapp:+1234567890
```

### 9. 共享工具 (`shared.ts`)

**导出**:
- `channelLabel(channel)` - 渠道标签
- `formatChannelAccountLabel(...)` - 账户标签
- `requireValidConfig(runtime)` - 加载配置
- `shouldUseWizard(params)` - 是否使用向导

## 类型定义

```typescript
interface ChannelsAddOptions {
  channel?: string;
  account?: string;
  phone?: string;
  apiId?: string;
  apiHash?: string;
  token?: string;
  initialSyncLimit?: number;
  groupChannels?: string;
  dmAllowlist?: string;
}

interface ChannelCapabilities {
  chatTypes?: string[];
  polls?: boolean;
  reactions?: boolean;
  edit?: boolean;
  unsend?: boolean;
  reply?: boolean;
  effects?: boolean;
  threads?: boolean;
}

interface ChannelStatus {
  channel: string;
  accountId: string;
  configured: boolean;
  enabled: boolean;
  connected: boolean;
  lastActivity?: Date;
  error?: string;
}
```

## 相关文档

- [渠道插件系统](../../channels/plugins/CLAUDE.md)
- [渠道目录](../../channels/plugins/catalog.ts)
- [路由系统](../../routing/CLAUDE.md)
- [Telegram 账户](../../telegram/accounts.ts)
- [Slack Scopes](../../slack/scopes.ts)

## 导出索引

```typescript
export { channelsAddCommand } from "./add.js";
export { channelsListCommand } from "./list.js";
export { channelsRemoveCommand } from "./remove.js";
export { channelsStatusCommand } from "./status.js";
export { channelsCapabilitiesCommand } from "./capabilities.js";
export { channelsLogsCommand } from "./logs.js";
export { channelsResolveCommand } from "./resolve.js";

export {
  channelLabel,
  formatChannelAccountLabel,
  requireValidConfig,
  shouldUseWizard,
} from "./shared.js";
```


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>