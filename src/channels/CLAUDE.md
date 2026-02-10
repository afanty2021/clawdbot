# 通信渠道模块 (src/channels/)

[根目录](../../CLAUDE.md) > [src](../CLAUDE.md) > **channels**

## 模块职责

提供通信渠道的抽象层和插件系统，支持多平台消息收发。该模块定义了渠道插件接口、实现渠道发现和加载机制、管理渠道配置和状态。目前大多数具体渠道已迁移到 `extensions/` 目录，此模块保留核心抽象和桥接逻辑。

## 目录结构

```
src/channels/
├── plugins/            # 渠道插件系统
│   ├── catalog.ts      # 插件目录
│   ├── load.ts         # 插件加载器
│   ├── types.ts        # 插件类型定义
│   ├── registry.ts     # 插件注册表
│   └── auto-enable.ts  # 自动启用逻辑
├── allowlists/         # 允许名单
│   └── allowlist.ts
├── dock.ts             # 渠道停靠站
├── registry.ts         # 渠道注册表
├── channel-config.ts   # 渠道配置
├── dock.ts             # 渠道对接管理
├── targets.ts          # 目标解析
├── session.ts          # 会话管理
├── location.ts         # 位置信息
├── typing.ts           # 打字状态
├── ack-reactions.ts    # 确认反应
├── chat-type.ts        # 聊天类型
├── sender-identity.ts  # 发送者身份
├── sender-label.ts     # 发送者标签
├── conversation-label.ts  # 会话标签
├── mention-gating.ts   # @提及控制
├── command-gating.ts   # 命令控制
├── reply-prefix.ts     # 回复前缀
├── logging.ts          # 日志记录
└── web/                # Web 渠道（旧版）
```

## 入口与启动

### 主入口
- **`src/channels/registry.ts`** - 渠道注册表
- **`src/channels/plugins/load.ts`** - 插件加载器

### 启动流程
```typescript
import { ChannelRegistry } from "./channels/registry.ts";
import { loadPlugins } from "./channels/plugins/load.ts";

const registry = new ChannelRegistry();
await loadPlugins(registry);
await registry.initialize();
```

## 对外接口

### ChannelRegistry 接口
```typescript
interface ChannelRegistry {
  getPlugin(id: string): ChannelPlugin | undefined;
  getPlugins(): ChannelPlugin[];
  isEnabled(id: string): boolean;
  enablePlugin(id: string): void;
  disablePlugin(id: string): void;
  getStatus(): ChannelStatus[];
}
```

### ChannelPlugin 接口
```typescript
interface ChannelPlugin {
  id: string;
  meta: ChannelMeta;
  runtime: ChannelRuntime;
  onboarding?: OnboardingHandler;
}

interface ChannelMeta {
  id: string;
  name: string;
  platform: string;
  version: string;
  capabilities: ChannelCapability[];
}

interface ChannelRuntime {
  monitor: ChannelMonitor;
  targets: TargetResolver;
  sender: MessageSender;
  accounts: AccountManager;
}
```

### ChannelMonitor 接口
```typescript
interface ChannelMonitor {
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(callback: (message: InboundMessage) => void): void;
  onConnect(callback: (connection: ChannelConnection) => void): void;
  onDisconnect(callback: (connection: ChannelConnection) => void): void;
}
```

### TargetResolver 接口
```typescript
interface TargetResolver {
  parseTarget(raw: string): ChannelTarget;
  validateTarget(target: ChannelTarget): boolean;
  getDisplayName(target: ChannelTarget): string;
}
```

### MessageSender 接口
```typescript
interface MessageSender {
  send(target: ChannelTarget, message: OutboundMessage): Promise<void>;
  sendReaction(target: ChannelTarget, reaction: Reaction): Promise<void>;
  sendTyping(target: ChannelTarget, typing: boolean): Promise<void>;
}
```

## 子模块详解

### 1. 插件系统 (`plugins/`)

**职责**：动态加载和管理渠道插件

**关键文件**：
- `catalog.ts` - 插件目录扫描
- `load.ts` - 插件加载实现
- `types.ts` - 插件接口类型
- `registry.ts` - 插件注册表

**加载优先级**：
1. 用户配置目录 (`~/.config/openclaw/plugins/`)
2. 工作区插件 (`plugins/`)
3. 全局插件 (`~/.local/share/openclaw/plugins/`)
4. 内置插件 (`extensions/`)

### 2. 渠道配置 (`channel-config.ts`)

**职责**：渠道配置模式定义、配置验证

**关键文件**：
- `channel-config.ts` - 配置模式
- `config/schema.ts` - Zod Schema 定义

### 3. 渠道停靠站 (`dock.ts`)

**职责**：管理渠道的生命周期和状态

**功能**：
- 渠道启动/停止
- 状态监控
- 错误恢复
- 负载均衡

### 4. 目标解析 (`targets.ts`)

**职责**：解析和验证消息目标

**目标类型**：
- `direct` - 私聊
- `group` - 群组
- `channel` - 频道
- `thread` - 线程

### 5. 身份与标签

**职责**：管理发送者身份和会话标签

**关键文件**：
- `sender-identity.ts` - 发送者身份
- `sender-label.ts` - 发送者标签
- `conversation-label.ts` - 会话标签
- `location.ts` - 位置信息

### 6. 控制功能

**职责**：消息控制和过滤

**关键文件**：
- `mention-gating.ts` - @提及控制
- `command-gating.ts` - 命令控制
- `reply-prefix.ts` - 回复前缀
- `typing.ts` - 打字状态指示

### 7. 确认机制 (`ack-reactions.ts`)

**职责**：消息确认和反应处理

**功能**：
- 消息已读确认
- 表情反应
- 引用回复

## 关键依赖与配置

### 配置文件
```typescript
// src/config/types.channels.ts
interface ChannelsConfig {
  enabled: string[];
  disabled: string[];
  perChannel: {
    [channelId: ChannelId]: ChannelSettings;
  };
}
```

### 环境变量
```bash
CHANNELS_DIR           # 插件目录
CHANNEL_DEFAULT_ENABLED  # 默认启用的渠道
```

## 测试与质量

### 测试文件
- `src/channels/**/*.test.ts` - 单元测试
- `src/channels/**/*.e2e.test.ts` - 端到端测试

### 测试命令
```bash
pnpm test src/channels
pnpm test src/channels/plugins
```

## 常见问题 (FAQ)

### Q: 如何添加新渠道？
A: 在 `extensions/` 目录创建新插件，实现 `ChannelPlugin` 接口。

### Q: 如何禁用某个渠道？
A: 在配置文件的 `channels.disabled` 列表中添加渠道 ID。

### Q: 渠道间消息如何路由？
A: 使用 `targets.ts` 中的解析器，根据消息目标选择对应渠道。

## 相关文件清单

### 核心文件
- `src/channels/registry.ts` - 渠道注册表
- `src/channels/plugins/load.ts` - 插件加载器
- `src/channels/dock.ts` - 渠道停靠站

### 类型文件
- `src/channels/plugins/types.ts` - 插件类型
- `src/config/types.channels.ts` - 配置类型

### 扩展参考
- `extensions/*/src/runtime.ts` - 各渠道运行时实现

## 变更记录

### 2026-02-10 - 创建渠道模块文档
- ✅ 创建 `src/channels/CLAUDE.md` 文档
- 📋 记录插件系统和接口定义
- 🔗 建立渠道导航结构


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 10, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #2212 | 10:30 AM | 🟣 | Documentation coverage campaign achieved 100% core module coverage | ~546 |
| #2207 | 10:25 AM | 🟣 | Documentation coverage significantly improved - 10 new CLAUDE.md files created | ~538 |
| #2189 | 10:21 AM | 🟣 | Created three CLAUDE.md files for channels, config, and sessions modules | ~367 |
</claude-mem-context>