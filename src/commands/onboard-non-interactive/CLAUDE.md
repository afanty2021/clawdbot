# 非交互式配置命令 (src/commands/onboard-non-interactive/)

[根目录](../../CLAUDE.md) > [commands](../CLAUDE.md) > **onboard-non-interactive**

## 模块职责

提供自动化配置流程，用于 CI/CD、脚本和无人值守场景。通过命令行参数完全控制配置，无需用户交互。

## 目录结构

```
src/commands/onboard-non-interactive/
├── local.ts          # 本地模式配置
├── remote.ts         # 远程模式配置
├── api-keys.ts       # API 密钥解析
└── local/            # 本地配置子模块
    ├── auth-choice.ts          # 认证选择
    ├── auth-choice-inference.ts # 认证推断
    ├── daemon-install.ts        # 守护进程安装
    ├── gateway-config.ts        # 网关配置
    ├── output.ts               # 输出格式化
    └── skills-config.ts        # 技能配置
```

## 核心功能

### 1. 本地模式配置 (`local.ts`)

实现完整的本地非交互式配置流程。

#### 配置流程

```typescript
export async function runNonInteractiveOnboardingLocal(params: {
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  baseConfig: OpenClawConfig;
})
```

**流程步骤**：

```
1. 解析工作区目录
   ↓
2. 推断/验证认证选择
   ↓
3. 应用认证配置
   ↓
4. 应用网关配置
   ↓
5. 应用技能配置
   ↓
6. 写入配置文件
   ↓
7. 确保工作区和会话
   ↓
8. 安装网关守护进程
   ↓
9. 等待网关就绪
   ↓
10. 运行健康检查
    ↓
11. 输出配置结果
```

#### 配置参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `--workspace` | string | 工作区目录 |
| `--auth-choice` | string | 认证提供商选择 |
| `--gateway-port` | number | 网关端口 |
| `--install-daemon` | boolean | 是否安装守护进程 |
| `--daemon-runtime` | string | 守护进程运行时 |
| `--skip-skills` | boolean | 跳过技能配置 |
| `--skip-health` | boolean | 跳过健康检查 |

### 2. API 密钥解析 (`api-keys.ts`)

从多个来源解析 API 密钥。

#### 解析顺序

```typescript
export async function resolveNonInteractiveApiKey(params: {
  provider: string;
  cfg: OpenClawConfig;
  flagValue?: string;
  flagName: string;
  envVar: string;
  envVarName?: string;
  runtime: RuntimeEnv;
  agentDir?: string;
  allowProfile?: boolean;
  required?: boolean;
}): Promise<{ key: string; source: NonInteractiveApiKeySource } | null>
```

**优先级顺序**：

```
1. 命令行标志 (flag)
   ↓
2. 环境变量 (env)
   ↓
3. 显式环境变量 (explicit env var)
   ↓
4. 认证配置文件 (profile)
   ↓
5. 错误 (如果 required)
```

#### 密钥来源

| 来源 | 说明 | 示例 |
|------|------|------|
| `flag` | 命令行参数 | `--anthropic-api-key sk-xxx` |
| `env` | 标准环境变量 | `ANTHROPIC_API_KEY=sk-xxx` |
| `profile` | 认证配置文件 | `auth-profiles.json` |

#### 从配置文件解析

```typescript
async function resolveApiKeyFromProfiles(params: {
  provider: string;
  cfg: OpenClawConfig;
  agentDir?: string;
}): Promise<string | null>
```

**流程**：
1. 获取认证配置存储
2. 解析认证配置顺序
3. 遍历配置查找 API 密钥
4. 返回第一个有效密钥

### 3. 认证选择推断 (`local/auth-choice-inference.ts`)

从命令行标志推断用户的认证意图。

#### 推断逻辑

```typescript
export function inferAuthChoiceFromFlags(opts: OnboardOptions): {
  choice: string | null;
  matches: Array<{ label: string; flag: string }>;
}
```

**检测的标志**：
- `--anthropic-api-key` → `anthropic`
- `--openai-api-key` → `openai`
- `--google-api-key` → `google`
- `--mini-max-api-key` → `minimax`
- 等等...

#### 多标志冲突处理

```typescript
if (!opts.authChoice && inferredAuthChoice.matches.length > 1) {
  runtime.error(
    "Multiple API key flags were provided for non-interactive onboarding." +
    "Use a single provider flag or pass --auth-choice explicitly."
  );
  runtime.exit(1);
}
```

### 4. 认证选择应用 (`local/auth-choice.ts`)

应用认证选择到配置。

#### 应用流程

```typescript
export async function applyNonInteractiveAuthChoice(params: {
  nextConfig: OpenClawConfig;
  authChoice: string;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  baseConfig: OpenClawConfig;
}): Promise<OpenClawConfig | null>
```

**支持的选择**：
- `skip` - 跳过认证配置
- `anthropic` - Anthropic Claude
- `openai` - OpenAI GPT
- `google` - Google Gemini
- `minimax` - MiniMax
- 等等...

### 5. 网关配置 (`local/gateway-config.ts`)

配置网关服务器参数。

#### 配置项

```typescript
export function applyNonInteractiveGatewayConfig(params: {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  defaultPort: number;
}): {
  nextConfig: OpenClawConfig;
  port: number;
  bind: string;
  authMode: string;
  gatewayToken: string;
  tailscaleMode: string;
} | null
```

**返回配置**：
- `port` - 网关端口
- `bind` - 绑定地址 (auto/lan/loopback/custom/tailnet)
- `authMode` - 认证模式
- `gatewayToken` - 网关令牌
- `tailscaleMode` - Tailscale 模式

### 6. 守护进程安装 (`local/daemon-install.ts`)

安装网关守护进程。

#### 安装流程

```typescript
export async function installGatewayDaemonNonInteractive(params: {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  port: number;
  gatewayToken: string;
}): Promise<void>
```

**支持平台**：
- macOS (launchd)
- Linux (systemd)
- Windows (nssm)

### 7. 输出格式化 (`local/output.ts`)

格式化配置输出。

#### JSON 输出

```typescript
export function logNonInteractiveOnboardingJson(params: {
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  mode: "local" | "remote";
  workspaceDir: string;
  authChoice: string;
  gateway: {
    port: number;
    bind: string;
    authMode: string;
    tailscaleMode: string;
  };
  installDaemon: boolean;
  daemonRuntime?: string;
  skipSkills: boolean;
  skipHealth: boolean;
}): void
```

**输出示例**：
```json
{
  "mode": "local",
  "workspaceDir": "/Users/user/.openclaw/workspace",
  "authChoice": "anthropic",
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "authMode": "token",
    "tailscaleMode": "off"
  },
  "installDaemon": true,
  "daemonRuntime": "node",
  "skipSkills": false,
  "skipHealth": false
}
```

### 8. 技能配置 (`local/skills-config.ts`)

配置 AI 技能。

#### 配置应用

```typescript
export function applyNonInteractiveSkillsConfig(params: {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
}): OpenClawConfig
```

**控制选项**：
- `--skip-skills` - 跳过技能配置

### 9. 工作区解析 (`local/workspace.ts`)

解析工作区目录路径。

#### 解析逻辑

```typescript
export function resolveNonInteractiveWorkspaceDir(params: {
  opts: OnboardOptions;
  baseConfig: OpenClawConfig;
  defaultWorkspaceDir: string;
}): string
```

**优先级**：
1. 命令行 `--workspace` 参数
2. 配置文件中的工作区路径
3. 默认工作区 (`~/.openclaw/workspace`)

### 10. 远程模式 (`remote.ts`)

远程模式配置（较少使用，用于远程节点配置）。

## 使用示例

### 基本本地配置

```bash
openclaw onboard \
  --non-interactive \
  --workspace ~/.openclaw/workspace \
  --anthropic-api-key sk-ant-xxx
```

### 完整配置

```bash
openclaw onboard \
  --non-interactive \
  --workspace ~/.openclaw/workspace \
  --auth-choice anthropic \
  --anthropic-api-key sk-ant-xxx \
  --gateway-port 18789 \
  --bind loopback \
  --install-daemon \
  --daemon-runtime node
```

### 使用环境变量

```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENCLAW_WORKSPACE=~/.openclaw/workspace

openclaw onboard --non-interactive
```

### 使用认证配置文件

```bash
# 先创建认证配置
openclaw auth add anthropic --api-key sk-ant-xxx

# 使用认证配置
openclaw onboard \
  --non-interactive \
  --auth-choice anthropic \
  --skip-health
```

### JSON 输出

```bash
openclaw onboard --non-interactive --json
```

输出：
```json
{
  "mode": "local",
  "workspaceDir": "/Users/user/.openclaw/workspace",
  "authChoice": "anthropic",
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "authMode": "token",
    "tailscaleMode": "off"
  },
  "installDaemon": true,
  "daemonRuntime": "node",
  "skipSkills": false,
  "skipHealth": false
}
```

### CI/CD 集成

```yaml
# .github/workflows/setup.yml
- name: Setup OpenClaw
  run: |
    openclaw onboard \
      --non-interactive \
      --workspace ${{ github.workspace }}/.openclaw \
      --auth-choice anthropic \
      --anthropic-api-key ${{ secrets.ANTHROPIC_API_KEY }} \
      --skip-daemon \
      --skip-health
```

## 错误处理

### 缺少 API 密钥

```bash
$ openclaw onboard --non-interactive --auth-choice anthropic
Error: Missing --anthropic-api-key (or ANTHROPIC_API_KEY in env).
```

### 多个 API 密钥冲突

```bash
$ openclaw onboard --non-interactive \
    --anthropic-api-key sk-ant-xxx \
    --openai-api-key sk-xxx

Error: Multiple API key flags were provided for non-interactive onboarding.
Use a single provider flag or pass --auth-choice explicitly.
Flags: Anthropic, OpenAI
```

### 网关启动失败

```bash
$ openclaw onboard --non-interactive
Error: Gateway failed to start within timeout.
```

## 相关模块

- **`src/commands/onboarding/`** - 交互式配置向导
- **`src/agents/auth-profiles/`** - 认证配置管理
- **`src/config/config.ts`** - 配置文件操作
- **`src/daemon/`** - 守护进程管理

## 常见问题 (FAQ)

### Q: 非交互式和交互式模式有什么区别？
A: 非交互式模式通过命令行参数完全控制配置，无需用户输入；交互式模式会提示用户选择。

### Q: 如何在 CI/CD 中使用？
A: 使用 `--non-interactive` 标志，通过环境变量或参数提供所有必需配置。

### Q: 认证配置文件的优先级？
A: 命令行标志 > 环境变量 > 认证配置文件。

### Q: 如何跳过某些配置步骤？
A: 使用 `--skip-skills`、`--skip-health` 等标志。

### Q: 安装守护进程失败怎么办？
A: 检查系统权限，或使用 `--skip-daemon` 跳过安装。

## 变更记录

### 2026-02-20 - 创建非交互式配置模块文档
- ✅ 创建 `src/commands/onboard-non-interactive/CLAUDE.md` 文档
- 📋 记录配置流程和 API 密钥解析
- 🔗 建立 CI/CD 集成示例
