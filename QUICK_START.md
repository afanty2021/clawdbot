# 🎯 IMA 知识库批量提取 - 快速开始指南

> 针对 AI 知识库 1800+ 文章的实用方案

## 🚀 最简单方案（推荐）

### 完全自动化提取 ⭐⭐⭐⭐⭐

**一键启动，无需任何手动操作：**
```bash
chmod +x ima-auto-extract.sh
./ima-auto-extract.sh
```

**使用流程：**
1. 确保 ima.copilot 已打开
2. 运行脚本
3. 脚本自动完成所有操作
4. 等待2-3小时（1800篇文章）

**优点：**
- ✅ 完全自动 - 无需任何手动操作
- ✅ 自动遍历 - 在列表框内自动滚动
- ✅ 自动去重 - 不会重复提取
- ✅ 实时保存 - 每篇自动保存
- ✅ 进度跟踪 - 显示完成百分比和时间估算
- ✅ 自动停止 - 到达列表末尾自动停止

---

### 交互式批量提取 ⭐⭐⭐⭐

**使用流程：**
1. 在 ima.copilot 中打开 AI 知识库
2. 向下滚动几篇文章
3. 回到终端，按 Enter
4. 脚本自动提取 5 篇文章
5. 重复步骤 2-4

**优点：**
- ✅ 简单易用 - 无需技术知识
- ✅ 自动去重 - 不会重复提取
- ✅ 实时保存 - 每批次自动保存
- ✅ 进度跟踪 - 显示完成百分比
- ✅ 可中断退出 - 随时可以停止

---

## 📝 单篇文章快速提取

如果只需要提取一两篇文章：

```bash
npx tsx auto-extract-ima-layout.ts
```

---

## 📊 时间估算

| 提取数量 | 时间估算 | 批次（5篇/批） |
|---------|---------|----------------|
| 10篇   | ~2分钟  | 2批             |
| 50篇   | ~10分钟 | 10批            |
| 100篇  | ~20分钟 | 20批            |
| 500篇  | ~1.5小时 | 100批           |
| 1000篇 | ~3小时  | 200批           |
| 1800篇 | ~5.5小时 | 360批           |

**建议**：分多次进行，每次提取50-100篇。

---

## 🔧 高级用法

### 修改每批提取数量

编辑 `ima-interactive-batch.sh`：
```bash
npx tsx batch-extract-ima-visible.ts 5  # 改为 10 或 20
```

### 导出结果

```bash
# 导出为 CSV
jq '.articles[] | [.index, .title, .url] | @csv' ima-all-articles.json > articles.csv

# 导出纯链接
jq '.articles[].url' ima-all-articles.json > urls.txt

# 导出为 Markdown
jq '.articles[] | "- \(.title\): \(.url\)"' ima-all-articles.json > articles.md
```

---

## 📁 文件说明

| 文件 | 用途 | 推荐度 |
|------|------|--------|
| `ima-interactive-batch.sh` | **推荐使用** - 交互式批量提取 | ⭐⭐⭐⭐⭐ |
| `auto-extract-ima-layout.ts` | 单篇完全自动化提取 | ⭐⭐⭐⭐ |
| `batch-extract-ima-visible.ts` | 可见区域提取（被主脚本调用） | ⭐⭐⭐⭐ |
| `ima-all-articles.json` | 所有提取的文章汇总 | - |

---

## 💡 使用技巧

### 1. 提高效率

- 每次滚动 3-5 篇文章的距离
- 使用触控板双指滑动更快速
- 可以同时打开多个知识库分别提取

### 2. 避免重复

脚本会自动检测并跳过已提取的文章，但为了保险：
- 记住上次滚动的位置
- 每次滚动到新的位置

### 3. 验证提取质量

```bash
# 查看提取的文章数量
jq '.total' ima-all-articles.json

# 查看前5篇
jq '.articles[:5]' ima-all-articles.json

# 检查是否有重复
jq '.articles | length' ima-all-articles.json
jq '.articles | unique_by(.url) | length' ima-all-articles.json
```

---

## 🎯 总结

对于您的 **AI 知识库 1800+ 文章**：

1. **最简单**：使用 `ima-interactive-batch.sh`
2. **最快速**：每批提取 10-20 篇
3. **最可靠**：分多次完成，每次 50-100 篇
4. **约需时间**：5-6 小时（全部完成）

---

**立即开始：**
```bash
chmod +x ima-interactive-batch.sh
./ima-interactive-batch.sh
```

---

## 旧版：手动复制验证方案

### 步骤 1: 在 ima.copilot 中复制链接

### 步骤 2: 运行验证脚本

```bash
# 在终端中运行
cd /Users/berton/Github/OpenClaw
./verify-ima-link.sh
```

### 步骤 3: 查看结果

脚本会自动：
- ✅ 从剪贴板提取链接
- ✅ 在 Chrome 中打开链接
- ✅ 等待页面加载
- ✅ 截取验证截图
- ✅ 保存结果到 `ima-link-result.json`

---

## 📸 预期结果

运行后会看到类似输出：

```
🚀 IMA 文章链接提取和验证工具
==========================================

📖 使用说明：
1. 在 ima.copilot 中复制微信公众号文章链接
2. 运行此脚本
3. 脚本会自动提取链接并在 Chrome 中验证

📋 剪贴板内容:
https://mp.weixin.qq.com/s/xxxxxxxxx?...

✅ 提取到链接:
https://mp.weixin.qq.com/s/xxxxxxxxx

🌐 在 Chrome 中打开...
⏳ 等待页面加载...
📸 截取验证截图...
✅ 截图已保存: ima-verify-1234567890.png

🎉 验证完成！

📋 链接: https://mp.weixin.qq.com/s/xxxxxxxxx
📸 截图: ima-verify-1234567890.png
💾 结果: ima-link-result.json
```

---

## 🔍 如何在 ima.copilot 中复制链接

### 方法 1: 右键菜单（推荐）
1. 在文章列表中找到文章
2. 右键点击文章标题
3. 选择"复制链接"或"分享"

### 方法 2: 文章详情页
1. 点击文章打开详情页
2. 复制浏览器地址栏中的 URL
3. 确保 URL 包含 `mp.weixin.qq.com`

### 方法 3: 键盘快捷键
1. 点击选中文章
2. 按 `Cmd + C` 复制
3. 如果复制的不是链接，使用方法 1 或 2

---

## 💡 常见问题

### Q: 脚本提示"剪贴板中没有微信公众号链接"
**A:** 确保：
- 复制的是完整的 URL（包含 mp.weixin.qq.com）
- 链接没有被截断
- 没有复制其他内容

### Q: Chrome 没有打开链接
**A:** 检查：
- Chrome 是否已安装
- 链接格式是否正确
- 尝试手动复制链接到 Chrome 地址栏

### Q: 如何批量提取多个链接？
**A:** 重复以下步骤：
1. 复制第一个链接 → 运行脚本
2. 复制第二个链接 → 运行脚本
3. 以此类推...

结果会保存在不同的文件中（带时间戳）

---

## 📊 结果文件说明

运行后会生成以下文件：

1. **`ima-link-result.json`** - 提取结果（JSON 格式）
   ```json
   {
     "url": "https://mp.weixin.qq.com/s/xxxxx",
     "timestamp": "2026-04-12T15:30:00.000Z",
     "screenshot": "ima-verify-1234567890.png"
   }
   ```

2. **`ima-verify-xxxxxxxx.png`** - Chrome 页面截图
   - 用于验证链接是否正确打开
   - 可用于文档或分享

---

## 🚀 高级用法

### 批量提取脚本

创建 `batch-extract.sh`:

```bash
#!/bin/bash

# 批量提取多个链接
COUNT=0

echo "开始批量提取..."
echo "每复制一个链接后按 Enter，完成后按 Ctrl+C"

while true; do
  read -p "链接 $((COUNT+1)): 已复制? [按 Enter 继续] "

  ./verify-ima-link.sh
  COUNT=$((COUNT+1))

  echo "✅ 已提取 $COUNT 个链接"
  echo ""
done
```

### 自动化提取

如果需要完全自动化，请查看 `ima-final-guide.md` 中的：
- DevTools 方法
- LevelDB 直接读取
- Chrome DevTools Protocol

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 ima.copilot 是否正在运行
2. 确认已复制正确的链接格式
3. 查看终端输出的错误信息
4. 检查生成的截图文件

**提示**：第一次使用建议先测试一篇文章，确认流程正常后再批量操作。

---

**最后更新**: 2026-04-12
**状态**: ✅ 已测试并验证
