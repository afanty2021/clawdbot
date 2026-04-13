# 🤖 IMA 文章链接提取工具 v2.0 - 完整使用指南

> **稳定可靠的自动化提取系统**
>
> 更新时间：2026-04-13
> 版本：2.0.0

---

## 🎯 核心特性

### ✅ 已实现的高级功能

| 功能 | 说明 | 优势 |
|------|------|------|
| **多策略自动切换** | 3种提取策略自动尝试 | 提高成功率，降低失败率 |
| **智能重试机制** | 失败自动重试，最多3次 | 容错性强，稳定可靠 |
| **进度自动保存** | 实时保存提取进度 | 支持断点续传，不怕中断 |
| **详细日志记录** | 记录所有操作和错误 | 便于调试和问题追踪 |
| **去重机制** | 自动跳过已提取文章 | 避免重复，提高效率 |
| **批次处理** | 分批提取，定期保存 | 数据安全，进度可控 |

---

## 🚀 快速开始

### 方法 1: 交互式菜单（推荐）

```bash
cd /Users/berton/Github/OpenClaw
./ima-extractor.sh
```

**操作流程**：
1. 检查依赖和状态
2. 选择操作（查看状态、开始提取、恢复提取等）
3. 按照提示完成操作

### 方法 2: 命令行直接运行

```bash
# 提取 1800 篇文章，批次大小 10
./ima-extractor.sh 1800 10

# 提取 100 篇文章，批次大小 5
./ima-extractor.sh 100 5
```

---

## 📋 使用前准备

### 1. 环境要求

```bash
# 检查 Node.js（需要 >= 18）
node --version

# 检查 tsx（如果没有会自动安装）
npx tsx --version

# 检查 ima.copilot 是否运行
pgrep -x "ima.copilot"
```

### 2. 首次运行

首次运行时，脚本会自动：
- ✅ 检查并安装依赖（tsx）
- ✅ 检查 ima.copilot 运行状态
- ✅ 创建必要的状态文件和日志文件
- ✅ 加载已有的提取进度（如果有）

### 3. 手动准备（可选）

如果需要完全自动化：
1. 打开 ima.copilot
2. 点击左侧导航栏的「知识库」图标
3. 选择目标知识库（如「AI」）
4. 确保文章列表可见

---

## 🎮 交互式菜单说明

### 菜单选项

```
请选择操作：

  1) 查看状态
  2) 开始提取
  3) 恢复上次提取
  4) 清除状态重新开始
  5) 查看日志
  6) 导出结果
  0) 退出
```

### 1. 查看状态

显示当前的提取进度：
- 已提取文章数量
- 目标数量和完成百分比
- 最近提取的文章列表

### 2. 开始提取

启动新的提取任务：
- 输入目标文章数量（默认 1800）
- 输入批次大小（默认 10）
- 确认后开始自动提取

### 3. 恢复上次提取

从上次中断的地方继续提取：
- 自动加载状态文件
- 从上次停止的位置继续
- 保留已提取的所有数据

### 4. 清除状态重新开始

清除所有进度和状态：
- 删除状态文件 `ima-extractor-state.json`
- 删除结果文件 `ima-extracted-articles.json`
- 从头开始新的提取

### 5. 查看日志

查看详细的操作日志：
- 所有操作记录
- 错误和警告信息
- 调试信息

### 6. 导出结果

导出提取的文章链接：
- **CSV 格式** - 包含索引、标题、URL
- **纯链接列表** - 仅 URL，每行一个
- **Markdown 格式** - 带标题的链接列表

---

## 🔧 高级配置

### 修改配置常量

编辑 `ima-extractor-core.ts` 中的 `CONFIG` 对象：

```typescript
const CONFIG = {
  // 文件路径
  STATE_FILE: 'ima-extractor-state.json',
  RESULT_FILE: 'ima-extracted-articles.json',
  LOG_FILE: 'ima-extractor.log',

  // 重试配置
  MAX_RETRIES: 3,              // 最大重试次数
  RETRY_DELAY_MS: 2000,         // 重试延迟（毫秒）
  OPERATION_TIMEOUT_MS: 10000,  // 操作超时（毫秒）

  // 批量配置
  BATCH_SIZE: 10,               // 默认批次大小
  SAVE_INTERVAL: 5,             // 保存间隔（每提取几篇保存一次）

  // 坐标配置
  ADDRESS_BAR: { x: 960, y: 100 },   // 地址栏坐标
  LISTBOX_CENTER: { x: 600, y: 450 }, // 列表框中心
  KNOWLEDGE_BASE_ICON: { x: 100, y: 80 }, // 知识库图标

  // 延迟配置（毫秒）
  DELAY_AFTER_CLICK: 500,
  DELAY_AFTER_KEY: 300,
  DELAY_AFTER_OPEN: 2500,
  DELAY_AFTER_BACK: 1500,
};
```

### 调整坐标

如果默认坐标不准确，可以调整：

```typescript
// 地址栏坐标
ADDRESS_BAR: { x: 960, y: 100 }

// 列表框坐标
LISTBOX_CENTER: { x: 600, y: 450 }
```

**获取坐标的方法**：
1. 按 `Cmd + Shift + 4` 启动截图
2. 按住 `Space` 键切换到窗口模式
3. 点击 ima.copilot 窗口
4. 在预览中可以看到坐标

---

## 📊 输出文件说明

### 1. 状态文件 (`ima-extractor-state.json`)

```json
{
  "lastUpdate": "2026-04-13T10:30:00.000Z",
  "totalExtracted": 150,
  "targetCount": 1800,
  "extractedUrls": [
    "https://mp.weixin.qq.com/s/...",
    "https://mp.weixin.qq.com/s/..."
  ],
  "currentBatch": 15,
  "startTime": "2026-04-13T09:00:00.000Z",
  "errors": []
}
```

### 2. 结果文件 (`ima-extracted-articles.json`)

```json
{
  "timestamp": "2026-04-13T10:30:00.000Z",
  "totalArticles": 150,
  "articles": [
    {
      "url": "https://mp.weixin.qq.com/s/...",
      "title": "Article #1",
      "timestamp": "2026-04-13T09:05:00.000Z",
      "index": 1,
      "extractMethod": "Cmd+L"
    }
  ]
}
```

### 3. 日志文件 (`ima-extractor.log`)

```
[2026-04-13T09:00:00.000Z] [INFO] 🚀 IMA 文章链接提取引擎 v2.0
[2026-04-13T09:00:01.000Z] [SUCCESS] ✅ 激活 ima.copilot
[2026-04-13T09:00:05.000Z] [INFO] 📄 文章 #1
[2026-04-13T09:00:06.000Z] [SUCCESS] ✅ 提取成功 (Cmd+L)
...
```

---

## 🛠️ 故障排除

### 问题 1: 激活应用失败

**症状**：脚本提示"激活应用失败"

**解决方案**：
```bash
# 手动启动 ima.copilot
open -a "ima.copilot"

# 等待 3 秒后重新运行脚本
sleep 3
./ima-extractor.sh
```

### 问题 2: 无法提取链接

**症状**：所有策略都失败，无法提取 URL

**可能原因**：
1. 文章未完全加载
2. 地址栏不可见
3. 坐标不正确

**解决方案**：
1. 确保文章完全加载（等待 2-3 秒）
2. 调整 `CONFIG.DELAY_AFTER_OPEN` 增加等待时间
3. 重新调整坐标配置

### 问题 3: 重复提取同一篇文章

**症状**：每次都提取到相同的文章

**原因**：返回操作后列表回到顶部

**解决方案**：
- 这是正常行为，脚本会自动跳过已提取的文章
- 如果需要提取更多文章，需要在 ima.copilot 中手动滚动列表

### 问题 4: 连续多次提取失败

**症状**：连续 20 次提取失败，自动停止

**原因**：
- 可能到达列表末尾
- 需要滚动列表框
- 应用失去焦点

**解决方案**：
1. 在 ima.copilot 中向下滚动列表
2. 重新运行脚本，选择"恢复上次提取"
3. 或者调整 `maxFailures` 参数增加容错次数

---

## 💡 使用技巧

### 1. 分批提取大量文章

对于 1800+ 篇文章，建议分多次完成：

```bash
# 第一次：提取 100 篇
./ima-extractor.sh 100 10

# 第二次：从第 101 篇开始
# 脚本会自动跳过已提取的文章
./ima-extractor.sh 200 10
```

### 2. 调整批次大小

- **小批次（5-10）**：更稳定，适合测试
- **大批次（20-50）**：更快，但可能不够稳定

### 3. 监控进度

实时查看提取进度：
```bash
# 查看状态文件
cat ima-extractor-state.json | jq '.'

# 查看已提取数量
jq '.totalArticles' ima-extracted-articles.json

# 实时监控日志
tail -f ima-extractor.log
```

### 4. 导出和验证

提取完成后，验证数据质量：

```bash
# 查看总数
jq '.totalArticles' ima-extracted-articles.json

# 检查重复
jq '.articles | length' ima-extracted-articles.json
jq '.articles | unique_by(.url) | length' ima-extracted-articles.json

# 导出为 CSV
./ima-extractor.sh
# 选择 6) 导出结果 -> 1) CSV
```

---

## 📈 性能和稳定性

### 时间估算

| 文章数量 | 批次大小 | 预计时间 | 说明 |
|---------|---------|---------|------|
| 10篇   | 10      | ~1分钟  | 快速测试 |
| 100篇  | 10      | ~10分钟 | 小批量提取 |
| 500篇  | 10      | ~45分钟 | 中批量提取 |
| 1000篇 | 10      | ~90分钟 | 大批量提取 |
| 1800篇 | 10      | ~2.5小时 | 全部提取 |

**注意**：实际时间可能因网络速度、应用响应等因素有所不同。

### 稳定性保证

1. **自动重试**：每篇失败最多重试 3 次
2. **多策略切换**：3 种提取策略自动尝试
3. **进度保存**：每 5 篇保存一次，不怕中断
4. **错误恢复**：详细记录错误，便于分析

---

## 🔍 技术原理

### 提取策略

#### 策略 1: Cmd+L 聚焦地址栏

```typescript
// 发送 Cmd+L 聚焦到地址栏
keystroke "l" using command down
// 全选并复制
keystroke "a" using command down
keystroke "c" using command down
```

#### 策略 2: 点击地址栏坐标

```typescript
// 点击地址栏位置
click at {960, 100}
// 全选并复制
keystroke "a" using command down
keystroke "c" using command down
```

#### 策略 3: 全选复制

```typescript
// 直接全选并复制（针对已选中状态）
keystroke "a" using command down
keystroke "c" using command down
```

### 自动化流程

```
1. 激活应用
   ↓
2. 打开文章（双击坐标）
   ↓
3. 等待加载（2.5秒）
   ↓
4. 提取 URL（多策略尝试）
   ↓
5. 验证和保存
   ↓
6. 返回列表
   ↓
7. 重复步骤 2-6
```

---

## 🆘 获取帮助

如果遇到问题：

1. **查看日志文件**：`ima-extractor.log`
2. **检查状态文件**：`ima-extractor-state.json`
3. **查看错误记录**：状态文件中的 `errors` 字段
4. **调整配置**：根据实际情况调整延迟和坐标

---

## 📝 更新日志

### v2.0.0 (2026-04-13)

- ✅ 重构核心引擎，架构更稳定
- ✅ 实现多策略自动切换
- ✅ 添加智能重试机制
- ✅ 实现进度保存和断点续传
- ✅ 添加详细的日志系统
- ✅ 创建交互式启动脚本
- ✅ 完善文档和使用指南

### v1.0.0 (2026-04-12)

- ✅ 实现基础自动化提取
- ✅ 支持固定坐标点击
- ✅ 支持键盘快捷键
- ✅ 基础去重功能

---

## 🎉 总结

IMA 文章链接提取工具 v2.0 提供了**稳定可靠的自动化提取**解决方案：

1. **多策略自动切换** - 提高成功率
2. **智能重试机制** - 容错性强
3. **进度自动保存** - 支持断点续传
4. **详细日志记录** - 便于调试
5. **交互式操作** - 简单易用

**立即开始**：
```bash
cd /Users/berton/Github/OpenClaw
./ima-extractor.sh
```

---

**需要帮助？** 请查看日志文件或状态文件，或参考故障排除部分。
