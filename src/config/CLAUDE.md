# 配置系统模块 (src/config/)

[根目录](../../CLAUDE.md) > [src](../CLAUDE.md) > **config**

## 模块职责

提供 OpenClaw 的配置管理功能，包括配置文件加载、Zod Schema 验证、环境变量替换、多配置文件合并、配置迁移和配置热重载。该模块是整个系统的配置中心，确保配置的一致性和类型安全。

## 目录结构

```
src/config/
├── sessions/           # 会话配置
├── schema.ts           # 主配置 Schema
├── config.ts           # 配置加载器
├── io.ts               # 配置 I/O 操作
├── defaults.ts         # 默认配置值
├── paths.ts            # 路径解析
├── includes.ts         # 配置包含处理
├── validation.ts       # 配置验证
├── merge-config.ts     # 配置合并
├── merge-patch.ts      # 补丁合并
├── normalize-paths.ts  # 路径规范化
├── env-substitution.ts # 环境变量替换
├── legacy-migrate.ts   # 遗留配置迁移
├── legacy.ts           # 遗留配置兼容
├── logging.ts          # 日志配置
├── markdown-tables.ts  # Markdown 表格
├── version.ts          # 版本信息

# 遗留迁移
├── legacy.migrations.ts
├── legacy.migrations.part-1.ts
├── legacy.migrations.part-2.ts
├── legacy.migrations.part-3.ts
├── legacy.shared.ts
├── legacy.rules.ts

# 配置文件类型
├── types.agent-defaults.ts
├── types.agents.ts
├── types.approvals.ts
├── types.auth.ts
├── types.base.ts
├── types.browser.ts
├── types.channels.ts
├── types.cron.ts
├── types.discord.ts
├── types.gateway.ts
├── types.googlechat.ts
├── types.hooks.ts
├── types.imessage.ts
├── types.memory.ts
├── types.messages.ts
├── types.models.ts
├── types.msteams.ts
├── types.node-host.ts
├── types.openclaw.ts
├── types.plugins.ts
├── types.queue.ts
├── types.sandbox.ts
├── types.signal.ts
├── types.skills.ts
├── types.slack.ts
├── types.telegram.ts
├── types.tools.ts
├── types.ts
├── types.tts.ts
├── types.whatsapp.ts

# Zod Schema
├── zod-schema.ts
├── zod-schema.agent-defaults.ts
├── zod-schema.agent-runtime.ts
├── zod-schema.agents.ts
├── zod-schema.approvals.ts
├── zod-schema.channels.ts
├── zod-schema.core.ts
├── zod-schema.hooks.ts
├── zod-schema.providers.ts
├── zod-schema.providers-core.ts
├── zod-schema.providers-whatsapp.ts
├── zod-schema.session.ts

# 特殊配置
├── config-paths.ts
├── group-policy.ts
├── agent-dirs.ts
├── agent-limits.ts
├── runtime-overrides.ts
├── port-defaults.ts
├── talk.ts
├── slack-http-config.ts
├── slack-token-validation.ts
├── plugin-auto-enable.ts
├── redact-snapshot.ts
├── test-helpers.ts
└── sessions.ts
```

## 入口与启动

### 主入口

- **`src/config/config.ts`** - 配置加载主入口
- **`src/config/io.ts`** - 配置读写操作

### 加载流程

```typescript
import { loadConfig } from "./config/config.ts";

const config = await loadConfig({
  configDir: "~/.config/openclaw",
  configFile: "openclaw.json",
  profile: "default",
});
```

## 对外接口

### ConfigLoader 接口

```typescript
interface ConfigLoader {
  load(): Promise<OpenClawConfig>;
  loadSync(): OpenClawConfig;
  reload(): Promise<OpenClawConfig>;
  validate(config: unknown): ValidationResult;
}
```

### OpenClawConfig 接口

```typescript
interface OpenClawConfig {
  version: string;
  identity: IdentityConfig;
  channels: ChannelsConfig;
  agents: AgentsConfig;
  providers: ProvidersConfig;
  browser: BrowserConfig;
  sessions: SessionsConfig;
  hooks: HooksConfig;
  logging: LoggingConfig;
  advanced: AdvancedConfig;
}
```

### ValidationResult 接口

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

## 子模块详解

### 1. 配置加载 (`config.ts`, `io.ts`)

**职责**：配置文件的读取、解析和缓存

**关键文件**：

- `config.ts` - 配置加载主逻辑
- `io.ts` - 文件 I/O 操作
- `paths.ts` - 配置文件路径解析

**功能**：

- 多格式支持（JSON、YAML）
- 配置目录扫描
- 配置文件合并
- 缓存和热重载

### 2. Schema 验证 (`schema.ts`, `zod-schema.*.ts`)

**职责**：使用 Zod 定义和验证配置

**关键文件**：

- `schema.ts` - 主配置 Schema
- `zod-schema.core.ts` - 核心配置 Schema
- `zod-schema.providers-core.ts` - 提供商 Schema
- `zod-schema.session.ts` - 会话 Schema

**功能**：

- 类型安全的配置验证
- 自定义验证规则
- 错误消息本地化

### 3. 配置合并 (`includes.ts`, `merge-config.ts`)

**职责**：处理配置包含和多配置文件合并

**关键文件**：

- `includes.ts` - `@include` 指令处理
- `merge-config.ts` - 配置合并逻辑

**合并策略**：

1. 默认配置
2. 用户配置
3. 环境变量覆盖
4. 命令行参数

### 4. 环境变量替换 (`env-substitution.ts`)

**职责**：将环境变量替换到配置中

**语法**：

```json
{
  "apiKey": "${OPENCLAW_API_KEY}",
  "path": "${HOME}/data"
}
```

### 5. 遗留迁移 (`legacy-migrate.ts`)

**职责**：将旧版配置迁移到新版格式

**关键文件**：

- `legacy-migrate.ts` - 迁移入口
- `legacy.migrations.part-*.ts` - 各版本迁移逻辑

**迁移版本**：

- v1.x → v2.x
- v2.x → v3.x
- v3.x → 当前版本

### 6. 会话配置 (`sessions/`, `sessions.ts`)

**职责**：会话相关的配置

**关键文件**：

- `sessions/sessions.ts` - 会话配置
- `sessions/cache.ts` - 会话缓存配置
- `sessions/test.ts` - 测试配置

### 7. 类型定义 (`types.*.ts`)

**职责**：配置的类型 TypeScript 定义

**主要类型**：

- `types.base.ts` - 基础类型
- `types.agents.ts` - 代理类型
- `types.providers.ts` - 提供商类型
- `types.channels.ts` - 渠道类型

## 关键依赖与配置

### 核心依赖

```json
{
  "zod": "^3.22.0",
  "yaml": "^2.3.0"
}
```

### 配置文件位置

```
~/.config/openclaw/openclaw.json     # 主配置
~/.config/openclaw/openclaw.local.json  # 本地覆盖
~/.config/openclaw/profiles/         # 配置文件
```

### 环境变量

```bash
OPENCLAW_CONFIG_DIR      # 配置目录
OPENCLAW_CONFIG_FILE     # 配置文件名
OPENCLAW_PROFILE         # 配置 profile
```

## 测试与质量

### 测试文件

- `src/config/**/*.test.ts` - 单元测试
- `src/config/**/*.migrations.test.ts` - 迁移测试

### 测试命令

```bash
pnpm test src/config
pnpm test src/config --migrations
```

## 常见问题 (FAQ)

### Q: 如何创建新配置？

A: 使用 `openclaw config init` 命令或复制示例配置文件。

### Q: 配置不生效怎么办？

A: 检查配置文件位置、格式是否正确，使用 `openclaw config validate` 验证。

### Q: 如何在不同环境使用不同配置？

A: 使用配置文件和 `OPENCLAW_PROFILE` 环境变量切换。

## 相关文件清单

### 核心文件

- `src/config/config.ts` - 配置加载器
- `src/config/schema.ts` - Schema 定义
- `src/config/io.ts` - I/O 操作

### 迁移文件

- `src/config/legacy-migrate.ts` - 迁移入口
- `src/config/legacy.migrations.part-*.ts` - 各版本迁移

### 测试文件

- `src/config/**/*.test.ts` - 配置测试
- `src/config/**/*.migrations.test.ts` - 迁移测试

## 变更记录

### 2026-02-10 - 创建配置模块文档

- ✅ 创建 `src/config/CLAUDE.md` 文档
- 📋 记录 Schema 和迁移系统
- 🔗 建立配置类型导航

<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 10, 2026

| ID    | Time     | T   | Title                                                                          | Read |
| ----- | -------- | --- | ------------------------------------------------------------------------------ | ---- |
| #2212 | 10:30 AM | 🟣  | Documentation coverage campaign achieved 100% core module coverage             | ~546 |
| #2207 | 10:25 AM | 🟣  | Documentation coverage significantly improved - 10 new CLAUDE.md files created | ~538 |
| #2189 | 10:21 AM | 🟣  | Created three CLAUDE.md files for channels, config, and sessions modules       | ~367 |

### Feb 21, 2026

| ID    | Time     | T   | Title                                    | Read |
| ----- | -------- | --- | ---------------------------------------- | ---- |
| #5608 | 11:55 PM | 🔵  | Exploring OpenClaw Configuration Options | ~195 |

### Feb 22, 2026

| ID    | Time     | T   | Title                                 | Read |
| ----- | -------- | --- | ------------------------------------- | ---- |
| #5612 | 12:00 AM | 🔵  | Heartbeat Configuration Options Found | ~274 |

</claude-mem-context>
