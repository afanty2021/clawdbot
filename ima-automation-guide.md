# ima.copilot 自动化探索指南

## 当前状态

✅ **ima.copilot 支持 AppleScript**
- 可以使用 System Events 访问 UI 元素
- 可以模拟点击和键盘操作

## 手动操作步骤

由于自动 UI 探索有限，建议手动操作：

### 1. 获取应用数据

**方法 A: 使用 SQLite 浏览器**
```bash
# 安装 SQLite 浏览器
brew install sqlitebrowser

# 查找数据库文件
find ~/Library -name "*.db" -o -name "*.sqlite" 2>/dev/null | grep -i ima
```

**方法 B: 使用开发者工具（如果应用支持）**
```bash
# 启用 Web Inspector（如果是 WebView 应用）
defaults write com.tencent.imac WebKitDeveloperExtras -bool true
```

### 2. 使用 Accessibility API

授予终端辅助功能权限后，可以：
```bash
# 运行此脚本
pnpm tsx explore-ima-ui.ts
```

### 3. 使用网络代理

如果应用使用网络 API：
```bash
# 设置代理
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080

# 启动应用
open -a "ima.copilot"
```

然后使用代理工具（如 Charles、mitmproxy）抓包。

### 4. 直接从应用导出

检查应用是否有导出功能：
- 文件菜单 > 导出
- 设置 > 数据管理 > 导出
- 右键菜单 > 导出

## 推荐的工作流程

1. **先尝试手动导出** - 最简单
2. **查看本地数据库** - 最直接
3. **使用网络代理** - 如果数据在线
4. **UI 自动化** - 最后手段

## 数据位置

可能的数据存储位置：
- `~/Library/Application Support/ima.copilot/`
- `~/Library/Containers/com.tencent.imac/`
- `~/Library/ima.copilot/`
- `~/.ima.copilot/`

## 数据库查询示例

如果找到 SQLite 数据库：
```sql
-- 查找所有表
SELECT name FROM sqlite_master WHERE type='table';

-- 搜索微信公众号链接
SELECT * FROM articles WHERE url LIKE '%mp.weixin.qq.com%';

-- 按日期排序
SELECT * FROM articles ORDER BY publish_date DESC;
```

## AppleScript 示例

```applescript
-- 获取当前选中的文章
tell application "System Events"
  tell process "ima.copilot"
    tell front window
      -- 获取选中的行
      tell table 1
        set selectedRow to selection
        -- 获取单元格内容
        tell selectedRow
          set cellValue to value of cell 1
        end tell
      end tell
    end tell
  end tell
end tell
```
