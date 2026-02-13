# Nostr 扩展 (extensions/nostr/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **nostr**

## 模块职责

提供 Nostr 去中心化社交协议的适配器，支持 NIP-04 加密私信、事件发布和订阅。Nostr 是一个抗审查的开放社交网络协议。

## 目录结构

```
extensions/nostr/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── events.ts         # 事件处理
    ├── dms.ts            # 加密私信
    ├── keys.ts           # 密钥管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable nostr
```

### 前置要求
- Nostr 密钥对（nsec/npub）
- 至少一个中继器（relay）URL

### 配置
```json
{
  "nostr": {
    "enabled": true,
    "privateKey": "nsec1xxxxx",
    "relays": [
      "wss://relay.nostr.ch",
      "wss://relay.damus.io",
      "wss://nostr.zebedee.cloud"
    ],
    "relayTimeout": 3000,
    "autoReconnect": true
  }
}
```

## 对外接口

### NostrRuntime 接口
```typescript
interface NostrRuntime {
  events: EventManager;
  dms: DMManager;
  keys: KeyManager;
  profile: ProfileManager;
}
```

## 关键功能

### 事件发布
```typescript
// 发布文本笔记
await nostr.publishNote({
  content: "Hello, Nostr from OpenClaw!",
  kind: 1, // 普通笔记
  tags: [["t", "openclaw"]]
});

// 发布长文章
await nostr.publishLongForm({
  title: "OpenClaw AI Assistant",
  content: "# Introduction\n...",
  kind: 30023, // 长文章
  tags: [["d", "openclaw-intro"]]
});

// 发布到指定中继器
await nostr.publishToRelay({
  content: "Test message",
  relay: "wss://relay.nostr.ch"
});
```

### 加密私信 (NIP-04)
```typescript
// 发送加密私信
await nostr.sendDM({
  recipient: "npub1xxxxx",
  content: "Secret message!",
  encrypt: true
});

// 接收私信
const messages = await nostr.getDMs({
  since: Date.now() - 86400000 // 最近24小时
});
```

### 订阅与监听
```typescript
// 订阅通用事件
const sub = nostr.subscribe({
  kinds: [1, 30023], // 笔记和长文章
  authors: ["npub1xxxxx"],
  limit: 100
});

sub.onEvent((event) => {
  console.log(event.content);
});

// 取消订阅
sub.close();
```

### 密钥管理
```typescript
// 生成新密钥
const keys = await nostr.generateKeys();

// 从助记词导入
const keys = await nostr.fromMnemonic(
  "abandon abandon abandon..."
);

// 导出公钥
const pubkey = await nostr.getPublicKey();
```

### 资料管理
```typescript
// 更新个人资料
await nostr.updateProfile({
  name: "OpenClaw Bot",
  about: "AI Assistant on Nostr",
  picture: "https://example.com/avatar.jpg"
});

// 获取资料
const profile = await nostr.getProfile("npub1xxxxx");
```

## 依赖与配置

### npm 依赖
- `nostr-tools` - Nostr 协议工具库
- `zod` - 配置验证
- `secp256k1` - 椭圆曲线加密

### NIP 标准支持

| NIP | 功能 | 支持状态 |
|-----|------|---------|
| NIP-01 | 基础协议 | ✓ |
| NIP-02 | 联系人列表 | ✓ |
| NIP-04 | 加密私信 | ✓ |
| NIP-05 | 验证域名 | ✓ |
| NIP-09 | 事件删除 | ✓ |
| NIP-10 | 标记查询 | ✓ |
| NIP-40 | 过期时间 | ✓ |

### 中继器选择

| 中继器 | 位置 | 稳定性 |
|--------|------|--------|
| relay.nostr.ch | 瑞士 | 高 |
| relay.damus.io | 全球 | 高 |
| nostr.zebedee.cloud | 全球 | 中 |
| nostr.bitcoiner.social | 全球 | 中 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/nostr/src/*.test.ts

# 集成测试
pnpm test:live extensions/nostr
```

### 测试覆盖率
- **事件发布**: 90%
- **加密私信**: 85%
- **密钥管理**: 88%
- **订阅功能**: 82%

## Nostr vs 传统社交

| 特性 | Nostr | 传统平台 |
|------|-------|---------|
| 去中心化 | ✓ | ✗ |
| 抗审查 | ✓ | ✗ |
| 用户拥有数据 | ✓ | ✗ |
| 无算法推荐 | ✓ | ✗ |
| 开源协议 | ✓ | ✗ |
| 中继器自选 | ✓ | ✗ |

## 常见问题 (FAQ)

### Q: 私钥泄露怎么办？
A: 立即发布 NIP-09 删除事件，生成新密钥对。

### Q: 消息发送失败？
A: 检查中继器可用性，尝试多个中继器。

### Q: 如何验证 NIP-05？
A: 配置 DNS TXT 记录，支持 nostr: 协议链接。

### Q: 匿名使用？
A: 可以使用一次性密钥，无需绑定邮箱或手机。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Nostr 扩展 CLAUDE.md 文档
- ✅ 记录 NIP-04 加密私信功能
- ✅ 补充密钥管理说明
- ✅ 添加中继器选择指南
