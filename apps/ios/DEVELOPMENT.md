# iOS 开发指南

[根目录](../../CLAUDE.md) > [apps](../CLAUDE.md) > **ios**

## 概述

OpenClaw iOS 是一个 SwiftUI 应用，提供 Canvas 渲染、语音唤醒、相机/屏幕录制和 Talk Mode 功能。应用通过 WebSocket 连接到 Gateway，并使用 Bonjour 进行本地网络发现。

## 开发环境

### 系统要求

- **macOS**: 15.0+ (Sequoia)
- **Xcode**: 16.0+
- **iOS SDK**: 18.0+
- **Swift**: 6.0+

### 必需工具

```bash
# 安装 Xcode 命令行工具
xcode-select --install

# 安装 SwiftFormat 和 SwiftLint
brew install swiftformat swiftlint

# 安装 xcodegen (项目生成)
brew install xcodegen

# 安装 fastlane (可选，用于发布)
brew install fastlane
```

## 项目结构

```
apps/ios/
├── Sources/                    # 源代码
│   ├── OpenClawApp.swift       # 应用入口
│   ├── RootCanvas.swift        # Canvas 根视图
│   ├── RootTabs.swift          # 标签页视图
│   ├── Gateway/                # Gateway 客户端
│   │   ├── GatewayClient.swift
│   │   ├── GatewayModels.swift
│   │   └── GatewayProtocol.swift
│   ├── Chat/                   # 聊天功能
│   ├── Camera/                 # 相机功能
│   ├── Voice/                  # 语音功能
│   ├── Screen/                 # 屏幕录制
│   ├── Location/               # 位置服务
│   ├── Settings/               # 设置界面
│   ├── Status/                 # 状态显示
│   ├── Model/                  # 数据模型
│   └── Assets.xcassets/        # 资源文件
├── Tests/                      # 单元测试
├── fastlane/                   # Fastlane 配置
├── project.yml                 # XcodeGen 配置
├── Package.swift               # Swift Package Manager
├── SwiftSources.input.xcfilelist
├── .swiftformat                # SwiftFormat 配置
└── .swiftlint.yml              # SwiftLint 配置
```

## 快速开始

### 1. 生成 Xcode 项目

```bash
cd apps/ios
xcodegen generate
```

这会根据 `project.yml` 生成 `OpenClaw.xcodeproj`。

### 2. 打开项目

```bash
open OpenClaw.xcodeproj
# 或
xed .
```

### 3. 选择运行目标

在 Xcode 中：
- 选择目标设备（iPhone 模拟器或真机）
- 选择 `OpenClaw` scheme
- 点击 Run (⌘R)

## 依赖管理

### Swift Package Manager

项目使用 SPM 管理依赖：

| 包 | 产品 | 用途 |
|---|------|------|
| **OpenClawKit** | OpenClawKit | 共享类型和常量 |
| **OpenClawKit** | OpenClawChatUI | 聊天 UI 组件 |
| **OpenClawKit** | OpenClawProtocol | 协议定义 |
| **Swabble** | SwabbleKit | 语音唤醒 |

### 添加新依赖

在 `project.yml` 中添加：

```yaml
packages:
  NewPackage:
    url: https://github.com/user/package
    version: 1.0.0

targets:
  OpenClaw:
    dependencies:
      - package: NewPackage
        product: MyProduct
```

然后重新运行 `xcodegen generate`。

## 构建和运行

### 命令行构建

```bash
# 列出可用 scheme
xcodebuild -project OpenClaw.xcodeproj -list

# 构建 Debug 版本
xcodebuild -project OpenClaw.xcodeproj \
  -scheme OpenClaw \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# 构建 Release 版本
xcodebuild -project OpenClaw.xcodeproj \
  -scheme OpenClaw \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS'
```

### 运行测试

```bash
# 在 Xcode 中运行测试
# 或使用命令行

xcodebuild test \
  -project OpenClaw.xcodeproj \
  -scheme OpenClaw \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
```

### 代码签名

**开发签名** (已配置):
```yaml
CODE_SIGN_IDENTITY: "Apple Development"
CODE_SIGN_STYLE: Manual
DEVELOPMENT_TEAM: Y5PE65HELJ
```

**发布签名**:
1. 在 Apple Developer 创建发布证书
2. 创建 App Store 配置文件
3. 在 `project.yml` 中更新配置

## 开发工作流

### 1. 代码格式化

项目在构建时自动检查代码格式：

```bash
# 手动格式化代码
swiftformat --config ../../.swiftformat \
  --filelist SwiftSources.input.xcfilelist

# 检查格式（不修改）
swiftformat --lint --config ../../.swiftformat \
  --filelist SwiftSources.input.xcfilelist
```

### 2. 代码检查

```bash
# 运行 SwiftLint
swiftlint lint --config .swiftlint.yml \
  --use-script-input-file-lists \
  --filelist SwiftSources.input.xcfilelist
```

### 3. 添加新功能

**添加新视图**:
```swift
// Sources/NewFeature/NewFeatureView.swift
import SwiftUI

struct NewFeatureView: View {
  var body: some View {
    Text("New Feature")
  }
}
```

**添加新设置**:
1. 在 `Settings/` 创建设置视图
2. 在 `RootTabs` 中添加标签
3. 更新 `Info.plist` 权限（如需要）

### 4. 调试技巧

**查看日志**:
```swift
import os.log

let log = OSLog(subsystem: "ai.openclaw.ios", category: "Gateway")
os_log("Connected to gateway", log: log, type: .info)
```

**使用 Console.app**:
1. 连接 iOS 设备
2. 打开 Console.app
3. 选择设备
4. 过滤 "OpenClaw"

**断点调试**:
- 在 Xcode 中设置断点
- 使用 LLDB 命令:
  - `po variable` - 打印变量
  - `expr variable = value` - 修改变量
  - `bt` - 打印调用栈

## Gateway 集成

### 连接到 Gateway

```swift
import Foundation
import OpenClawProtocol

class GatewayClient: ObservableObject {
  @Published var isConnected = false

  func connect(to url: URL) async throws {
    // WebSocket 连接逻辑
  }
}
```

### Bonjour 发现

```swift
import Network

class BonjourDiscovery {
  let browser = NWBrowser(for: .bonjour(
    type: "_openclaw-gw._tcp",
    domain: nil
  ))

  func startDiscovery() {
    browser.start(queue: .main)
  }
}
```

### 处理 Gateway 消息

```swift
func handleMessage(_ frame: GatewayFrame) {
  switch frame {
  case .event(let eventFrame):
    handleEvent(eventFrame)
  case .response(let responseFrame):
    handleResponse(responseFrame)
  default:
    break
  }
}
```

## 权限配置

### Info.plist 权限

| 权限 | Key | 用途 |
|------|-----|------|
| 本地网络 | `NSLocalNetworkUsageDescription` | Bonjour 发现 |
| Bonjour 服务 | `NSBonjourServices` | `_openclaw-gw._tcp` |
| 相机 | `NSCameraUsageDescription` | 拍照/录制 |
| 麦克风 | `NSMicrophoneUsageDescription` | 语音唤醒 |
| 语音识别 | `NSSpeechRecognitionUsageDescription` | 语音识别 |
| 位置 | `NSLocationWhenInUseUsageDescription` | 位置共享 |
| 后台位置 | `NSLocationAlwaysAndWhenInUseUsageDescription` | 后台位置 |
| 后台音频 | `UIBackgroundModes` - `audio` | 后台音频 |

### 添加新权限

在 `project.yml` 的 `info.properties` 中添加：

```yaml
NSNewPermissionUsageDescription: OpenClaw needs permission for feature X.
```

## 测试

### 单元测试

```swift
import XCTest
@testable import OpenClaw

final class OpenClawTests: XCTestCase {
  func testExample() throws {
    // 测试代码
  }
}
```

### UI 测试

```swift
import XCTest

final class OpenClawUITests: XCTestCase {
  func testLaunch() throws {
    let app = XCUIApplication()
    app.launch()
  }
}
```

### 运行测试

```bash
# 运行所有测试
xcodebuild test -scheme OpenClaw

# 运行特定测试
xcodebuild test -scheme OpenClaw -only-testing:OpenClawTests/OpenClawTests/testExample
```

## 发布

### 使用 Fastlane

```bash
cd apps/ios
fastlane lanes
```

### 可用 Lanes

参考 `fastlane/SETUP.md`：
- `beta` - 发布 TestFlight
- `release` - 发布 App Store
- `screenshots` - 生成截图
- `metadata` - 更新元数据

### 版本管理

在 `project.yml` 中更新版本：

```yaml
info:
  properties:
    CFBundleShortVersionString: "2026.2.7"
    CFBundleVersion: "20260203"
```

## 常见问题

### Q: Xcode 无法找到 SwiftFormat？

A: 确保 SwiftFormat 在 PATH 中：
```bash
which swiftformat
# 如果不存在
brew install swiftformat
```

### Q: 真机调试失败？

A: 检查：
1. 开发者证书是否有效
2. 设备是否信任开发者证书
3. Bundle ID 是否唯一

### Q: Bonjour 发现不工作？

A: 确保：
1. 设备在同一网络
2. 防火墙允许本地网络
3. Info.plist 包含 `NSBonjourServices`

### Q: 如何清理构建？

A:
```bash
# Xcode 菜单: Product > Clean Build Folder (⇧⌘K)
# 或
rm -rf ~/Library/Developer/Xcode/DerivedData/OpenClaw-*
```

## 相关资源

### 文档
- [SwiftUI 文档](https://developer.apple.com/documentation/swiftui)
- [Swift Package Manager](https://swift.org/package-manager/)
- [XcodeGen 文档](https://github.com/yonaskolb/XcodeGen)

### 工具
- [SwiftFormat](https://github.com/nicklockwood/SwiftFormat)
- [SwiftLint](https://github.com/realm/SwiftLint)
- [Fastlane](https://fastlane.tools/)

## 变更记录

### 2026-02-08 - 创建 iOS 开发指南
- ✅ 创建 `apps/ios/DEVELOPMENT.md`
- 📋 添加环境设置和项目结构
- 🔧 补充构建和调试指南
- ❓ 添加常见问题解答
