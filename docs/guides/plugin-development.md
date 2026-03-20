---
summary: "OpenClaw 插件开发完整指南，教你如何创建新的通信渠道扩展"
read_when:
  - 创建新的渠道扩展插件
  - 理解插件架构
  - 开发自定义功能扩展
title: "插件开发指南"
---

# OpenClaw 插件开发指南

> 更新时间：2026-02-20

本指南将教你如何为 OpenClaw 创建新的通信渠道扩展插件。

## 什么是插件？

OpenClaw 插件是扩展 OpenClaw 功能的模块，主要类型包括：

1. **渠道插件** - 支持新的通信平台（WhatsApp、Telegram、Slack 等）
2. **认证插件** - 添加新的身份验证方式（OAuth、API Key 等）
3. **功能插件** - 添加新功能（内存管理、工具等）

## 快速开始

### 1. 创建插件目录结构

```bash
# 在 extensions 目录下创建新插件
mkdir -p extensions/my-new-channel/src
cd extensions/my-new-channel
```

### 2. 必需的文件

```
extensions/my-new-channel/
├── index.ts              # 插件入口（必需）
├── package.json          # 包清单（必需）
├── openclaw.plugin.json  # 插件配置（必需）
├── README.md            # 使用说明（推荐）
└── src/
    ├── runtime.ts        # 运行时实现
    ├── monitor.ts       # 消息监控
    ├── send.ts          # 消息发送
    ├── targets.ts       # 目标解析
    ├── format.ts        # 消息格式化
    ├── accounts.ts      # 账户管理
    └── onboarding.ts    # 配置向导
```

## 文件详解

### 1. package.json

```json
{
  "name": "@openclaw/channel-my-new-channel",
  "version": "1.0.0",
  "type": "module",
  "main": "./index.ts",
  "openclaw": {
    "channels": ["my-new-channel"]
  }
}
```

### 2. openclaw.plugin.json

```json
{
  "id": "my-new-channel",
  "channels": ["my-new-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": {
        "type": "boolean",
        "default": true
      },
      "apiKey": {
        "type": "string",
        "description": "API Key for the service"
      }
    }
  }
}
```

### 3. index.ts（插件入口）

```typescript
import type { ChannelPlugin } from "../../src/channels/plugins/types";

export default {
  id: "my-new-channel",
  meta: {
    name: "My New Channel",
    description: "Description of the channel",
    icon: "📱",
  },
  async load(api) {
    // 导入运行时
    const { default: runtime } = await import("./src/runtime.js");

    // 注册插件
    api.registerChannel({
      id: "my-new-channel",
      runtime,
      configSchema: {
        type: "object",
        properties: {
          apiKey: { type: "string" },
        },
      },
    });
  },
} satisfies ChannelPlugin;
```

### 4. src/runtime.ts（运行时核心）

```typescript
import type {
  ChannelRuntime,
  ChannelMonitor,
  MessageSender,
  TargetResolver,
  AccountManager,
} from "../../src/channels/plugins/types";

export const runtime: ChannelRuntime = {
  async start(config) {
    // 初始化连接
  },

  async stop() {
    // 清理资源
  },

  monitor: {
    async start(onMessage) {
      // 开始监听消息
    },
    async stop() {
      // 停止监听
    },
  },

  sender: {
    async send(target, message) {
      // 发送消息逻辑
      return { id: "message-id", success: true };
    },
  },

  targets: {
    parse(targetString) {
      // 解析目标地址
      return { type: "user", id: targetString };
    },
  },

  accounts: {
    async list() {
      // 列出账户
      return [];
    },
  },
};
```

## 接口定义

### ChannelRuntime

```typescript
interface ChannelRuntime {
  // 生命周期
  start(config: ChannelConfig): Promise<void>;
  stop(): Promise<void>;

  // 消息监控
  monitor: ChannelMonitor;

  // 消息发送
  sender: MessageSender;

  // 目标解析
  targets: TargetResolver;

  // 账户管理
  accounts: AccountManager;

  // 可选：配置向导
  onboarding?: OnboardingHandler;
}
```

### ChannelMonitor

```typescript
interface ChannelMonitor {
  start(onMessage: (message: InboundMessage) => void): Promise<void>;
  stop(): Promise<void>;
}
```

### MessageSender

```typescript
interface MessageSender {
  send(target: OutboundTarget, message: OutboundMessage): Promise<SendResult>;

  // 可选方法
  sendTyping?: (target: OutboundTarget) => Promise<void>;
  sendReaction?: (target: OutboundTarget, messageId: string, reaction: string) => Promise<void>;
}
```

### TargetResolver

```typescript
interface TargetResolver {
  parse(targetString: string): OutboundTarget;
  validate(targetString: string): boolean;
  format(target: OutboundTarget): string;
}
```

### AccountManager

```typescript
interface AccountManager {
  list(): Promise<Account[]>;
  add(config: AccountConfig): Promise<Account>;
  remove(accountId: string): Promise<void>;
  enable(accountId: string): Promise<void>;
  disable(accountId: string): Promise<void>;
}
```

## 消息类型

### InboundMessage（接收消息）

```typescript
interface InboundMessage {
  id: string;
  channel: string;
  from: {
    id: string;
    name?: string;
    avatar?: string;
  };
  to: string;
  content: {
    text?: string;
    media?: MediaAttachment[];
  };
  timestamp: Date;
  raw: unknown; // 原始消息对象
}
```

### OutboundMessage（发送消息）

```typescript
interface OutboundMessage {
  text?: string;
  markdown?: string;
  media?: MediaAttachment[];
  replyTo?: string;
  keyboard?: InlineKeyboard;
}
```

### MediaAttachment

```typescript
interface MediaAttachment {
  type: "image" | "video" | "audio" | "file";
  url?: string;
  data?: Buffer;
  filename?: string;
  mimeType?: string;
  caption?: string;
}
```

## 开发步骤

### 步骤 1：创建项目结构

```bash
mkdir -p extensions/my-channel/src
touch extensions/my-channel/index.ts
```

### 2. 实现基本框架

按照上面的接口定义实现基本框架代码。

### 3. 运行开发服务器

```bash
# 在项目根目录
pnpm build

# 启用插件进行测试
openclaw plugins enable my-channel

# 查看插件状态
openclaw plugins list
```

### 4. 编写测试

```typescript
// src/runtime.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runtime } from "./runtime";

describe("my-channel runtime", () => {
  let config = { apiKey: "test-key" };

  beforeAll(async () => {
    await runtime.start(config);
  });

  afterAll(async () => {
    await runtime.stop();
  });

  it("should send message", async () => {
    const result = await runtime.sender.send({ type: "user", id: "test-user" }, { text: "Hello" });
    expect(result.success).toBe(true);
  });
});
```

### 5. 调试技巧

```bash
# 启用调试日志
OPENCLAW_DEBUG=plugin:* pnpm gateway

# 查看插件日志
openclaw plugins diagnose my-channel
```

## 认证扩展开发

如果你想创建认证扩展（如 OAuth 登录），结构类似：

### openclaw.plugin.json

```json
{
  "id": "my-auth-provider",
  "type": "auth",
  "configSchema": {
    "type": "object",
    "properties": {
      "clientId": { "type": "string" },
      "clientSecret": { "type": "string" }
    }
  }
}
```

### index.ts

```typescript
import type { AuthPlugin } from "../../src/agents/auth-profiles/types";

export default {
  id: "my-auth-provider",
  type: "auth",
  async load(api) {
    api.registerAuthProvider({
      id: "my-auth-provider",
      name: "My Auth Provider",
      async authenticate(config) {
        // OAuth 或 API Key 认证逻辑
        return { accessToken: "token", expiresIn: 3600 };
      },
    });
  },
} satisfies AuthPlugin;
```

## 测试策略

### 单元测试

```bash
# 运行插件单元测试
pnpm test extensions/my-channel
```

### E2E 测试

```bash
# 运行 Docker E2E 测试
pnpm test:docker:plugins
```

### 集成测试

```bash
# 测试真实 API
LIVE=1 pnpm test extensions/my-channel
```

## 最佳实践

### 1. 错误处理

```typescript
async send(target, message) {
  try {
    // 发送逻辑
  } catch (error) {
    if (error instanceof RateLimitError) {
      // 处理速率限制
      throw new RetryableError("Rate limited", { retryAfter: 60 });
    }
    throw error;
  }
}
```

### 2. 日志记录

```typescript
import { logger } from "../../src/lib/logger";

async send(target, message) {
  logger.info({ target, messageLength: message.text?.length }, "Sending message");
  // ...
}
```

### 3. 配置验证

```typescript
import { z } from "zod";

const configSchema = z.object({
  apiKey: z.string().min(1),
  webhookUrl: z.string().url().optional(),
});
```

### 4. 资源清理

```typescript
let connection: Connection;

async start(config) {
  connection = await createConnection(config);
}

async stop() {
  if (connection) {
    await connection.close();
  }
}
```

## 常见问题

### Q: 如何处理速率限制？

A: 实现重试逻辑和队列：

```typescript
class RateLimiter {
  private queue: Queue;
  private limit: number;
  private window: number;

  async add(task: () => Promise<void>) {
    // 检查速率限制
    // 添加到队列或立即执行
  }
}
```

### Q: 如何处理 Webhook？

A: 使用标准接口：

```typescript
async start(config) {
  const app = express();
  app.post("/webhook", async (req, res) => {
    const message = transformWebhookPayload(req.body);
    this.onMessage(message);
    res.status(200).send("OK");
  });

  await this.server.listen(config.port);
}
```

### Q: 如何发布插件？

A:

```bash
# 构建
pnpm build

# 发布到 npm
npm publish --access public

# 或打包为 tgz
npm pack
```

## 相关文档

- [插件 SDK 重构计划](./refactor/plugin-sdk.md)
- [CLI 插件命令](./cli/plugins.md)
- [现有扩展示例 - Telegram](../extensions/telegram/CLAUDE.md)
- [现有扩展示例 - WhatsApp](../extensions/whatsapp/CLAUDE.md)
- [现有扩展示例 - MiniMax Auth](../extensions/minimax-portal-auth/CLAUDE.md)

## 下一步

1. 参考现有扩展（`extensions/telegram/`）的实现
2. 运行 `pnpm test:docker:plugins` 了解测试流程
3. 在 GitHub 上提交 PR 分享你的插件

---

# 高级主题

## 完整实战示例：Echo 插件

下面是一个从零开始创建简单 Echo 插件的完整教程。

### 步骤 1：创建目录结构

```bash
mkdir -p extensions/echo-channel/src
cd extensions/echo-channel
```

### 步骤 2：创建 package.json

```json
{
  "name": "@openclaw/channel-echo",
  "version": "1.0.0",
  "type": "module",
  "main": "./index.ts",
  "openclaw": {
    "channels": ["echo"]
  },
  "dependencies": {
    "openclaw/plugin-sdk": "workspace:*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "vitest": "^4.0.18"
  }
}
```

### 步骤 3：创建 openclaw.plugin.json

```json
{
  "id": "echo-channel",
  "name": "Echo Channel",
  "description": "Simple echo plugin for testing",
  "version": "1.0.0",
  "channels": ["echo"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Enable the echo channel"
      },
      "prefix": {
        "type": "string",
        "default": "Echo: ",
        "description": "Prefix for echoed messages"
      }
    }
  }
}
```

### 步骤 4：创建 index.ts（插件入口）

```typescript
import type { ChannelPlugin, OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { echoRuntime } from "./src/runtime.js";

const plugin: ChannelPlugin = {
  id: "echo-channel",
  name: "Echo Channel",
  description: "Simple echo plugin for testing and development",
  version: "1.0.0",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerChannel({
      plugin: {
        id: "echo-channel",
        meta: {
          name: "Echo Channel",
          description: "Echoes back received messages",
          icon: "🔊",
          capabilities: {
            text: true,
            media: false,
            reactions: false,
            editing: false,
            threads: false,
          },
        },
        runtime: echoRuntime,
      },
    });
  },
};

export default plugin;
```

### 步骤 5：创建 src/runtime.ts（核心运行时）

```typescript
import type {
  ChannelRuntime,
  ChannelMonitor,
  MessageSender,
  TargetResolver,
  AccountManager,
  InboundMessage,
  OutboundTarget,
  OutboundMessage,
  SendResult,
} from "openclaw/plugin-sdk";

// 配置接口
interface EchoConfig {
  enabled: boolean;
  prefix: string;
}

// Echo 运行时状态
let echoConfig: EchoConfig = {
  enabled: true,
  prefix: "Echo: ",
};

// 消息处理器
let messageHandler: ((message: InboundMessage) => void) | null = null;

// 监控器实现
const monitor: ChannelMonitor = {
  async start(onMessage: (message: InboundMessage) => void) {
    messageHandler = onMessage;
    console.log("[Echo] Monitor started");
  },

  async stop() {
    messageHandler = null;
    console.log("[Echo] Monitor stopped");
  },

  // 模拟接收消息（用于测试）
  simulateMessage(text: string, from: string) {
    if (!messageHandler) return;

    const message: InboundMessage = {
      id: `echo-${Date.now()}`,
      channel: "echo",
      from: {
        id: from,
        name: from,
      },
      to: "echo-bot",
      content: {
        text,
      },
      timestamp: new Date(),
      raw: { text, from },
    };

    messageHandler(message);
  },
};

// 发送器实现
const sender: MessageSender = {
  async send(target: OutboundTarget, message: OutboundMessage): Promise<SendResult> {
    const prefixedText = `${echoConfig.prefix}${message.text || ""}`;
    console.log(`[Echo] Sending to ${target.id}: ${prefixedText}`);

    // 在实际插件中，这里会调用平台 API
    // 对于 Echo 插件，我们只是记录并返回成功

    return {
      id: `echo-${Date.now()}`,
      success: true,
      timestamp: new Date(),
    };
  },

  // 可选：支持发送输入状态
  async sendTyping?(target: OutboundTarget): Promise<void> {
    console.log(`[Echo] Typing indicator sent to ${target.id}`);
  },
};

// 目标解析器
const targets: TargetResolver = {
  parse(targetString: string): OutboundTarget {
    return {
      id: targetString,
      type: "user",
      platform: "echo",
    };
  },

  validate(targetString: string): boolean {
    return targetString.length > 0;
  },

  format(target: OutboundTarget): string {
    return target.id;
  },
};

// 账户管理器
const accounts: AccountManager = {
  async list() {
    return [
      {
        id: "echo-bot",
        name: "Echo Bot",
        enabled: true,
        platform: "echo",
      },
    ];
  },

  async add(config) {
    return {
      id: "echo-bot",
      name: config.name || "Echo Bot",
      enabled: true,
      platform: "echo",
    };
  },

  async remove(_accountId: string) {
    console.log("[Echo] Account removed");
  },

  async enable(_accountId: string) {
    console.log("[Echo] Account enabled");
  },

  async disable(_accountId: string) {
    console.log("[Echo] Account disabled");
  },
};

// 导出运行时
export const echoRuntime: ChannelRuntime = {
  async start(config: EchoConfig) {
    echoConfig = {
      enabled: config.enabled ?? true,
      prefix: config.prefix ?? "Echo: ",
    };
    console.log("[Echo] Runtime started with config:", echoConfig);
  },

  async stop() {
    console.log("[Echo] Runtime stopped");
  },

  monitor,
  sender,
  targets,
  accounts,
};

// 导出监控器以支持测试
export { monitor as echoMonitor };
```

### 步骤 6：创建测试文件

```typescript
// src/runtime.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { echoRuntime, echoMonitor } from "./runtime";

describe("Echo Channel Runtime", () => {
  beforeEach(async () => {
    await echoRuntime.start({ enabled: true, prefix: "Test: " });
  });

  afterEach(async () => {
    await echoRuntime.stop();
  });

  describe("Target Resolution", () => {
    it("should parse target string", () => {
      const target = echoRuntime.targets.parse("user123");
      expect(target.id).toBe("user123");
      expect(target.type).toBe("user");
      expect(target.platform).toBe("echo");
    });

    it("should validate non-empty targets", () => {
      expect(echoRuntime.targets.validate("user123")).toBe(true);
      expect(echoRuntime.targets.validate("")).toBe(false);
    });

    it("should format target correctly", () => {
      const target = { id: "user123", type: "user" as const, platform: "echo" };
      expect(echoRuntime.targets.format(target)).toBe("user123");
    });
  });

  describe("Message Sending", () => {
    it("should send message with prefix", async () => {
      const result = await echoRuntime.sender.send(
        { id: "user123", type: "user", platform: "echo" },
        { text: "Hello" },
      );

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^echo-\d+$/);
    });

    it("should handle empty messages", async () => {
      const result = await echoRuntime.sender.send(
        { id: "user123", type: "user", platform: "echo" },
        {},
      );

      expect(result.success).toBe(true);
    });
  });

  describe("Account Management", () => {
    it("should list accounts", async () => {
      const accounts = await echoRuntime.accounts.list();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe("echo-bot");
    });

    it("should add new account", async () => {
      const account = await echoRuntime.accounts.add({ name: "Test Bot" });
      expect(account.name).toBe("Test Bot");
    });
  });
});

describe("Echo Monitor", () => {
  it("should receive and forward messages", async () => {
    let receivedMessage: any = null;

    await echoMonitor.start((msg) => {
      receivedMessage = msg;
    });

    echoMonitor.simulateMessage("Test message", "user123");

    expect(receivedMessage).not.toBeNull();
    expect(receivedMessage.content.text).toBe("Test message");
    expect(receivedMessage.from.id).toBe("user123");

    await echoMonitor.stop();
  });
});
```

### 步骤 7：构建和测试

```bash
# 构建项目
pnpm build

# 运行测试
pnpm test extensions/echo-channel

# 启用插件
openclaw plugins enable echo-channel

# 测试插件
openclaw message send --to echo:user123 --message "Hello Echo"
```

## SDK 详细参考

### openclaw/plugin-sdk 导出

```typescript
// 插件类型
import type { ChannelPlugin, AuthPlugin, OpenClawPluginApi } from "openclaw/plugin-sdk";

// 配置工具
import { emptyPluginConfigSchema, defineConfigSchema } from "openclaw/plugin-sdk";

// 运行时类型
import type {
  ChannelRuntime,
  ChannelMonitor,
  MessageSender,
  TargetResolver,
  AccountManager,
} from "openclaw/plugin-sdk";

// 消息类型
import type {
  InboundMessage,
  OutboundMessage,
  OutboundTarget,
  SendResult,
  MediaAttachment,
} from "openclaw/plugin-sdk";

// 认证类型
import type { ProviderAuthContext, ProviderAuthResult, AuthCredential } from "openclaw/plugin-sdk";
```

### OpenClawPluginApi

```typescript
interface OpenClawPluginApi {
  // 运行时环境
  runtime: {
    // 日志工具
    logger: {
      info(msg: string, ...args: any[]): void;
      error(msg: string, ...args: any[]): void;
      warn(msg: string, ...args: any[]): void;
      debug(msg: string, ...args: any[]): void;
    };

    // 配置访问
    config: {
      get(key: string): any;
      set(key: string, value: any): void;
    };

    // 文件系统
    fs: {
      readFile(path: string): Promise<string>;
      writeFile(path: string, content: string): Promise<void>;
    };
  };

  // 注册渠道
  registerChannel(options: { plugin: ChannelPlugin }): void;

  // 注册认证提供商
  registerProvider(options: {
    id: string;
    label: string;
    docsPath?: string;
    aliases?: string[];
    auth: Array<{
      id: string;
      label: string;
      hint?: string;
      kind: "api_key" | "oauth" | "device_code";
      run: (ctx: ProviderAuthContext) => Promise<ProviderAuthResult>;
    }>;
  }): void;

  // 注册工具
  registerTool(tool: ToolDefinition): void;

  // 注册技能
  registerSkill(skill: SkillDefinition): void;
}
```

## 调试技巧

### 1. 启用调试日志

```bash
# 设置环境变量
export OPENCLAW_DEBUG=plugin:*
export OPENCLAW_TRACE=1

# 启动网关
pnpm gateway
```

### 2. 使用 VS Code 调试器

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Plugin",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["gateway"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 3. 插件诊断命令

```bash
# 检查插件状态
openclaw plugins diagnose echo-channel

# 查看插件日志
openclaw plugins logs echo-channel --tail 50

# 测试插件连接
openclaw plugins test echo-channel
```

### 4. 常见调试场景

#### 场景 1：插件未加载

```typescript
// 在 index.ts 中添加调试日志
const plugin = {
  id: "echo-channel",
  register(api: OpenClawPluginApi) {
    console.log("[Echo Plugin] Registering...", { id: plugin.id });
    api.registerChannel({ plugin: echoPlugin });
    console.log("[Echo Plugin] Registered successfully");
  },
};
```

#### 场景 2：消息未接收

```typescript
// 在 monitor.ts 中添加调试日志
const monitor: ChannelMonitor = {
  async start(onMessage) {
    console.log("[Echo Monitor] Starting...");
    // ... 监听逻辑
    console.log("[Echo Monitor] Started");
  },

  async stop() {
    console.log("[Echo Monitor] Stopping...");
    // ... 清理逻辑
    console.log("[Echo Monitor] Stopped");
  },
};
```

#### 场景 3：发送失败

```typescript
// 在 send.ts 中添加详细错误处理
async send(target: OutboundTarget, message: OutboundMessage): Promise<SendResult> {
  try {
    console.log("[Echo Send] Sending to:", target.id);
    const result = await platformApi.send(target, message);
    console.log("[Echo Send] Success:", result);
    return result;
  } catch (error) {
    console.error("[Echo Send] Error:", error);
    return {
      id: "",
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    };
  }
}
```

## 高级特性

### 1. WebSocket 支持

```typescript
// websocket.ts
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WebSocket] Connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    this.ws.onclose = () => {
      console.log("[WebSocket] Closed");
      this.reconnect();
    };
  }

  private async reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.connect(this.url);
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.ws?.close();
  }
}
```

### 2. 文件处理

```typescript
// file-handler.ts
import { createReadStream, createWriteStream } from "fs";
import { stat } from "fs/promises";
import { join } from "path";

export class FileHandler {
  private uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filepath = join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(filepath);
      stream.write(buffer);
      stream.end();
      stream.on("finish", () => resolve(filepath));
      stream.on("error", reject);
    });
  }

  async getFileSize(filepath: string): Promise<number> {
    const stats = await stat(filepath);
    return stats.size;
  }

  async validateFile(filepath: string, maxSize: number = 10 * 1024 * 1024): Promise<boolean> {
    const size = await this.getFileSize(filepath);
    return size <= maxSize;
  }

  getMimeType(filename: string): string {
    const ext = filename.split(".").pop();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      mp4: "video/mp4",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
```

### 3. 状态管理

```typescript
// state-manager.ts
interface PluginState {
  isConnected: boolean;
  lastMessageId: string;
  unreadCount: number;
  userSettings: Map<string, any>;
}

export class StateManager {
  private state: PluginState;
  private stateFile: string;

  constructor(stateFile: string) {
    this.stateFile = stateFile;
    this.state = {
      isConnected: false,
      lastMessageId: "",
      unreadCount: 0,
      userSettings: new Map(),
    };
  }

  async load() {
    try {
      const data = await readFile(this.stateFile, "utf-8");
      const parsed = JSON.parse(data);
      this.state = {
        ...parsed,
        userSettings: new Map(parsed.userSettings),
      };
    } catch {
      // 文件不存在，使用默认状态
    }
  }

  async save() {
    const data = JSON.stringify({
      ...this.state,
      userSettings: Array.from(this.state.userSettings.entries()),
    });
    await writeFile(this.stateFile, data);
  }

  get<K extends keyof PluginState>(key: K): PluginState[K] {
    return this.state[key];
  }

  set<K extends keyof PluginState>(key: K, value: PluginState[K]) {
    this.state[key] = value;
    this.save();
  }

  getUserSetting(userId: string, key: string): any {
    return this.state.userSettings.get(`${userId}:${key}`);
  }

  setUserSetting(userId: string, key: string, value: any) {
    this.state.userSettings.set(`${userId}:${key}`, value);
    this.save();
  }
}
```

### 4. 速率限制

```typescript
// rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  async check(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.window);

    if (this.requests.length < this.limit) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.check())) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.window - Date.now() + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.window);
    return Math.max(0, this.limit - this.requests.length);
  }
}
```

### 5. 消息队列

```typescript
// message-queue.ts
export class MessageQueue {
  private queue: Array<{
    target: OutboundTarget;
    message: OutboundMessage;
    resolve: (result: SendResult) => void;
    reject: (error: Error) => void;
  }> = [];

  private processing = false;
  private sender: MessageSender;
  private rateLimiter: RateLimiter;

  constructor(sender: MessageSender, rateLimiter: RateLimiter) {
    this.sender = sender;
    this.rateLimiter = rateLimiter;
  }

  async enqueue(target: OutboundTarget, message: OutboundMessage): Promise<SendResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ target, message, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      await this.rateLimiter.waitForSlot();

      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await this.sender.send(item.target, item.message);
        item.resolve(result);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.processing = false;
  }

  get length() {
    return this.queue.length;
  }
}
```

## 发布流程

### 1. 准备发布

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 运行所有测试
pnpm test

# 构建生产版本
pnpm build

# 检查包内容
npm pack --dry-run
```

### 2. 发布到 npm

```bash
# 登录 npm（如果尚未登录）
npm login

# 发布公共包
npm publish --access public

# 或发布特定标签
npm publish --tag beta
```

### 3. 在项目中使用

```bash
# 安装发布的插件
npm install -g @openclaw/channel-echo

# 或在项目中安装
pnpm add -D @openclaw/channel-echo

# 启用插件
openclaw plugins enable echo-channel
```

### 4. 发布到 OpenClaw 插件目录

提交 PR 到 [OpenClaw 插件目录仓库](https://github.com/openclaw/plugins)：

```bash
# Fork 并克隆插件目录仓库
git clone https://github.com/your-username/plugins.git
cd plugins

# 添加你的插件
echo "- @openclaw/channel-echo - Echo channel plugin" >> README.md

# 提交 PR
git add .
git commit -m "Add echo-channel plugin"
git push origin main
```

## 测试最佳实践

### 1. 单元测试

```typescript
// 使用 Mock 避免真实 API 调用
import { vi, describe, it, expect } from "vitest";

describe("Plugin with mocks", () => {
  it("should handle API errors gracefully", async () => {
    const mockApi = {
      send: vi.fn().mockRejectedValue(new Error("API Error")),
    };

    const result = await sendMessage(mockApi, "test", "message");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 2. 集成测试

```typescript
// 使用测试账户和沙箱环境
describe("Integration tests", () => {
  it("should send real message in test environment", async () => {
    if (!process.env.LIVE_TEST) {
      // 跳过需要真实 API 的测试
      return;
    }

    const result = await runtime.sender.send(
      { id: process.env.TEST_TARGET!, type: "user", platform: "test" },
      { text: "Integration test message" },
    );

    expect(result.success).toBe(true);
  });
});
```

### 3. E2E 测试

```typescript
// 使用 Docker 测试环境
// docker-compose.yml
/*
services:
  plugin-test:
    build: .
    environment:
      - PLUGIN_ID=echo-channel
      - TEST_CONFIG={"enabled":true}
*/

describe("E2E tests", () => {
  it("should complete full message flow", async () => {
    // 启动插件
    await runtime.start(config);

    // 发送消息
    const sendResult = await runtime.sender.send(target, message);
    expect(sendResult.success).toBe(true);

    // 验证消息接收
    await new Promise((resolve) => {
      monitor.start((msg) => {
        expect(msg.content.text).toBe(message.text);
        resolve();
      });
    });

    // 清理
    await runtime.stop();
  });
});
```

---

_祝你开发顺利！如有问题，请提交 Issue 或参与讨论。_
