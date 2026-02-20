# 配置向导命令 (src/commands/onboarding/)

[根目录](../../CLAUDE.md) > [commands](../CLAUDE.md) > **onboarding**

## 模块职责

引导用户完成 OpenClaw 的初始配置和插件安装。通过交互式向导，帮助用户：

1. 安装通信渠道插件
2. 配置工作区和会话
3. 设置本地开发模式

## 目录结构

```
src/commands/onboarding/
├── plugin-install.ts           # 插件安装逻辑
├── plugin-install.e2e.test.ts  # E2E 测试
├── registry.ts                 # 向导注册表
└── types.ts                    # 类型定义
```

## 核心功能

### 1. 插件安装 (`plugin-install.ts`)

负责从 npm 或本地路径安装通信渠道插件。

#### 安装选项

| 选项 | 说明 | 场景 |
|------|------|------|
| `npm` | 从 npm 下载 | 生产环境、稳定发布 |
| `local` | 使用本地路径 | 开发环境、本地测试 |
| `skip` | 跳过安装 | 暂时不安装该插件 |

#### 本地路径解析

```typescript
function resolveLocalPath(
  entry: ChannelPluginCatalogEntry,
  workspaceDir: string | undefined,
  allowLocal: boolean,
): string | null
```

**解析顺序**：
1. 检查当前工作目录下的路径
2. 检查工作区目录下的路径
3. 验证路径是否存在

#### 默认选择策略

```typescript
function resolveInstallDefaultChoice(params: {
  cfg: OpenClawConfig;
  entry: ChannelPluginCatalogEntry;
  localPath?: string | null;
}): InstallChoice
```

**决策逻辑**：
- `updateChannel: "dev"` + 有本地路径 → `local`
- `updateChannel: "stable"|"beta"` → `npm`
- 插件默认配置
- 有本地路径 → `local`，否则 → `npm`

#### Git 工作区检测

```typescript
function hasGitWorkspace(workspaceDir?: string): boolean
```

**检测路径**：
1. `process.cwd()/.git`
2. `workspaceDir/.git` (如果不同)

### 2. 插件安装流程

```typescript
export async function ensureOnboardingPluginInstalled(params: {
  cfg: OpenClawConfig;
  entry: ChannelPluginCatalogEntry;
  prompter: WizardPrompter;
  runtime: RuntimeEnv;
  workspaceDir?: string;
}): Promise<InstallResult>
```

**流程图**：

```
开始
  ↓
检测 Git 工作区
  ↓
解析本地路径
  ↓
确定默认选择
  ↓
提示用户选择
  ↓
┌─────────────┬──────────┬──────────┐
│  npm       │  local   │  skip    │
└─────────────┴──────────┴──────────┘
  ↓              ↓           ↓
从 npm 安装    添加路径    返回未安装
  ↓              ↓
记录安装记录   启用插件
  ↓              ↓
启用插件
  ↓
返回安装结果
```

### 3. 安装结果记录

```typescript
type InstallResult = {
  cfg: OpenClawConfig;    // 更新后的配置
  installed: boolean;      // 是否已安装
};
```

### 4. 插件注册表重载

```typescript
export function reloadOnboardingPluginRegistry(params: {
  cfg: OpenClawConfig;
  runtime: RuntimeEnv;
  workspaceDir?: string;
}): void
```

**功能**：重新加载插件注册表，用于安装后立即生效。

## 交互式提示

### 安装选择提示

```typescript
await prompter.select<InstallChoice>({
  message: `Install ${entry.meta.label} plugin?`,
  options: [
    { value: "npm", label: `Download from npm (${entry.install.npmSpec})` },
    { value: "local", label: "Use local plugin path", hint: localPath },
    { value: "skip", label: "Skip for now" },
  ],
  initialValue: defaultChoice,
});
```

### 安装失败确认

```typescript
await prompter.confirm({
  message: `Use local plugin path instead? (${localPath})`,
  initialValue: true,
});
```

### 失败通知

```typescript
await prompter.note(
  `Failed to install ${entry.install.npmSpec}: ${result.error}`,
  "Plugin install",
);
```

## 配置更新

### 添加插件加载路径

```typescript
function addPluginLoadPath(cfg: OpenClawConfig, pluginPath: string): OpenClawConfig
```

**效果**：
```json
{
  "plugins": {
    "load": {
      "paths": ["/path/to/plugin", ...]
    }
  }
}
```

### 启用插件

```typescript
next = enablePluginInConfig(next, entry.id).config;
```

**效果**：
```json
{
  "plugins": {
    "enable": ["plugin-id", ...]
  }
}
```

### 记录安装

```typescript
next = recordPluginInstall(next, {
  pluginId: result.pluginId,
  source: "npm",
  spec: entry.install.npmSpec,
  installPath: result.targetDir,
  version: result.version,
  resolvedName: result.npmResolution?.name,
  resolvedVersion: result.npmResolution?.version,
  resolvedSpec: result.npmResolution?.resolvedSpec,
  integrity: result.npmResolution?.integrity,
  shasum: result.npmResolution?.shasum,
  resolvedAt: result.npmResolution?.resolvedAt,
});
```

## 测试

### E2E 测试

`plugin-install.e2e.test.ts` - 端到端测试插件安装流程。

### 测试场景

1. npm 安装流程
2. 本地路径安装
3. 安装失败回退到本地路径
4. Git 工作区检测
5. 默认选择策略

## 使用示例

### 交互式安装

```bash
# 启动配置向导
openclaw onboard

# 提示: Install Telegram plugin?
# 选择: Download from npm (@openclaw/channel-telegram)
```

### 开发模式安装

```bash
# 在开发工作区中
cd /path/to/openclaw
openclaw onboard

# 检测到 Git 工作区，提示:
# Install Telegram plugin?
# 选择: Use local plugin path (extensions/telegram)
```

### 跳过安装

```bash
openclaw onboard

# 提示: Install Telegram plugin?
# 选择: Skip for now
```

## 相关模块

- **`src/plugins/install.ts`** - 插件安装核心逻辑
- **`src/plugins/enable.ts`** - 插件启用配置
- **`src/channels/plugins/catalog.ts`** - 插件目录
- **`src/wizard/prompts.ts`** - 交互式提示

## 常见问题 (FAQ)

### Q: 如何检测本地开发环境？
A: 通过检查 `.git` 目录是否存在。如果有，允许使用本地插件路径。

### Q: 安装失败会怎样？
A: 会提示用户是否使用本地路径作为后备选项。

### Q: 如何控制默认选择？
A: 通过 `updateChannel` 配置（dev/stable/beta）和插件的 `defaultChoice` 配置。

### Q: 安装记录存储在哪里？
A: 存储在配置文件的 `plugins.installs` 字段中。

## 变更记录

### 2026-02-20 - 创建配置向令模块文档
- ✅ 创建 `src/commands/onboarding/CLAUDE.md` 文档
- 📋 记录插件安装流程和配置更新
- 🔗 建立相关模块关联
