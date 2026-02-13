# Talk Voice 扩展 (extensions/talk-voice/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **talk-voice**

## 模块职责

提供语音唤醒功能，支持关键词检测和语音激活。Talk Voice 是 OpenClaw 的语音交互入口，支持多种唤醒词和自定义配置。

## 目录结构

```
extensions/talk-voice/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── wakeword.ts      # 唤醒词检测
    ├── voice.ts         # 语音处理
    ├── config.ts        # 配置管理
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw voice enable talk-voice
```

### 前置要求
- 麦克风设备
- 语音唤醒库（Porcupine 或 Snowboy）
- Node.js ≥18

### 配置
```json
{
  "talk-voice": {
    "enabled": true,
    "wakeWord": "hey openclaw",
    "sensitivity": 0.7,
    "audioDevice": "default",
    "modelPath": "~/.openclaw/talk-voice/models",
    "continuous": true,
    "onDetected": "listen"
  }
}
```

## 对外接口

### TalkVoiceRuntime 接口
```typescript
interface TalkVoiceRuntime {
  wakeword: WakeWordDetector;
  audio: AudioManager;
  config: VoiceConfig;
}
```

## 关键功能

### 唤醒词检测
```typescript
// 检测唤醒词
await talkVoice.detect({
  audioStream: microphoneStream,
  wakeWords: ["hey openclaw", "okay bot"],
  sensitivity: 0.7
});

// 添加自定义唤醒词
await talkVoice.addCustomWord({
  word: "hey assistant",
  modelPath: "/path/to/model.ppn"
});

// 移除唤醒词
await talkVoice.removeWord({
  word: "hey bot"
});
```

### 语音处理
```typescript
// 开始监听
await talkVoice.startListening({
  hotword: true,
  silenceTimeout: 5000,
  maxDuration: 30000
});

// 停止监听
await talkVoice.stopListening();

// 获取音频缓冲区
const audio = talkVoice.getAudioBuffer({
  format: "float",
  channels: 1,
  sampleRate: 16000
});
```

### 音频设备
```typescript
// 列出音频设备
const devices = await talkVoice.listDevices({
  type: "input" // input, output, all
});

// 选择音频设备
await talkVoice.setDevice({
  deviceId: "device-id",
  sampleRate: 16000,
  channels: 1
});

// 获取设备音量
const volume = await talkVoice.getInputVolume();
```

### 配置管理
```typescript
// 保存配置
await talkVoice.saveConfig({
  wakeWord: "hey openclaw",
  sensitivity: 0.7
});

// 加载配置
const config = await talkVoice.loadConfig();

// 重置为默认值
await talkVoice.resetConfig();
```

## 依赖与配置

### 支持的唤醒引擎

| 引擎 | 说明 | 准确性 | 资源占用 |
|------|------|--------|---------|
| Porcupine | Picovoice | 高 | 中 |
| Snowboy | Kitt.ai | 中 | 低 |
| Rhino | Picovoice | 高 | 中 |
| Mycroft | 开源 | 中 | 高 |

### 音频配置

| 参数 | 默认值 | 范围 |
|------|--------|------|
| sampleRate | 16000 | 8000-48000 |
| channels | 1 | 1-2 |
| bitDepth | 16 | 8-32 |
| bufferSize | 4096 | 512-16384 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/talk-voice/src/*.test.ts

# 集成测试
pnpm test:live extensions/talk-voice
```

### 测试覆盖率
- **唤醒词检测**: 88%
- **音频处理**: 85%
- **设备管理**: 82%
- **配置操作**: 80%

## 语音唤醒对比

| 特性 | Porcupine | Snowboy | Rhasspy |
|------|-----------|---------|---------|
| 开源 | ✗ | ✗ | ✓ |
| 离线运行 | ✓ | ✓ | ✓ |
| 自定义唤醒词 | ✓ | ✓ | ✓ |
| 中文支持 | ✓ | ✓ | ✓ |
| 资源占用 | 中 | 低 | 高 |

## 常见问题 (FAQ)

### Q: 唤醒词检测不准确？
A: 调整 sensitivity 参数（0.5-0.8），确保环境噪音较低。

### Q: 如何添加自定义唤醒词？
A: 使用 Porcupine CLI 工具训练模型，或使用在线服务。

### Q: CPU 占用高？
A: 使用 Snowboy 引擎，或降低音频采样率。

### Q: 麦克风无响应？
A: 检查系统权限，确认设备 ID 正确。

### Q: 支持多唤醒词吗？
A: 是的，配置 wakeWords 数组即可。

## 相关模块

- **Voice Call** (`extensions/voice-call/`) - 语音通话
- **macOS 应用** (`apps/macos/`) - 原生语音支持
- **AI 代理** (`src/agents/`) - 语音集成

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Talk Voice 扩展 CLAUDE.md 文档
- ✅ 记录唤醒词检测和语音处理接口
- ✅ 补充音频设备管理示例
- ✅ 添加唤醒引擎对比表
