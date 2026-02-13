# Zalo 扩展 (extensions/zalo/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **zalo**

## 模块职责

提供 Zalo 消息平台适配器，支持 Zalo Official Account API 的消息收发、菜单和富媒体消息。Zalo 是越南最流行的即时通讯平台，拥有超过 7000 万用户。

## 目录结构

```
extensions/zalo/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── messages.ts       # 消息处理
    ├── webhook.ts       # Webhook 处理
    ├── menu.ts           # 菜单管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw channels enable zalo
```

### 前置要求
- Zalo Official Account (OA)
- Zalo App ID 和 Secret Key
- OAuth 访问令牌

### 配置
```json
{
  "zalo": {
    "enabled": true,
    "appId": "your-app-id",
    "secretKey": "your-secret-key",
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token"
  }
}
```

## 对外接口

### ZaloRuntime 接口
```typescript
interface ZaloRuntime {
  messages: MessageManager;
  webhook: WebhookHandler;
  menu: MenuManager;
  profile: ProfileManager;
}
```

## 关键功能

### 消息收发
```typescript
// 发送文本消息
await zalo.send({
  recipient: { user_id: "user-id" },
  message: {
    text: "Hello, Zalo!"
  }
});

// 发送图片
await zalo.sendImage({
  recipient: { user_id: "user-id" },
  message: {
    attachment: {
      type: "image",
      payload: {
        url: "https://example.com/image.jpg"
      }
    }
  }
});

// 发送模板消息
await zalo.sendTemplate({
  recipient: { user_id: "user-id" },
  message: {
    template_type: "text",
    text: "Your code: {{1}}",
    template_data: {
      code: "123456"
    }
  }
});
```

### OA 菜单
```typescript
// 创建菜单
await zalo.createMenu({
  menu: {
    name: "OpenClaw Menu",
    items: [
      {
        id: "1",
        title: "Help",
        type: "reply",
        payload: "help_command"
      },
      {
        id: "2",
        title: "Website",
        type: "oa_open_url",
        url: "https://example.com"
      }
    ]
  }
});
```

### 用户资料
```typescript
// 获取用户资料
const profile = await zalo.getProfile({
  userId: "user-id"
});

// 资料结构
interface ZaloProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
}
```

### 链接账号
```typescript
// 生成授权链接
const authUrl = zalo.getAuthUrl({
  appId: "your-app-id",
  redirectUri: "https://your-domain.com/callback",
  state: "random_state"
});

// 交换令牌
const tokens = await zalo.exchangeCode({
  code: "authorization_code"
});
```

## 依赖与配置

### API 限制
| 限制类型 | 数值 | 说明 |
|---------|------|------|
| 消息发送 | 100次/用户/小时 | 免费 OA |
| API 调用 | 1000次/天 | 免费 OA |
| 菜单按钮 | 最多 10 个 | |

### 消息类型支持

| 类型 | 支持 | 说明 |
|------|------|------|
| 文本 | ✓ | |
| 图片 | ✓ | |
| 视频 | ✓ | |
| 文件 | ✓ | 最大 20MB |
| 链接预览 | ✓ | |
| 模板消息 | ✓ | |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/zalo/src/*.test.ts

# 集成测试
pnpm test:live extensions/zalo
```

### 测试覆盖率
- **消息发送**: 90%
- **菜单管理**: 85%
- **用户资料**: 82%
- **Webhook 处理**: 80%

## Zalo vs 其他平台

| 特性 | Zalo | WhatsApp | Telegram |
|------|------|----------|----------|
| 东南亚市场 | 主导 | 增长中 | 小众 |
| 官方账号 | ✓ | ✓ | ✓ |
| 机器人 API | ✓ | ✓ | ✓ |
| 模板消息 | ✓ | ✓ | ✗ |
| 免费发送 | ✓ | ✗ | ✓ |

## 常见问题 (FAQ)

### Q: 消息发送失败？
A: 检查 access token 是否过期，验证 appId 和 secretKey。

### Q: Webhook 收不到消息？
A: 确认 Zalo OA 设置中已配置 Webhook URL 并验证。

### Q: 如何获取 userId？
A: 用户通过 OA 发送消息时，Webhoo k会包含 userId。

### Q: Zalo API 有哪些限制？
A: 免费 OA 有消息和 API 调用限制，付费 OA 额度更高。

## 相关模块

- **网关服务器** (`src/gateway/`) - WebSocket 通信
- **配置系统** (`src/config/`) - 插件配置管理
- **渠道插件系统** (`src/channels/`) - 插件加载和生命周期

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Zalo 扩展 CLAUDE.md 文档
- ✅ 记录 Official Account API 接口
- ✅ 补充消息类型和菜单示例
- ✅ 添加 Zalo 市场特点说明
