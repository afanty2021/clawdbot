# 🎯 IMA Copilot 自动化链接提取 - 完全自动化方案

> ✅ **已验证成功** - 2026-04-12

## 🚀 一键运行

```bash
npx tsx extract-fixed-coordinates.ts
```

## ✨ 功能特性

- ✅ **完全自动化** - 无需任何手动操作
- ✅ **智能坐标** - 自动获取窗口位置或使用智能默认值
- ✅ **自动验证** - 在 Chrome 中打开并验证链接
- ✅ **结果保存** - JSON 格式保存链接和时间戳
- ✅ **验证截图** - 自动截取验证页面

## 📋 工作流程

1. **激活应用** - 自动激活 ima.copilot 窗口
2. **获取坐标** - 智能计算地址栏坐标（窗口中心偏上）
3. **点击复制** - 使用 AppleScript 点击坐标并复制
4. **提取链接** - 从剪贴板提取微信公众号链接
5. **Chrome 验证** - 在 Chrome 中打开并等待加载
6. **保存结果** - 保存链接、时间戳和截图

## 📊 输出文件

- `ima-fixed-result.json` - 链接和元数据
- `ima-fixed-*.png` - 验证截图

## 🔧 技术原理

### 固定坐标点击

```typescript
// 地址栏通常在窗口顶部中央
const addressX = x + (w / 2)  // 水平居中
const addressY = y + 50       // 顶部偏下 50px
```

### AppleScript 自动化

```applescript
tell application "System Events"
  tell process "ima.copilot"
    click at {x, y}
    keystroke "a" using command down  -- 全选
    keystroke "c" using command down  -- 复制
  end tell
end tell
```

## 🎯 使用场景

- 批量提取知识库文章链接
- 自动化内容迁移
- 链接备份和归档
- 内容分析和统计

## 💡 优势

- **零手动操作** - 从运行到结果完全自动化
- **容错性强** - 坐标获取失败时使用智能默认值
- **可重复** - 可多次运行提取不同文章
- **可扩展** - 易于集成到更大的自动化流程

## 📝 示例输出

```json
{
  "timestamp": "2026-04-12T07:41:36.998Z",
  "url": "https://mp.weixin.qq.com/s?...",
  "method": "fixed_coordinates"
}
```

## 🔄 批量使用

如需批量提取多篇文章，可以：

1. 在 ima.copilot 中打开第一篇文章
2. 运行脚本提取
3. 返回 ima.copilot 打开下一篇
4. 重复步骤 2-3

或者创建循环自动化脚本（需配合 GUI 自动化切换文章）。

## 🛠️ 故障排除

### 如果坐标不准确

编辑脚本中的默认坐标：
```typescript
return { x: 960, y: 100 };  // 调整这些值
```

### 如果无法激活应用

确保 ima.copilot 正在运行，并且已授予终端辅助功能权限。

### 如果剪贴板内容不正确

确保在运行前：
1. ima.copilot 窗口在前台
2. 一篇文章已完全加载
3. 地址栏完全可见

## 📚 相关文件

- `extract-fixed-coordinates.ts` - 主脚本
- `extract-ocr-improved.ts` - OCR 备用方案
- `extract-ocr-python.py` - Python OCR 版本
- `one-click-extract.sh` - 一键手动方案
- `FINAL_SOLUTION.md` - 完整方案对比

## 🎉 成功验证

已成功从 ima.copilot 地址栏提取并验证微信公众号文章链接！

---

**创建时间**: 2026-04-12
**状态**: ✅ 已验证可用
