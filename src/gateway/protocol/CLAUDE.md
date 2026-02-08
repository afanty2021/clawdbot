# Gateway 协议规范 (src/gateway/protocol/)

[根目录](../../../CLAUDE.md) > [src](../../CLAUDE.md) > **gateway/protocol**

## 模块职责

定义 OpenClaw Gateway WebSocket 通信协议，包括消息格式、方法定义、事件类型和客户端认证机制。

## 目录结构

```
src/gateway/protocol/
├── index.ts           # 协议入口，导出所有类型和 Schema
├── client-info.ts     # 客户端信息类型
├── schema.ts          # Schema 快捷导出
└── schema/            # 协议 Schema 定义
    ├── agent.ts           # AI 代理相关
    ├── agents-models-skills.ts  # 代理/模型/技能
    ├── channels.ts        # 渠道相关
    ├── config.ts          # 配置管理
    ├── cron.ts            # 定时任务
    ├── devices.ts         # 设备配对
    ├── exec-approvals.ts  # 执行批准
    ├── frames.ts          # 消息帧定义
    ├── logs-chat.ts       # 日志和聊天
    ├── nodes.ts           # 节点管理
    ├── primitives.ts      # 基础类型
    ├── protocol-schemas.ts # 协议 Schema
    ├── sessions.ts        # 会话管理
    ├── snapshot.ts        # 状态快照
    ├── types.ts           # 通用类型
    └── wizard.ts          # 向导流程
```

## 协议概述

### 通信模型

OpenClaw Gateway 使用 **WebSocket** 协议进行双向通信：

```
客户端                    Gateway
  │                          │
  │────── connect ──────────>│
  │<───── hello-ok ──────────│
  │                          │
  │────── request ──────────>│
  │<───── response ──────────│
  │                          │
  │<───── event ─────────────│
  │                          │
```

### 协议版本

- **当前版本**: 协商确定
- **版本范围**: 客户端指定 `minProtocol` 和 `maxProtocol`
- **向后兼容**: Gateway 支持多版本协议

## 消息格式

### 消息帧类型

所有消息都是 JSON 对象，使用 `type` 字段进行区分：

| 类型 | 值 | 方向 | 描述 |
|------|-----|------|------|
| **connect** | - | 客户端 → Gateway | 连接握手 |
| **hello-ok** | - | Gateway → 客户端 | 连接成功 |
| **req** | "req" | 双向 | 请求消息 |
| **res** | "res" | 双向 | 响应消息 |
| **event** | "event" | Gateway → 客户端 | 事件通知 |

### 连接握手

**客户端 → Gateway**:
```json
{
  "minProtocol": 1,
  "maxProtocol": 2,
  "client": {
    "id": "client-id",
    "displayName": "My Client",
    "version": "1.0.0",
    "platform": "web",
    "mode": "full"
  },
  "auth": {
    "token": "optional-token"
  }
}
```

**Gateway → 客户端**:
```json
{
  "type": "hello-ok",
  "protocol": 2,
  "server": {
    "version": "0.52.8",
    "commit": "abc123",
    "host": "hostname",
    "connId": "conn-123"
  },
  "features": {
    "methods": ["agent.chat", "config.get", ...],
    "events": ["agent.event", "node.event", ...]
  },
  "snapshot": { ... },
  "policy": {
    "maxPayload": 10485760,
    "maxBufferedBytes": 67108864,
    "tickIntervalMs": 30000
  }
}
```

### 请求/响应模式

**请求** (RequestFrame):
```json
{
  "type": "req",
  "id": "req-123",
  "method": "agent.chat",
  "params": {
    "sessionKey": "main",
    "messages": [...]
  }
}
```

**响应** (ResponseFrame):
```json
{
  "type": "res",
  "id": "req-123",
  "ok": true,
  "payload": { ... }
}
```

**错误响应**:
```json
{
  "type": "res",
  "id": "req-123",
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found",
    "retryable": false
  }
}
```

### 事件通知

**事件** (EventFrame):
```json
{
  "type": "event",
  "event": "agent.event",
  "seq": 123,
  "stateVersion": "v1",
  "payload": {
    "agentId": "agent-123",
    "type": "content_delta",
    "delta": "Hello"
  }
}
```

## 方法目录

### AI 代理 (`agent.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `agent.chat` | 发送聊天消息 | `ChatSendParams` | `AsyncGenerator` |
| `agent.abort` | 中断代理 | `ChatAbortParams` | `void` |
| `agent.wait` | 等待代理完成 | `AgentWaitParams` | `AgentSummary` |
| `agent.identity` | 获取代理身份 | `AgentIdentityParams` | `AgentIdentityResult` |

### 代理管理 (`agents.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `agents.list` | 列出代理 | `AgentsListParams` | `AgentsListResult` |
| `agents.create` | 创建代理 | `AgentsCreateParams` | `AgentsCreateResult` |
| `agents.update` | 更新代理 | `AgentsUpdateParams` | `AgentsUpdateResult` |
| `agents.delete` | 删除代理 | `AgentsDeleteParams` | `AgentsDeleteResult` |
| `agents.files.list` | 列出文件 | `AgentsFilesListParams` | `AgentsFilesListResult` |
| `agents.files.get` | 获取文件 | `AgentsFilesGetParams` | `AgentsFilesGetResult` |
| `agents.files.set` | 设置文件 | `AgentsFilesSetParams` | `AgentsFilesSetResult` |

### 渠道管理 (`channels.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `channels.status` | 渠道状态 | `ChannelsStatusParams` | `ChannelsStatusResult` |
| `channels.logout` | 渠道登出 | `ChannelsLogoutParams` | `void` |
| `channels.webLogin.start` | 开始 Web 登录 | `WebLoginStartParams` | `string` (URL) |
| `channels.webLogin.wait` | 等待 Web 登录 | `WebLoginWaitParams` | `void` |

### 配置管理 (`config.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `config.get` | 获取配置 | `ConfigGetParams` | 配置对象 |
| `config.set` | 设置配置 | `ConfigSetParams` | `void` |
| `config.apply` | 应用配置 | `ConfigApplyParams` | `void` |
| `config.patch` | 补丁配置 | `ConfigPatchParams` | `void` |
| `config.schema` | 获取 Schema | `ConfigSchemaParams` | `ConfigSchemaResponse` |

### 定时任务 (`cron.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `cron.list` | 列出任务 | `CronListParams` | `CronJob[]` |
| `cron.add` | 添加任务 | `CronAddParams` | `CronJob` |
| `cron.update` | 更新任务 | `CronUpdateParams` | `CronJob` |
| `cron.remove` | 删除任务 | `CronRemoveParams` | `void` |
| `cron.run` | 立即运行 | `CronRunParams` | `void` |
| `cron.runs` | 运行历史 | `CronRunsParams` | `CronRunLogEntry[]` |
| `cron.status` | 任务状态 | `CronStatusParams` | `CronJob` |

### 设备配对 (`devices.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `devices.pair.list` | 列出待配对 | `DevicePairListParams` | `DevicePairRequest[]` |
| `devices.pair.approve` | 批准配对 | `DevicePairApproveParams` | `void` |
| `devices.pair.reject` | 拒绝配对 | `DevicePairRejectParams` | `void` |
| `devices.token.revoke` | 撤销令牌 | `DeviceTokenRevokeParams` | `void` |
| `devices.token.rotate` | 轮换令牌 | `DeviceTokenRotateParams` | `string` |

### 日志和聊天 (`logs.*`, `chat.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `logs.tail` | 跟踪日志 | `LogsTailParams` | `AsyncIterator` |
| `chat.inject` | 注入消息 | `ChatInjectParams` | `void` |

### 节点管理 (`nodes.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `nodes.list` | 列出节点 | `NodeListParams` | `NodeInfo[]` |
| `nodes.describe` | 描述节点 | `NodeDescribeParams` | `NodeDescription` |
| `nodes.invoke` | 调用节点 | `NodeInvokeParams` | `NodeInvokeResultParams` |
| `nodes.pair.request` | 请求配对 | `NodePairRequestParams` | `void` |
| `nodes.pair.list` | 列出配对 | `NodePairListParams` | `NodePairRequest[]` |
| `nodes.pair.approve` | 批准配对 | `NodePairApproveParams` | `void` |
| `nodes.pair.reject` | 拒绝配对 | `NodePairRejectParams` | `void` |
| `nodes.pair.verify` | 验证配对 | `NodePairVerifyParams` | `void` |
| `nodes.rename` | 重命名节点 | `NodeRenameParams` | `void` |

### 技能管理 (`skills.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `skills.list` | 列出技能 | `SkillsStatusParams` | `SkillsStatusResult` |
| `skills.install` | 安装技能 | `SkillsInstallParams` | `void` |
| `skills.update` | 更新技能 | `SkillsUpdateParams` | `void` |
| `skills.bins` | 技能包 | `SkillsBinsParams` | `SkillsBinsResult` |

### 模型管理 (`models.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `models.list` | 列出模型 | `ModelsListParams` | `ModelsListResult` |

### 执行批准 (`execApprovals.*`)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `execApprovals.get` | 获取批准状态 | `ExecApprovalsGetParams` | `ExecApprovalsSnapshot` |
| `execApprovals.set` | 设置批准策略 | `ExecApprovalsSetParams` | `void` |
| `execApprovals.node.get` | 获取节点策略 | `ExecApprovalsNodeGetParams` | `ExecApprovalPolicy` |
| `execApprovals.node.set` | 设置节点策略 | `ExecApprovalsNodeSetParams` | `void` |
| `execApprovals.resolve` | 解析批准请求 | `ExecApprovalResolveParams` | `void` |

## 事件类型

### 代理事件 (`agent.event`)

```typescript
type AgentEvent = {
  agentId: string;
  type: "content_delta" | "tool_call" | "tool_result" | "done" | "error";
  delta?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  error?: ErrorShape;
};
```

### 节点事件 (`node.event`)

```typescript
type NodeEvent = {
  nodeId: string;
  type: "pair_request" | "pair_approved" | "pair_rejected" | "connected" | "disconnected";
  // ... 事件特定数据
};
```

### 聊天事件 (`chat.event`)

```typescript
type ChatEvent = {
  sessionKey: string;
  type: "message" | "abort" | "error";
  // ... 事件特定数据
};
```

### 系统事件

| 事件 | 描述 | Payload |
|------|------|---------|
| `tick` | 定时心跳 | `{ ts: number }` |
| `shutdown` | 关闭通知 | `{ reason: string, restartExpectedMs?: number }` |

## 客户端认证

### 认证方式

#### 1. Token 认证

```json
{
  "auth": {
    "token": "your-gateway-token"
  }
}
```

#### 2. 密码认证

```json
{
  "auth": {
    "password": "your-password"
  }
}
```

#### 3. 设备认证

```json
{
  "device": {
    "id": "device-id",
    "publicKey": "base64-public-key",
    "signature": "base64-signature",
    "signedAt": 1234567890,
    "nonce": "optional-nonce"
  }
}
```

### 认证响应

成功认证后，`hello-ok` 消息包含：

```json
{
  "auth": {
    "deviceToken": "new-device-token",
    "role": "user",
    "scopes": ["read", "write"],
    "issuedAtMs": 1234567890000
  }
}
```

## 客户端信息

### 客户端标识

```typescript
interface ClientInfo {
  id: string;              // 客户端 ID
  displayName?: string;    // 显示名称
  version: string;         // 客户端版本
  platform: string;        // 平台 (web/ios/android/macos/windows)
  deviceFamily?: string;   // 设备系列
  modelIdentifier?: string; // 型号标识
  mode: ClientMode;        // 客户端模式
  instanceId?: string;     // 实例 ID
}
```

### 客户端模式

| 模式 | 描述 |
|------|------|
| `full` | 完整功能客户端 |
| `node` | 节点客户端（移动/原生） |
| `web` | Web 客户端 |
| `service` | 服务客户端 |

### 客户端能力

```json
{
  "caps": ["canvas", "camera", "microphone", "talk"],
  "commands": ["camera.snap", "camera.clip"],
  "permissions": {
    "camera": true,
    "microphone": false
  }
}
```

## 协议策略

### 限制参数

| 参数 | 默认值 | 描述 |
|------|--------|------|
| `maxPayload` | 10MB | 单条消息最大大小 |
| `maxBufferedBytes` | 64MB | 缓冲区最大大小 |
| `tickIntervalMs` | 30000 | 心跳间隔（毫秒） |

### 错误处理

```typescript
interface ErrorShape {
  code: string;              // 错误代码
  message: string;           // 错误消息
  details?: unknown;         // 详细信息
  retryable?: boolean;       // 是否可重试
  retryAfterMs?: number;     // 重试延迟（毫秒）
}
```

### 错误代码

| 代码 | 描述 | 可重试 |
|------|------|--------|
| `NOT_FOUND` | 资源未找到 | 否 |
| `PERMISSION_DENIED` | 权限不足 | 否 |
| `INVALID_PARAMS` | 参数无效 | 否 |
| `RATE_LIMITED` | 请求受限 | 是 |
| `TIMEOUT` | 操作超时 | 是 |
| `INTERNAL_ERROR` | 内部错误 | 是 |

## 状态同步

### 状态版本

```typescript
type StateVersion = string; // e.g., "v1", "v2"
```

### 快照机制

Gateway 在连接时发送初始快照：

```json
{
  "snapshot": {
    "agents": [...],
    "channels": {...},
    "config": {...},
    "nodes": [...],
    "version": "v1"
  }
}
```

### 增量更新

状态变化通过事件通知：

```json
{
  "type": "event",
  "event": "agent.event",
  "stateVersion": "v2",
  "payload": {...}
}
```

## 客户端集成指南

### 连接流程

1. **建立 WebSocket 连接**
```typescript
const ws = new WebSocket('ws://localhost:18789');
```

2. **发送握手消息**
```typescript
ws.send(JSON.stringify({
  minProtocol: 1,
  maxProtocol: 2,
  client: {
    id: 'my-client',
    version: '1.0.0',
    platform: 'web',
    mode: 'full'
  }
}));
```

3. **处理 hello-ok 响应**
```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'hello-ok') {
    console.log('Connected!', msg.server);
  }
};
```

### 发送请求

```typescript
const requestId = crypto.randomUUID();

ws.send(JSON.stringify({
  type: 'req',
  id: requestId,
  method: 'agent.chat',
  params: {
    sessionKey: 'main',
    messages: [{ role: 'user', content: 'Hello!' }]
  }
}));
```

### 处理响应

```typescript
const pendingRequests = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'res') {
    const resolver = pendingRequests.get(msg.id);
    if (resolver) {
      if (msg.ok) {
        resolver.resolve(msg.payload);
      } else {
        resolver.reject(msg.error);
      }
      pendingRequests.delete(msg.id);
    }
  }
};
```

### 订阅事件

```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === 'event') {
    switch (msg.event) {
      case 'agent.event':
        handleAgentEvent(msg.payload);
        break;
      case 'node.event':
        handleNodeEvent(msg.payload);
        break;
    }
  }
};
```

## 相关文件清单

### 协议定义
- `src/gateway/protocol/index.ts`
- `src/gateway/protocol/schema/frames.ts`
- `src/gateway/protocol/schema/types.ts`

### 协议实现
- `src/gateway/server.ts`
- `src/gateway/client.ts`
- `src/gateway/server-*.ts`

### 测试文件
- `src/gateway/protocol/index.test.ts`
- `src/gateway/*.e2e.test.ts`

## 变更记录

### 2026-02-08 - 初始化协议规范文档
- ✅ 创建 `src/gateway/protocol/CLAUDE.md` 文档
- 📋 记录消息格式和方法目录
- 🔌 添加客户端集成指南
- 📝 补充认证和错误处理说明
