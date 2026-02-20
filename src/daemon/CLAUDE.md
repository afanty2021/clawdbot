# 守护进程模块 (src/daemon/)

[根目录](../CLAUDE.md) > **daemon**

## 模块职责

OpenClaw 网关守护进程的安装和管理。支持 systemd (Linux)、launchd (macOS) 和 Windows 服务。

## 目录结构

```
src/daemon/
├── service.ts            # 服务管理
├── service-types.ts      # 服务类型
├── systemd.ts            # systemd 支持
├── systemd-unit.ts       # systemd 单元配置
├── launchd.ts            # launchd 支持
├── launchd.plist         # launchd plist 配置
├── schtasks.ts           # Windows 任务计划程序
├── node-service.ts       # Node.js 服务包装
├── service-audit.ts      # 服务审计
├── service-env.ts        # 服务环境变量
├── service-runtime.ts    # 运行时类型
├── constants.ts          # 常量定义
├── paths.ts              # 路径工具
├── program-args.ts       # 程序参数处理
├── diagnostics.ts        # 诊断工具
├── output.ts             # 输出处理
├── inspect.ts            # 检查工具
└── exec-file.ts          # 可执行文件
```

## 核心功能

### 1. 服务管理 (`service.ts`)

```typescript
// 服务状态
type ServiceStatus = "installed" | "running" | "stopped" | "unknown";

// 服务操作
interface DaemonService {
  install(): Promise<void>;
  uninstall(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  status(): Promise<ServiceStatus>;
  logs(): Promise<string>;
}
```

### 2. systemd 支持 (`systemd.ts`)

Linux systemd 服务管理：

```typescript
// systemd 服务
class SystemdService implements DaemonService {
  install(): Promise<void> {
    // 创建 .service 文件
    // 运行 systemctl enable
  }

  start(): Promise<void> {
    // 运行 systemctl start
  }
}
```

**服务单元示例**：
```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/openclaw gateway
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 3. launchd 支持 (`launchd.ts`)

macOS launchd 服务管理：

```typescript
// launchd 服务
class LaunchdService implements DaemonService {
  install(): Promise<void> {
    // 创建 plist 文件
    // 加载到 launchd
  }

  start(): Promise<void> {
    // launchctl start
  }
}
```

**Plist 示例**：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.openclaw.gateway</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/openclaw</string>
    <string>gateway</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

### 4. Windows 任务计划 (`schtasks.ts`)

Windows 任务计划程序支持：

```typescript
// Windows 服务
class SchtasksService implements DaemonService {
  install(): Promise<void> {
    // 创建计划任务
    // schtasks /create
  }
}
```

### 5. 服务环境 (`service-env.ts`)

```typescript
// 环境变量配置
interface ServiceEnvConfig {
  PATH?: string;
  NODE_ENV?: string;
  OPENCLAW_CONFIG?: string;
  [key: string]: string | undefined;
}

// 解析服务环境
function resolveServiceEnv(): ServiceEnvConfig
```

### 6. 服务审计 (`service-audit.ts`)

```typescript
// 审计服务配置
async function auditServiceConfig(params: {
  platform: NodeJS.Platform;
  serviceType: "systemd" | "launchd" | "schtasks";
}): Promise<ServiceAuditReport>
```

### 7. 常量定义 (`constants.ts`)

```typescript
// 服务名称
const DAEMON_NAME = "openclaw-gateway";

// 默认端口
const DEFAULT_PORT = 18789;

// 日志路径
const DEFAULT_LOG_PATH = "/var/log/openclaw/gateway.log";
```

### 8. 路径工具 (`paths.ts`)

```typescript
// 解析可执行文件路径
function resolveExecutablePath(): Promise<string>

// 解析配置文件路径
function resolveConfigPath(): Promise<string>

// 解析日志文件路径
function resolveLogPath(): Promise<string>
```

### 9. 程序参数 (`program-args.ts`)

```typescript
// 解析程序参数
function parseProgramArgs(args: string[]): ProgramArgs

// 格式化程序参数
function formatProgramArgs(args: ProgramArgs): string[]
```

## 对外接口

```typescript
// 服务工厂
export function createDaemonService(params: {
  platform: NodeJS.Platform;
}): DaemonService

// 服务类型
export * from "./service-types.js";
```

## 使用示例

### 安装服务

```bash
# Linux (systemd)
openclaw daemon install

# macOS (launchd)
openclaw daemon install

# Windows
openclaw daemon install
```

### 管理服务

```bash
# 启动
openclaw daemon start

# 停止
openclaw daemon stop

# 重启
openclaw daemon restart

# 状态
openclaw daemon status

# 日志
openclaw daemon logs
```

## 相关模块

- **`src/gateway/`** - 网关服务器
- **`src/cli/daemon-cli/`** - 守护进程 CLI

## 变更记录

### 2026-02-20 - 创建守护进程模块文档
- ✅ 创建 `src/daemon/CLAUDE.md` 文档
- 📋 记录各平台支持
- 🔗 建立服务管理说明
