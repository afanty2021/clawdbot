# Swabble - 语音唤醒守护进程

[根目录](../CLAUDE.md) > **Swabble**

## 模块职责

基于 Speech.framework 的语音唤醒（Wake Word）守护进程，为 macOS 提供"Hey Clawd"语音激活功能。

## 目录结构

```
Swabble/
├── Sources/
│   ├── swabble/           # CLI 主程序
│   │   ├── CLI/
│   │   │   ├── CLIRegistry.swift
│   │   │   └── Commands/
│   │   │       ├── DoctorCommand.swift
│   │   │       ├── HealthCommand.swift
│   │   │       ├── ServeCommand.swift
│   │   │       ├── StartStopCommands.swift
│   │   │       ├── StatusCommand.swift
│   │   │       ├── SetupCommand.swift
│   │   │       ├── TailLogCommand.swift
│   │   │       ├── TranscribeCommand.swift
│   │   │       ├── ServiceCommands.swift
│   │   │       └── MicCommands.swift
│   │   └── main.swift
│   ├── SwabbleCore/       # 核心库
│   │   ├── Speech/
│   │   │   ├── SpeechPipeline.swift
│   │   │   └── BufferConverter.swift
│   │   ├── Hooks/
│   │   │   └── HookExecutor.swift
│   │   ├── Config/
│   │   │   └── Config.swift
│   │   ├── Support/
│   │   │   ├── Logging.swift
│   │   │   ├── OutputFormat.swift
│   │   │   ├── TranscriptsStore.swift
│   │   │   └── AttributedString+Sentences.swift
│   └── SwabbleKit/        # 多平台库
│       └── WakeWordGate.swift
├── Tests/
│   ├── SwabbleKitTests/
│   │   └── WakeWordGateTests.swift
│   └── swabbleTests/
│       └── ConfigTests.swift
├── Package.swift
├── .swiftformat
├── .swiftlint.yml
├── CHANGELOG.md
└── README.md
```

## 入口与启动

### CLI 入口
- **主入口**: `Sources/swabble/main.swift`

### 快速开始
```bash
# 安装依赖
brew install swiftformat swiftlint

# 构建
swift build

# 写入默认配置
swift run swabble setup

# 运行前台守护进程
swift run swabble serve

# 测试钩子
swift run swabble test-hook "hello world"

# 转录文件为 SRT
swift run swabble transcribe /path/to/audio.m4a --format srt --output out.srt
```

### 作为库使用
```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/steipete/swabble.git", branch: "main"),
],
targets: [
    .target(name: "MyApp", dependencies: [
        .product(name: "Swabble", package: "swabble"),     // Speech pipeline (macOS 26+)
        .product(name: "SwabbleKit", package: "swabble"),  // Wake-word gate utilities (iOS 17+)
    ]),
]
```

## 对外接口

### CLI 命令
- `serve` - 前台循环（麦克风 → 唤醒 → 钩子）
- `transcribe <file>` - 离线转录（txt|srt）
- `test-hook "text"` - 调用配置的钩子
- `mic list|set <index>` - 枚举/选择输入设备
- `setup` - 写入默认配置 JSON
- `doctor` - 检查 Speech 授权和设备可用性
- `health` - 打印 `ok`
- `tail-log` - 最近 10 条转录
- `status` - 显示唤醒状态和最近转录
- `service install|uninstall|status` - 用户 launchd plist

### SwabbleCore 接口
```swift
// Speech pipeline
class SpeechPipeline {
    func start()
    func stop()
}

// Hook executor
class HookExecutor {
    func execute(text: String)
}

// Config
struct Config {
    var audio: AudioConfig
    var wake: WakeConfig
    var hook: HookConfig
    var logging: LoggingConfig
}
```

### SwabbleKit 接口
```swift
// Wake word gate (iOS 17+ / macOS 15+)
class WakeWordGate {
    func shouldTranscribe(segment: String) -> Bool
}
```

## 关键依赖与配置

### 系统要求
- **Swift**: 6.2+
- **macOS**: 26+ (SpeechAnalyzer + SpeechTranscriber)
- **iOS**: 17+ (SwabbleKit)
- **Framework**: Speech.framework

### 开发工具
- **swiftformat**: 代码格式化
- **swiftlint**: 代码检查
- **swift-testing**: 测试框架

### 配置文件
**路径**: `~/.config/swabble/config.json`

```json
{
  "audio": {
    "deviceName": "",
    "deviceIndex": -1,
    "sampleRate": 16000,
    "channels": 1
  },
  "wake": {
    "enabled": true,
    "word": "clawd",
    "aliases": ["claude"]
  },
  "hook": {
    "command": "",
    "args": [],
    "prefix": "Voice swabble from ${hostname}: ",
    "cooldownSeconds": 1,
    "minCharacters": 24,
    "timeoutSeconds": 5,
    "env": {}
  },
  "logging": {
    "level": "info",
    "format": "text"
  },
  "transcripts": {
    "enabled": true,
    "maxEntries": 50
  },
  "speech": {
    "localeIdentifier": "en_US",
    "etiquetteReplacements": false
  }
}
```

## 子模块详解

### 1. Speech Pipeline (`SwabbleCore/Speech/`)

**职责**: 音频处理和语音识别

**组件**:
- `SpeechPipeline.swift` - 主管道
- `BufferConverter.swift` - 缓冲区转换

**流程**:
1. `AVAudioEngine` tap → 音频流
2. `BufferConverter` → 格式转换
3. `SpeechAnalyzer` → 唤醒词检测
4. `SpeechTranscriber` → 转录
5. 结果输出 → 钩子执行

### 2. Hooks (`SwabbleCore/Hooks/`)

**职责**: 钩子执行和管理

**组件**:
- `HookExecutor.swift` - 执行器

**钩子协议**:
```bash
<command> <args...> "<prefix><text>"
```

**环境变量**:
- `SWABBLE_TEXT` - 去除唤醒词的转录
- `SWABBLE_PREFIX` - 渲染的前缀（主机名已替换）

### 3. Config (`SwabbleCore/Config/`)

**职责**: 配置管理

**组件**:
- `Config.swift` - 配置结构

**配置路径**:
- 默认: `~/.config/swabble/config.json`
- 覆盖: `--config /path/to/config.json`

### 4. SwabbleKit (`SwabbleKit/`)

**职责**: 多平台唤醒词门控

**组件**:
- `WakeWordGate.swift` - 唤醒词门控

**平台支持**:
- macOS 15+
- iOS 17+

## 测试与质量

### 测试框架
- **swift-testing**: 单元测试

### 测试文件
- `Tests/SwabbleKitTests/WakeWordGateTests.swift`
- `Tests/swabbleTests/ConfigTests.swift`

### 运行测试
```bash
swift test
```

### 代码质量
- **格式化**: `./scripts/format.sh`
- **Lint**: `./scripts/lint.sh`

## 常见问题 (FAQ)

### Q: 如何更改唤醒词？
A: 编辑 `~/.config/swabble/config.json` 中的 `wake.word` 和 `wake.aliases`。

### Q: 如何禁用唤醒词检测？
A: 设置 `wake.enabled: false` 或使用 `--no-wake` 标志。

### Q: 钩子命令如何工作？
A: 当唤醒词被检测到且转录通过 `minCharacters` 和 `cooldownSeconds` 检查时执行。

### Q: 转录存储在哪里？
A: `~/Library/Application Support/swabble/transcripts.log`。

### Q: 如何集成到 OpenClaw？
A: 设置钩子命令为 `openclaw nodes voice` 或类似的 OpenClaw 命令。

## 相关文件清单

### 核心文件
- `Sources/swabble/main.swift`
- `Sources/SwabbleCore/Speech/SpeechPipeline.swift`
- `Sources/SwabbleKit/WakeWordGate.swift`

### 命令文件
- `Sources/swabble/CLI/Commands/ServeCommand.swift`
- `Sources/swabble/CLI/Commands/SetupCommand.swift`
- `Sources/swabble/CLI/Commands/DoctorCommand.swift`

### 配置文件
- `.swiftformat`
- `.swiftlint.yml`
- `Package.swift`

### 文档文件
- `README.md`
- `docs/spec.md`
- `CHANGELOG.md`

## 变更记录

### 2026-02-08 - 初始化 Swabble 文档
- ✅ 创建 `Swabble/CLAUDE.md` 文档
- 📋 记录 CLI 命令和接口
- 🔗 建立模块导航

---

**注意**: Swabble 是一个独立的 Swift 项目，与 OpenClaw 主仓库分开维护。它作为 OpenClaw macOS 应用的语音唤醒组件。
