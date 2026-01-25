# 配置管理模块 (Config)

[根目录](../../CLAUDE.md) > [src](../) > **config**

## 模块职责

配置管理模块负责 Clawdbot 的配置加载、验证、迁移、路径解析等。该模块支持 YAML/JSON5 配置文件、环境变量替换、配置包含、默认值等高级功能。

## 入口与启动

### 主要入口点

- **config.ts**: 配置加载入口
- **io.ts**: 配置文件读写
- **schema.ts**: 配置模式定义
- **validation.ts**: 配置验证
- **paths.ts**: 路径解析
- **runtime-overrides.ts**: 运行时覆盖

### 配置加载

```typescript
// src/config/config.ts
async function loadConfig(params?: {
  configPath?: string;
  runtime?: RuntimeEnv;
}): Promise<ClawdbotConfig>;

async function readConfigFileSnapshot(params?: {
  configPath?: string;
}): Promise<string>;

async function writeConfigFile(params: {
  config: ClawdbotConfig;
  configPath?: string;
}): Promise<void>;
```

### 配置验证

```typescript
// src/config/validation.ts
async function validateConfigObject(params: {
  config: unknown;
  runtime?: RuntimeEnv;
}): Promise<{
  valid: boolean;
  errors?: string[];
  config?: ClawdbotConfig;
}>;

async function validateConfigObjectWithPlugins(params: {
  config: unknown;
  runtime?: RuntimeEnv;
}): Promise<{
  valid: boolean;
  errors?: string[];
  config?: ClawdbotConfig;
}>;
```

## 对外接口

### 路径解析

```typescript
// src/config/paths.ts
function resolveConfigPath(params?: {
  configPath?: string;
}): string;

function resolveDataDir(): string;

function resolveSessionsDir(): string;

function resolveCredentialsDir(): string;

function resolveWebAuthDir(): string;
```

### 环境变量替换

```typescript
// src/config/env-substitution.ts
function substituteEnvVars(value: unknown): unknown;

function substituteEnvVarsInString(value: string): string;
```

### 配置包含

```typescript
// src/config/includes.ts
async function resolveConfigIncludes(params: {
  config: ClawdbotConfig;
  configDir: string;
}): Promise<ClawdbotConfig>;
```

### 默认值

```typescript
// src/config/defaults.ts
function applyConfigDefaults(params: {
  config: Partial<ClawdbotConfig>;
}): ClawdbotConfig;
```

### 配置迁移

```typescript
// src/config/legacy-migrate.ts
async function migrateLegacyConfig(params: {
  config: unknown;
  configPath: string;
  runtime?: RuntimeEnv;
}): Promise<ClawdbotConfig>;
```

### 运行时覆盖

```typescript
// src/config/runtime-overrides.ts
function applyRuntimeOverrides(params: {
  config: ClawdbotConfig;
  overrides?: Partial<ClawdbotConfig>;
}): ClawdbotConfig;
```

## 关键依赖与配置

### 配置文件格式

支持 YAML 和 JSON5 格式：

```yaml
# ~/.config/clawdbot/config.yaml
agents:
  default: clawdbot
  list:
    - id: clawdbot
      model: claude-3-5-sonnet-20241022
      provider: anthropic
      system: |
        You are Clawdbot, a helpful AI assistant.

channels:
  telegram:
    accounts:
      default:
        token: ${TELEGRAM_BOT_TOKEN}
        config:
          allowFrom:
            - "*"

  discord:
    accounts:
      default:
        token: ${DISCORD_BOT_TOKEN}
        config:
          dm:
            allowFrom:
              - "*"

  slack:
    accounts:
      default:
        botToken: ${SLACK_BOT_TOKEN}
        dm:
          allowFrom:
            - "*"

session:
  dmScope: main

hooks:
  - path: ./hooks/my-hook
```

### 环境变量

使用 `${VAR_NAME}` 语法引用环境变量：

```yaml
token: ${BOT_TOKEN}
apiKey: ${API_KEY}
password: ${PASSWORD}
```

### 配置包含

使用 `include` 字段包含其他配置文件：

```yaml
include:
  - ./agents.yaml
  - ./channels.yaml
```

### 配置模式

```typescript
// src/config/types.ts
interface ClawdbotConfig {
  // Agent 配置
  agents?: {
    default?: string;
    list?: Array<{
      id: string;
      model?: string;
      provider?: string;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      tools?: string[];
      [key: string]: unknown;
    }>;
    bindings?: Array<{
      agentId: string;
      match: {
        channel?: string;
        accountId?: string;
        peer?: { kind: string; id: string };
        guildId?: string;
        teamId?: string;
      };
    }>;
    concurrency?: number;
    limits?: {
      maxSessions?: number;
      maxMessagesPerSession?: number;
      maxSessionAge?: number;
    };
  };

  // 渠道配置
  channels?: {
    telegram?: TelegramConfig;
    discord?: DiscordConfig;
    slack?: SlackConfig;
    signal?: SignalConfig;
    imessage?: IMessageConfig;
    whatsapp?: WhatsAppConfig;
    googlechat?: GoogleChatConfig;
    [key: string]: unknown;
  };

  // 会话配置
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

  // Hooks 配置
  hooks?: Array<{
    path?: string;
    event?: string;
    handler?: string;
  }>;

  // 其他配置
  [key: string]: unknown;
}
```

### 特定配置类型

- **types.agents.ts**: Agent 配置类型
- **types.auth.ts**: 认证配置类型
- **types.channels.ts**: 渠道配置类型
- **types.discord.ts**: Discord 配置类型
- **types.slack.ts**: Slack 配置类型
- **types.imessage.ts**: iMessage 配置类型
- **types.models.ts**: 模型配置类型
- **types.gateway.ts**: Gateway 配置类型
- **types.hooks.ts**: Hooks 配置类型
- **types.browser.ts**: 浏览器配置类型
- **types.cron.ts**: 定时任务配置类型
- **types.messages.ts**: 消息配置类型
- **types.approvals.ts**: 批准配置类型
- **types.msteams.ts**: MS Teams 配置类型
- **types.googlechat.ts**: Google Chat 配置类型

### 工具模块

- **agent-dirs.ts**: Agent 目录
- **agent-limits.ts**: Agent 限制
- **cache-utils.ts**: 缓存工具
- **channel-capabilities.ts**: 渠道能力
- **commands.ts**: 命令配置
- **config-paths.ts**: 配置路径
- **group-policy.ts**: 群组策略
- **logging.ts**: 日志配置
- **markdown-tables.ts**: Markdown 表格
- **merge-config.ts**: 配置合并
- **merge-patch.ts**: 合并补丁
- **model-alias-defaults.ts**: 模型别名默认值
- **normalize-paths.ts**: 路径规范化
- **plugin-auto-enable.ts**: 插件自动启用
- **port-defaults.ts**: 端口默认值
- **sessions/**: 会话配置
- **slack-http-config.ts**: Slack HTTP 配置
- **slack-token-validation.ts**: Slack Token 验证
- **talk.ts**: Talk 配置
- **telegram-custom-commands.ts**: Telegram 自定义命令

## 数据模型

### 配置 IO

```typescript
// src/config/io.ts
interface ConfigIO {
  read: (path: string) => Promise<string>;
  write: (path: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
}

function createConfigIO(): ConfigIO;
```

### 配置哈希

```typescript
// src/config/io.ts
async function resolveConfigSnapshotHash(params?: {
  configPath?: string;
}): Promise<string>;
```

## 测试与质量

### 测试文件

- **config.*.test.ts**: 大量配置测试文件
- **schema.test.ts**: 模式测试
- **validation.test.ts**: 验证测试（需要单独运行）

### 测试覆盖

当前测试覆盖率约 92%。

## 常见问题 (FAQ)

### Q1: 配置文件默认位置在哪里？

A: `~/.config/clawdbot/config.yaml`（或 `config.json`）。

### Q2: 如何使用环境变量？

A: 使用 `${VAR_NAME}` 语法。

### Q3: 如何包含其他配置文件？

A: 使用 `include` 字段。

### Q4: 配置验证失败怎么办？

A: 检查错误信息，修正配置文件。使用 `clawdbot config validate` 验证。

### Q5: 如何迁移旧配置？

A: 自动迁移。如有问题，查看迁移日志。

## 相关文件清单

- `src/config/config.ts` - 配置入口
- `src/config/io.ts` - 配置 IO
- `src/config/schema.ts` - 配置模式
- `src/config/validation.ts` - 配置验证
- `src/config/paths.ts` - 路径解析
- `src/config/defaults.ts` - 默认值
- `src/config/env-substitution.ts` - 环境变量替换
- `src/config/includes.ts` - 配置包含
- `src/config/legacy-migrate.ts` - 旧配置迁移
- `src/config/runtime-overrides.ts` - 运行时覆盖
- `src/config/types*.ts` - 类型定义
- `src/config/*.test.ts` - 测试文件

## 变更记录

### 2026-01-25

- 创建配置管理模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
