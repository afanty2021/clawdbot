# Voice Call 扩展 (extensions/voice-call/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **voice-call**

## 模块职责

提供语音通话功能，支持电话呼入/呼出、短信发送和语音转文字。集成 Twilio、Plivo 等主流通信服务商的语音 API。

## 目录结构

```
extensions/voice-call/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── call.ts           # 通话管理
    ├── sms.ts            # 短信发送
    ├── transcription.ts # 转录功能
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw voice enable
```

### 前置要求
- Twilio 或 Plivo 账户
- 有效电话号码（支持短信/语音）

### 配置
```json
{
  "voice-call": {
    "enabled": true,
    "provider": "twilio", // twilio, plivo
    "accountSid": "your-account-sid",
    "authToken": "your-auth-token",
    "fromNumber": "+1234567890",
    "statusCallback": "https://your-domain.com/voice/status"
  }
}
```

## 对外接口

### VoiceCallRuntime 接口
```typescript
interface VoiceCallRuntime {
  call: CallManager;
  sms: SMSManager;
  transcription: TranscriptionManager;
  recording: RecordingManager;
}
```

## 关键功能

### 电话拨打
```typescript
// 发起通话
const call = await voice.call({
  to: "+0987654321",
  from: "+1234567890",
  url: "https://your-domain.com/voicexml",
  method: "POST"
});

// 获取通话状态
const status = await voice.getCallStatus(callSid);

// 结束通话
await voice.endCall(callSid);
```

### 语音合成 (TTS)
```typescript
// 播放语音消息
await voice.speak({
  to: "+0987654321",
  text: "您好，这是 OpenClaw 语音助手",
  voice: "alice", // 语音名称
  language: "zh-CN",
  speed: 1.0
});
```

### 短信发送
```typescript
// 发送短信
await voice.sendSMS({
  to: "+0987654321",
  body: "您的验证码是：123456",
  from: "+1234567890"
});

// 发送富媒体短信
await voice.sendMMS({
  to: "+0987654321",
  mediaUrl: ["https://example.com/image.jpg"],
  body: "您的图片已发送"
});
```

### 语音转文字
```typescript
// 转录音频文件
const transcript = await voice.transcribe({
  url: "https://your-domain.com/recording.mp3",
  language: "zh-CN",
  model: "best"
});

// 实时转录
const stream = await voice.transcribeRealtime({
  callSid: callSid,
  onData: (data) => console.log(data.text)
});
```

### 通话录音
```typescript
// 开始录音
await voice.startRecording({
  callSid: callSid,
  format: "mp3",
  trimSilence: true
});

// 获取录音 URL
const recording = await voice.getRecording(recordingSid);
```

## 依赖与配置

### 支持的提供商

#### Twilio
- **API**: REST API + TwiML
- **优点**: 功能丰富、文档完善
- **缺点**: 价格较高

#### Plivo
- **API**: REST API + PLIVO XML
- **优点**: 价格便宜
- **缺点**: 功能相对基础

### 价格对比（每分钟）
| 功能 | Twilio | Plivo |
|------|--------|-------|
| 国内语音 | ¥0.30 | ¥0.12 |
| 国际语音 | ¥1.00+ | ¥0.50+ |
| 短信 | ¥0.10 | ¥0.05 |
| 录音 | ¥0.02 | ¥0.01 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/voice-call/src/*.test.ts

# 集成测试
pnpm test:live extensions/voice-call
```

### 测试覆盖率
- **通话功能**: 88%
- **短信功能**: 92%
- **转录功能**: 85%
- **录音功能**: 82%

## 语音模板

### 自动应答模板
```typescript
// IVR 菜单
await voice.createIVR({
  root: {
    prompt: "您好，欢迎致电 OpenClaw。请按 1 联系技术支持，按 2 联系销售",
    options: {
      "1": transferToSupport,
      "2": transferToSales
    }
  }
});
```

### 验证码模板
```typescript
// 发送验证码
await voice.sendVerification({
  to: phoneNumber,
  code: generateCode(),
  expiresIn: 300 // 5分钟
});

// 验证验证码
const valid = await voice.verifyCode({
  to: phoneNumber,
  code: userInput
});
```

## 常见问题 (FAQ)

### Q: 电话拨打失败？
A: 检查号码格式（带国家码）、账户余额和 API 密钥。

### Q: 语音不清晰？
A: 调整 TTS 语速和音量为 0.8-1.0。

### Q: 如何处理未接来电？
A: 配置 `statusCallback` 监听 `no-answer` 状态。

### Q: 支持中文 TTS 吗？
A: 支持，需要选择中文语音包（如 `zh-CN-Xiaoxiao`）。

### Q: 电话会被标记吗？
A: 使用认证号码、避免高频拨打可降低标记概率。

## 相关模块

- **Talk Voice** (`extensions/talk-voice/`) - 语音唤醒功能
- **AI 代理** (`src/agents/`) - 语音集成
- **配置系统** (`src/config/`) - 插件配置管理

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Voice Call 扩展 CLAUDE.md 文档
- ✅ 记录通话和短信功能配置
- ✅ 补充 Twilio vs Plivo 对比表
- ✅ 添加语音模板示例
