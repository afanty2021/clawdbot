[根目录](../../CLAUDE.md) > [apps](../) > **macos**

# macOS 应用模块

> 最后更新：2026-01-25 16:21:01
> 模块类型：平台应用
> 语言：Swift (SwiftUI)
> 测试覆盖率：N/A (手动测试)

## 模块职责

macOS 应用是 Clawdbot 的桌面控制中心，提供：

- 菜单栏图标和下拉菜单控制面板
- Gateway 启动/停止和状态监控
- Voice Wake（语音唤醒）和 Push-to-Talk（按住说话）
- Talk Mode 对话模式覆盖层
- WebChat 内嵌浏览器
- 设备节点模式（执行本地操作）
- 远程 Gateway 控制和 SSH 隧道
- 调试工具和日志查看器

## 入口与启动

### 主入口点

- **`Sources/Clawdbot/App.swift`**：应用入口
- **`Sources/Clawdbot/ClawdbotApp.swift`**：App 结构
- **`Sources/Clawdbot/ContentView.swift`**：主视图

### 启动流程

```swift
// 1. 应用启动
@main
struct ClawdbotApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self)
    var appDelegate

    var body: some Scene {
        MenuBarExtra("Clawdbot", systemImage: "message.fill") {
            MenuBarView()
        }
    }
}

// 2. 初始化服务
class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        // 启动 Gateway
        gatewayService.start()

        // 启动节点模式
        nodeService.start()

        // 启动 Voice Wake
        voiceWakeService.start()
    }
}

// 3. 显示菜单栏图标
// 菜单栏下拉菜单提供控制选项
```

### 配置要求

应用使用共享的 `~/.clawdbot/clawdbot.json` 配置文件，无需额外配置。

### 构建要求

- **Xcode**：15.0+
- **Swift**：5.9+
- **macOS 目标**：13.0+ (Ventura)
- **架构**：x86_64 和 arm64 (Universal Binary)

## 对外接口

### GatewayService

```swift
class GatewayService: ObservableObject {
    @Published var isRunning: Bool
    @Published var port: Int
    @Published var status: GatewayStatus

    // 控制方法
    func start() async throws
    func stop() async throws
    func restart() async throws

    // 状态查询
    func getStatus() async -> GatewayStatus
    func getLogs() async -> [LogEntry]
}
```

### NodeService

```swift
class NodeService: ObservableObject {
    @Published var isConnected: Bool
    @Published var nodeId: String?
    @Published var capabilities: NodeCapabilities

    // 节点方法
    func connect(to gatewayUrl: String) async throws
    func disconnect() async

    // 功能调用
    func invoke(command: NodeCommand) async throws -> NodeResult
}
```

### VoiceWakeService

```swift
class VoiceWakeService: ObservableObject {
    @Published var isEnabled: Bool
    @Published var wakePhrase: String
    @Published var sensitivity: Float

    // 控制方法
    func start() async throws
    func stop() async

    // 配置
    func setWakePhrase(_ phrase: String)
    func setSensitivity(_ level: Float)
}
```

### TalkModeService

```swift
class TalkModeService: ObservableObject {
    @Published var isActive: Bool
    @Published var isListening: Bool

    // 控制方法
    func activate() async
    func deactivate()

    // 语音输入
    func startListening()
    func stopListening()
}
```

## 关键依赖与配置

### 核心依赖

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0"),
    .package(url: "https://github.com/apple/swift-log", from: "1.0.0")
]
```

### 系统框架

- **SwiftUI**：用户界面
- **Combine**：响应式数据流
- **Foundation**：基础功能
- **AVFoundation**：音频处理
- **Speech**：语音识别
- **Network**：网络通信

### 权限要求

应用需要以下 macOS 权限（在 `Info.plist` 中声明）：

```xml
<key>NSMicrophoneUsageDescription</key>
<string>需要麦克风访问以进行语音唤醒和对话</string>

<key>NSCameraUsageDescription</key>
<string>需要相机访问以拍照和录像</string>

<key>NSScreenCaptureDescription</key>
<string>需要屏幕录制权限以录制屏幕</string>

<key>com.apple.security.device.audio-input</key>
<true/>

<key>com.apple.security.device.camera</key>
<true/>

<key>com.apple.security.network.client</key>
<true/>

<key>com.apple.security.network.server</key>
<true/>
```

## 数据模型

### GatewayStatus

```swift
struct GatewayStatus: Codable {
    let isRunning: Bool
    let port: Int
    let bind: String
    let uptime: TimeInterval
    let version: String
    let channels: [ChannelStatus]
}
```

### NodeCapabilities

```swift
struct NodeCapabilities: Codable {
    let platform: String
    let version: String
    let features: [String]  // 如 ["camera", "screen", "system"]
}
```

### NodeCommand

```swift
struct NodeCommand: Codable {
    let tool: String  // 如 "camera.snap", "screen.record"
    let params: [String: AnyCodable]
}
```

### MenuBarState

```swift
struct MenuBarState {
    var gatewayStatus: GatewayStatus?
    var nodeStatus: NodeStatus?
    var voiceWakeEnabled: Bool
    var talkModeActive: Bool
    var unreadMessages: Int
}
```

### LogEntry

```swift
struct LogEntry: Identifiable {
    let id: UUID
    let timestamp: Date
    let level: LogLevel
    let message: String
    let source: String
}
```

## 测试与质量

### 手动测试

macOS 应用主要通过手动测试：

1. **功能测试**：在真实 macOS 系统上测试所有功能
2. **权限测试**：验证所有权限请求和授予流程
3. **集成测试**：与 Gateway 和节点的端到端测试
4. **性能测试**：内存使用、CPU 占用、电池影响

### 测试清单

- [ ] Gateway 启动/停止
- [ ] 节点配对和连接
- [ ] Voice Wake 识别
- [ ] Talk Mode 对话
- [ ] WebChat 加载
- [ ] 相机拍照/录像
- [ ] 屏幕录制
- [ ] 系统命令执行
- [ ] 日志查看
- [ ] 远程 Gateway 控制

### 构建和运行

```bash
# 1. 生成 Xcode 项目
cd apps/macos
xcodegen generate
open Clawdbot.xcodeproj

# 2. 在 Xcode 中构建
# Product > Build (⌘+B)

# 3. 运行
# Product > Run (⌘+R)

# 或使用脚本
cd ../../
pnpm mac:restart
pnpm mac:open
```

## 常见问题 (FAQ)

### Q: 如何授予应用必要的权限？

A: 首次使用功能时，系统会提示授予权限：

- **麦克风**：Voice Wake / Talk Mode
- **相机**：拍照/录像
- **屏幕录制**：屏幕录制
- **辅助功能**：系统自动化（可选）

在"系统设置 > 隐私与安全性"中管理权限。

### Q: 如何启用 Voice Wake？

A: 在菜单栏中选择"Enable Voice Wake"，然后说出唤醒短语（默认"Hey Clawdbot"）。

可以在设置中自定义唤醒短语和灵敏度。

### Q: 如何使用 Talk Mode？

A: 点击菜单栏中的"Talk Mode"或使用快捷键（默认 ⌘+Shift+T），对话覆盖层会出现。

按住空格键说话，释放后发送消息。

### Q: 如何连接到远程 Gateway？

A: 在设置中配置远程 Gateway URL，或使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 user@remote-host
```

然后在应用中连接到 `ws://127.0.0.1:18789`。

### Q: 如何查看日志？

A: 在菜单栏中选择"Logs"，打开日志查看器。或使用命令行：

```bash
./scripts/clawlog.sh --follow
```

## 相关文件清单

### 应用入口

- `Sources/Clawdbot/App.swift` - 应用入口
- `Sources/Clawdbot/ClawdbotApp.swift` - App 结构
- `Sources/Clawdbot/ContentView.swift` - 主视图

### 菜单栏

- `Sources/Clawdbot/MenuBar/MenuBarView.swift` - 菜单栏视图
- `Sources/Clawdbot/MenuBar/MenuBarExtra.swift` - 菜单栏额外组件

### 服务

- `Sources/Clawdbot/Services/GatewayService.swift` - Gateway 服务
- `Sources/Clawdbot/Services/NodeService.swift` - 节点服务
- `Sources/Clawdbot/Services/VoiceWakeService.swift` - 语音唤醒服务
- `Sources/Clawdbot/Services/TalkModeService.swift` - 对话模式服务

### 视图

- `Sources/Clawdbot/Views/GatewayStatusView.swift` - Gateway 状态视图
- `Sources/Clawdbot/Views/NodeStatusView.swift` - 节点状态视图
- `Sources/Clawdbot/Views/VoiceWakeView.swift` - 语音唤醒视图
- `Sources/Clawdbot/Views/TalkModeView.swift` - 对话模式视图
- `Sources/Clawdbot/Views/WebChatView.swift` - WebChat 视图
- `Sources/Clawdbot/Views/LogsView.swift` - 日志视图
- `Sources/Clawdbot/Views/SettingsView.swift` - 设置视图

### 节点功能

- `Sources/Clawdbot/Node/NodeClient.swift` - 节点客户端
- `Sources/Clawdbot/Node/NodeHandlers.swift` - 节点处理器
- `Sources/Clawdbot/Node/CameraHandler.swift` - 相机处理器
- `Sources/Clawdbot/Node/ScreenHandler.swift` - 屏幕处理器
- `Sources/Clawdbot/Node/SystemHandler.swift` - 系统处理器

### 共享代码

- `Sources/Clawdbot/Shared/Extensions.swift` - Swift 扩展
- `Sources/Clawdbot/Shared/Utils.swift` - 工具函数
- `Sources/Clawdbot/Shared/Constants.swift` - 常量定义

### 资源

- `Sources/Clawdbot/Resources/Assets.xcassets` - 资源目录
- `Sources/Clawdbot/Resources/Info.plist` - 应用配置

### 配置

- `project.yml` - XcodeGen 配置
- `.swiftformat` - SwiftFormat 配置
- `.swiftlint.yml` - SwiftLint 配置

## 变更记录 (Changelog)

### 2026-01-25 16:21:01 - 初始化文档

**扫描结果**
- ✅ 完成模块结构扫描
- ✅ 识别 30+ Swift 文件
- ✅ 识别核心服务和视图
- ✅ 分析配置和依赖关系
- ✅ 收集权限和构建要求

**覆盖率**
- 文件数：35
- 测试文件：0 (手动测试)
- 文档完整性：100%
