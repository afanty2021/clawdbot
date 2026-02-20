# OpenAI Codex Auth 扩展 (extensions/openai-codex-auth/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **openai-codex-auth**

## 模块职责

提供 OpenAI Codex CLI 认证扩展，允许使用 ChatGPT Plus/Pro 订阅访问 Codex 模型，无需单独的 API 密钥。

> **注意**：此扩展为占位符实现，当前仅有文档结构。实际功能开发需要实现 Codex CLI OAuth 令牌读取和模型代理逻辑。

## 目录结构

```
extensions/openai-codex-auth/
├── CLAUDE.md           # 本文档
└── src/
    └── CLAUDE.md       # 源代码文档
```

### 标准扩展结构（参考）

```
extensions/openai-codex-auth/
├── index.ts           # 插件入口
├── package.json       # 插件清单
├── openclaw.plugin.json # 插件配置
├── README.md         # 使用说明
├── oauth.ts          # OAuth 处理逻辑
└── src/
    ├── runtime.ts    # 运行时实现
    └── config-schema.ts # 配置模式
```

## OpenAI Codex 概述

### 什么是 Codex？

Codex 是 OpenAI 的编程模型系列，基于 GPT-4 构建，专门优化了代码生成和理解能力。

### 支持的模型

| 模型 | 描述 | 上下文窗口 |
|-----|------|----------|
| `gpt-4.1` | 最新 Codex 主模型 | 200K |
| `gpt-4o` | GPT-4 Omni | 128K |
| `o1` | 推理模型 | 128K |
| `o3` | 高级推理模型 | 200K |
| `gpt-4.1-mini` | 轻量版本 | 200K |
| `gpt-4.1-nano` | 最小版本 | 200K |

### 优势

- **无需 API 密钥**：使用 ChatGPT 订阅即可
- **最新模型访问**：优先访问 OpenAI 最新模型
- **成本优势**：包含在 ChatGPT 订阅中（Plus/Pro）
- **OAuth 认证**：安全的 OAuth 2.0 流程

## 启用与配置

### 前置要求

1. 安装 Codex CLI：
```bash
# 通过 npm 安装
npm install -g @openai/codex

# 或通过 Homebrew
brew install openai/codex/codex
```

2. 登录 Codex：
```bash
codex auth login
# 会打开浏览器进行 OAuth 认证
```

3. 确认认证文件存在：
```bash
cat ~/.codex/auth.json
# 应包含 access_token 和 refresh_token
```

### 启用插件
```bash
openclaw plugins enable openai-codex-auth
```

### 配置
```json
{
  "models": {
    "providers": {
      "openai-codex": {
        "enabled": true,
        "authFile": "~/.codex/auth.json",
        "defaultModel": "gpt-4.1"
      }
    }
  }
}
```

## 认证流程

### OAuth 2.0 流程

```typescript
interface CodexAuthConfig {
  authFile: string;      // ~/.codex/auth.json
  clientId: string;      // OpenAI OAuth 客户端 ID
  redirectUri: string;   // 回调 URI
}

interface CodexToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;    // Unix 时间戳
  token_type: "Bearer";
}
```

### 令牌刷新

```typescript
class CodexAuthProvider {
  private authFile: string;

  async getValidToken(): Promise<string> {
    const token = await this.loadToken();

    // 检查是否过期（提前 5 分钟刷新）
    if (token.expires_at - 300 * 1000 < Date.now()) {
      return await this.refreshToken(token.refresh_token);
    }

    return token.access_token;
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    // 调用 OpenAI OAuth 刷新端点
    const response = await fetch("https://oauth.openai.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.clientId,
      }),
    });

    const newToken = await response.json();
    await this.saveToken(newToken);
    return newToken.access_token;
  }
}
```

## 模型代理设计

### Runtime 接口

```typescript
interface CodexAuthRuntime {
  // 认证
  auth: {
    getToken(): Promise<string>;
    refreshToken(): Promise<void>;
    isAuthenticated(): Promise<boolean>;
  };

  // 模型调用
  chat: {
    createCompletion(request: CodexChatRequest): Promise<CodexChatResponse>;
    streamCompletion(request: CodexChatRequest): AsyncIterable<CodexChunk>;
  };

  // 配置
  config: {
    getDefaultModel(): string;
    setDefaultModel(model: string): void;
    listAvailableModels(): CodexModel[];
  };
}
```

### 请求/响应类型

```typescript
interface CodexChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface CodexChatResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

## 使用示例

### 配置默认模型
```bash
# 设置 Codex 为默认模型
openclaw models set openai-codex/gpt-4.1

# 查看可用模型
openclaw models list --provider openai-codex
```

### 在代码中使用
```typescript
// 使用 Codex 模型
const response = await openclaw.chat.completions.create({
  model: "openai-codex/gpt-4.1",
  messages: [
    { role: "system", content: "You are a helpful coding assistant." },
    { role: "user", content: "Write a function to fibonacci." }
  ]
});
```

### 多模型组合
```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "openai-codex/gpt-4.1" }
    },
    "routing": {
      "complex": {
        "model": "openai-codex/o3",
        "triggers": ["debug", "explain code", "refactor"]
      }
    }
  }
}
```

## 测试

### 测试命令
```bash
# 认证测试
pnpm test extensions/openai-codex-auth/auth

# 集成测试（需要 Codex 登录）
codex auth login
pnpm test:live extensions/openai-codex-auth

# 手动测试
node -e "
const codex = require('./extensions/openai-codex-auth');
codex.auth.isAuthenticated().then(console.log);
"
```

## 常见问题 (FAQ)

### Q: 需要 ChatGPT 订阅吗？
A: 是的，需要 ChatGPT Plus ($20/月) 或 ChatGPT Pro ($200/月) 订阅。

### Q: 与 OpenAI API 密钥有什么区别？
A: Codex 使用 OAuth 认证，不需要 API 密钥。令牌来自你的 ChatGPT 订阅。

### Q: 支持哪些订阅级别？
A: Plus 和 Pro 订阅都支持。具体模型访问可能因订阅级别而异。

### Q: 如何检查认证状态？
A: 运行 `codex auth status` 或查看 `~/.codex/auth.json`。

### Q: 令牌会过期吗？
A: 是的，OpenAI OAuth 令牌有有效期。扩展会自动刷新令牌。

### Q: 可以同时使用 Codex 和 OpenAI API 吗？
A: 可以，在配置中分别定义两个 provider 即可。

### Q: 支持图像输入吗？
A: Codex 模型支持图像输入（通过 GPT-4V），但需确认具体模型能力。

## 相关文件

- `extensions/openai-codex-auth/oauth.ts`（待实现）
- `extensions/openai-codex-auth/src/runtime.ts`（待实现）
- `extensions/minimax-portal-auth/`（参考实现）

## 变更记录

### 2026-02-20 - 创建 OpenAI Codex Auth 扩展文档
- ✅ 创建 `extensions/openai-codex-auth/CLAUDE.md` 文档
- 📋 记录 Codex OAuth 认证流程
- 🔗 建立 OpenAI Codex 认证导航

---

*提示：如需实现此扩展，请参考 `extensions/minimax-portal-auth/` 的认证实现作为模板。*


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Feb 17, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #4284 | 8:02 AM | 🔵 | OpenAI Codex authentication plugin enables ChatGPT subscription usage | ~357 |
</claude-mem-context>