# ima.copilot 文章链接自动化获取方案

根据界面分析，以下是几个可行的自动化方案：

## 🎯 方案 1: 本地数据库提取（推荐）

**优点**：最直接、最可靠
**适用场景**：数据存储在本地数据库

### 步骤

1. **查找数据库文件**
```bash
# 搜索 ima.copilot 的数据文件
find ~/Library -name "*.db" -o -name "*.sqlite" 2>/dev/null | grep -i ima

# 或者搜索所有相关文件
find ~/Library -type f -name "*ima*" 2>/dev/null
```

2. **使用 SQLite 浏览器查看**
```bash
# 安装 DB Browser for SQLite
brew install --cask db-browser-for-sqlite

# 或使用命令行
brew install sqlite3
```

3. **查询文章数据**
```sql
-- 查看所有表
SELECT name FROM sqlite_master WHERE type='table';

-- 搜索微信公众号链接
SELECT * FROM articles WHERE url LIKE '%mp.weixin.qq.com%';

-- 查看表结构
PRAGMA table_info(articles);
```

### 自动化脚本

创建 `extract-ima-articles.ts`:

```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 找到数据库后，运行此脚本
function extractArticles(dbPath: string) {
  const db = new Database(dbPath, { readonly: true });

  // 获取所有表
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('数据库表:', tables);

  // 搜索文章
  const articles = db.prepare(`
    SELECT * FROM articles
    WHERE url LIKE '%mp.weixin.qq.com%'
    ORDER BY publish_date DESC
    LIMIT 100
  `).all();

  console.log(`找到 ${articles.length} 篇文章`);

  // 保存结果
  fs.writeFileSync('ima-articles.json', JSON.stringify(articles, null, 2));

  db.close();
  return articles;
}
```

---

## 🌐 方案 2: 网络抓包

**优点**：可以获取实时数据、API 接口
**适用场景**：数据从服务器加载

### 步骤

1. **安装抓包工具**
```bash
# 使用 mitmproxy
brew install mitmproxy

# 或使用 Charles
brew install --cask charles

# 或使用 Proxyman
brew install --cask proxyman
```

2. **启动代理**
```bash
# mitmproxy
mitmweb --listen-port 8080

# 然后设置系统代理
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

3. **启动应用并观察流量**
```bash
open -a "ima.copilot"
```

4. **分析 API 请求**
   - 查找 `/api/article`、`/api/knowledge` 等接口
   - 提取请求参数和响应数据
   - 复制请求头和认证信息

### 自动化脚本

创建 `fetch-ima-api.ts`:

```typescript
async function fetchArticlesFromAPI(apiUrl: string, headers: any) {
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'ima.copilot',
      ...headers
    }
  });

  const data = await response.json();
  const articles = data.articles || data.list || [];

  // 提取微信公众号链接
  const wechatArticles = articles.filter((a: any) =>
    a.url?.includes('mp.weixin.qq.com') ||
    a.source?.includes('微信')
  );

  return wechatArticles;
}
```

---

## 🖱️ 方案 3: UI 自动化（需要权限）

**优点**：不需要了解内部实现
**适用场景**：其他方案都不可行

### 前置设置

1. **授予辅助功能权限**
   - 系统设置 > 隐私与安全性 > 辅助功能
   - 添加"终端"或"iTerm2"

2. **安装自动化工具**
```bash
# 使用 Python + PyAutoGUI
pip install pyautogui

# 或使用 Node.js + robotjs
npm install robotjs
```

### 自动化脚本

创建 `automate-ima-ui.ts`:

```typescript
import robot from 'robotjs';
import fs from 'fs';

// 模拟点击和键盘操作
async function extractArticlesByUI() {
  const articles: any[] = [];

  // 1. 点击知识库
  robot.moveMouse(100, 200);
  robot.mouseClick();
  await sleep(1000);

  // 2. 滚动列表
  for (let i = 0; i < 10; i++) {
    robot.scrollMouse(0, -5);
    await sleep(500);

    // 3. 截图并识别文字
    const screenshot = robot.screen.capture();
    // 使用 OCR 识别文字...

    // 4. 提取文章信息
    // ...
  }

  return articles;
}
```

---

## 🔧 方案 4: 混合方案（最佳实践）

结合多种方法的优势：

### 完整流程

1. **首先尝试数据库提取**
```bash
# 运行数据库探索脚本
pnpm tsx explore-ima-database.ts
```

2. **如果数据库加密，尝试网络抓包**
```bash
# 启动代理并分析 API
pnpm tsx analyze-ima-api.ts
```

3. **如果以上都失败，使用 UI 自动化**
```bash
# 运行 UI 自动化脚本
pnpm tsx automate-ima-ui.ts
```

### 一键运行脚本

创建 `extract-ima-articles-all.ts`:

```typescript
async function extractAll() {
  console.log('🚀 开始提取 ima.copilot 文章...\n');

  let articles: any[] = [];

  // 方法 1: 数据库
  console.log('📊 尝试数据库提取...');
  try {
    articles = await extractFromDatabase();
    if (articles.length > 0) {
      console.log(`✅ 数据库提取成功: ${articles.length} 篇`);
    }
  } catch (error) {
    console.log('❌ 数据库提取失败');
  }

  // 方法 2: API
  if (articles.length === 0) {
    console.log('\n🌐 尝试 API 提取...');
    try {
      articles = await extractFromAPI();
      if (articles.length > 0) {
        console.log(`✅ API 提取成功: ${articles.length} 篇`);
      }
    } catch (error) {
      console.log('❌ API 提取失败');
    }
  }

  // 方法 3: UI
  if (articles.length === 0) {
    console.log('\n🖱️  使用 UI 自动化...');
    try {
      articles = await extractByUI();
      if (articles.length > 0) {
        console.log(`✅ UI 提取成功: ${articles.length} 篇`);
      }
    } catch (error) {
      console.log('❌ UI 提取失败');
    }
  }

  // 保存结果
  if (articles.length > 0) {
    fs.writeFileSync('ima-articles-final.json', JSON.stringify(articles, null, 2));
    console.log(`\n💾 最终提取: ${articles.length} 篇文章`);
  } else {
    console.log('\n⚠️  所有方法都失败了');
  }

  return articles;
}
```

---

## 📝 数据格式

提取的文章数据应包含：

```typescript
interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  author?: string;
  publishTime: string;
  summary?: string;
  content?: string;
  tags?: string[];
  readTime?: number;
}
```

---

## 🎯 推荐的下一步

1. **立即执行**：
   ```bash
   # 查找数据库文件
   find ~/Library -name "*.db" 2>/dev/null | grep -i ima
   ```

2. **如果找到数据库**：
   ```bash
   # 安装工具
   brew install sqlite3

   # 查看数据
   sqlite3 ~/Library/.../data.db "SELECT * FROM articles LIMIT 10"
   ```

3. **如果没找到数据库**：
   ```bash
   # 启动抓包工具
   brew install mitmproxy
   mitmweb --listen-port 8080

   # 设置代理并启动应用
   export HTTP_PROXY=http://localhost:8080
   open -a "ima.copilot"
   ```

4. **如果需要 UI 自动化**：
   - 授予终端辅助功能权限
   - 运行 UI 自动化脚本

---

## 📞 需要帮助？

如果你：
- ✅ 找到了数据库文件 → 告诉我路径，我帮你分析
- ✅ 抓到了 API 请求 → 告诉我接口信息，我帮你写脚本
- ✅ 授予了辅助功能权限 → 我帮你运行 UI 自动化

**请告诉我你想尝试哪个方案，我会提供详细的指导！**
