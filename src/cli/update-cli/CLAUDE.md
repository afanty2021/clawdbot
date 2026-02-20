---
summary: "更新 CLI 实现 - 检查、下载、安装 OpenClaw 更新"
read_when:
  - 理解更新命令实现
  - 调试更新流程
  - 添加新的更新源
title: "Update CLI 子模块"
---

# Update CLI 子模块

> 更新时间：2026-02-20

本模块实现 `openclaw update` 命令，支持从 npm 和 Git 源更新 OpenClaw。

## 模块概览

```
src/cli/update-cli/
├── update-command.ts       # 更新命令实现
├── progress.ts             # 进度显示
├── restart-helper.ts       # 重启辅助
├── shared.ts               # 共享工具函数
├── status.ts               # 状态查询
├── wizard.ts               # 更新向导
└── suppress-deprecations.ts # 弃用警告抑制
```

## 核心功能

### 1. 更新命令 (`update-command.ts`)

**导出**: `registerUpdateCommand(program: Command)`

**命令**: `openclaw update [options]`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--channel` | string | 更新通道（latest/beta/git） |
| `--version` | string | 目标版本 |
| `--tag` | string | Git 标签 |
| `--branch` | string | Git 分支 |
| `--dry-run` | boolean | 预演更新 |
| `--timeout` | string | 超时时间 |
| `--skip-prompt` | boolean | 跳过确认 |
| `--restart` | boolean | 更新后重启服务 |

### 2. 更新流程

**完整流程**:
```
1. 检查更新状态
   ├─ 当前版本
   ├─ 最新版本
   └─ 更新来源

2. 下载更新
   ├─ npm: npm install -g
   ├─ git: git pull / git checkout
   └─ 缓存: 使用本地缓存

3. 安装更新
   ├─ 全局安装
   ├─ 插件同步
   └─ 补全缓存

4. 重启服务
   ├─ 网关重启
   ├─ 守护进程重启
   └─ 节点重连
```

### 3. 更新通道 (`shared.ts`)

**支持的通道**:
- **latest**: 最新稳定版（默认）
- **beta**: 测试版
- **git**: Git 源（开发模式）

**通道配置**:
```typescript
function channelToNpmChannel(channel: string): string {
  if (channel === "beta") return "@openclaw/beta";
  return "@openclaw/openclaw";
}

function resolveNpmChannelTag(channel: string): string {
  if (channel === "beta") return "beta";
  return "latest";
}
```

### 4. 版本检查

**导出**:
- `checkUpdateStatus(opts)` - 检查更新状态
- `compareSemverStrings(a, b)` - 比较版本

**返回状态**:
```typescript
interface UpdateStatus {
  current: string;
  latest: string;
  updateAvailable: boolean;
  channel: string;
}
```

### 5. 进度显示 (`progress.ts`)

**导出**: `createUpdateProgress()`

**进度阶段**:
1. 检查更新
2. 下载更新
3. 安装更新
4. 同步插件
5. 重启服务

```typescript
const progress = createUpdateProgress();
progress.check();
progress.download();
progress.install();
progress.sync();
progress.restart();
```

### 6. 重启辅助 (`restart-helper.ts`)

**导出**:
- `prepareRestartScript(opts)` - 准备重启脚本
- `runRestartScript(opts)` - 运行重启脚本

**重启流程**:
1. 停止网关服务
2. 等待进程退出
3. 启动新版本
4. 验证服务健康

### 7. 状态查询 (`status.ts`)

**导出**: `registerUpdateStatusCommand(program: Command)`

**命令**: `openclaw update status`

**显示信息**:
- 当前版本
- 最新版本
- 更新通道
- 上次更新时间
- Git commit（如果适用）

### 8. 更新向导 (`wizard.ts`)

**交互式更新**:
- 选择更新通道
- 确认目标版本
- 显示更新摘要
- 确认并执行

## 类型定义

```typescript
interface UpdateCommandOptions {
  channel?: string;
  version?: string;
  tag?: string;
  branch?: string;
  dryRun?: boolean;
  timeout?: string;
  skipPrompt?: boolean;
  restart?: boolean;
}

type UpdateChannel = "latest" | "beta" | "git";
```

## 相关文档

- [更新检查](../../infra/update-check.ts)
- [更新运行器](../../infra/update-runner.ts)
- [全局安装](../../infra/update-global.ts)
- [守护进程管理](../daemon-cli/)

## 导出索引

```typescript
export { registerUpdateCommand } from "./update-command.js";
export { registerUpdateStatusCommand } from "./status.js";

export {
  createUpdateProgress,
  printResult,
} from "./progress.js";

export {
  prepareRestartScript,
  runRestartScript,
} from "./restart-helper.js";

export {
  DEFAULT_PACKAGE_NAME,
  readPackageName,
  readPackageVersion,
  resolveTargetVersion,
  resolveUpdateRoot,
  normalizeTag,
  parseTimeoutMsOrExit,
} from "./shared.js";
```
