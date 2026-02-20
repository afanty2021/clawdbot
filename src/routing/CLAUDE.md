# 路由模块 (src/routing/)

[根目录](../CLAUDE.md) > **routing**

## 模块职责

消息路由和会话键管理。负责确定消息应该路由到哪个账户、会话和渠道。

## 目录结构

```
src/routing/
├── session-key.ts        # 会话键管理
├── bindings.ts           # 设备绑定
├── resolve-route.ts      # 路由解析
└── session-key.ts        # 会话键工具
```

## 核心功能

### 1. 会话键 (`session-key.ts`)

```typescript
// 默认账户 ID
const DEFAULT_ACCOUNT_ID = "default";

// 会话键格式: {platform}:{accountId}:{channelId}
type SessionKey = string;

// 规范化账户 ID
function normalizeAccountId(accountId: string): string

// 解析会话键
function parseSessionKey(key: string): {
  platform: string;
  accountId: string;
  channelId: string;
} | null
```

### 2. 绑定关系 (`bindings.ts`)

```typescript
// 设备绑定
interface DeviceBinding {
  deviceId: string;
  accountId: string;
  platform: string;
  capabilities: string[];
}

// 绑定存储
interface BindingStore {
  addBinding(binding: DeviceBinding): Promise<void>;
  getBindings(deviceId: string): Promise<DeviceBinding[]>;
  removeBinding(deviceId: string, accountId: string): Promise<void>;
}
```

### 3. 路由解析 (`resolve-route.ts`)

```typescript
// 路由解析
interface Route {
  accountId: string;
  channelId: string;
  platform: string;
}

// 解析路由
function resolveRoute(params: {
  target: string;
  config: OpenClawConfig;
}): Route
```

## 对外接口

```typescript
// 会话键
export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "./session-key.js";

// 路由
export { resolveRoute } from "./resolve-route.js";
```

## 相关模块

- **`src/pairing/`** - 设备配对
- **`src/sessions/`** - 会话管理

## 变更记录

### 2026-02-20 - 创建路由模块文档
- ✅ 创建 `src/routing/CLAUDE.md` 文档
- 📋 记录会话键管理
- 🔗 建立路由解析说明
