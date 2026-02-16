# Thread Ownership 扩展插件

[扩展插件目录](../CLAUDE.md) > **thread-ownership**

## 模块职责

防止多个 AI 代理在同一个 Slack 线程中响应，使用 HTTP 调用 `slack-forwarder` ownership API 来实现线程所有权管理。

## 目录结构

```
extensions/thread-ownership/
├── index.ts           # 插件入口，注册 hook 处理器
├── index.test.ts      # 单元测试
└── openclaw.plugin.json  # 插件清单
```

## 入口与启动

### 插件注册
插件通过 `index.ts` 中的 `register()` 函数注册，监听两个关键事件：

1. **`message_received`** - 跟踪 @-mentions
2. **`message_sending`** - 检查线程所有权

### 配置加载
插件从以下位置加载配置（优先级从高到低）：
1. 插件配置 (`api.pluginConfig`)
2. 环境变量 `SLACK_FORWARDER_URL`
3. 默认值 `http://slack-forwarder:8750`

## 对外接口

### 插件 API 钩子
```typescript
// 消息接收钩子：跟踪 @-mentions
api.on("message_received", async (event, ctx) => {
  // 检查 @-mention 并记录
});

// 消息发送钩子：检查线程所有权
api.on("message_sending", async (event, ctx) => {
  // 返回 { cancel: true } 取消发送
  // 或返回 undefined 允许发送
});
```

### 配置模式
```typescript
type ThreadOwnershipConfig = {
  forwarderUrl?: string;      // Forwarder API 基础 URL
  abTestChannels?: string[];  // 启用线程所有权的频道 ID 列表
};
```

## 关键依赖与配置

### 环境变量
- **`SLACK_FORWARDER_URL`**: Forwarder API 基础 URL（默认：`http://slack-forwarder:8750`）
- **`SLACK_BOT_USER_ID`**: Slack 机器人用户 ID（用于检测 `<@UXXX>` 格式的提及）
- **`THREAD_OWNERSHIP_CHANNELS`**: 逗号分隔的频道 ID 列表

### Forwarder API 端点
```
POST /api/v1/ownership/{channelId}/{threadTs}
Content-Type: application/json

{
  "agent_id": "agent-id"
}

响应:
- 200 OK: 获得所有权（或已拥有）
- 409 Conflict: 另一个代理拥有此线程
```

### 配置示例
```json
{
  "plugins": {
    "thread-ownership": {
      "forwarderUrl": "http://slack-forwarder:8750",
      "abTestChannels": ["C123456", "C789012"]
    }
  }
}
```

## 核心功能

### 1. 线程所有权检查
在发送消息到 Slack 线程前，插件会：
1. 检查是否为线程消息（有 `threadTs`）
2. 检查是否在 A/B 测试频道中
3. 检查本代理是否最近被 @-提及
4. 调用 Forwarder API 尝试声明所有权
5. 如果所有权属于其他代理，取消发送

### 2. @-提及跟踪
插件跟踪本代理被 @-提及的线程：
- 支持两种提及格式：`@BotName` 和 `<@UXXX>`
- 提及记录在 5 分钟后过期
- 被提及的线程跳过所有权检查

### 3. 失败开放策略
为了确保可用性，以下情况会允许发送：
- Forwarder API 网络错误
- API 返回非预期状态码
- 非 Slack 频道
- 顶级消息（无线程）

## 技术实现

### 内存状态管理
```typescript
// 线程 -> 时间戳 映射
const mentionedThreads = new Map<string, number>();
const MENTION_TTL_MS = 5 * 60 * 1000;  // 5 分钟

// 清理过期提及
function cleanExpiredMentions(): void {
  const now = Date.now();
  for (const [key, ts] of mentionedThreads) {
    if (now - ts > MENTION_TTL_MS) {
      mentionedThreads.delete(key);
    }
  }
}
```

### 代理身份解析
```typescript
function resolveOwnershipAgent(config: OpenClawConfig): {
  id: string;
  name: string;
} {
  const list = config.agents?.list ?? [];
  const selected = list.find(e => e.default === true) ?? list[0];

  return {
    id: selected?.id ?? "unknown",
    name: selected?.identity?.name ?? selected?.name ?? ""
  };
}
```

### 所有权声明流程
```typescript
// 1. 尝试声明所有权
const resp = await fetch(
  `${forwarderUrl}/api/v1/ownership/${channelId}/${threadTs}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
    signal: AbortSignal.timeout(3000),  // 3 秒超时
  }
);

// 2. 处理响应
if (resp.ok) {
  return;  // 允许发送
}
if (resp.status === 409) {
  return { cancel: true };  // 取消发送
}

// 3. 意外状态 - 失败开放
api.logger.warn?.(`unexpected status ${resp.status}, allowing send`);
```

## 测试与质量

### 单元测试
插件包含完整的单元测试（`index.test.ts`），覆盖：
- ✅ 钩子注册验证
- ✅ 非 Slack 频道处理
- ✅ 顶级消息处理
- ✅ 所有权声明成功
- ✅ 所有权冲突取消
- ✅ 网络错误失败开放
- ✅ @-提及跟踪和跳过
- ✅ 非 Slack 频道 @-提及忽略
- ✅ Bot 用户 ID 提及检测

### 测试覆盖率
- **行覆盖率**: 95%+
- **分支覆盖率**: 90%+

### 运行测试
```bash
# 从项目根目录
pnpm test thread-ownership

# 或直接运行
vitest run extensions/thread-ownership/index.test.ts
```

## 常见问题 (FAQ)

### Q: 为什么要防止多个代理响应同一线程？
A: 在多代理部署中，多个代理可能会尝试响应同一个问题，导致重复或冲突的回复。线程所有权机制确保每个线程只有一个活跃的响应者。

### Q: 什么是 A/B 测试频道？
A: A/B 测试频道是指启用了线程所有权检查的频道。如果 `abTestChannels` 为空，则跳过所有权检查（允许所有代理响应）。

### Q: @-提及后代理会永远拥有线程吗？
A: 不会。@-提及记录在 5 分钟后过期，之后会恢复正常的所有权检查。

### Q: 如果 Forwarder API 不可用会怎样？
A: 插件采用"失败开放"策略，如果 API 不可用或返回非预期状态，会允许消息发送以确保可用性。

### Q: 如何确认线程所有权是否正常工作？
A: 检查日志中的 `thread-ownership:` 前缀消息：
- `cancelled send to C123:1234.5678 — owned by other-agent`
- `unexpected status 500, allowing send`
- `ownership check failed (Error: ECONNREFUSED), allowing send`

## 相关文件清单

### 核心文件
- `extensions/thread-ownership/index.ts` - 插件入口
- `extensions/thread-ownership/index.test.ts` - 单元测试
- `extensions/thread-ownership/openclaw.plugin.json` - 插件清单

### 依赖文件
- `src/config/types.ts` - 配置类型定义
- `src/channels/plugins/load.ts` - 插件加载器

## 变更记录

### 2026-02-16 - 初始化文档
- ✅ 创建 `thread-ownership/CLAUDE.md` 文档
- 📋 记录插件功能和配置
- 🔗 建立与其他扩展的关联

---

*提示：此扩展仅适用于 Slack 频道，且需要部署 slack-forwarder 服务。*
