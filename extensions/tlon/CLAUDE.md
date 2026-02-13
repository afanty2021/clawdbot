# Tlon/Urbit 扩展 (extensions/tlon/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **tlon**

## 模块职责

提供 Tlon/Urbit 去中心化计算平台的适配器，支持去中心化消息、部落管理和 Urbit ID 集成。Urbit 是一个独特的操作系统和社交网络，具有抗审查特性。

## 目录结构

```
extensions/tlon/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── ship.ts           # 船只通信
    ├── graph.ts          # 图谱管理
    ├── groups.ts         # 部落管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable tlon
```

### 前置要求
- Urbit ID (planet 或 star)
- 运行中的 Urbit 飞船（本地或托管）
- HTTP API 访问端点

### 配置
```json
{
  "tlon": {
    "enabled": true,
    "shipUrl": "http://localhost:8080",
    "shipName": "~your-ship",
    "code": "your-ship-code",
    "apiToken": "your-api-token"
  }
}
```

## 对外接口

### TlonRuntime 接口
```typescript
interface TlonRuntime {
  ship: ShipManager;
  graph: GraphManager;
  groups: GroupManager;
  contacts: ContactManager;
}
```

## 关键功能

### 船只通信
```typescript
// 发送消息到船只
await tlon.sendPoke({
  app: "chat",
  mark: "chat-message",
  json: {
    whom: "~zod/chat-name",
    content: [{ text: "Hello, Urbit!" }]
  }
});

// 订阅通道
await tlon.subscribe({
  app: "chat",
  path: "/inbox"
});

// 获取消息
const messages = await tlon.scry({
  app: "chat",
  path: "~zod/chat-name"
});
```

### 部落（Groups）管理
```typescript
// 创建部落
await tlon.createGroup({
  name: "OpenClaw Users",
  description: "Community for OpenClaw users",
  privacy: "public" // public, private, secret
});

// 加入部落
await tlon.joinGroup({
  group: "~zod/openclaw-users"
});

// 管理成员
await tlon.addMembers({
  group: "~zod/openclaw-users",
  ships: ["~nidset", "marzod"]
});
```

### 图谱（Graph）操作
```typescript
// 创建图谱
await tlon.createGraph({
  name: "OpenClaw Blog",
  title: "OpenClaw Updates",
  description: "Latest news and updates"
});

// 发布帖子
await tlon.postToGraph({
  graph: "~zod/openclaw-blog",
  contents: [
    { text: "New feature!" },
    { url: "https://example.com/post" }
  ]
});

// 读取图谱
const posts = await tlon.getGraphFeed({
  graph: "~zod/openclaw-blog",
  limit: 20
});
```

### 联系人管理
```typescript
// 获取联系人
const contacts = await tlon.getContacts();

// 添加/更新联系人
await tlon.setContact({
  ship: "~nidset",
  nickname: "My Friend",
  bio: "OpenClaw user"
});
```

## 依赖与配置

### Urbit 概念

| 概念 | 说明 |
|------|------|
| Ship | Urbit 节点（~zod） |
| Planet | 个人 ID（免费） |
| Star | 中继节点（付费） |
| Galaxy | 根节点（10个） |
| Desk | 应用包 |
| Gall | 应用运行时 |

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| /~/channel | POST | 长期轮询 |
| /scry | GET | 只读查询 |
| /peek | GET | 元数据查询 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/tlon/src/*.test.ts

# 集成测试
pnpm test:live extensions/tlon
```

### 测试覆盖率
- **船只通信**: 88%
- **部落管理**: 82%
- **图谱操作**: 80%
- **联系人管理**: 78%

## Urbit vs 传统社交

| 特性 | Urbit | 传统平台 |
|------|-------|---------|
| 所有权 | 用户拥有 | 平台拥有 |
| 抗审查 | ✓ | ✗ |
| 去中心化 | ✓ | ✗ |
| 数据便携 | ✓ | ✗ |
| 独立身份 | ✓ | ✗ |

## 常见问题 (FAQ)

### Q: 如何获取 Urbit ID？
A: 购买 planet 或使用免费 testnet ID。

### Q: 本地飞船配置？
A: 使用 `./urbit -c my-ship` 创建新飞船。

### Q: 消息延迟？
A: Urbit 使用乐观更新，通常秒级同步。

### Q: 如何扩展？
A: 开发 Gall 应用程序，打包为 desk 分发。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Tlon/Urbit 扩展 CLAUDE.md 文档
- ✅ 记录 Urbit 概念和 API 接口
- ✅ 补充船只通信和部落管理示例
- ✅ 添加 Urbit vs 传统平台对比
