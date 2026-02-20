# 设备配对模块 (src/pairing/)

[根目录](../CLAUDE.md) > **pairing**

## 模块职责

OpenClaw 设备配对功能，用于安全地连接新设备到现有系统。支持配对码生成、配对状态管理和配对消息处理。

## 目录结构

```
src/pairing/
├── pairing-store.ts      # 配对存储
├── setup-code.ts         # 设置码生成
├── pairing-messages.ts   # 配对消息
├── pairing-labels.ts     # 配对标签
└── bindings.ts           # 绑定关系 (routing 模块)
```

## 核心功能

### 1. 配对存储 (`pairing-store.ts`)

```typescript
// 配对数据
interface PairingData {
  code: string;
  status: "pending" | "completed" | "expired";
  createdAt: Date;
  expiresAt: Date;
  deviceId?: string;
}

// 配对存储
interface PairingStore {
  createPairing(): Promise<string>;  // 创建配对码
  getPairing(code: string): Promise<PairingData | null>;
  completePairing(code: string, deviceId: string): Promise<void>;
  expirePairing(code: string): Promise<void>;
}
```

### 2. 设置码生成 (`setup-code.ts`)

```typescript
// 生成设置码
function generateSetupCode(): string

// 验证设置码
function validateSetupCode(code: string): boolean

// 设置码格式: XXXX-XXXX-XXXX-XXXX
```

### 3. 配对消息 (`pairing-messages.ts`)

```typescript
// 配对消息类型
interface PairingMessage {
  type: "pairing-request" | "pairing-response" | "pairing-complete";
  code: string;
  deviceId: string;
  deviceName?: string;
}
```

### 4. 绑定关系 (`bindings.ts`)

位于 `src/routing/bindings.ts`，管理设备绑定：

```typescript
// 设备绑定
interface DeviceBinding {
  deviceId: string;
  accountId: string;
  channels: string[];
  capabilities: string[];
}
```

## 配对流程

```
设备 A (现有)          设备 B (新)
    |                      |
    |  1. 生成配对码        |
    |--------------------->|
    |    XXXX-XXXX         |
    |                      |
    |  2. 验证配对码        |
    |<---------------------|
    |                      |
    |  3. 确认配对          |
    |--------------------->|
    |                      |
    |  4. 绑定设备          |
    |<=====================>|
```

## 对外接口

```typescript
// 配对管理
export { createPairingStore } from "./pairing-store.js";
export { generateSetupCode, validateSetupCode } from "./setup-code.js";

// 绑定管理
export * from "./routing/bindings.js";
```

## 相关模块

- **`src/routing/`** - 路由和绑定
- **`src/channels/`** - 渠道配对

## 变更记录

### 2026-02-20 - 创建设备配对模块文档
- ✅ 创建 `src/pairing/CLAUDE.md` 文档
- 📋 记录配对流程
- 🔗 建立配对消息说明
