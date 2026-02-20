---
summary: "Agent 命令实现 - Agent 管理、配置和身份"
read_when:
  - 理解 Agent 管理功能
  - 调试 Agent 配置
  - 管理多个 Agent
title: "Agent 命令子模块"
---

# Agent 命令子模块

> 更新时间：2026-02-20

本模块实现 `openclaw agent` 命令，用于管理 OpenClaw Agent。

## 模块概览

```
src/commands/agent/
├── agents.ts                # 命令导出
├── agents.bindings.ts       # 绑定描述
├── agents.commands.add.ts   # agent add 命令
├── agents.commands.delete.ts # agent delete 命令
├── agents.commands.identity.ts # agent identity 命令
├── agents.commands.list.ts  # agent list 命令
├── agents.config.ts         # Agent 配置解析
├── agents.providers.ts      # 提供商状态
├── delivery.ts              # 消息传递
├── diagnosis.ts             # 诊断工具
├── format.ts                # 格式化
├── gateway.ts               # 网关交互
├── report-lines.ts          # 报告行
├── run-context.ts           # 运行上下文
├── session-store.ts         # 会话存储
├── session.ts               # 会话管理
└── types.ts                 # 类型定义
```

## 核心功能

### 1. 命令入口 (`../agents.ts`)

**命令**: `openclaw agent`

**子命令**:
- `openclaw agent` - 列出 Agent（默认）
- `openclaw agent list` - 列出 Agent
- `openclaw agent add` - 添加 Agent
- `openclaw agent delete` - 删除 Agent
- `openclaw agent identity` - 设置身份

### 2. 列出 Agent (`agents.commands.list.ts`)

**导出**: `agentsListCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--bindings` | boolean | 显示路由规则 |
| `--json` | boolean | JSON 输出 |

**显示信息**:
- Agent ID 和名称
- 默认标记
- 身份（表情符号、名称）
- 工作区路径
- Agent 目录
- 配置的模型
- 路由规则数量
- 提供商列表

```bash
# 列出所有 Agent
openclaw agent list

# 显示路由规则
openclaw agent list --bindings
```

### 3. 添加 Agent (`agents.commands.add.ts`)

**导出**: `agentsAddCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--id` | string | Agent ID |
| `--name` | string | 显示名称 |
| `--model` | string | 默认模型 |
| `--workspace` | string | 工作区路径 |
| `--set-default` | boolean | 设为默认 |

```bash
# 添加新 Agent
openclaw agent add --id my-agent --name "My Agent" --model anthropic/claude-3-opus

# 添加并设为默认
openclaw agent add --id my-agent --set-default
```

### 4. 删除 Agent (`agents.commands.delete.ts`)

**导出**: `agentsDeleteCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--id` | string | Agent ID |
| `--purge` | boolean | 删除工作区目录 |

```bash
# 删除 Agent
openclaw agent delete --id my-agent

# 删除并清除数据
openclaw agent delete --id my-agent --purge
```

### 5. 设置身份 (`agents.commands.identity.ts`)

**导出**: `agentsIdentityCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--agent` | string | Agent ID |
| `--name` | string | 名称 |
| `--emoji` | string | 表情符号 |
| `--clear` | boolean | 清除身份 |

**身份存储**:
- 配置文件 (`config.yaml`)
- IDENTITY.md 文件（优先级更高）

```bash
# 设置身份
openclaw agent identity --agent my-agent --name "Claw" --emoji "🦞"

# 清除身份
openclaw agent identity --agent my-agent --clear
```

### 6. 配置解析 (`agents.config.ts`)

**导出**:
- `buildAgentSummaries(cfg)` - 构建 Agent 摘要
- `resolveDefaultAgentId(cfg)` - 解析默认 Agent ID
- `resolveAgentDir(cfg, agentId)` - 解析 Agent 目录
- `resolveAgentWorkspace(cfg, agentId)` - 解析工作区路径

### 7. 提供商状态 (`agents.providers.ts`)

**导出**:
- `buildProviderStatusIndex(cfg)` - 构建提供商状态索引
- `listProvidersForAgent(cfg, agentId)` - 列出 Agent 提供商
- `summarizeBindings(bindings)` - 汇总绑定

### 8. 消息传递 (`delivery.ts`)

**导出**:
- `deliverToAgent(opts)` - 传递消息到 Agent
- `buildAgentDeliveryContext(opts)` - 构建传递上下文

**传递流程**:
1. 解析目标 Agent
2. 检查路由规则
3. 构建传递上下文
4. 调用网关 API
5. 处理响应

### 9. 诊断工具 (`diagnosis.ts`)

**导出**:
- `diagnoseAgent(opts)` - 诊断 Agent
- `checkAgentHealth(agentId)` - 检查 Agent 健康

**诊断项**:
- 配置有效性
- 模型可用性
- 认证状态
- 路由规则
- 工作区目录

### 10. 会话管理 (`session.ts`, `session-store.ts`)

**导出**:
- `createAgentSession(opts)` - 创建会话
- `getAgentSession(sessionId)` - 获取会话
- `endAgentSession(sessionId)` - 结束会话

**会话生命周期**:
```
创建 → 激活 → 消息传递 → 超时/关闭 → 清理
```

## 类型定义

```typescript
interface AgentSummary {
  id: string;
  name?: string;
  isDefault: boolean;
  identityEmoji?: string;
  identityName?: string;
  identitySource?: "identity" | "config";
  workspace: string;
  agentDir: string;
  model?: string;
  bindings: number;
  routes?: string[];
  providers?: string[];
  bindingDetails?: string[];
}

interface AgentDeliveryOpts {
  agentId?: string;
  channel: string;
  target: string;
  message: string;
  sessionId?: string;
}
```

## 相关文档

- [Agent 范围](../../agents/agent-scope.ts)
- [Agent 路径](../../agents/agent-paths.ts)
- [配置类型](../../config/types.ts)
- [路由系统](../../routing/CLAUDE.md)

## 导出索引

```typescript
// 主要命令
export { agentsListCommand } from "./agents.commands.list.js";
export { agentsAddCommand } from "./agents.commands.add.js";
export { agentsDeleteCommand } from "./agents.commands.delete.js";
export { agentsIdentityCommand } from "./agents.commands.identity.js";

// 工具函数
export { describeBinding } from "./agents.bindings.js";
export {
  buildAgentSummaries,
  resolveDefaultAgentId,
  resolveAgentDir,
  resolveAgentWorkspace,
} from "./agents.config.js";

export {
  buildProviderStatusIndex,
  listProvidersForAgent,
  summarizeBindings,
} from "./agents.providers.js";

export {
  deliverToAgent,
  buildAgentDeliveryContext,
} from "./delivery.js";

export {
  diagnoseAgent,
  checkAgentHealth,
} from "./diagnosis.js";
```
