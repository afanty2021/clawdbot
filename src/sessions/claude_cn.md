# 会话管理模块 (Sessions)

[根目录](../../CLAUDE.md) > [src](../) > **sessions**

## 模块职责

会话管理模块负责管理 Clawdbot 的会话状态、发送策略、会话标签、模型覆盖等。该模块提供会话持久化、并发控制、消息去重等功能。

## 入口与启动

### 主要功能

- **session-key-utils.ts**: 会话密钥工具
- **send-policy.ts**: 发送策略
- **session-label.ts**: 会话标签
- **transcript-events.ts**: 转录事件
- **level-overrides.ts**: 级别覆盖
- **model-overrides.ts**: 模型覆盖

## 对外接口

### 会话密钥工具

```typescript
// src/sessions/session-key-utils.ts
function parseSessionKey(sessionKey: string): {
  agentId: string;
  channel: string;
  peerId?: string;
} | null;

function normalizeSessionKey(sessionKey: string): string;

function isValidSessionKey(sessionKey: string): boolean;
```

### 发送策略

```typescript
// src/sessions/send-policy.ts
interface SendPolicy {
  allowStreaming?: boolean;
  blockStreaming?: boolean;
  coalesceMinChars?: number;
  coalesceIdleMs?: number;
  maxChars?: number;
}

function resolveSendPolicy(params: {
  channel: string;
  config: ClawdbotConfig;
  agentId?: string;
}): SendPolicy;
```

### 会话标签

```typescript
// src/sessions/session-label.ts
function buildSessionLabel(params: {
  sessionKey: string;
  agentId: string;
  channel: string;
  peerLabel?: string;
}): string;

function formatSessionLabel(params: {
  label: string;
  maxLength?: number;
}): string;
```

### 转录事件

```typescript
// src/sessions/transcript-events.ts
interface TranscriptEvent {
  type: "message" | "tool" | "error" | "metadata";
  timestamp: number;
  data: unknown;
}

function formatTranscriptEvent(event: TranscriptEvent): string;

function parseTranscriptEvent(line: string): TranscriptEvent | null;
```

### 级别覆盖

```typescript
// src/sessions/level-overrides.ts
interface LevelOverrides {
  log?: "debug" | "info" | "warn" | "error";
  console?: boolean;
}

function resolveLevelOverrides(params: {
  agentId?: string;
  config: ClawdbotConfig;
}): LevelOverrides;
```

### 模型覆盖

```typescript
// src/sessions/model-overrides.ts
interface ModelOverride {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
}

function resolveModelOverride(params: {
  agentId?: string;
  channel?: string;
  config: ClawdbotConfig;
}): ModelOverride | undefined;
```

## 关键依赖与配置

### 配置结构

```typescript
interface ClawdbotConfig {
  session?: {
    dmScope?: "main" | "per-peer" | "per-channel-peer";
    identityLinks?: Record<string, string[]>;
    sendPolicy?: {
      allowStreaming?: boolean;
      blockStreaming?: boolean;
      coalesceMinChars?: number;
      coalesceIdleMs?: number;
      maxChars?: number;
    };
  };
}
```

## 数据模型

### 会话状态

```typescript
interface SessionState {
  sessionKey: string;
  agentId: string;
  channel: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  metadata?: Record<string, unknown>;
}
```

### 发送策略

```typescript
interface SendPolicy {
  allowStreaming?: boolean; // 允许流式发送
  blockStreaming?: boolean; // 阻止流式发送
  coalesceMinChars?: number; // 合并最小字符数
  coalesceIdleMs?: number; // 合并空闲时间（毫秒）
  maxChars?: number; // 最大字符数
}
```

## 测试与质量

### 测试文件

- **send-policy.test.ts**: 发送策略测试

### 测试覆盖

当前测试覆盖率约 85%。

## 常见问题 (FAQ)

### Q1: 会话密钥如何生成？

A: 格式为 `{agentId}:{channel}:{peerKind}:{peerId}`，私聊可简化为 `{agentId}:main`。

### Q2: 发送策略如何工作？

A: 根据渠道配置和 Agent 配置决定是否流式发送、消息合并等。

### Q3: 如何覆盖模型设置？

A: 通过 `modelOverrides` 配置或会话级别的覆盖。

### Q4: 会话数据存储在哪里？

A: 会话数据存储在 `~/.clawdbot/sessions/` 目录。

### Q5: 如何清理会话数据？

A: 使用 `clawdbot agent:sessions --clear` 或手动删除会话文件。

## 相关文件清单

- `src/sessions/session-key-utils.ts` - 会话密钥工具
- `src/sessions/send-policy.ts` - 发送策略
- `src/sessions/session-label.ts` - 会话标签
- `src/sessions/transcript-events.ts` - 转录事件
- `src/sessions/level-overrides.ts` - 级别覆盖
- `src/sessions/model-overrides.ts` - 模型覆盖
- `src/sessions/*.test.ts` - 测试文件

## 变更记录

### 2026-01-25

- 创建会话管理模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
