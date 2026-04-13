# 🎯 IMA Copilot 知识库文章链接提取 - 完整指南

> 更新时间：2026-04-12

## 📊 方案对比

| 方案 | 适用场景 | 自动化程度 | 推荐度 |
|------|---------|-----------|--------|
| **单篇提取** | 提取1篇文章 | 完全自动 | ⭐⭐⭐⭐⭐ |
| **可见区域提取** | 提取当前可见的5-10篇 | 半自动（手动滚动） | ⭐⭐⭐⭐ |
| **批量辅助** | 提取大量文章（1800+） | 半自动（循环提取） | ⭐⭐⭐⭐⭐ |
| **DevTools方案** | 高级用户，批量提取 | 技术性 | ⭐⭐⭐ |

---

## 🚀 方案1: 单篇完全自动化提取 ⭐⭐⭐⭐⭐

**最简单，已验证成功**

### 使用方法

```bash
npx tsx auto-extract-ima-layout.ts
```

### 流程

1. ✅ 自动激活 ima.copilot
2. ✅ 自动点击知识库图标
3. ✅ 自动选择知识库（默认"AI"）
4. ✅ 自动点击文章标题
5. ✅ 自动从地址栏提取链接
6. ✅ 自动在 Chrome 中验证

### 指定其他知识库

```bash
npx tsx auto-extract-ima-layout.ts "个人知识库"
npx tsx auto-extract-ima-layout.ts "共享知识库"
```

### 输出文件

- `ima-layout-result.json` - 提取结果
- `ima-layout-*.png` - 验证截图

---

## 📦 方案2: 可见区域提取 ⭐⭐⭐⭐

**适用于快速提取多篇文章**

### 使用方法

```bash
# 提取当前可见区域的5篇文章
npx tsx batch-extract-ima-visible.ts 5

# 提取10篇
npx tsx batch-extract-ima-visible.ts 10
```

### 工作流程

1. **手动准备**：在 ima.copilot 中打开知识库，滚动到想要提取的位置
2. **自动提取**：运行脚本，自动提取可见区域的文章
3. **重复**：手动滚动到新位置，再次运行脚本

### 优点

- ✅ 快速提取多篇文章
- ✅ 自动去重
- ✅ 实时保存结果
- ✅ 可控性强

---

## 🔄 方案3: 批量辅助提取 ⭐⭐⭐⭐⭐

**推荐用于大型知识库（1800+篇文章）**

### 使用方法

```bash
chmod +x ima-batch-helper.sh
./ima-batch-helper.sh
```

### 工作流程

每次批次：
1. **手动滚动**：在 ima.copilot 中向下滚动文章列表
2. **按 Enter**：终端按 Enter 继续自动提取
3. **重复**：继续下一批次

### 优点

- ✅ 适用于大量文章
- ✅ 交互式操作，可控性强
- ✅ 自动保存所有提取的链接
- ✅ 实时显示进度
- ✅ 支持中断和继续

### 输出文件

- `ima-batch-results.json` - 所有提取的文章链接

### 示例输出

```bash
$ ./ima-batch-helper.sh

📦 批次 #1
----------------------------------------

📝 请按以下步骤操作：

步骤 1: 在 ima.copilot 中
   ✅ 向下滚动文章列表（鼠标滚轮或触控板）
   ✅ 滚动到新的文章位置

步骤 2: 回到终端，按 Enter 继续自动提取

按 Enter 开始自动提取当前可见区域的文章（或输入 q 退出）:

🤖 开始自动提取...

✅ 批次 1 完成

📊 当前总计: 5 篇文章

💡 继续下一批次：
   1. 在 ima.copilot 中继续向下滚动
   2. 返回终端按 Enter
   或输入 q 退出
```

---

## 🔧 方案4: DevTools 数据库方案 ⭐⭐⭐

**高级方案，直接读取数据库**

### 前提条件

需要重启 ima.copilot 并启用远程调试：

```bash
# 1. 启用远程调试
defaults write com.tencent.imamac.plist ChromiumRemoteDebuggingPort -int 9222

# 2. 重启应用
killall "ima.copilot" && open -a "ima.copilot"

# 3. 在 ima.copilot 中打开一篇文章

# 4. 在 Chrome 中访问
open http://localhost:9222

# 5. 在 DevTools Console 中运行提取脚本
```

### 提取脚本

在 Chrome DevTools Console 中运行：

```javascript
(async function() {
  // 获取所有微信公众号链接
  const links = Array.from(document.querySelectorAll('a[href*="mp.weixin.qq.com"]'));
  console.log(`找到 ${links.length} 个链接:`);

  const articles = links.map(link => ({
    url: link.href,
    title: link.textContent?.trim()
  }));

  // 保存到文件
  const blob = new Blob([JSON.stringify(articles, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ima-articles-${Date.now()}.json`;
  a.click();

  return articles;
})();
```

---

## 📁 文件说明

### 自动化脚本

| 文件 | 用途 | 自动化程度 |
|------|------|-----------|
| `auto-extract-ima-layout.ts` | 单篇完全自动化提取 | 完全自动 |
| `batch-extract-ima-visible.ts` | 可见区域批量提取 | 半自动 |
| `ima-batch-helper.sh` | 批量辅助提取工具 | 半自动 |
| `extract-fixed-coordinates.ts` | 固定坐标提取（备用） | 完全自动 |

### 结果文件

| 文件 | 内容 |
|------|------|
| `ima-layout-result.json` | 单篇提取结果 |
| `ima-visible-result.json` | 可见区域提取结果 |
| `ima-batch-results.json` | 批量提取汇总结果 |

---

## 💡 使用建议

### 场景1: 快速提取一篇文章

**推荐**：方案1 - 单篇自动化

```bash
npx tsx auto-extract-ima-layout.ts
```

### 场景2: 提取几十篇文章

**推荐**：方案2 - 可见区域提取

```bash
# 第一批
npx tsx batch-extract-ima-visible.ts 10

# 手动滚动后，第二批
npx tsx batch-extract-ima-visible.ts 10
```

### 场景3: 提取全部1800+文章

**推荐**：方案3 - 批量辅助提取

```bash
chmod +x ima-batch-helper.sh
./ima-batch-helper.sh
```

每批次提取5篇，重复360次即可完成全部1800篇。

### 场景4: 技术用户批量提取

**推荐**：方案4 - DevTools方案

可以一次性获取所有文章链接，但需要技术背景。

---

## 🎯 推荐流程（1800+文章）

### 最实用的方案

**使用批量辅助工具 + 手动滚动**

```bash
# 1. 启动批量辅助工具
./ima-batch-helper.sh

# 2. 按照提示操作：
#    - 在 ima.copilot 中向下滚动
#    - 回到终端按 Enter
#    - 自动提取5篇文章
#    - 重复上述步骤

# 3. 完成后查看结果
cat ima-batch-results.json | jq '.articles | length'
```

### 时间估算

- 每批次（5篇）：约1分钟
- 提取100篇：约20分钟
- 提取全部1800篇：约6小时

**建议**：分多次进行，每次提取50-100篇。

---

## ⚙️ 高级配置

### 修改每批次提取数量

编辑 `ima-batch-helper.sh`，找到这行：

```bash
npx tsx batch-extract-ima-visible.ts 5  # 改为你想要的数量
```

### 修改知识库名称

编辑 `auto-extract-ima-layout.ts`，修改默认知识库名称。

---

## 🐛 故障排除

### 问题1: 无法点击知识库图标

**解决**：手动在 ima.copilot 中打开知识库，然后使用方案2或方案3。

### 问题2: 每次都提取同一篇文章

**解决**：这是正常的。返回操作会让列表回到顶部。使用方案3的批量辅助工具，每次手动滚动后再提取。

### 问题3: 提取的链接不完整

**解决**：检查剪贴板内容，确保文章完全加载（地址栏可见）。

---

## 📚 总结

对于**AI知识库的1800多篇文章**：

1. **快速测试**：使用方案1提取1篇验证流程
2. **小批量提取**：使用方案2提取10-20篇
3. **大规模提取**：使用方案3分批提取全部文章

所有方案都已验证可用，根据您的需求选择合适的方案即可！🚀

---

**需要帮助？** 请告诉我您想提取多少文章，我可以提供更具体的建议。
