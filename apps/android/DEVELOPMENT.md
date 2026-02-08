# Android 开发指南

[根目录](../../CLAUDE.md) > [apps](../CLAUDE.md) > **android**

## 概述

OpenClaw Android 是一个现代 Kotlin + Jetpack Compose 应用，提供 Canvas 渲染、Talk Mode、相机/屏幕录制功能。应用通过 WebSocket 连接到 Gateway，并使用 NSD 进行本地网络发现。

## 开发环境

### 系统要求

- **JDK**: 17+
- **Android SDK**: 33+ (Android 13+)
- **Kotlin**: 2.2.21+
- **Gradle**: 8.13.2+

### 必需工具

```bash
# 安装 Android Studio
# 下载: https://developer.android.com/studio

# 或使用命令行工具
brew install --cask android-studio

# 设置 ANDROID_SDK_ROOT (默认)
export ANDROID_SDK_ROOT=~/Library/Android/sdk
# 或
export ANDROID_HOME=~/Library/Android/sdk
```

### 验证安装

```bash
# 检查 Java
java -version

# 检查 Android SDK
echo $ANDROID_SDK_ROOT

# 检查 Gradle
./gradlew --version
```

## 项目结构

```
apps/android/
├── app/                        # 应用模块
│   └── src/
│       └── main/
│           ├── java/ai/openclaw/android/
│           │   ├── MainActivity.kt       # 主 Activity
│           │   ├── MainViewModel.kt      # 主 ViewModel
│           │   ├── NodeRuntime.kt        # 节点运行时
│           │   ├── GatewayClient.kt      # Gateway 客户端
│           │   ├── GatewayService.kt     # Gateway 后台服务
│           │   ├── tools/                # 工具实现
│           │   └── ui/                   # UI 组件
│           │       ├── RootScreen.kt     # 根屏幕
│           │       ├── TalkOrbOverlay.kt # Talk 覆盖层
│           │       ├── CameraHudOverlay.kt # 相机 HUD
│           │       ├── ChatSheet.kt      # 聊天面板
│           │       ├── SettingsSheet.kt  # 设置面板
│           │       └── ...
│           ├── res/                     # 资源文件
│           │   ├── drawable/
│           │   ├── values/
│           │   └── ...
│           └── AndroidManifest.xml      # 应用清单
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
├── build.gradle.kts            # 项目级构建配置
├── settings.gradle.kts         # 设置配置
├── gradle.properties           # Gradle 属性
├── gradlew                     # Gradle 包装脚本
├── gradlew.bat                 # Windows 包装脚本
└── README.md                   # 项目说明
```

## 快速开始

### 1. 打开项目

```bash
# 使用 Android Studio
open -a "Android Studio" apps/android

# 或使用命令行
cd apps/android
./gradlew :app:assembleDebug
```

### 2. 同步 Gradle

Android Studio 会自动同步，或手动：
```bash
./gradlew --refresh-dependencies
```

### 3. 运行应用

**在 Android Studio 中**:
1. 选择设备（模拟器或真机）
2. 点击 Run 按钮 (▶️)

**命令行**:
```bash
# 安装到设备
./gradlew :app:installDebug

# 或指定设备
./gradlew :app:installDebug -PdeviceId=<device-id>
```

## 依赖管理

### 核心依赖

```kotlin
// build.gradle.kts (app 模块)
dependencies {
  // Compose
  implementation(platform("androidx.compose:compose-bom:2024.12.01"))
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.ui:ui-tooling-preview")
  implementation("androidx.compose.material3:material3")

  // Lifecycle
  implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
  implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

  // Navigation
  implementation("androidx.navigation:navigation-compose:2.8.5")

  // Coroutines
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

  // OkHttp (WebSocket)
  implementation("com.squareup.okhttp3:okhttp:4.12.0")

  // Kotlin Serialization
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
```

### 添加新依赖

在 `app/build.gradle.kts` 中添加：

```kotlin
dependencies {
  implementation("com.example:library:1.0.0")
}
```

然后同步 Gradle。

## 构建和运行

### 构建变体

| 变体 | 用途 | 签名 |
|------|------|------|
| `debug` | 开发调试 | Debug 签名 |
| `release` | 生产发布 | Release 签名 |

### 构建命令

```bash
# 构建 Debug APK
./gradlew :app:assembleDebug

# 构建 Release APK
./gradlew :app:assembleRelease

# 构建 App Bundle (推荐用于发布)
./gradlew :app:bundleRelease

# 查看构建产物
ls -lh app/build/outputs/apk/debug/
```

### 安装到设备

```bash
# 安装 Debug 版本
./gradlew :app:installDebug

# 安装到特定设备
adb devices
./gradlew :app:installDebug -PdeviceId=<device-id>

# 卸载
./gradlew :app:uninstallDebug
```

## 测试

### 单元测试

```kotlin
// app/src/test/java/ai/openclaw/android/ExampleTest.kt
class ExampleTest {
  @Test
  fun testExample() {
    assertEquals(4, 2 + 2)
  }
}
```

### 运行测试

```bash
# 单元测试
./gradlew :app:testDebugUnitTest

# 带覆盖率
./gradlew :app:testDebugUnitTestCoverage

# 查看报告
open app/build/reports/tests/testDebugUnitTest/index.html
```

### Instrumented 测试

```kotlin
// app/src/androidTest/java/ai/openclaw/android/ExampleInstrumentedTest.kt
@RunWith(AndroidJUnit4::class)
class ExampleInstrumentedTest {
  @Test
  fun useAppContext() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    assertEquals("ai.openclaw.android", context.packageName)
  }
}
```

### UI 测试 (Compose)

```bash
# 运行 UI 测试
./gradlew :app:connectedDebugAndroidTest
```

## 开发工作流

### 1. 代码风格

项目使用 ktlint：

```bash
# 检查格式
./gradlew ktlintCheck

# 自动格式化
./gradlew ktlintFormat
```

### 2. Lint

```bash
# 运行 Lint
./gradlew lint

# 查看 Lint 报告
open app/build/reports/lint-results-debug.html
```

### 3. 添加新功能

**添加新 Composable**:
```kotlin
@Composable
fun NewFeatureScreen(
  viewModel: MainViewModel = viewModel()
) {
  val uiState by viewModel.uiState.collectAsState()

  Column {
    Text("New Feature")
    // UI 组件
  }
}
```

**添加新工具方法**:
在 `tools/` 目录创建工具文件，实现 Gateway 方法。

### 4. 调试技巧

**使用 Logcat**:
```kotlin
import android.util.Log

private const val TAG = "OpenClaw"

Log.d(TAG, "Debug message")
Log.e(TAG, "Error message", exception)
```

**使用 Android Studio Debugger**:
1. 设置断点
2. 点击 Debug 按钮 (🐛)
3. 使用调试工具

**查看数据库**:
```bash
adb shell
run-as ai.openclaw.android
cat databases/app.db
```

## Gateway 集成

### 连接到 Gateway

```kotlin
class GatewayClient(
  private val context: Context
) {
  private val client = OkHttpClient.Builder()
    .readTimeout(0, TimeUnit.MILLISECONDS)
    .build()

  fun connect(url: String, token: String) {
    val request = Request.Builder()
      .url(url)
      .addHeader("Authorization", "Bearer $token")
      .build()

    val ws = client.newWebSocket(request, object : WebSocketListener() {
      override fun onMessage(ws: WebSocket, text: String) {
        // 处理消息
      }
    })
  }
}
```

### NSD 服务发现

```kotlin
class NsdDiscovery(private val context: Context) {
  private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager

  fun discover() {
    nsdManager.discoverServices("_openclaw-gw._tcp", NsdManager.PROTOCOL_DNS_SD, discoveryListener)
  }

  private val discoveryListener = object : NsdManager.DiscoveryListener {
    override fun onServiceFound(serviceInfo: NsdServiceInfo) {
      // 解析服务
      nsdManager.resolveService(serviceInfo, resolveListener)
    }
    // ...
  }
}
```

### 后台服务

```kotlin
class GatewayService : Service() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIFICATION_ID, createNotification())
    // 保持连接
    return START_STICKY
  }

  override fun onDestroy() {
    scope.cancel()
    super.onDestroy()
  }
}
```

## 权限配置

### AndroidManifest.xml 权限

```xml
<!-- 网络服务发现 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

<!-- Android 13+ (API 33+) -->
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />

<!-- Android 12 及以下 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

<!-- 前台服务 -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- 相机 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera.any" android:required="false" />

<!-- 麦克风 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### 运行时权限请求

```kotlin
val cameraPermission = rememberPermissionState(android.Manifest.permission.CAMERA)

LaunchedEffect(Unit) {
  cameraPermission.launchPermissionRequest()
}

if (cameraPermission.status.isGranted) {
  // 使用相机
}
```

## 发布

### 构建 Release APK

```bash
# 设置签名配置
# 在 app/build.gradle.kts 中配置

# 构建
./gradlew :app:assembleRelease
```

### 签名配置

```kotlin
// app/build.gradle.kts
android {
  signingConfigs {
    create("release") {
      storeFile = file("path/to/keystore.jks")
      storePassword = "keystore-password"
      keyAlias = "release-key"
      keyPassword = "key-password"
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
      isMinifyEnabled = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
    }
  }
}
```

### 上传到 Play Console

1. 构建 App Bundle:
```bash
./gradlew :app:bundleRelease
```

2. 上传 `app/build/outputs/bundle/release/app-release.aab` 到 Play Console

## 常见问题

### Q: Gradle 同步失败？

A: 尝试：
```bash
./gradlew --stop
./gradlew clean
./gradlew --refresh-dependencies
```

### Q: 无法连接到 Gateway？

A: 检查：
1. 设备在同一网络
2. 防火墙允许本地连接
3. Gateway 正在运行
4. 权限已授予

### Q: NSD 发现不工作？

A: 确保：
1. Android 13+ 使用 `NEARBY_WIFI_DEVICES`
2. Android 12 及以下需要位置权限
3. 设备不是飞行模式

### Q: 如何清理构建？

A:
```bash
./gradlew clean
# 或
rm -rf app/build/
```

## 相关资源

### 文档
- [Android 开发者文档](https://developer.android.com/)
- [Jetpack Compose 文档](https://developer.android.com/jetpack/compose)
- [Kotlin 文档](https://kotlinlang.org/docs/)

### 工具
- [Android Studio](https://developer.android.com/studio)
- [OkHttp](https://square.github.io/okhttp/)
- [Kotlinx Serialization](https://github.com/Kotlin/kotlinx.serialization)

## 变更记录

### 2026-02-08 - 创建 Android 开发指南
- ✅ 创建 `apps/android/DEVELOPMENT.md`
- 📋 添加环境设置和项目结构
- 🔧 补充构建和调试指南
- ❓ 添加常见问题解答
