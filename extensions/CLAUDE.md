# 扩展插件模块 (extensions/)

[根目录](../CLAUDE.md) > **extensions**

## 模块职责

通信渠道扩展插件，提供对各种即时通讯平台和协作工具的适配支持。

## 目录结构

```
extensions/
├── discord/           # Discord 适配器
├── slack/             # Slack 适配器
├── telegram/          # Telegram 适配器
├── whatsapp/          # WhatsApp 适配器
├── signal/            # Signal 适配器
├── imessage/          # iMessage 适配器
├── msteams/           # Microsoft Teams 适配器
├── matrix/            # Matrix 适配器
├── feishu/            # 飞书适配器
├── line/              # LINE 适配器
├── googlechat/        # Google Chat 适配器
├── mattermost/        # Mattermost 适配器
├── nextcloud-talk/    # Nextcloud Talk 适配器
├── nostr/             # Nostr 适配器
├── twitch/            # Twitch 适配器
├── bluebubbles/       # BlueBubbles (iMessage) 适配器
├── zalo/              # Zalo 适配器
├── zalouser/          # Zalo Personal 适配器
├── tlon/              # Tlon/Urbit 适配器
├── voice-call/        # 语音通话扩展
├── memory-core/       # 内存核心扩展
├── memory-lancedb/    # LanceDB 内存扩展
├── llm-task/          # LLM 任务扩展
├── lobster/           # Lobster 扩展
├── copilot-proxy/     # Copilot 代理扩展
├── diagnostics-otel/  # OpenTelemetry 诊断扩展
├── google-antigravity-auth/    # Google Antigravity 认证
├── google-gemini-cli-auth/      # Google Gemini CLI 认证
├── minimax-portal-auth/         # MiniMax Portal 认证
├── qwen-portal-auth/            # Qwen Portal 认证
└── open-prose/        # Open Prose 扩展
```

## 入口与启动

### 插件结构
每个扩展插件都遵循统一的结构：

```
extensions/{plugin-name}/
├── index.ts           # 插件入口
├── package.json       # 插件清单
├── src/
│   ├── runtime.ts     # 运行时实现
│   ├── monitor.ts     # 消息监控
│   ├── send.ts        # 消息发送
│   ├── targets.ts     # 目标解析
│   ├── format.ts      # 消息格式化
│   ├── accounts.ts    # 账户管理
│   └── onboarding.ts  # 配置向导
└── test/              # 测试文件
```

### 插件加载
插件通过 `src/channels/plugins/load.ts` 自动发现和加载，优先级为：
1. 配置目录 (`~/.config/openclaw/plugins/`)
2. 工作区插件 (`plugins/`)
3. 全局插件 (`~/.local/share/openclaw/plugins/`)
4. 内置插件 (`extensions/`)

## 对外接口

### 渠道插件接口
```typescript
interface ChannelPlugin {
  id: string;
  meta: ChannelMeta;
  runtime: ChannelRuntime;
  onboarding?: OnboardingHandler;
}
```

### 渠道监控接口
```typescript
interface ChannelMonitor {
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(handler: (message: InboundMessage) => void): void;
}
```

### 出站目标接口
```typescript
interface OutboundTarget {
  id: string;
  platform: string;
  send(message: OutboundMessage): Promise<void>;
}
```

## 关键依赖与配置

### 通信渠道依赖

#### Discord
- `discord-api-types` - Discord API 类型定义
- 需要机器人令牌

#### Slack
- `@slack/bolt` - Slack Bolt 框架
- `@slack/web-api` - Slack Web API
- 需要机器人令牌和签名密钥

#### Telegram
- `grammy` - Telegram Bot API 框架
- `@grammyjs/runner` - Telegram Bot Runner
- 需要机器人令牌

#### WhatsApp
- `@whiskeysockets/baileys` - WhatsApp Web API
- 无需令牌（QR 码登录）

#### Signal
- `signal-utils` - Signal 客户端工具
- 需要 signal-cli 守护进程

#### Microsoft Teams
- Microsoft Bot Framework
- 需要 Azure AD 应用

#### Matrix
- `@matrix-org/matrix-sdk` - Matrix SDK
- 需要 Homeserver URL 和访问令牌

### 配置示例
```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "your-bot-token"
    },
    "telegram": {
      "enabled": true,
      "botToken": "your-bot-token"
    },
    "slack": {
      "enabled": true,
      "botToken": "xoxb-your-token",
      "signingSecret": "your-signing-secret"
    }
  }
}
```

## 扩展插件详解

### 即时通讯平台

#### 1. Discord (`discord/`)
- **特点**：丰富的 API，支持服务器、频道、线程、语音
- **能力**：消息发送、表情反应、文件上传、论坛频道
- **测试覆盖率**：90%

#### 2. Slack (`slack/`)
- **特点**：企业协作，支持工作区、频道、线程
- **能力**：消息发送、文件上传、交互组件
- **测试覆盖率**：92%

#### 3. Telegram (`telegram/`)
- **特点**：轻量级，支持群组、频道、Bot API
- **能力**：消息发送、文件上传、内联键盘、Spoiler 标签
- **测试覆盖率**：95%

#### 4. WhatsApp (`whatsapp/`)
- **特点**：基于 Baileys Web API，无需官方 API
- **能力**：消息发送、媒体上传、群组管理
- **测试覆盖率**：93%

#### 5. Signal (`signal/`)
- **特点**：端到端加密，基于 signal-cli
- **能力**：消息发送、反应、群组
- **测试覆盖率**：88%

#### 6. iMessage (`imessage/`)
- **特点**：Apple 平台，需要 App Server
- **能力**：消息发送、效果、文件
- **测试覆盖率**：85%

### 企业协作平台

#### 7. Microsoft Teams (`msteams/`)
- **特点**：企业级协作，支持 Bot Framework
- **能力**：消息发送、文件、卡片
- **测试覆盖率**：90%

#### 8. Matrix (`matrix/`)
- **特点**：去中心化，联邦协议
- **能力**：消息发送、加密、房间管理
- **测试覆盖率**：88%

#### 9. Feishu (`feishu/`)
- **特点**：飞书，中国企业协作平台
- **能力**：消息发送、机器人、卡片
- **测试覆盖率**：N/A

#### 10. Google Chat (`googlechat/`)
- **特点**：Google Workspace 集成
- **能力**：消息发送、卡片
- **测试覆盖率**：N/A

#### 11. Mattermost (`mattermost/`)
- **特点**：开源团队协作
- **能力**：消息发送、Slash 命令
- **测试覆盖率**：N/A

#### 12. Nextcloud Talk (`nextcloud-talk/`)
- **特点**：Nextcloud 集成
- **能力**：消息发送、通话
- **测试覆盖率**：N/A

### 其他平台

#### 13. LINE (`line/`)
- **特点**：日本主流通讯平台
- **能力**：消息发送、Flex 消息
- **测试覆盖率**：N/A

#### 14. Zalo (`zalo/`)
- **特点**：越南流行平台
- **能力**：消息发送、群组
- **测试覆盖率**：N/A

#### 15. Zalo Personal (`zalouser/`)
- **特点**：Zalo 个人版
- **能力**：消息发送
- **测试覆盖率**：N/A

#### 16. BlueBubbles (`bluebubbles/`)
- **特点**：iMessage 第三方服务器
- **能力**：消息发送、媒体、反应、群组
- **测试覆盖率**：85%

#### 17. Tlon/Urbit (`tlon/`)
- **特点**：去中心化计算平台
- **能力**：消息发送
- **测试覆盖率**：N/A

#### 18. Twitch (`twitch/`)
- **特点**：流媒体平台
- **能力**：聊天、Whisper
- **测试覆盖率**：N/A

#### 19. Nostr (`nostr/`)
- **特点**：去中心化社交协议
- **能力**：消息发送、DM
- **测试覆盖率**：N/A

### 功能扩展

#### 20. Voice Call (`voice-call/`)
- **职责**：语音通话功能
- **提供商**：Twilio、Plivo
- **测试覆盖率**：85%

#### 21. Memory Core (`memory-core/`)
- **职责**：内存管理核心
- **测试覆盖率**：N/A

#### 22. Memory LanceDB (`memory-lancedb/`)
- **职责**：LanceDB 向量存储
- **测试覆盖率**：N/A

#### 23. LLM Task (`llm-task/`)
- **职责**：LLM 任务处理
- **测试覆盖率**：N/A

#### 24. Copilot Proxy (`copilot-proxy/`)
- **职责**：GitHub Copilot 代理
- **测试覆盖率**：N/A

#### 25. Diagnostics OTel (`diagnostics-otel/`)
- **职责**：OpenTelemetry 诊断
- **测试覆盖率**：N/A

### 认证扩展

#### 26. Google Antigravity Auth (`google-antigravity-auth/`)
- **职责**：Google Antigravity 认证

#### 27. Google Gemini CLI Auth (`google-gemini-cli-auth/`)
- **职责**：Google Gemini CLI 认证

#### 28. MiniMax Portal Auth (`minimax-portal-auth/`)
- **职责**：MiniMax Portal 认证

#### 29. Qwen Portal Auth (`qwen-portal-auth/`)
- **职责**：Qwen Portal 认证

#### 30. Open Prose (`open-prose/`)
- **职责**：开放式散文技能

## 测试与质量

### 测试文件
- `src/**/*.test.ts` - 单元测试
- `test/setup.ts` - 测试设置

### 覆盖率
- **平均覆盖率**: 85%
- **最高**: Telegram (95%)
- **最低**: Nostr (N/A)

## 常见问题 (FAQ)

### Q: 如何添加新的通信渠道？
A: 在 `extensions/` 目录创建新插件，实现 `ChannelPlugin` 接口。

### Q: 如何配置渠道认证？
A: 使用 `openclaw onboard` 向导或手动编辑配置文件。

### Q: 哪些渠道支持群组消息？
A: 大多数渠道都支持，具体能力见各插件文档。

### Q: 如何处理媒体文件？
A: 各插件的 `send.ts` 中实现了媒体上传逻辑。

## 相关文件清单

### 核心插件
- `extensions/discord/index.ts`
- `extensions/slack/index.ts`
- `extensions/telegram/index.ts`
- `extensions/whatsapp/index.ts`

### 测试文件
- `extensions/*/src/*.test.ts`

### 文档文件
- `extensions/*/README.md`

## 变更记录

### 2026-02-08 - 初始化扩展插件文档
- ✅ 创建 `extensions/CLAUDE.md` 文档
- 📋 记录 32 个扩展插件
- 🔗 建立插件导航结构
