# 基础设施模块 (Infrastructure)

[根目录](../../CLAUDE.md) > [src](../) > **infra**

## 模块职责

基础设施模块提供 Clawdbot 的底层服务和工具函数，包括执行主机、日志记录、端口管理、网络工具、文件存储、环境变量、错误处理等。

## 主要功能模块

### 执行主机 (exec-host.ts)

```typescript
// 执行命令的底层封装
interface ExecHost {
  exec: (command: string, args: string[], options?: ExecOptions) => Promise<ExecResult>;
  spawn: (command: string, args: string[], options?: SpawnOptions) => ChildProcess;
}

function createExecHost(): ExecHost;
```

### 日志记录 (logging.ts)

```typescript
// 日志系统
interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createLogger(options?: {
  level?: "debug" | "info" | "warn" | "error";
  pretty?: boolean;
}): Logger;
```

### 端口管理 (ports.ts)

```typescript
// 端口管理
async function getAvailablePort(params?: {
  host?: string;
  port?: number;
}): Promise<number>;

async function isPortInUse(params: {
  host: string;
  port: number;
}): Promise<boolean>;
```

### 网络工具 (net/)

```typescript
// src/infra/net/ssrf.ts
// SSRF 防护
function isSafeUrl(url: string): boolean;

function sanitizeUrl(url: string): string;
```

### 文件存储 (json-file.ts)

```typescript
// JSON 文件存储
class JsonFileStore<T> {
  read(): Promise<T>;
  write(data: T): Promise<void>;
  watch(callback: (data: T) => void): () => void;
}
```

### 环境变量 (env.ts, dotenv.ts)

```typescript
// 环境变量读取
function getEnv(key: string): string | undefined;

function requireEnv(key: string): string;

// .env 文件加载
async function loadDotEnv(params?: {
  path?: string;
}): Promise<Record<string, string>>;
```

### 错误处理 (errors.ts)

```typescript
// 错误工具
function isError(value: unknown): value is Error;

function isAbortError(value: unknown): value is Error;

function createError(params: {
  message: string;
  code?: string;
  cause?: Error;
}): Error;
```

### 出站消息 (outbound/)

```typescript
// src/infra/outbound/deliver.ts
// 消息传递核心
async function deliverMessage(params: {
  message: OutboundMessage;
  config: ClawdbotConfig;
  deps: OutboundSendDeps;
}): Promise<void>;

// src/infra/outbound/format.ts
// 消息格式化
function formatMessage(params: {
  message: string;
  channel: string;
}): string;

// src/infra/outbound/targets.ts
// 目标解析
function resolveTarget(params: {
  channel: string;
  target: string;
  config: ClawdbotConfig;
}): Target | null;
```

### 其他工具

- **archive.ts**: 归档工具
- **backoff.ts**: 退避重试
- **binaries.ts**: 二进制文件管理
- **bonjour.ts**: mDNS/Bonjour 服务发现
- **clipboard.ts**: 剪贴板操作
- **device-pairing.ts**: 设备配对
- **device-auth-store.ts**: 设备认证存储
- **device-identity.ts**: 设备身份
- **diagnostic-events.ts**: 诊断事件
- **exec-approvals.ts**: 执行批准
- **exec-safety.ts**: 执行安全
- **fetch.ts**: HTTP 请求封装
- **format-duration.ts**: 时长格式化
- **gateway-lock.ts**: Gateway 锁
- **heartbeat-*.ts**: 心跳相关
- **is-main.ts**: 主进程检测
- **machine-name.ts**: 机器名称
- **node-pairing.ts**: 节点配对
- **node-shell.ts**: 节点 Shell
- **os-summary.ts**: 操作系统摘要
- **path-env.ts**: PATH 环境变量

## 测试与质量

当前测试覆盖率约 86%。

## 常见问题 (FAQ)

### Q1: 如何使用 exec-host？

A: 通过 `createExecHost()` 创建实例，使用 `exec()` 或 `spawn()` 方法。

### Q2: 日志级别如何配置？

A: 通过 `createLogger({ level: "debug" })` 配置。

### Q3: 如何处理端口冲突？

A: 使用 `getAvailablePort()` 自动获取可用端口。

## 相关文件清单

- `src/infra/exec-host.ts`
- `src/infra/logging.ts`
- `src/infra/ports.ts`
- `src/infra/net/ssrf.ts`
- `src/infra/json-file.ts`
- `src/infra/env.ts`
- `src/infra/dotenv.ts`
- `src/infra/errors.ts`
- `src/infra/outbound/*.ts`
- 以及其他工具模块

## 变更记录

### 2026-01-25

- 创建基础设施模块文档
