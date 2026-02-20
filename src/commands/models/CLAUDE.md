---
summary: "Models 命令实现 - 列出、设置和检查 AI 模型配置"
read_when:
  - 理解模型管理命令
  - 调试模型配置问题
  - 添加新的模型提供商
title: "Models 命令子模块"
---

# Models 命令子模块

> 更新时间：2026-02-20

本模块实现 `openclaw models` 命令，用于管理 AI 模型配置和认证。

## 模块概览

```
src/commands/models/
├── aliases.ts               # 模型别名处理
├── auth-order.ts            # 认证顺序解析
├── auth.ts                  # 认证配置命令
├── fallbacks-shared.ts      # 回退模型共享逻辑
├── fallbacks.ts             # 回退模型命令
├── image-fallbacks.ts       # 图像模型回退
├── list.auth-overview.ts    # 认证概览
├── list.configured.ts       # 已配置模型列表
├── list.errors.ts           # 错误处理
├── list.format.ts           # 格式化工具
├── list.list-command.ts     # models list 命令
├── list.probe.ts            # 认证探测
├── list.registry.ts         # 模型注册表
├── list.status-command.ts   # models status 命令
├── list.table.ts            # 表格渲染
├── list.ts                  # 命令入口
├── list.types.ts            # 类型定义
├── scan.ts                  # 模型扫描
├── set-image.ts             # 设置图像模型
├── set.ts                   # 设置模型
├── shared.test.ts           # 共享测试
├── shared.ts                # 共享工具
```

## 核心功能

### 1. 命令入口 (`list.ts`)

**命令**: `openclaw models`

**子命令**:
- `openclaw models` - 列出已配置的模型（默认）
- `openclaw models list` - 列出模型
- `openclaw models status` - 显示模型状态
- `openclaw models set <model>` - 设置默认模型
- `openclaw models auth` - 配置认证
- `openclaw models scan` - 扫描可用模型

### 2. 模型列表 (`list.list-command.ts`)

**导出**: `modelsListCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--all` | boolean | 列出所有已知模型 |
| `--local` | boolean | 仅本地模型 |
| `--provider` | string | 过滤提供商 |
| `--json` | boolean | JSON 输出 |
| `--plain` | boolean | 纯文本输出 |

**显示列**:
- Provider: 提供商名称
- Model: 模型 ID
- Type: 模型类型（text/image）
- Context: 上下文窗口
- Max Tokens: 最大令牌
- Auth: 认证状态
- Aliases: 别名列表

```bash
# 列出所有模型
openclaw models list --all

# 过滤特定提供商
openclaw models list --provider anthropic

# 仅本地模型
openclaw models list --local
```

### 3. 模型状态 (`list.status-command.ts`)

**导出**: `modelsStatusCommand(opts, runtime)`

**选项**:
| 选项 | 类型 | 说明 |
|------|------|------|
| `--check` | boolean | 检查模型可用性 |
| `--probe` | boolean | 运行认证探测 |
| `--probe-provider` | string | 探测特定提供商 |
| `--probe-profile` | string | 探测特定配置 |
| `--probe-timeout` | string | 探测超时 |
| `--agent` | string | Agent ID |

**状态信息**:
- 当前默认模型
- 配置的回退模型
- 图像模型
- 认证状态
- OAuth 令牌过期时间
- 使用统计

```bash
# 检查模型状态
openclaw models status

# 运行认证探测
openclaw models status --probe --probe-provider anthropic
```

### 4. 认证探测 (`list.probe.ts`)

**导出**:
- `runAuthProbes(opts)` - 运行认证探测
- `sortProbeResults(results)` - 排序探测结果
- `describeProbeSummary(summary)` - 描述探测摘要

**探测流程**:
1. 收集所有认证配置
2. 并发探测每个配置
3. 测试 API 可达性
4. 测试模型调用
5. 收集延迟和错误
6. 排序和显示结果

### 5. 模型设置 (`set.ts`, `set-image.ts`)

**导出**:
- `modelsSetCommand(opts, runtime)` - 设置文本模型
- `modelsSetImageCommand(opts, runtime)` - 设置图像模型

**语法**:
```bash
# 设置提供商/模型
openclaw models set anthropic/claude-3-opus
openclaw models set claude-3-opus
openclaw models set anthropic

# 设置图像模型
openclaw models set-image anthropic/claude-3-opus
```

### 6. 认证配置 (`auth.ts`)

**命令**: `openclaw models auth <provider>`

**支持的提供商**:
- `anthropic` - Anthropic Claude
- `openai` - OpenAI GPT
- `google` - Google Gemini
- `minimax` - MiniMax
- `huggingface` - Hugging Face
- `openrouter` - OpenRouter
- `xai` - xAI Grok
- `moonshot` - Moonshot AI
- `vllm` - vLLM 本地
- 等等...

### 7. 回退模型 (`fallbacks.ts`, `image-fallbacks.ts`)

**命令**: `openclaw models fallbacks`

**管理回退链**:
```bash
# 查看回退模型
openclaw models fallbacks

# 添加回退
openclaw models fallbacks add anthropic/claude-3-sonnet

# 移除回退
openclaw models fallbacks remove anthropic/claude-3-sonnet
```

### 8. 模型扫描 (`scan.ts`)

**命令**: `openclaw models scan`

**扫描本地模型**:
- vLLM 端点
- Ollama 模型
- LM Studio 模型
- 其他本地提供商

### 9. 共享工具 (`shared.ts`)

**导出**:
- `modelKey(provider, id)` - 生成模型键
- `parseModelRef(ref)` - 解析模型引用
- `isLocalBaseUrl(url)` - 检查是否为本地
- `ensureFlagCompatibility(opts)` - 确保标志兼容
- `resolveKnownAgentId(opts)` - 解析 Agent ID

## 类型定义

```typescript
interface ModelRef {
  provider: string;
  model: string;
}

interface ModelRow {
  provider: string;
  model: string;
  type: "text" | "image" | "multimodal";
  context: number;
  maxTokens: number;
  auth: string;
  aliases: string[];
}

interface AuthProbeSummary {
  provider: string;
  profile: string;
  success: boolean;
  latency: number;
  error?: string;
}
```

## 相关文档

- [模型选择](../../agents/model-selection.ts)
- [认证配置](../../agents/auth-profiles/CLAUDE.md)
- [模型注册表](../../agents/pi-model-discovery.ts)
- [提供商使用](../../infra/provider-usage.ts)

## 导出索引

```typescript
// 主要命令
export { modelsListCommand } from "./list.list-command.js";
export { modelsStatusCommand } from "./list.status-command.js";
export { modelsSetCommand } from "./set.js";
export { modelsSetImageCommand } from "./set-image.js";

// 工具函数
export {
  modelKey,
  parseModelRef,
  isLocalBaseUrl,
  ensureFlagCompatibility,
} from "./shared.js";

export {
  runAuthProbes,
  sortProbeResults,
  describeProbeSummary,
  formatProbeLatency,
} from "./list.probe.js";
```


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>