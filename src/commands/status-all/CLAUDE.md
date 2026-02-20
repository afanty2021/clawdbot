---
summary: "Status All 命令实现 - 全面系统状态扫描"
read_when:
  - 理解状态检查机制
  - 调试系统问题
  - 扩展状态检查功能
title: "Status All 命令子模块"
---

# Status All 命令子模块

> 更新时间：2026-02-20

本模块实现 `openclaw status --all` 命令，执行全面的系统状态扫描。

## 模块概览

```
src/commands/status-all/
├── agents.ts       # Agent 状态收集
├── channels.ts     # 渠道状态表格
├── format.ts       # 格式化工具
├── gateway.ts      # 网关状态
└── report-lines.ts # 报告行生成
```

## 核心功能

### 1. 命令实现 (`../status-all.ts`)

**导出**: `statusAllCommand(runtime, opts)`

**命令**: `openclaw status --all`

**扫描项** (11 个阶段):
1. **加载配置** - 读取配置文件
2. **检查 Tailscale** - VPN 状态
3. **检查更新** - 版本更新状态
4. **网关探测** - 连接性和认证
5. **渠道状态** - 所有通信渠道
6. **Agent 状态** - 本地 Agent
7. **节点服务** - 移动节点
8. **守护进程** - 服务状态
9. **技能状态** - 工作区技能
10. **错误日志** - 最近的错误
11. **生成报告** - 汇总所有信息

### 2. Agent 状态 (`agents.ts`)

**导出**: `getAgentLocalStatuses(cfg)`

**收集信息**:
- Agent ID 和名称
- 工作区路径
- Agent 目录
- 配置的模型
- 路由规则
- 绑定数量

### 3. 渠道状态 (`channels.ts`)

**导出**: `buildChannelsTable(channels, cfg)`

**显示信息**:
- 渠道类型
- 账户 ID
- 配置状态
- 启用状态
- 连接状态
- 错误信息

### 4. 网关状态 (`gateway.ts`)

**导出**:
- `pickGatewaySelfPresence(presence)` - 提取自身状态
- `buildGatewayConnectionDetails(opts)` - 连接详情

**状态信息**:
- 运行状态
- 监听地址
- 认证模式
- 连接的客户端
- 最后活动时间

### 5. 格式化工具 (`format.ts`)

**导出**:
- `formatDurationPrecise(ms)` - 格式化持续时间
- `formatGatewayAuthUsed(auth)` - 格式化认证使用

### 6. 报告生成 (`report-lines.ts`)

**导出**: `buildStatusAllReportLines(data)`

**报告部分**:
```typescript
// 示例输出
OpenClaw v1.0.0 (latest)

┌─────────────────────────────────────────────────────────────┐
│ Gateway                                                     │
├─────────────────────────────────────────────────────────────┤
│ Status: Running                                             │
│ Listen: ws://127.0.0.1:18789                               │
│ Auth: token                                                 │
│ Clients: 1                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Channels                                                    │
├─────────────────────────────────────────────────────────────┤
│ telegram (default)  Configured Enabled Connected           │
│ slack (work)       Configured Enabled  Disconnected         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Agents                                                      │
├─────────────────────────────────────────────────────────────┤
│ main (default)                                              │
│   Workspace: ~/.openclaw/agents/main                        │
│   Model: anthropic/claude-3-opus                           │
│   Bindings: 2                                               │
└─────────────────────────────────────────────────────────────┘
```

## 进度跟踪

使用 `withProgress` 显示扫描进度：

```typescript
await withProgress({ label: "Scanning status --all…", total: 11 }, async (progress) => {
  progress.setLabel("Loading config…");
  const cfg = loadConfig();
  progress.tick();

  progress.setLabel("Checking Tailscale…");
  // ...
});
```

## 相关文档

- [状态命令](../status.command.ts)
- [网关探测](../../gateway/probe.ts)
- [渠道状态问题](../../infra/channels-status-issues.ts)
- [节点服务](../../daemon/node-service.ts)

## 导出索引

```typescript
export { statusAllCommand } from "../status-all.js";

export { getAgentLocalStatuses } from "./status-all/agents.js";
export { buildChannelsTable } from "./status-all/channels.js";
export { pickGatewaySelfPresence } from "./status-all/gateway.js";
export { buildStatusAllReportLines } from "./status-all/report-lines.js";

export {
  formatDurationPrecise,
  formatGatewayAuthUsed,
} from "./status-all/format.js";
```
