# 原生应用模块 (apps/)

[根目录](../CLAUDE.md) > **apps**

## 模块职责

跨平台原生应用，提供 macOS、iOS 和 Android 上的 OpenClaw 节点功能。

## 目录结构

```
apps/
├── macos/              # macOS 应用
│   ├── Sources/
│   │   ├── Clawdbot/           # 主应用
│   │   ├── OpenClawProtocol/   # 协议定义
│   │   ├── OpenClawKit/        # 共享库
│   │   └── MoltbotKit/         # 兼容库
│   ├── .swiftformat
│   ├── .swiftlint.yml
│   └── README.md
├── ios/                # iOS 节点
│   ├── Sources/
│   │   ├── Assets.xcassets/
│   │   └── Clawdbot/
│   ├── fastlane/
│   ├── Package.swift
│   └── README.md
└── android/            # Android 节点
    ├── app/
    │   └── src/main/
    │       ├── java/com/clawdbot/android/
    │       ├── res/
    │       └── AndroidManifest.xml
    ├── gradle/
    ├── build.gradle.kts
    └── README.md
```

## 入口与启动

### macOS 应用
- **入口**: `apps/macos/Sources/Clawdbot/App.swift`
- **启动**: 双击 `dist/OpenClaw.app` 或使用 `scripts/restart-mac.sh`
- **要求**: macOS 15+, Swift 6.2+

### iOS 节点
- **入口**: `apps/ios/Sources/Clawdbot/App.swift`
- **启动**: 从 Xcode 运行或部署到设备
- **要求**: iOS 17+, SwiftUI

### Android 节点
- **入口**: `apps/android/app/src/main/java/com/clawdbot/android/MainActivity.kt`
- **启动**: 从 Android Studio 运行或安装 APK
- **要求**: Android 13+ (API 33+), Kotlin

## 对外接口

### macOS 应用接口
```swift
// 应用入口
class ClawdbotApp: App {
    // 菜单栏控制
    // 语音唤醒
    // Talk Mode
}

// 网关服务
class GatewayService {
    func connect(to: URL)
    func disconnect()
}
```

### iOS 节点接口
```swift
// 应用入口
struct ClawdbotApp: App {
    // Canvas 渲染
    // 语音唤醒
    // 相机/屏幕录制
}

// 网关客户端
class GatewayClient {
    func connect(to: URL)
    func send(message: Data)
}
```

### Android 节点接口
```kotlin
// 主活动
class MainActivity : AppCompatActivity() {
    // Canvas 渲染
    // Talk Mode
    // 相机/屏幕录制
}

// 网关服务
class GatewayService : Service() {
    fun connect(url: String)
    fun send(message: Data)
}
```

## 关键依赖与配置

### macOS 依赖
- **Swift**: 6.2+
- **Speech.framework**: macOS 26+ (语音唤醒)
- **Sparkle**: 自动更新
- **Swabble**: 语音唤醒守护进程

### iOS 依赖
- **SwiftUI**: iOS 17+
- **SwiftPM**: 包管理
- **MultipeerConnectivity**: 设备发现

### Android 依赖
- **Kotlin**: 1.9+
- **Jetpack Compose**: UI 框架
- **Coroutines**: 异步处理
- **OkHttp**: WebSocket 客户端

## 平台详解

### 1. macOS 应用 (`macos/`)

**职责**：菜单栏控制平面，语音唤醒，Talk Mode

**关键功能**：
- 菜单栏控制界面
- 网关连接管理
- 语音唤醒集成（通过 Swabble）
- Talk Mode 覆盖层
- WebChat 集成
- 调试工具
- 远程网关控制

**开发**：
```bash
# 快速运行
scripts/restart-mac.sh

# 构建
scripts/package-mac-app.sh

# 代码签名
scripts/codesign-mac-app.sh
```

**要求**：
- SwiftFormat (格式化)
- SwiftLint (Lint)
- Xcode (构建)

### 2. iOS 节点 (`ios/`)

**职责**：移动节点，Canvas，语音唤醒，相机/屏幕录制

**关键功能**：
- Canvas 渲染
- 语音唤醒（Speech.framework）
- Talk Mode
- 相机拍照/录制
- 屏幕录制
- Bonjour 设备发现
- 网关配对

**开发**：
```bash
# 生成 Xcode 项目
cd apps/ios
xcodegen generate
open OpenClaw.xcodeproj

# 构建
xcodebuild -project OpenClaw.xcodeproj -scheme OpenClaw build

# 测试
xcodebuild test -project OpenClaw.xcodeproj -scheme OpenClaw
```

**要求**：
- Xcode 15+
- iOS 17+ SDK
- SwiftFormat + SwiftLint

**Fastlane**：
```bash
cd apps/ios
fastlane lanes
```

### 3. Android 节点 (`android/`)

**职责**：移动节点，Canvas，Talk Mode，相机/屏幕录制

**关键功能**：
- Canvas 渲染
- Talk Mode
- 相机拍照/录制
- 屏幕录制
- NSD 服务发现
- 前台服务（持久通知）
- 网关配对

**开发**：
```bash
# 构建
cd apps/android
./gradlew :app:assembleDebug

# 安装
./gradlew :app:installDebug

# 测试
./gradlew :app:testDebugUnitTest
```

**要求**：
- Android Studio
- Android SDK 33+
- Kotlin 1.9+

**权限**：
- `NEARBY_WIFI_DEVICES` (Android 13+)
- `ACCESS_FINE_LOCATION` (Android 12 及以下)
- `POST_NOTIFICATIONS` (Android 13+)
- `CAMERA`
- `RECORD_AUDIO`

## 测试与质量

### macOS
- **单元测试**: Swift Testing
- **代码覆盖率**: N/A
- **Lint**: SwiftLint
- **格式化**: SwiftFormat

### iOS
- **单元测试**: XCTest
- **UI 测试**: XCUITest
- **代码覆盖率**: N/A
- **Lint**: SwiftLint
- **格式化**: SwiftFormat

### Android
- **单元测试**: JUnit
- **UI 测试**: Espresso
- **代码覆盖率**: JaCoCo
- **Lint**: Android Lint
- **格式化**: ktlint

## 常见问题 (FAQ)

### Q: 如何在 macOS 上启用代码签名？
A: 使用 `scripts/codesign-mac-app.sh` 或设置 `SIGN_IDENTITY` 环境变量。

### Q: 如何配置 iOS 开发证书？
A: 参考 `apps/ios/fastlane/SETUP.md`。

### Q: Android SDK 路径如何配置？
A: 设置 `ANDROID_SDK_ROOT` 或 `ANDROID_HOME` 环境变量，默认为 `~/Library/Android/sdk`。

### Q: 如何启用语音唤醒？
A: macOS 上需要安装并运行 Swabble 守护进程。

## 相关文件清单

### macOS
- `apps/macos/Sources/Clawdbot/App.swift`
- `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`
- `apps/macos/Sources/OpenClawKit/`
- `apps/macos/README.md`

### iOS
- `apps/ios/Sources/Clawdbot/App.swift`
- `apps/ios/Sources/Clawdbot/GatewayClient.swift`
- `apps/ios/README.md`
- `apps/ios/fastlane/SETUP.md`

### Android
- `apps/android/app/src/main/java/com/clawdbot/android/MainActivity.kt`
- `apps/android/app/src/main/java/com/clawdbot/android/GatewayService.kt`
- `apps/android/README.md`

## 变更记录

### 2026-02-08 - 初始化原生应用文档
- ✅ 创建 `apps/CLAUDE.md` 文档
- 📋 记录三个平台的应用
- 🔗 建立平台导航结构


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>