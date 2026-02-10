# 工具系统模块 (src/agents/tools/)

[根目录](../../CLAUDE.md) > [src](../CLAUDE.md) > [agents](./CLAUDE.md) > **tools**

## 模块职责

提供 AI 代理可调用的工具系统，包括工具注册、Schema 定义、执行策略和工具策略管理。该模块是 AI 代理与外部世界交互的桥梁，支持文件系统操作、进程执行、网络请求等能力。

## 目录结构

```
src/agents/tools/
├── bash/                 # Bash 工具
│   ├── exec.ts          # 命令执行
│   ├── process.ts       # 进程管理
│   └── shared.ts        # 共享工具
├── http/                # HTTP 工具
│   ├── request.ts       # HTTP 请求
│   └── client.ts        # HTTP 客户端
├── file/                # 文件工具
│   ├── read.ts          # 读取文件
│   ├── write.ts         # 写入文件
│   ├── glob.ts          # 文件匹配
│   └── edit.ts          # 文件编辑
├── git/                 # Git 工具
│   ├── status.ts        # Git 状态
│   ├── commit.ts        # Git 提交
│   └── diff.ts          # Git 差异
├── browser/             # 浏览器工具
│   ├── navigate.ts      # 导航
│   ├── screenshot.ts    # 截图
│   └── interact.ts      # 交互
├── channel/             # 渠道工具
│   ├── send.ts          # 发送消息
│   └── receive.ts       # 接收消息
├── sandbox/             # 沙箱工具
│   ├── create.ts        # 创建沙箱
│   ├── exec.ts          # 沙箱执行
│   └── destroy.ts       # 销毁沙箱
├── pi-tool-definition-adapter.ts  # 工具定义适配器
├── tool-policy.ts       # 工具策略
├── tool-display.ts      # 工具显示配置
├── tool-summaries.ts    # 工具摘要
├── tool-images.ts       # 工具图标
├── tool-call-id.ts      # 工具调用 ID
└── tool-policy.conformance.ts  # 策略一致性
```

## 入口与启动

### 主入口
- **`src/agents/tools/pi-tools.ts`** - 工具主入口
- **`src/agents/tools/tool-registry.ts`** - 工具注册表

### 工具注册
```typescript
import { ToolRegistry } from "./tools/tool-registry.ts";

const registry = new ToolRegistry();
registry.register(new BashTool());
registry.register(new FileTool());
registry.register(new HttpTool());
```

## 对外接口

### ToolRegistry 接口
```typescript
interface ToolRegistry {
  register(tool: Tool): void;
  unregister(name: string): void;
  get(name: string): Tool | null;
  getAll(): Tool[];
  execute(name: string, params: Record<string, unknown>): Promise<ToolResult>;
}
```

### Tool 接口
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  schema: ZodSchema;
  execute(params: Record<string, unknown>): Promise<ToolResult>;
  validate(params: unknown): ValidationResult;
}
```

### ToolParameter 接口
```typescript
interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}
```

### ToolResult 接口
```typescript
interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: Record<string, unknown>;
  metadata?: {
    executionTime: number;
    memoryUsed: number;
  };
}
```

## 子模块详解

### 1. Bash 工具 (`bash/`)

**职责**：提供 Shell 命令执行能力

**关键文件**：
- `exec.ts` - 命令执行
- `process.ts` - 进程管理

**功能**：
- 单命令执行
- 脚本执行
- PTY 支持
- 超时控制
- 输出捕获

### 2. 文件工具 (`file/`)

**职责**：提供文件系统操作能力

**关键文件**：
- `read.ts` - 读取文件
- `write.ts` - 写入文件
- `glob.ts` - 文件匹配
- `edit.ts` - 文件编辑

**安全限制**：
- 路径遍历防护
- 只读目录限制
- 文件大小限制

### 3. Git 工具 (`git/`)

**职责**：提供 Git 版本控制操作

**关键文件**：
- `status.ts` - 仓库状态
- `commit.ts` - 提交操作
- `diff.ts` - 差异比较
- `branch.ts` - 分支管理

### 4. 浏览器工具 (`browser/`)

**职责**：提供浏览器自动化操作

**关键文件**：
- `navigate.ts` - 页面导航
- `screenshot.ts` - 页面截图
- `interact.ts` - 元素交互

### 5. 渠道工具 (`channel/`)

**职责**：提供消息渠道操作

**关键文件**：
- `send.ts` - 发送消息
- `receive.ts` - 接收消息
- `query.ts` - 查询消息

### 6. 工具策略 (`tool-policy.ts`)

**职责**：管理工具使用策略

**策略类型**：
- `AllowListPolicy` - 允许名单
- `DenyListPolicy` - 拒绝名单
- `RateLimitPolicy` - 频率限制
- `QuotaPolicy` - 配额策略

### 7. 工具定义适配器 (`pi-tool-definition-adapter.ts`)

**职责**：将工具转换为 Pi Agent 兼容的格式

## 关键依赖与配置

### 配置文件
```typescript
// 工具策略配置
interface ToolsConfig {
  enabled: string[];
  disabled: string[];
  policies: {
    rateLimit: number;
    quota: number;
    allowList?: string[];
    denyList?: string[];
  };
}
```

### 环境变量
```bash
TOOLS_DIR              # 工具目录
TOOL_TIMEOUT_MS        # 默认超时
TOOL_MEMORY_LIMIT_MB   # 内存限制
```

## 测试与质量

### 测试文件
- `src/agents/tools/**/*.test.ts`

### 测试命令
```bash
pnpm test src/agents/tools
```

## 常见问题 (FAQ)

### Q: 如何添加新工具？
A: 实现 `Tool` 接口，在 `tool-registry.ts` 中注册。

### Q: 工具执行失败怎么办？
A: 检查 `ToolResult.error` 字段，根据错误信息调整参数。

### Q: 如何限制工具使用？
A: 配置 `tool-policy.ts` 中的策略规则。

## 相关文件清单

### 核心文件
- `src/agents/tools/pi-tools.ts` - 工具主入口
- `src/agents/tools/tool-registry.ts` - 注册表
- `src/agents/tools/tool-policy.ts` - 策略

### CLI 文件
- `src/cli/sandbox-cli.ts` - 沙箱 CLI

## 变更记录

### 2026-02-10 - 创建工具模块文档
- ✅ 创建 `src/agents/tools/CLAUDE.md` 文档
- 📋 记录工具注册和执行系统
- 🔗 建立工具类型导航


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 10, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #2212 | 10:30 AM | 🟣 | Documentation coverage campaign achieved 100% core module coverage | ~546 |
| #2207 | 10:25 AM | 🟣 | Documentation coverage significantly improved - 10 new CLAUDE.md files created | ~538 |
</claude-mem-context>