# Plugin SDK (src/plugin-sdk/)

[根目录](../CLAUDE.md) > **plugin-sdk**

## 模块职责

OpenClaw 插件开发工具包，提供插件开发所需的共享工具、类型定义和辅助函数。

## 目录结构

```
src/plugin-sdk/
├── index.ts                 # 主入口，导出所有类型和工具
├── file-lock.ts             # 文件锁
├── json-store.ts            # JSON 存储
├── temp-path.ts             # 临时路径
├── config-paths.ts          # 配置路径
├── webhook-path.ts          # Webhook 路径
├── webhook-targets.ts       # Webhook 目标
├── agent-media-payload.ts   # Agent 媒体载荷
├── status-helpers.ts        # 状态辅助
├── provider-auth-result.ts  # 提供商认证结果
├── text-chunking.ts         # 文本分块
├── account-id.ts            # 账户 ID
├── allow-from.ts            # 允许来源
├── command-auth.ts          # 命令认证
├── onboarding.ts            # 引导流程
├── tool-send.ts             # 工具发送
├── slack-message-actions.ts # Slack 消息操作
```

## 核心功能

### 1. 文件锁 (`file-lock.ts`)

用于防止并发访问冲突：

```typescript
interface FileLockHandle {
  path: string;
  release(): Promise<void>;
}

// 获取文件锁
function acquireFileLock(options: FileLockOptions): Promise<FileLockHandle>

// 使用文件锁执行操作
async function withFileLock<T>(
  options: FileLockOptions,
  fn: () => Promise<T>
): Promise<T>
```

**使用示例**：
```typescript
await withFileLock({ path: "/tmp/lock" }, async () => {
  // 临界区代码
});
```

### 2. JSON 存储 (`json-store.ts`)

简单的 JSON 文件存储：

```typescript
interface JsonStore<T> {
  get(): Promise<T | null>;
  set(value: T): Promise<void>;
  update(fn: (value: T | null) => T): Promise<void>;
}

function createJsonStore<T>(options: {
  path: string;
  defaultValue?: T;
}): JsonStore<T>
```

### 3. 临时路径 (`temp-path.ts`)

管理插件临时文件路径：

```typescript
// 解析临时路径
function resolvePluginTempPath(params: {
  pluginId: string;
  name: string;
}): string

// 临时路径测试
function testPluginTempPath(path: string): boolean
```

### 4. 配置路径 (`config-paths.ts`)

```typescript
// 解析插件配置路径
function resolvePluginConfigPath(params: {
  pluginId: string;
  name: string;
}): string
```

### 5. Webhook 路径 (`webhook-path.ts`)

```typescript
// 规范化 Webhook 路径
function normalizeWebhookPath(path: string): string

// 解析 Webhook 路径
function resolveWebhookPath(params: {
  pluginId: string;
  path?: string;
}): string
```

### 6. Webhook 目标 (`webhook-targets.ts`)

```typescript
// 注册 Webhook 目标
function registerWebhookTarget(params: {
  pluginId: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}): void

// 解析 Webhook 目标
function resolveWebhookTargets(
  pluginId: string
): WebhookTarget[]

// 拒绝非 POST Webhook 请求
function rejectNonPostWebhookRequest(req: Request): Response
```

### 7. Agent 媒体载荷 (`agent-media-payload.ts`)

```typescript
// 构建 Agent 媒体载荷
function buildAgentMediaPayload(params: {
  media: MediaAttachment[];
  maxSize?: number;
}): AgentMediaPayload
```

### 8. 状态辅助 (`status-helpers.ts`)

```typescript
// 构建基础渠道状态摘要
function buildBaseChannelStatusSummary(params: {
  pluginId: string;
  enabled: boolean;
  state?: ChannelAccountState;
  error?: Error;
}): ChannelStatusSummary

// 从错误收集状态问题
function collectStatusIssuesFromLastError(
  error: unknown
): ChannelStatusIssue[]

// 创建默认渠道运行时状态
function createDefaultChannelRuntimeState(): ChannelRuntimeState
```

### 9. 提供商认证结果 (`provider-auth-result.ts`)

```typescript
// 构建 OAuth 提供商认证结果
function buildOauthProviderAuthResult(params: {
  profileId: string;
  provider: string;
  access: string;
  refresh?: string;
  expires?: number;
}): ProviderAuthResult
```

### 10. 文本分块 (`text-chunking.ts`)

```typescript
// 分块文本（保持完整性）
function chunkTextKeepingIntact(text: string, maxSize: number): string[]
```

### 11. 账户 ID (`account-id.ts`)

```typescript
const DEFAULT_ACCOUNT_ID = "default";

// 规范化账户 ID
function normalizeAccountId(accountId: string): string
```

### 12. 允许来源 (`allow-from.ts`)

```typescript
// 格式化允许来源（小写）
function formatAllowFromLowercase(allowFrom: string[]): string[]

// 检查是否允许解析的聊天发送者
function isAllowedParsedChatSender(
  sender: ParsedChatSender,
  config: DmConfig | GroupConfig
): boolean
```

### 13. 命令认证 (`command-auth.ts`)

```typescript
// 检查命令认证
function checkCommandAuth(params: {
  command: string;
  senderId: string;
  config: CommandAuthConfig;
}): boolean
```

### 14. 引导流程 (`onboarding.ts`)

```typescript
// 引导上下文
interface OnboardingContext {
  pluginId: string;
  step: string;
  data: Record<string, unknown>;
}
```

### 15. 工具发送 (`tool-send.ts`)

```typescript
// 工具发送选项
interface ToolSendOptions {
  timeout?: number;
  retries?: number;
}
```

### 16. Slack 消息操作 (`slack-message-actions.ts`)

Slack 特定的消息操作类型定义。

## 对外接口

### 主入口导出 (`index.ts`)

```typescript
// 文件系统
export { acquireFileLock, withFileLock } from "./file-lock.js";
export { createJsonStore } from "./json-store.js";

// 路径处理
export { resolvePluginTempPath } from "./temp-path.js";
export { resolvePluginConfigPath } from "./config-paths.js";
export { normalizeWebhookPath, resolveWebhookPath } from "./webhook-path.js";

// Webhook
export { registerWebhookTarget, rejectNonPostWebhookRequest } from "./webhook-targets.js";

// 媒体
export { buildAgentMediaPayload } from "./agent-media-payload.js";

// 状态
export { buildBaseChannelStatusSummary } from "./status-helpers.js";

// 认证
export { buildOauthProviderAuthResult } from "./provider-auth-result.js";

// 文本处理
export { chunkTextKeepingIntact } from "./text-chunking.js";

// 账户
export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "./account-id.js";

// 权限
export { formatAllowFromLowercase, isAllowedParsedChatSender } from "./allow-from.js";
export { checkCommandAuth } from "./command-auth.js";
```

## 使用示例

### 创建插件使用文件锁

```typescript
import { withFileLock } from "openclaw/plugin-sdk";

await withFileLock({ path: "/tmp/my-lock" }, async () => {
  // 安全执行临界区代码
});
```

### 使用 JSON 存储

```typescript
import { createJsonStore } from "openclaw/plugin-sdk";

const store = createJsonStore<MyData>({
  path: "/tmp/data.json",
  defaultValue: { key: "value" }
});

await store.update(data => ({ ...data, key: "new-value" }));
```

### 注册 Webhook

```typescript
import { registerWebhookTarget, resolveWebhookPath } from "openclaw/plugin-sdk";

registerWebhookTarget({
  pluginId: "my-plugin",
  path: resolveWebhookPath({ pluginId: "my-plugin" }),
  handler: async (req) => {
    return new Response("OK");
  }
});
```

## 相关模块

- **`src/plugins/`** - 插件系统
- **`extensions/*/`** - 插件实现

## 变更记录

### 2026-02-20 - 创建 Plugin SDK 文档
- ✅ 创建 `src/plugin-sdk/CLAUDE.md` 文档
- 📋 记录所有工具函数
- 🔗 建立使用示例
