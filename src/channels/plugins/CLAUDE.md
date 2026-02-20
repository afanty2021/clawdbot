# 渠道插件系统 (src/channels/plugins/)

[根目录](../../CLAUDE.md) > [channels](../CLAUDE.md) > **plugins**

## 模块职责

OpenClaw 渠道插件系统的核心实现。提供插件发现、加载、配置管理、目录服务和类型定义。

## 目录结构

```
src/channels/plugins/
├── catalog.ts            # 插件目录
├── load.ts               # 插件加载器
├── types.ts              # 核心类型定义
├── types.core.ts         # 核心接口类型
├── types.adapters.ts     # 适配器类型
├── types.plugin.ts       # 插件类型
├── index.ts              # 插件注册
├── helpers.ts            # 辅助函数
├── status.ts             # 状态管理
├── config-helpers.ts     # 配置辅助
├── config-schema.ts      # 配置模式
├── config-writes.ts      # 配置写入
├── media-limits.ts       # 媒体限制
├── message-actions.ts    # 消息操作
├── message-action-names.ts  # 操作名称
├── group-mentions.ts     # 群组提及
├── pairing.ts            # 配对
├── pairing-message.ts    # 配对消息
├── account-helpers.ts    # 账户辅助
├── account-action-gate.ts # 账户操作门控
├── allowlist-match.ts    # 白名单匹配
├── whatsapp-heartbeat.ts # WhatsApp 心跳
├── slack.actions.ts      # Slack 操作
├── bluebubbles-actions.ts # BlueBubbles 操作
├── directory-config.ts   # 目录配置
├── onboarding-types.ts   # 引导类型
├── onboarding/           # 引导处理器
├── actions/              # 操作处理器
├── agent-tools/          # Agent 工具
├── outbound/             # 出站处理
├── normalize/            # 消息规范化
└── status-issues/        # 状态问题
```

## 核心功能

### 1. 插件目录 (`catalog.ts`)

提供插件发现和目录服务。

**目录来源**：
1. 内置插件 (`extensions/`)
2. 全局插件 (`~/.local/share/openclaw/plugins/`)
3. 工作区插件 (`plugins/`)
4. 配置目录插件 (`~/.config/openclaw/plugins/`)
5. 外部目录 (环境变量或配置指定)

**目录格式**：
```typescript
interface ChannelPluginCatalogEntry {
  id: string;
  meta: ChannelMeta;
  install: {
    npmSpec: string;
    localPath?: string;
    defaultChoice?: "npm" | "local";
  };
}

interface ChannelUiCatalog {
  entries: ChannelUiMetaEntry[];
  order: string[];
  labels: Record<string, string>;
  byId: Record<string, ChannelUiMetaEntry>;
}
```

**目录路径优先级**：
```typescript
const DEFAULT_CATALOG_PATHS = [
  path.join(CONFIG_DIR, "mpm", "plugins.json"),
  path.join(CONFIG_DIR, "mpm", "catalog.json"),
  path.join(CONFIG_DIR, "plugins", "catalog.json"),
];
```

### 2. 插件加载 (`load.ts`)

动态加载渠道插件。

**加载流程**：

```
扫描目录
    ↓
读取插件清单
    ↓
验证插件类型
    ↓
初始化插件
    ↓
注册到系统
```

### 3. 类型系统 (`types*.ts`)

#### 核心类型 (`types.ts`)

```typescript
// 渠道 ID
type ChannelId = string;

// 渠道能力
interface ChannelCapabilities {
  text?: boolean;
  media?: boolean;
  reactions?: boolean;
  editing?: boolean;
  threads?: boolean;
  streaming?: boolean;
}
```

#### 核心接口 (`types.core.ts`)

```typescript
// 渠道元数据
interface ChannelMeta {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  platform: string;
  capabilities: ChannelCapabilities;
}

// 渠道运行时
interface ChannelRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
  monitor: ChannelMonitor;
  sender: MessageSender;
  targets: TargetResolver;
  accounts: AccountManager;
}
```

#### 适配器类型 (`types.adapters.ts`)

```typescript
// 消息适配器
interface ChannelMessagingAdapter {
  sendText(target, text): Promise<void>;
  sendMedia(target, media): Promise<void>;
}

// 组适配器
interface ChannelGroupAdapter {
  listGroups(): Promise<Group[]>;
  getGroupInfo(groupId): Promise<GroupInfo>;
}

// 安全适配器
interface ChannelSecurityAdapter {
  validateDmPolicy(senderId): Promise<boolean>;
  validateGroupPolicy(groupId, senderId): Promise<boolean>;
}
```

### 4. 配置管理

**配置辅助** (`config-helpers.ts`)：
- 获取渠道配置
- 验证配置
- 合并默认配置

**配置写入** (`config-writes.ts`)：
- 更新渠道配置
- 保存配置文件

### 5. 消息操作 (`message-actions.ts`)

支持的消息操作类型：

```typescript
type ChannelMessageActionName =
  | "send"
  | "edit"
  | "delete"
  | "react"
  | "reply"
  | "forward";
```

### 6. 群组提及 (`group-mentions.ts`)

群组消息中的 @ 提及处理：

```typescript
interface GroupMentionContext {
  groupId: string;
  senderId: string;
  text: string;
  mentions: Mention[];
}

function parseGroupMentions(
  text: string,
  members: Member[]
): ParsedMentions
```

### 7. 账户管理 (`account-helpers.ts`)

账户辅助函数：

```typescript
// 创建账户快照
function createAccountSnapshot(params: {
  accountId: string;
  state: ChannelAccountState;
}): ChannelAccountSnapshot

// 账户列表辅助
export function createAccountListHelpers() {
  return {
    listAccounts,
    getAccount,
    addAccount,
    removeAccount,
  };
}
```

### 8. 白名单匹配 (`allowlist-match.ts`)

```typescript
// 检查发送者是否在白名单中
function isAllowlistMatch(
  senderId: string,
  allowlist: Allowlist
): boolean
```

### 9. 出站处理 (`outbound/`)

出站消息的预处理和转换：

```
OutboundMessage
    ↓
验证
    ↓
格式转换
    ↓
┌─────────────┬─────────────┬─────────────┐
│   Text      │   Media     │ Components  │
└─────────────┴─────────────┴─────────────┘
    ↓           ↓             ↓
发送到平台
```

### 10. 消息规范化 (`normalize/`)

平台特定的消息规范化：

- `normalize/slack.ts` - Slack 消息规范化
- `normalize/imessage.ts` - iMessage 消息规范化
- `normalize/telegram.ts` - Telegram 消息规范化

## 对外接口

### 主要导出

```typescript
// 目录服务
export { buildChannelPluginCatalog } from "./catalog.js";
export { buildChannelUiCatalog } from "./catalog.js";

// 插件加载
export { loadChannelPlugins } from "./load.js";

// 类型
export * from "./types.js";
export * from "./types.core.js";
export * from "./types.adapters.js";
export * from "./types.plugin.js";
```

## 相关模块

- **`src/gateway/`** - 网关服务器
- **`extensions/*/`** - 渠道插件实现
- **`src/plugin-sdk/`** - 插件 SDK

## 变更记录

### 2026-02-20 - 创建渠道插件系统文档
- ✅ 创建 `src/channels/plugins/CLAUDE.md` 文档
- 📋 记录插件发现和加载流程
- 🔗 建立类型系统说明
