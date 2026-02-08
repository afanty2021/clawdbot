# 插件开发教程

[根目录](../CLAUDE.md) > **extensions**

## 概述

OpenClaw 插件系统允许扩展 OpenClaw 的功能，包括添加新的通信渠道、工具、Gateway 方法、CLI 命令和服务。本教程将指导您从零开始创建一个插件。

## 插件类型

### 1. 渠道插件 (Channel Plugin)
添加新的即时通讯平台支持，如 Discord、Slack、Telegram 等。

### 2. 工具插件 (Tool Plugin)
为 AI 代理添加新的工具能力。

### 3. Gateway 方法插件 (Gateway Method Plugin)
添加新的 Gateway WebSocket 方法。

### 4. CLI 命令插件 (CLI Command Plugin)
添加新的命令行命令。

### 5. 服务插件 (Service Plugin)
添加后台服务。

## 插件结构

### 最小化插件结构

```
my-plugin/
├── index.ts              # 插件入口
├── package.json          # 插件清单
├── openclaw.plugin.json  # 插件元数据
└── src/                  # 源代码（可选）
    └── ...
```

### 插件清单文件

**package.json**:
```json
{
  "name": "@openclaw/my-plugin",
  "version": "0.0.1",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

**openclaw.plugin.json**:
```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API 密钥"
      }
    }
  }
}
```

## 创建渠道插件

### 1. 初始化插件

```bash
mkdir extensions/my-channel
cd extensions/my-channel
npm init -y
```

### 2. 创建插件入口

**index.ts**:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { myChannelPlugin } from "./src/channel.js";

const plugin = {
  id: "my-channel",
  name: "My Channel",
  description: "My custom channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    // 注册渠道插件
    api.registerChannel({ plugin: myChannelPlugin });
  },
};

export default plugin;
```

### 3. 实现渠道插件

**src/channel.ts**:
```typescript
import type {
  ChannelPlugin,
  ChannelMeta,
  ChannelRuntime,
  InboundMessage,
  OutboundMessage,
  OutboundTarget,
} from "openclaw/plugin-sdk";

// 渠道元数据
export const myChannelPlugin: ChannelPlugin = {
  id: "my-channel",
  meta: {
    platform: "myplatform",
    displayName: "My Platform",
    description: "My custom messaging platform",
    capabilities: {
      text: true,
      media: false,
      reactions: false,
      edits: false,
      threads: false,
    },
  },

  // 运行时实现
  runtime: {
    // 启动监控
    async startMonitor(config, onMessage) {
      // 连接到平台
      // 监听消息
      // 调用 onMessage(message)
    },

    // 停止监控
    async stopMonitor() {
      // 断开连接
    },

    // 发送消息
    async send(target, message, config) {
      // 发送消息到平台
    },

    // 解析目标
    async parseTarget(targetString, config) {
      // 解析目标字符串为目标对象
      return {
        id: targetString,
        platform: "myplatform",
        name: targetString,
      } satisfies OutboundTarget;
    },

    // 格式化消息
    formatTarget(target) {
      // 格式化目标用于显示
      return `myplatform:${target.id}`;
    },
  },
};
```

### 4. 添加配置向导（可选）

**src/onboarding.ts**:
```typescript
import type { OnboardingHandler } from "openclaw/plugin-sdk";

export const onboarding: OnboardingHandler = {
  async prompt(config) {
    // 询问用户配置
    const apiKey = await prompt("Enter API key:");
    return { apiKey };
  },

  async validate(config) {
    // 验证配置
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
  },
};
```

## 创建工具插件

### 1. 创建插件

**index.ts**:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-tools",
  name: "My Tools",
  description: "Custom AI tools",
  register(api: OpenClawPluginApi) {
    // 注册工具
    api.registerTool(
      async (input) => {
        // 工具实现
        return { result: "Hello!" };
      },
      {
        name: "my_tool",
        description: "My custom tool",
        inputSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
      }
    );
  },
};

export default plugin;
```

### 2. 工具输入/输出

```typescript
// 工具输入类型
interface ToolInput {
  message: string;
}

// 工具输出类型
interface ToolOutput {
  result: string;
  timestamp: number;
}

// 注册工具
api.registerTool(
  async (input: ToolInput): Promise<ToolOutput> => {
    return {
      result: `Processed: ${input.message}`,
      timestamp: Date.now(),
    };
  },
  {
    name: "my_tool",
    description: "Process a message",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  }
);
```

## 创建 Gateway 方法插件

### 1. 创建插件

**index.ts**:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-gateway-methods",
  name: "My Gateway Methods",
  register(api: OpenClawPluginApi) {
    // 注册 Gateway 方法
    api.registerGatewayMethod("my.customMethod", async (params) => {
      // 方法实现
      return { success: true, data: params };
    });
  },
};

export default plugin;
```

### 2. 参数验证

```typescript
import { Type } from "@sinclair/typebox";

api.registerGatewayMethod(
  "my.customMethod",
  async (params) => {
    // params 已验证
    return { result: params.value * 2 };
  },
  {
    paramsSchema: Type.Object({
      value: Type.Integer(),
    }),
  }
);
```

## 创建 CLI 命令插件

### 1. 创建插件

**index.ts**:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-commands",
  name: "My Commands",
  register(api: OpenClawPluginApi) {
    // 注册 CLI 命令
    api.registerCli(
      async (args) => {
        console.log("Hello from my command!");
        console.log("Args:", args);
      },
      {
        commands: ["my-command", "mc"],
        description: "My custom command",
      }
    );
  },
};

export default plugin;
```

## 创建服务插件

### 1. 创建插件

**index.ts**:
```typescript
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const plugin = {
  id: "my-service",
  name: "My Service",
  register(api: OpenClawPluginApi) {
    // 注册服务
    api.registerService({
      id: "my-service",
      async start(deps) {
        console.log("Service starting...");
        // 启动服务逻辑
      },
      async stop() {
        console.log("Service stopping...");
        // 停止服务逻辑
      },
    });
  },
};

export default plugin;
```

## 插件配置

### 访问配置

```typescript
const plugin = {
  register(api: OpenClawPluginApi) {
    // 获取插件配置
    const config = api.getConfig();

    // 访问配置值
    const apiKey = config.apiKey;

    // 使用配置
    console.log("Using API key:", apiKey);
  },
};
```

### 配置变更监听

```typescript
api.onConfigChange((newConfig) => {
  console.log("Config changed:", newConfig);
  // 重新初始化
});
```

## 插件开发最佳实践

### 1. 错误处理

```typescript
api.registerTool(
  async (input) => {
    try {
      // 尝试操作
      const result = await riskyOperation(input);
      return { success: true, data: result };
    } catch (error) {
      // 返回错误信息
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  { /* ... */ }
);
```

### 2. 日志记录

```typescript
const logger = api.runtime.logger;

logger.info("Plugin started");
logger.debug("Processing input", { input });
logger.warn("Rate limit approaching");
logger.error("Operation failed", { error });
```

### 3. 资源清理

```typescript
api.registerService({
  id: "my-service",
  async start(deps) {
    // 创建资源
    this.interval = setInterval(() => {
      // 定期任务
    }, 1000);
  },
  async stop() {
    // 清理资源
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
});
```

### 4. 测试

**test/index.test.ts**:
```typescript
import { describe, it, expect } from "vitest";
import plugin from "../index.js";

describe("my-plugin", () => {
  it("should register tool", () => {
    const mockApi = {
      registerTool: () => {},
    };

    plugin.register(mockApi);

    // 验证工具已注册
  });
});
```

## 插件发布

### 1. 本地测试

```bash
# 安装本地插件
openclaw plugins install ./extensions/my-plugin

# 列出插件
openclaw plugins list

# 测试插件
openclaw my-command
```

### 2. 发布到 npm

```bash
# 构建（如需要）
npm run build

# 发布
npm publish
```

### 3. 用户安装

```bash
# 从 npm 安装
openclaw plugins install @openclaw/my-plugin

# 从 Git 安装
openclaw plugins install https://github.com/user/my-plugin
```

## 常见问题

### Q: 插件无法加载？

A: 检查：
1. `package.json` 中的 `openclaw.extensions` 是否正确
2. 插件是否导出默认对象
3. 是否有语法错误

### Q: 如何调试插件？

A: 使用日志：
```typescript
api.runtime.logger.debug("Debug info", { data });
```

查看日志：
```bash
openclaw logs --follow
```

### Q: 如何添加依赖？

A: 在插件目录中：
```bash
npm install dependency-name
```

### Q: 插件可以访问哪些 API？

A: 查看 `OpenClawPluginApi` 类型定义：
- `registerTool` - 注册工具
- `registerGatewayMethod` - 注册方法
- `registerCli` - 注册命令
- `registerService` - 注册服务
- `getConfig` - 获取配置
- `onConfigChange` - 监听配置变更
- `runtime.logger` - 日志记录器

## 相关资源

### 参考插件
- `extensions/discord/` - 完整的渠道插件示例
- `extensions/memory-core/` - 功能扩展示例
- `extensions/diagnostics-otel/` - 服务插件示例

### 类型定义
- `packages/plugin-sdk/` - Plugin SDK 类型定义

### 文档
- [OpenClaw 文档](https://github.com/openclaw/openclaw)

## 变更记录

### 2026-02-08 - 创建插件开发教程
- ✅ 创建 `extensions/PLUGIN_GUIDE.md`
- 📋 添加各类插件开发指南
- 🔧 补充最佳实践和测试方法
- ❓ 添加常见问题解答
