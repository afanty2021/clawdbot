# CLI 框架模块

[根目录](../../CLAUDE.md) > [src](../) > **cli**

## 模块职责

CLI 框架模块是 Clawdbot 的命令行界面层，负责解析命令行参数、调度各个子命令、管理 CLI 依赖注入、处理进度显示等。该模块为用户提供了统一的命令行入口，支持丰富的子命令和选项。

## 入口与启动

### 主要入口点

- **deps.ts**: CLI 依赖注入中心
  - `createDefaultDeps()`: 创建默认依赖（消息发送函数等）
  - `createOutboundSendDeps()`: 创建出站发送依赖

### CLI 结构

CLI 采用分层命令结构：

```
clawdbot
├── agent           # AI Agent 相关命令
├── channels        # 消息渠道相关命令
├── config          # 配置管理命令
├── gateway         # Gateway 相关命令
├── browser         # 浏览器控制命令
├── nodes           # 节点管理命令
├── daemon          # 守护进程命令
├── hooks           # Hooks 命令
├── logs            # 日志命令
├── memory          # 内存管理命令
├── models          # 模型管理命令
├── docs            # 文档命令
├── dns             # DNS 命令
├── devices         # 设备管理命令
├── directory       # 目录命令
├── exec-approvals  # 执行批准命令
├── cron            # 定时任务命令
└── ...             # 其他命令
```

### 依赖注入

```typescript
// src/cli/deps.ts
interface CliDeps {
  sendMessageWhatsApp: typeof sendMessageWhatsApp;
  sendMessageTelegram: typeof sendMessageTelegram;
  sendMessageDiscord: typeof sendMessageDiscord;
  sendMessageSlack: typeof sendMessageSlack;
  sendMessageSignal: typeof sendMessageSignal;
  sendMessageIMessage: typeof sendMessageIMessage;
}

// 创建默认依赖
function createDefaultDeps(): CliDeps;

// 创建出站发送依赖
function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps;
```

## 对外接口

### 命令行接口

```bash
# AI Agent 命令
clawdbot agent [options] [message...]
clawdbot agent:send [options] <target> <message...>
clawdbot agent:sessions [options]

# 渠道命令
clawdbot channels status [options]
clawdbot channels auth <channel> [options]
clawdbot channels probe [options]

# Gateway 命令
clawdbot gateway run [options]
clawdbot gateway call [options] <method>
clawdbot gateway discover [options]
clawdbot gateway dev [options]

# 配置命令
clawdbot config set <key> <value>
clawdbot config get <key>
clawdbot config list
clawdbot config edit
clawdbot config validate

# 浏览器命令
clawdbot browser serve [options]
clawdbot browser inspect [options]
clawdbot browser debug [options]
clawdbot browser actions [options]
clawdbot browser examples [options]
clawdbot browser manage [options]
clawdbot browser state [options]

# 节点命令
clawdbot nodes status [options]
clawdbot nodes pair [options]
clawdbot nodes camera [options]
clawdbot nodes canvas [options]
clawdbot nodes screen [options]
clawdbot nodes location [options]
clawdbot nodes notify [options]
clawdbot nodes invoke [options]

# 守护进程命令
clawdbot daemon start [options]
clawdbot daemon stop [options]
clawdbot daemon restart [options]
clawdbot daemon status [options]
clawdbot daemon install [options]

# Hooks 命令
clawdbot hooks list [options]
clawdbot hooks install <hook>
clawdbot hooks uninstall <hook>
clawdbot hooks status [options]

# 日志命令
clawdbot logs [options] [query]
clawdbot logs:follow [options] [query]

# 内存命令
clawdbot memory stats [options]
clawdbot memory gc

# 模型命令
clawdbot models list [options]
clawdbot models test [options]

# DNS 命令
clawdbot dns query <domain>

# 设备命令
clawdbot devices list [options]
clawdbot devices info <device-id>

# 目录命令
clawdbot directory list [options]
clawdbot directory get <id>

# 执行批准命令
clawdbot exec-approvals list [options]
clawdbot exec-approvals clear [options]

# 定时任务命令
clawdbot cron list [options]
clawdbot cron add [options]
clawdbot cron edit <id>
clawdbot cron remove <id>

# 文档命令
clawdbot docs [options] [page]

# 开发命令
clawdbot dev [options]
```

### 共享选项

```typescript
// src/cli/command-options.ts
interface CommonOptions {
  config?: string; // 配置文件路径
  verbose?: boolean; // 详细输出
  quiet?: boolean; // 静默模式
  debug?: boolean; // 调试模式
  json?: boolean; // JSON 输出
  account?: string; // 账户 ID
  agent?: string; // Agent ID
}

// 渠道选项
interface ChannelOptions {
  channel?: string; // 渠道 ID
  accountId?: string; // 账户 ID
}

// Gateway 选项
interface GatewayOptions {
  mode?: "local" | "remote"; // Gateway 模式
  bind?: string; // 绑定地址
  port?: number; // 端口
  force?: boolean; // 强制启动
}
```

### 进度显示

```typescript
// src/cli/progress.ts
import { createProgressBar, createSpinner } from "./progress.js";

// 进度条
const progress = createProgressBar("Processing...", { total: 100 });
progress.update(50);
progress.complete();

// 旋转指示器
const spinner = createSpinner("Loading...");
spinner.start();
spinner.stop("Done!");
```

### Banner 显示

```typescript
// src/cli/banner.ts
function printBanner(options?: {
  compact?: boolean; // 紧凑模式
  color?: boolean; // 彩色输出
}): void;
```

## 关键依赖与配置

### 命令行解析器

CLI 使用 `yargs` 或 `cac` 进行命令行解析：

```typescript
import { Command } from "cac";
import { Option } from "cac";

const cli = Command("clawdbot");
cli.option("--config <path>", "Config file path");
cli.option("--verbose", "Verbose output");
```

### 浏览器 CLI

浏览器控制有独立的 CLI 子模块：

```typescript
// src/cli/browser-cli.ts
// src/cli/browser-cli-actions-input.ts
// src/cli/browser-cli-actions-observe.ts
// src/cli/browser-cli-debug.ts
// src/cli/browser-cli-extension.ts
// src/cli/browser-cli-inspect.ts
// src/cli/browser-cli-manage.ts
// src/cli/browser-cli-serve.ts
// src/cli/browser-cli-state.ts
```

### Gateway RPC

```typescript
// src/cli/gateway-rpc.ts
async function callGateway(params: {
  method: string;
  params?: unknown[];
  options?: {
    mode?: "local" | "remote";
    timeoutMs?: number;
  };
}): Promise<unknown>;
```

### Channels CLI

```typescript
// src/cli/channels-cli.ts
async function channelsStatus(params: {
  all?: boolean;
  deep?: boolean;
  probe?: boolean;
  json?: boolean;
}): Promise<ChannelStatus[]>;

async function channelsAuth(params: {
  channel: string;
  account?: string;
}): Promise<void>;

async function channelsProbe(params: {
  channel?: string;
  timeoutMs?: number;
}): Promise<ProbeResult[]>;
```

### Config CLI

```typescript
// src/cli/config-cli.ts
async function configGet(params: {
  key: string;
  format?: "json" | "yaml";
}): Promise<unknown>;

async function configSet(params: {
  key: string;
  value: string;
}): Promise<void>;

async function configList(): Promise<Record<string, unknown>>;

async function configValidate(): Promise<{
  valid: boolean;
  errors?: string[];
}>;
```

### Daemon CLI

```typescript
// src/cli/daemon-cli.ts
async function daemonStart(params: {
  mode?: "local" | "remote";
  bind?: string;
  port?: number;
  force?: boolean;
}): Promise<void>;

async function daemonStop(): Promise<void>;

async function daemonStatus(): Promise<DaemonStatus>;

async function daemonInstall(params: {
  platform?: "macos" | "linux" | "windows";
}): Promise<void>;
```

### Nodes CLI

```typescript
// src/cli/nodes-cli.ts
async function nodesStatus(params: {
  all?: boolean;
  probe?: boolean;
}): Promise<NodeStatus[]>;

async function nodesPair(params: {
  code?: string;
  timeoutMs?: number;
}): Promise<void>;

async function nodesCamera(params: {
  action: "start" | "stop" | "capture";
  nodeId?: string;
}): Promise<void>;

async function nodesCanvas(params: {
  action: "list" | "show" | "hide";
  jsonl?: string;
}): Promise<void>;

async function nodesScreen(params: {
  action: "start" | "stop" | "capture";
  nodeId?: string;
}): Promise<void>;

async function nodesLocation(params: {
  action: "get" | "watch";
  nodeId?: string;
}): Promise<void>;

async function nodesNotify(params: {
  title: string;
  body: string;
  nodeId?: string;
}): Promise<void>;

async function nodesInvoke(params: {
  target: string;
  method: string;
  params?: unknown[];
  nodeId?: string;
}): Promise<unknown>;
```

### Hooks CLI

```typescript
// src/cli/hooks-cli.ts
async function hooksList(): Promise<HookInfo[]>;

async function hooksInstall(params: {
  hook: string;
  force?: boolean;
}): Promise<void>;

async function hooksUninstall(params: {
  hook: string;
}): Promise<void>;

async function hooksStatus(): Promise<HookStatus[]>;
```

### Logs CLI

```typescript
// src/cli/logs-cli.ts
async function logsQuery(params: {
  query?: string;
  follow?: boolean;
  tail?: number;
  json?: boolean;
}): Promise<void>;
```

### Memory CLI

```typescript
// src/cli/memory-cli.ts
async function memoryStats(): Promise<MemoryStats>;

async function memoryGC(): Promise<void>;
```

### Models CLI

```typescript
// src/cli/models-cli.ts
async function modelsList(params: {
  provider?: string;
  capabilities?: string[];
}): Promise<ModelInfo[]>;

async function modelsTest(params: {
  model: string;
  prompt?: string;
}): Promise<void>;
```

### Cron CLI

```typescript
// src/cli/cron-cli.ts
async function cronList(): Promise<CronJob[]>;

async function cronAdd(params: {
  schedule: string;
  agent: string;
  message: string;
}): Promise<void>;

async function cronEdit(params: {
  id: string;
  schedule?: string;
  agent?: string;
  message?: string;
}): Promise<void>;

async function cronRemove(params: {
  id: string;
}): Promise<void>;
```

### 其他 CLI

- **docs-cli.ts**: 文档命令
- **dns-cli.ts**: DNS 查询
- **devices-cli.ts**: 设备管理
- **directory-cli.ts**: 目录管理
- **exec-approvals-cli.ts**: 执行批准管理
- **acp-cli.ts**: ACP（Agent Control Protocol）命令
- **channel-auth.ts**: 渠道认证辅助
- **channel-options.ts**: 渠道选项辅助
- **command-format.ts**: 命令格式化
- **cli-utils.ts**: CLI 工具函数
- **help-format.ts**: 帮助格式化

## 数据模型

### CLI 上下文

```typescript
interface CliContext {
  config: ClawdbotConfig;
  options: CommonOptions;
  runtime: RuntimeEnv;
  deps: CliDeps;
}

// 创建 CLI 上下文
async function createCliContext(options: CommonOptions): Promise<CliContext>;
```

### 命令结果

```typescript
interface CommandResult {
  success: boolean;
  data?: unknown;
  error?: string;
  output?: string;
}

// JSON 输出
function printCommandResult(result: CommandResult, options: {
  json?: boolean;
  pretty?: boolean;
}): void;
```

### 进度上下文

```typescript
interface ProgressContext {
  progressBar: ProgressBar;
  spinner: Spinner;
  update: (current: number, total?: number) => void;
  complete: (message?: string) => void;
  error: (message: string) => void;
}
```

## 测试与质量

### 测试文件

- **argv.test.ts**: 命令行参数解析测试
- **browser-cli.test.ts**: 浏览器 CLI 测试
- **browser-cli-extension.test.ts**: 浏览器扩展 CLI 测试
- **browser-cli-inspect.test.ts**: 浏览器检查 CLI 测试
- **cron-cli.test.ts**: 定时任务 CLI 测试
- **daemon-cli.coverage.test.ts**: 守护进程 CLI 覆盖率测试
- **gateway-cli.coverage.test.ts**: Gateway CLI 覆盖率测试
- **gateway.sigterm.test.ts**: Gateway SIGTERM 处理测试
- **nodes-cli.coverage.test.ts**: 节点 CLI 覆盖率测试
- **nodes-camera.test.ts**: 相机命令测试
- **nodes-canvas.test.ts**: Canvas 命令测试
- **exec-approvals-cli.test.ts**: 执行批准 CLI 测试
- **hooks-cli.test.ts**: Hooks CLI 测试
- **logs-cli.test.ts**: 日志 CLI 测试
- **memory-cli.test.ts**: 内存 CLI 测试
- **models-cli.test.ts**: 模型 CLI 测试

### 测试覆盖

当前测试覆盖率约 90%。

### 运行测试

```bash
# CLI 模块测试
pnpm test src/cli

# 特定测试
pnpm test src/cli/gateway-cli.test.ts

# 实时测试
CLAWDBOT_LIVE_TEST=1 pnpm test:live src/cli
```

## 常见问题 (FAQ)

### Q1: 如何添加新的 CLI 命令？

A: 在 `src/commands/` 或 `src/cli/` 中创建新的命令文件，然后在主 CLI 入口中注册。

### Q2: CLI 配置文件位置在哪里？

A: 默认位置为 `~/.config/clawdbot/config.yaml`，可通过 `--config` 选项指定。

### Q3: 如何启用调试模式？

A: 使用 `--debug` 或 `--verbose` 选项。

### Q4: CLI 支持哪些输出格式？

A: 支持文本输出（默认）和 JSON 输出（`--json`）。

### Q5: 如何查看 CLI 帮助？

A: 使用 `clawdbot --help` 或 `clawdbot <command> --help`。

### Q6: CLI 支持自动补全吗？

A: 部分支持，可通过 `clawdbot completion <shell>` 生成补全脚本。

### Q7: 如何处理 CLI 错误？

A: CLI 错误会显示友好的错误信息，退出码非 0 表示错误。

### Q8: CLI 支持配置文件吗？

A: 支持，可通过 `--config` 选项指定配置文件路径。

### Q9: 如何运行 CLI 开发模式？

A: 使用 `clawdbot dev` 或 `pnpm dev` 启动开发模式。

### Q10: CLI 支持哪些环境变量？

A:
- `CLAWDBOT_CONFIG`: 配置文件路径
- `CLAWDBOT_VERBOSE`: 详细输出
- `CLAWDBOT_DEBUG`: 调试模式
- `CLAWDBOT_QUIET`: 静默模式

## 相关文件清单

### 核心

- `src/cli/deps.ts` - 依赖注入
- `src/cli/banner.ts` - Banner 显示
- `src/cli/cli-utils.ts` - CLI 工具
- `src/cli/command-format.ts` - 命令格式化
- `src/cli/command-options.ts` - 命令选项
- `src/cli/help-format.ts` - 帮助格式化
- `src/cli/progress.ts` - 进度显示

### 命令实现

- `src/cli/acp-cli.ts` - ACP 命令
- `src/cli/channel-auth.ts` - 渠道认证
- `src/cli/channel-options.ts` - 渠道选项
- `src/cli/channels-cli.ts` - 渠道命令
- `src/cli/config-cli.ts` - 配置命令
- `src/cli/cron-cli.ts` - 定时任务命令
- `src/cli/daemon-cli.ts` - 守护进程命令
- `src/cli/devices-cli.ts` - 设备命令
- `src/cli/directory-cli.ts` - 目录命令
- `src/cli/dns-cli.ts` - DNS 命令
- `src/cli/docs-cli.ts` - 文档命令
- `src/cli/exec-approvals-cli.ts` - 执行批准命令
- `src/cli/gateway-cli.ts` - Gateway 命令
- `src/cli/gateway-rpc.ts` - Gateway RPC
- `src/cli/hooks-cli.ts` - Hooks 命令
- `src/cli/logs-cli.ts` - 日志命令
- `src/cli/memory-cli.ts` - 内存命令
- `src/cli/models-cli.ts` - 模型命令
- `src/cli/node-cli.ts` - Node 命令

### 浏览器 CLI

- `src/cli/browser-cli.ts` - 浏览器 CLI 入口
- `src/cli/browser-cli-actions-input.ts` - 输入动作
- `src/cli/browser-cli-actions-observe.ts` - 观察动作
- `src/cli/browser-cli-debug.ts` - 调试命令
- `src/cli/browser-cli-examples.ts` - 示例命令
- `src/cli/browser-cli-extension.ts` - 扩展命令
- `src/cli/browser-cli-inspect.ts` - 检查命令
- `src/cli/browser-cli-manage.ts` - 管理命令
- `src/cli/browser-cli-serve.ts` - 服务命令
- `src/cli/browser-cli-shared.ts` - 共享代码
- `src/cli/browser-cli-state.ts` - 状态命令
- `src/cli/browser-cli-state.cookies-storage.ts` - Cookie 存储

### Cron 子命令

- `src/cli/cron-cli/register.ts` - Cron 注册
- `src/cli/cron-cli/register.cron-add.ts` - 添加定时任务
- `src/cli/cron-cli/register.cron-edit.ts` - 编辑定时任务
- `src/cli/cron-cli/register.cron-simple.ts` - 简单定时任务
- `src/cli/cron-cli/shared.ts` - 共享代码

### Daemon 子命令

- `src/cli/daemon-cli/register.ts` - Daemon 注册
- `src/cli/daemon-cli/install.ts` - 安装
- `src/cli/daemon-cli/lifecycle.ts` - 生命周期
- `src/cli/daemon-cli/probe.ts` - 探测
- `src/cli/daemon-cli/response.ts` - 响应
- `src/cli/daemon-cli/runners.ts` - 运行器
- `src/cli/daemon-cli/shared.ts` - 共享代码
- `src/cli/daemon-cli/status.ts` - 状态
- `src/cli/daemon-cli/status.gather.ts` - 状态收集
- `src/cli/daemon-cli/status.print.ts` - 状态打印

### Gateway 子命令

- `src/cli/gateway-cli/register.ts` - Gateway 注册
- `src/cli/gateway-cli/call.ts` - 调用命令
- `src/cli/gateway-cli/dev.ts` - 开发命令
- `src/cli/gateway-cli/discover.ts` - 发现命令
- `src/cli/gateway-cli/register.ts` - 注册
- `src/cli/gateway-cli/run-loop.ts` - 运行循环
- `src/cli/gateway-cli/run.ts` - 运行命令
- `src/cli/gateway-cli/shared.ts` - 共享代码

### Nodes 子命令

- `src/cli/nodes-cli/register.ts` - Nodes 注册
- `src/cli/nodes-cli/a2ui-jsonl.ts` - A2UI JSONL
- `src/cli/nodes-cli/cli-utils.ts` - CLI 工具
- `src/cli/nodes-cli/format.ts` - 格式化
- `src/cli/nodes-cli/register.camera.ts` - 相机命令
- `src/cli/nodes-cli/register.canvas.ts` - Canvas 命令
- `src/cli/nodes-cli/register.invoke.ts` - 调用命令
- `src/cli/nodes-cli/register.location.ts` - 位置命令
- `src/cli/nodes-cli/register.notify.ts` - 通知命令
- `src/cli/nodes-cli/register.pairing.ts` - 配对命令
- `src/cli/nodes-cli/register.screen.ts` - 屏幕命令
- `src/cli/nodes-cli/register.status.ts` - 状态命令

### 测试

- `src/cli/**/*.test.ts` - 单元测试

## 变更记录

### 2026-01-25

- 创建 CLI 框架模块文档
- 记录核心接口和数据模型
- 添加常见问题解答
- 记录命令结构和依赖注入
