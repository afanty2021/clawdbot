# iMa 桌面应用 GUI 探索指南

## 概述

本指南帮助你自动化获取 iMa（微信阅读）桌面应用知识库中的微信公众号文章链接。

## 方案对比

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **方案 1: 本地数据分析** | 所有类型应用 | 最直接，不需要运行应用 | 需要数据库知识 |
| **方案 2: CDP 连接** | Electron 应用 | 可获取实时数据 | 需要启用远程调试 |
| **方案 3: Accessibility API** | 原生应用 | 不需要修改应用 | 数据提取有限 |

## 方案 1: 本地数据分析（推荐）

这是最直接的方法，直接读取 iMa 的本地数据文件。

### 步骤

1. **安装依赖**
```bash
cd /Users/berton/Github/OpenClaw
pnpm add better-sqlite3
```

2. **运行探索脚本**
```bash
pnpm tsx explore-ima-desktop.ts
```

3. **查看结果**
脚本会自动：
- 查找 iMa 应用位置
- 确定应用类型（Electron/原生/Flutter）
- 查找本地数据存储目录
- 分析 SQLite 数据库
- 搜索微信公众号链接
- 保存结果到 `ima-desktop-analysis.json`

### 预期输出

```
🚀 开始探索 iMa 桌面应用...

✅ 找到 iMa 应用: /Applications/iMa.app
✅ 检测到 Electron 应用
✅ 找到数据目录: ~/Library/Application Support/iMa
📄 找到数据文件: ~/Library/Application Support/iMa/data.db
🔍 分析数据库: ~/Library/Application Support/iMa/data.db
📋 数据库表: ['articles', 'collections', 'metadata']
✅ 在表 articles 中找到微信公众号链接
数据: [...]

💾 分析结果已保存到: /Users/berton/Github/OpenClaw/ima-desktop-analysis.json
📊 总共找到 150 条相关数据
```

## 方案 2: CDP 连接（Electron 应用）

如果 iMa 是 Electron 应用，可以通过 Chrome DevTools Protocol 连接。

### 步骤

1. **启用 iMa 的远程调试**

找到 iMa 的启动参数，添加：
```bash
/Applications/iMa.app/Contents/MacOS/iMa --remote-debugging-port=9222
```

或者在 `~/Library/Preferences/iMa.plist` 中添加配置。

2. **运行 CDP 探索脚本**
```bash
pnpm tsx explore-ima-cdp.ts
```

3. **按照脚本提示操作**
   - 脚本会显示需要在 iMa 开发者工具中运行的代码
   - 按 Enter 键继续
   - 查看提取的数据

### 预期输出

```
🚀 初始化 CDP 连接...
✅ CDP 连接已建立
🔧 启用 iMa 开发者工具...

请按以下步骤操作：
1. 打开 iMa 应用
2. 按 Cmd+Option+I 打开开发者工具
3. 在 Console 标签中运行代码...

（脚本会显示具体的代码）

尝试连接到 iMa 的 CDP 端点...
✅ 成功连接到 CDP 端点: http://localhost:9222
找到 iMa 页面: iMa
✅ 提取到 150 个文章链接
💾 数据已保存到: ima-cdp-data.json
```

## 方案 3: 使用 OpenClaw 的浏览器自动化

如果上述方法都不适用，可以使用 OpenClaw 的浏览器控制功能。

### 步骤

1. **启动 iMa 应用**
2. **启动 OpenClaw Gateway**
```bash
openclaw gateway --port 18789
```

3. **发送浏览器控制命令**
```bash
openclaw browser snapshot
openclaw browser click --element "知识库"
openclaw browser extract --selector "a[href*='mp.weixin.qq.com']"
```

## 数据分析

### 提取的数据格式

```json
{
  "structure": {
    "appPath": "/Applications/iMa.app",
    "appType": "electron",
    "dataPath": "~/Library/Application Support/iMa",
    "dbPath": "~/Library/Application Support/iMa/data.db"
  },
  "articles": [
    {
      "title": "文章标题",
      "url": "https://mp.weixin.qq.com/s/xxxxx",
      "author": "公众号名称",
      "publishTime": "2024-01-01",
      "summary": "文章摘要"
    }
  ]
}
```

### 后续处理

提取数据后，你可以：

1. **导出到其他应用**
```typescript
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('ima-desktop-analysis.json', 'utf-8'));

// 导出到 Notion
// 导出到 Obsidian
// 导出到 Readwise
```

2. **定期同步**
```typescript
// 创建定时任务，定期提取新文章
setInterval(async () => {
  const explorer = new IMADesktopExplorer();
  await explorer.run();
}, 24 * 60 * 60 * 1000); // 每 24 小时
```

3. **创建搜索索引**
```typescript
// 使用 sqlite-vec 创建向量搜索索引
// 实现语义搜索
```

## 故障排除

### 问题 1: 找不到 iMa 应用

**解决方案**:
- 检查应用是否安装在 `/Applications/` 目录
- 使用 Spotlight 搜索 iMa
- 手动指定应用路径

### 问题 2: 数据库访问被拒绝

**解决方案**:
- 确保 iMa 应用已关闭
- 使用 sudo 权限运行脚本
- 复制数据库文件到临时位置

### 问题 3: 找不到微信公众号链接

**解决方案**:
- 检查 iMa 是否已登录
- 确认知识库中是否有微信公众号文章
- 尝试搜索其他关键词（"weixin"、"mp"、"公众号"）

## 高级用法

### 自定义查询

```typescript
// 在 explore-ima-desktop.ts 中添加自定义查询
const customQuery = `
  SELECT title, url, author, publish_time
  FROM articles
  WHERE url LIKE '%mp.weixin.qq.com%'
  ORDER BY publish_time DESC
  LIMIT 100
`;

const articles = db.prepare(customQuery).all();
```

### 数据过滤

```typescript
// 按日期过滤
const recentArticles = articles.filter(a => {
  const publishDate = new Date(a.publishTime);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return publishDate > oneMonthAgo;
});

// 按作者过滤
const authors = ['作者A', '作者B'];
const filteredArticles = articles.filter(a =>
  authors.includes(a.author)
);
```

### 批量操作

```typescript
// 批量下载文章
for (const article of articles) {
  const response = await fetch(article.url);
  const html = await response.text();
  fs.writeFileSync(`articles/${article.title}.html`, html);
}
```

## 安全注意事项

1. **备份原始数据**
   - 在分析前复制数据库文件
   - 不要修改原始数据库

2. **隐私保护**
   - 不要分享包含个人信息的提取数据
   - 删除敏感字段后再导出

3. **API 密钥**
   - 不要在脚本中硬编码 API 密钥
   - 使用环境变量存储密钥

## 相关资源

- [OpenClaw 文档](./CLAUDE.md)
- [Stagehand 浏览器自动化](https://github.com/browser-use/stagehand)
- [Playwright 文档](https://playwright.dev/)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)

## 贡献

如果你发现更好的方法或改进建议，欢迎提交 PR 或 Issue。

---

**最后更新**: 2026-04-12
**维护者**: OpenClaw Team
