# 会话管理模块 (src/sessions/)

[根目录](../../CLAUDE.md) > [src](../CLAUDE.md) > **sessions**

## 模块职责

提供会话生命周期管理，包括会话策略定义、密钥管理、转录事件处理、消息队列和会话状态追踪。该模块是 OpenClaw 消息系统的核心，协调消息的发送、接收和状态同步。

## 目录结构

```
src/sessions/
├── send-policy.ts      # 发送策略
├── session-key-utils.ts  # 会话密钥工具
├── transcript-events.ts  # 转录事件
├── session-label.ts    # 会话标签
├── model-overrides.ts  # 模型覆盖配置
├── level-overrides.ts  # 级别覆盖配置
└── claude_cn.md        # 中文文档
```

## 入口与启动

### 主入口
- **`src/sessions/send-policy.ts`** - 发送策略主文件
- **`src/sessions/session-key-utils.ts`** - 密钥工具

### 使用示例
```typescript
import { SendPolicy, SessionKey } from "./sessions/send-policy.ts";

const policy = new SendPolicy({
  maxMessages: 100,
  rateLimit: 10, // 每分钟消息数
  cooldown: 5000, // 冷却时间 ms
});

await policy.apply(session);
```

## 对外接口

### SendPolicy 接口
```typescript
interface SendPolicy {
  // 策略配置
  maxMessages: number;
  rateLimit: number;
  cooldown: number;
  batchSize: number;

  // 策略应用
  apply(session: Session): Promise<void>;
  check(session: Session): PolicyCheckResult;
  reset(session: Session): void;
}
```

### SessionKey 接口
```typescript
interface SessionKey {
  id: string;
  platform: string;
  conversationId: string;
  label: SessionLabel;
  createdAt: Date;
  expiresAt?: Date;
}
```

### SessionLabel 接口
```typescript
interface SessionLabel {
  type: "direct" | "group" | "channel" | "thread";
  name: string;
  participants: string[];
  isArchived: boolean;
}
```

### TranscriptEvent 接口
```typescript
interface TranscriptEvent {
  id: string;
  sessionId: string;
  type: "message" | "reaction" | "typing" | "join" | "leave";
  timestamp: Date;
  data: Record<string, unknown>;
}
```

## 子模块详解

### 1. 发送策略 (`send-policy.ts`)

**职责**：控制消息发送频率、批次和限制

**策略类型**：
- `RateLimitPolicy` - 频率限制策略
- `CooldownPolicy` - 冷却时间策略
- `BatchPolicy` - 批量发送策略
- `QuotaPolicy` - 配额策略

**关键功能**：
```typescript
class SendPolicy {
  // 速率限制
  checkRateLimit(session: Session): boolean;

  // 冷却管理
  applyCooldown(session: Session): void;

  // 批量处理
  queueMessage(message: OutboundMessage): void;
  flushQueue(): Promise<void>;
}
```

### 2. 会话密钥 (`session-key-utils.ts`)

**职责**：生成和管理会话密钥

**功能**：
- 密钥生成算法
- 密钥派生
- 密钥轮换
- 密钥存储

### 3. 转录事件 (`transcript-events.ts`)

**职责**：记录和查询会话事件历史

**事件类型**：
```typescript
type TranscriptEventType =
  | "message"        // 消息
  | "reaction"       // 反应
  | "typing"         // 打字状态
  | "join"           // 加入会话
  | "leave"          // 离开会话
  | "edit"           // 编辑消息
  | "delete"         // 删除消息
  | "pin"            // 固定消息
  | "schedule"       // 定时消息;
```

### 4. 模型覆盖 (`model-overrides.ts`)

**职责**：为特定会话配置不同的模型

**配置格式**：
```typescript
interface ModelOverride {
  sessionPattern: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

### 5. 级别覆盖 (`level-overrides.ts`)

**职责**：为特定会话配置不同的日志级别

**配置格式**：
```typescript
interface LevelOverride {
  sessionPattern: string;
  level: "debug" | "info" | "warn" | "error";
  components?: string[];
}
```

## 关键依赖与配置

### 配置文件
```typescript
// src/config/types.session.ts
interface SessionsConfig {
  defaultPolicy: SendPolicyConfig;
  overrides: SessionOverride[];
  transcript: TranscriptConfig;
  keyRotation: KeyRotationConfig;
}

interface SendPolicyConfig {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  cooldownMs: number;
  batchSize: number;
}
```

### 环境变量
```bash
SESSION_MAX_MESSAGES     # 最大消息数
SESSION_COOLDOWN_MS      # 冷却时间
SESSION_BATCH_SIZE       # 批量大小
```

## 测试与质量

### 测试文件
- `src/sessions/**/*.test.ts` - 单元测试

### 测试命令
```bash
pnpm test src/sessions
```

## 常见问题 (FAQ)

### Q: 如何修改发送频率限制？
A: 在配置文件的 `sessions.defaultPolicy` 中修改，或设置 `SESSION_MAX_MESSAGES` 环境变量。

### Q: 会话密钥如何轮换？
A: 使用 `session-key-utils.ts` 中的 `rotateKey()` 函数，或配置自动轮换。

### Q: 如何查看转录历史？
A: 使用 `transcript-events.ts` 中的查询接口，或查看日志文件。

## 相关文件清单

### 核心文件
- `src/sessions/send-policy.ts` - 发送策略
- `src/sessions/session-key-utils.ts` - 密钥工具
- `src/sessions/transcript-events.ts` - 转录事件

### 配置参考
- `src/config/zod-schema.session.ts` - 会话配置 Schema
- `src/config/types.session.ts` - 会话类型

### 相关模块
- `src/channels/` - 渠道模块
- `src/gateway/` - 网关模块

## 变更记录

### 2026-02-10 - 创建会话模块文档
- ✅ 创建 `src/sessions/CLAUDE.md` 文档
- 📋 记录会话策略和事件系统
- 🔗 建立会话管理导航


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