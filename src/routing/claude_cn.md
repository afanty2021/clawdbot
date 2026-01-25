# 消息路由模块 (Routing)

[根目录](../../CLAUDE.md) > [src](../) > **routing**

## 模块职责

消息路由模块负责将入站消息路由到正确的 Agent 实例。该模块根据配置的绑定规则、消息上下文（渠道、发送者、群组等）解析目标 Agent，并生成相应的会话密钥。

## 入口与启动

### 主要入口点

- **resolve-route.ts**: 路由解析核心
- **bindings.ts**: 绑定规则管理
- **session-key.ts**: 会话密钥生成

### 路由解析

```typescript
// src/routing/resolve-route.ts
export type RoutePeerKind = "dm" | "group" | "channel";

export type RoutePeer = {
  kind: RoutePeerKind;
  id: string;
};

export type ResolveAgentRouteInput = {
  cfg: ClawdbotConfig;
  channel: string;
  accountId?: string | null;
  peer?: RoutePeer | null;
  guildId?: string | null;
  teamId?: string | null;
};

export type ResolvedAgentRoute = {
  agentId: string;
  channel: string;
  accountId: string;
  sessionKey: string;
  mainSessionKey: string;
  matchedBy:
    | "binding.peer"
    | "binding.guild"
    | "binding.team"
    | "binding.account"
    | "binding.channel"
    | "default";
};

function resolveAgentRoute(input: ResolveAgentRouteInput): ResolvedAgentRoute;
```

## 对外接口

### 绑定规则

```typescript
// src/routing/bindings.ts
interface AgentBinding {
  agentId: string;
  match: {
    channel?: string;
    accountId?: string | "*";
    peer?: {
      kind: "dm" | "group" | "channel";
      id: string;
    };
    guildId?: string;
    teamId?: string;
  };
}

function listBindings(cfg: ClawdbotConfig): AgentBinding[];
```

### 会话密钥

```typescript
// src/routing/session-key.ts
const DEFAULT_ACCOUNT_ID = "default";
const DEFAULT_AGENT_ID = "clawdbot";
const DEFAULT_MAIN_KEY = "main";

function buildAgentMainSessionKey(params: {
  agentId: string;
  mainKey?: string;
}): string;

function buildAgentPeerSessionKey(params: {
  agentId: string;
  mainKey: string;
  channel: string;
  peerKind: "dm" | "group" | "channel";
  peerId: string | null;
  dmScope?: "main" | "per-peer" | "per-channel-peer";
  identityLinks?: Record<string, string[]>;
}): string;

function normalizeAgentId(agentId: string): string;
function sanitizeAgentId(agentId: string): string;
```

## 关键依赖与配置

### 配置结构

```typescript
interface ClawdbotConfig {
  agents?: {
    bindings?: AgentBinding[];
    list?: Array<{ id: string }>;
    default?: string;
  };
  session?: {
    dmScope?: "main" | "per-peer" | "per-channel-peer";
    identityLinks?: Record<string, string[]>;
  };
}
```

### 路由优先级

1. **peer 匹配**: 精确匹配发送者/群组
2. **guild/team 匹配**: Discord 服务器或 Slack Team
3. **account 匹配**: 特定账户（非通配符）
4. **channel 匹配**: 渠道级通配符账户
5. **default**: 默认 Agent

## 数据模型

### 绑定匹配

```typescript
interface BindingMatch {
  channel: string;
  accountId: string;
  peer?: { kind: string; id: string };
  guildId?: string;
  teamId?: string;
}

function matchesChannel(match: BindingMatch, channel: string): boolean;
function matchesPeer(match: BindingMatch, peer: RoutePeer): boolean;
function matchesGuild(match: BindingMatch, guildId: string): boolean;
function matchesTeam(match: BindingMatch, teamId: string): boolean;
function matchesAccountId(match: string | undefined, actual: string): boolean;
```

### 会话作用域

```typescript
type DmScope = "main" | "per-peer" | "per-channel-peer";

// "main": 所有私聊共享一个会话
// "per-peer": 每个发送者一个会话
// "per-channel-peer": 每个渠道的每个发送者一个会话
```

### 身份链接

```typescript
// 链接不同渠道的同一用户
interface IdentityLinks {
  [channel: string]: string[]; // channel -> [identity1, identity2, ...]
}

// 示例: 将 Telegram 用户和 Signal 用户链接为同一人
{
  "telegram": ["123456789"],
  "signal": ["+1234567890"],
}
```

## 测试与质量

### 测试文件

- **resolve-route.test.ts**: 路由解析测试

### 测试覆盖

当前测试覆盖率约 85%。

## 常见问题 (FAQ)

### Q1: 如何配置路由规则？

A: 在配置文件中添加 `agents.bindings` 数组，每个绑定指定 `agentId` 和 `match` 条件。

### Q2: 路由优先级如何？

A: peer > guild/team > account > channel > default。

### Q3: 如何共享会话？

A: 通过 `session.dmScope` 配置。`"main"` 共享所有私聊会话。

### Q4: 如何链接不同渠道的用户？

A: 通过 `session.identityLinks` 配置。

### Q5: 会话密钥格式是什么？

A: 格式为 `{agentId}:{channel}:{peerKind}:{peerId}`，私聊可简化为 `{agentId}:main`。

## 相关文件清单

- `src/routing/resolve-route.ts` - 路由解析
- `src/routing/bindings.ts` - 绑定规则
- `src/routing/session-key.ts` - 会话密钥
- `src/routing/*.test.ts` - 测试文件

## 变更记录

### 2026-01-25

- 创建消息路由模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
