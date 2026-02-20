# Gateway Server 实现 (src/gateway/server/)

[根目录](../../CLAUDE.md) > [gateway](../CLAUDE.md) > **server**

## 模块职责

Gateway WebSocket 服务器的核心实现。管理 WebSocket 连接、处理客户端认证、消息路由和广播。

## 目录结构

```
src/gateway/server/
├── ws-connection/        # WebSocket 连接
│   ├── message-handler.ts     # 消息处理器
│   └── auth-messages.ts       # 认证消息
├── ws-connection.ts      # WebSocket 连接处理
├── ws-types.ts           # WebSocket 类型定义
├── health-state.ts       # 健康状态管理
├── presence-events.ts    # 在线状态事件
├── hooks.ts              # Hooks 处理
├── http-listen.ts        # HTTP 监听
├── plugins-http.ts       # 插件 HTTP 端点
├── tls.ts                # TLS 配置
├── close-reason.ts       # 关闭原因
└── __tests__/            # 测试文件
```

## 核心功能

### 1. WebSocket 连接处理 (`ws-connection.ts`)

**连接流程**：

```
客户端连接
    ↓
握手超时检查
    ↓
认证验证
    ↓
连接注册
    ↓
消息处理循环
    ↓
断开/关闭
```

**主要接口**：

```typescript
function attachGatewayWsConnectionHandler(params: {
  wss: WebSocketServer;
  clients: Set<GatewayWsClient>;
  port: number;
  resolvedAuth: ResolvedGatewayAuth;
  gatewayMethods: string[];
  events: string[];
}): void
```

### 2. 消息处理 (`ws-connection/message-handler.ts`)

**消息分发**：

```typescript
interface GatewayWsMessage {
  type: "method" | "event" | "auth";
  method?: string;
  event?: string;
  params?: unknown;
}
```

**处理流程**：

```
接收消息
    ↓
类型检查
    ↓
┌─────────┬─────────┬─────────┐
│ method  │ event   │ auth    │
└─────────┴─────────┴─────────┘
    ↓         ↓         ↓
方法执行   事件触发   认证验证
    ↓
响应发送
```

### 3. 健康状态管理 (`health-state.ts`)

```typescript
// 健康状态版本
interface HealthStateVersion {
  presence: number;
  health: number;
}

// 获取健康版本
function getHealthVersion(): {
  presence?: number;
  health?: number;
}

// 增加版本号
function incrementPresenceVersion(): number
```

### 4. 在线状态事件 (`presence-events.ts`)

```typescript
// 广播在线状态快照
function broadcastPresenceSnapshot(params: {
  clients: Set<GatewayWsClient>;
  event: string;
  payload: unknown;
}): void
```

### 5. TLS 配置 (`tls.ts`)

```typescript
// TLS 配置选项
interface TlsOptions {
  cert?: string;
  key?: string;
  ca?: string;
  minVersion?: "TLSv1.2" | "TLSv1.3";
}
```

### 6. HTTP 监听 (`http-listen.ts`)

用于健康检查和 HTTP 回退：

```typescript
// 启动 HTTP 服务器
function startHttpServer(params: {
  port: number;
  healthCheck?: (req: Request) => Response;
}): Promise<HttpServer>
```

### 7. 插件 HTTP 端点 (`plugins-http.ts`)

为插件提供 HTTP 端点注册：

```typescript
// 注册插件 HTTP 路由
function registerPluginHttpRoute(params: {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}): void
```

## 客户端类型

| 类型 | 说明 | 功能 |
|------|------|------|
| `webchat` | Web UI | 完整 UI 功能 |
| `node` | 移动节点 | Canvas、语音、相机 |
| `cli` | CLI 工具 | 命令行交互 |
| `bridge` | 桥接服务器 | 多网关桥接 |

## 认证流程

```
客户端发送 AUTH 消息
    ↓
验证 Token
    ↓
检查权限
    ↓
记录客户端信息
    ↓
发送 AUTH_OK 响应
```

## 关键常量

```typescript
const HANDSHAKE_TIMEOUT_MS = 30_000;  // 握手超时
const LOG_HEADER_MAX_LEN = 300;        // 日志头最大长度
const PING_INTERVAL_MS = 30_000;       // 心跳间隔
```

## 测试

### 单元测试

- `plugins-http.test.ts` - 插件 HTTP 端点测试
- `presence-events.test.ts` - 在线状态事件测试

## 相关模块

- **`src/gateway/`** - 网关模块根目录
- **`src/gateway/server-methods/`** - 服务器方法实现

## 变更记录

### 2026-02-20 - 创建 Gateway Server 实现文档
- ✅ 创建 `src/gateway/server/CLAUDE.md` 文档
- 📋 记录 WebSocket 连接处理
- 🔗 建立消息处理流程图
