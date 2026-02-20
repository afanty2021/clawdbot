# 白名单模块 (src/channels/allowlists/)

[根目录](../../CLAUDE.md) > [channels](../CLAUDE.md) > **allowlists**

## 模块职责

渠道消息白名单解析工具，用于验证消息发送者是否在允许列表中。

## 目录结构

```
src/channels/allowlists/
├── allow-from.ts          # 白名单来源解析
└── allowlist.ts          # 白名单匹配
```

## 核心功能

### 1. 白名单来源解析 (`allow-from.ts`)

```typescript
// 解析允许来源配置
function resolveAllowFrom(
  config: DmConfig | GroupConfig
): AllowFrom | null

// 允许来源类型
type AllowFrom =
  | "open"           // 开放给所有人
  | "closed"         // 仅允许特定用户
  | string[]         // 白名单列表
```

### 2. 白名单匹配 (`allowlist.ts`)

```typescript
// 检查发送者是否在白名单中
function isAllowlistMatch(
  senderId: string,
  allowlist: AllowFrom
): boolean

// 检查多个发送者
function checkAllowlistMatch(
  senderIds: string[],
  allowlist: AllowFrom
): boolean[]
```

## 对外接口

```typescript
export { resolveAllowFrom } from "./allow-from.js";
export { isAllowlistMatch } from "./allowlist.js";
```

## 使用示例

```typescript
import { resolveAllowFrom, isAllowlistMatch } from "./channels/allowlists/index.js";

// 解析配置
const allowFrom = resolveAllowFrom(config);

// 检查发送者
if (isAllowlistMatch(senderId, allowFrom)) {
  // 允许处理消息
}
```

## 相关模块

- **`src/channels/plugins/allowlist-match.ts`** - 插件白名单匹配
- **`src/config/types.channels.ts`** - 渠道配置类型

## 变更记录

### 2026-02-20 - 创建白名单模块文档
- ✅ 创建 `src/channels/allowlists/CLAUDE.md` 文档
