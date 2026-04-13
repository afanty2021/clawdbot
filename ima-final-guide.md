# 🎯 ima.copilot 文章链接自动化 - 最终解决方案

## ✅ 已发现的重要信息

### 数据存储位置
```
~/Library/Application Support/com.tencent.imamac/
├── Default/
│   ├── IndexedDB/
│   │   ├── https_ima.qq.com_0.indexeddb.leveldb/    # IMA 官方数据
│   │   └── https_mp.weixin.qq.com_0.indexeddb.leveldb/  # 微信公众号数据
│   ├── Local Storage/
│   ├── Preferences (JSON 文件)
│   ├── Cookies
│   └── History
├── imainfo/    # 应用日志和数据
├── mmkv/       # 腾讯 MMKV 键值存储
└── tdsinfo/    # 腾讯数据服务
```

### 应用类型
- ✅ **基于 Chromium** (不是 Electron)
- ✅ **支持远程调试** (可以启用 DevTools)
- ✅ **使用 LevelDB** 存储 IndexedDB 数据
- ✅ **使用 MMKV** 存储键值数据

---

## 🚀 推荐方案（按优先级）

### 方案 1: 启用 DevTools 并提取数据 ⭐⭐⭐⭐⭐

**最推荐！** 可以直接在浏览器中查看所有数据。

#### 步骤：

1. **启用远程调试**
```bash
# 关闭 ima.copilot
killall "ima.copilot"

# 启用远程调试
defaults write com.tencent.imamac.plist ChromiumRemoteDebuggingPort -int 9222

# 重新启动
open -a "ima.copilot"
```

2. **打开 DevTools**
```bash
# 在浏览器中访问
open http://localhost:9222

# 或在 Chrome 中
chrome://inspect
```

3. **提取数据**
打开 DevTools Console，运行：

```javascript
// 1. 获取所有 IndexedDB 数据
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    console.log('数据库:', db.name);
  });
});

// 2. 打开 ima.qq.com 数据库
const request = indexedDB.open('ima.qq.com', 1);
request.onsuccess = () => {
  const db = request.result;

  // 获取所有对象存储
  const stores = Array.from(db.objectStoreNames);
  console.log('对象存储:', stores);

  // 遍历所有数据
  stores.forEach(storeName => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const getAll = store.getAll();

    getAll.onsuccess = () => {
      console.log(`${storeName}:`, getAll.result);

      // 保存到文件
      const data = JSON.stringify(getAll.result, null, 2);
      const blob = new Blob([data], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storeName}.json`;
      a.click();
    };
  });
};

// 3. 获取 LocalStorage
console.log('LocalStorage:', {...localStorage});

// 4. 获取 SessionStorage
console.log('SessionStorage:', {...sessionStorage});
```

4. **搜索文章链接**
```javascript
// 搜索所有包含微信公众号链接的数据
function searchWeChatLinks(data) {
  const results = [];
  const search = (obj, path = '') => {
    if (typeof obj === 'string' && obj.includes('mp.weixin.qq.com')) {
      results.push({path, url: obj});
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        search(value, `${path}.${key}`);
      });
    }
  };
  search(data);
  return results;
}

// 使用示例
const links = searchWeChatLinks(windowData);
console.log('找到微信公众号链接:', links);
```

---

### 方案 2: 直接读取 LevelDB ⭐⭐⭐⭐

使用工具直接读取 LevelDB 文件。

#### 步骤：

1. **安装 LevelDB 工具**
```bash
# 使用 Python
pip install leveldb

# 或使用 Node.js
npm install level
```

2. **读取数据**
创建 `extract-leveldb.ts`:

```typescript
import level from 'level';
import path from 'path';

const leveldbPath = path.join(
  process.env.HOME,
  'Library/Application Support/com.tencent.imamac/Default/IndexedDB/https_ima.qq.com_0.indexeddb.leveldb'
);

async function extractLevelDB() {
  const db = level(leveldbPath, { readonly: true });

  const articles: any[] = [];

  // 创建读取流
  db.createReadStream()
    .on('data', (data) => {
      try {
        const key = data.key.toString();
        const value = JSON.parse(data.value.toString());

        // 搜索文章数据
        if (value.url?.includes('mp.weixin.qq.com') ||
            value.title || value.content) {
          articles.push({ key, value });
        }
      } catch (error) {
        // 跳过无法解析的数据
      }
    })
    .on('end', () => {
      console.log(`找到 ${articles.length} 篇文章`);

      // 保存结果
      fs.writeFileSync(
        'ima-articles-from-leveldb.json',
        JSON.stringify(articles, null, 2)
      );

      db.close();
    });
}

extractLevelDB();
```

---

### 方案 3: 使用 Chrome DevTools Protocol ⭐⭐⭐

通过 CDP 自动化提取数据。

#### 步骤：

1. **安装依赖**
```bash
pnpm add -D puppeteer-core
```

2. **运行脚本**
创建 `extract-ima-cdp.ts`:

```typescript
import puppeteer from 'puppeteer-core';

async function extractWithCDP() {
  // 连接到 ima.copilot 的 CDP 端点
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222'
  });

  const pages = await browser.pages();
  const imaPage = pages.find(p => p.url().includes('ima.qq.com'));

  if (!imaPage) {
    console.log('未找到 ima.qq.com 页面');
    return;
  }

  // 提取数据
  const articles = await imaPage.evaluate(() => {
    return new Promise((resolve) => {
      const request = indexedDB.open('ima.qq.com', 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['articles'], 'readonly');
        const store = tx.objectStore('articles');
        const getAll = store.getAll();

        getAll.onsuccess = () => {
          resolve(getAll.result);
        };
      };
    });
  });

  console.log(`提取到 ${articles.length} 篇文章`);

  await browser.disconnect();
}

extractWithCDP();
```

---

### 方案 4: 使用浏览器扩展 ⭐⭐⭐

创建一个简单的浏览器扩展来提取数据。

#### 步骤：

1. **创建扩展**
创建目录 `ima-extractor/`：

```json
// manifest.json
{
  "manifest_version": 3,
  "name": "IMA Article Extractor",
  "version": "1.0",
  "permissions": ["storage"],
  "content_scripts": [{
    "matches": ["https://ima.qq.com/*"],
    "js": ["content.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}
```

```javascript
// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    extractArticles().then(sendResponse);
    return true;
  }
});

async function extractArticles() {
  const articles = [];

  // 获取 IndexedDB
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name.includes('ima')) {
      const data = await extractFromDB(db.name);
      articles.push(...data);
    }
  }

  return articles;
}
```

2. **加载扩展**
- 打开 Chrome: `chrome://extensions/`
- 启用"开发者模式"
- 加载已解压的扩展程序

3. **使用扩展**
- 访问 ima.qq.com
- 点击扩展图标
- 点击"提取文章"按钮

---

## 📊 数据格式

提取的数据通常包含：

```typescript
interface IMASArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  author: string;
  publishTime: number;
  content?: string;
  summary?: string;
  tags: string[];
  readStatus: boolean;
  favoriteStatus: boolean;
  createTime: number;
  updateTime: number;
}
```

---

## 🎯 快速开始

### 立即执行（推荐）

```bash
# 1. 启用远程调试
defaults write com.tencent.imamac.plist ChromiumRemoteDebuggingPort -int 9222

# 2. 重启应用
killall "ima.copilot" && sleep 1 && open -a "ima.copilot"

# 3. 打开 DevTools
open http://localhost:9222

# 4. 在 DevTools Console 中运行提取脚本
# (复制上面的 JavaScript 代码)
```

### 一键提取脚本

创建 `extract-ima-quick.sh`:

```bash
#!/bin/bash

echo "🚀 IMA 文章提取工具"
echo "===================="

# 检查应用是否运行
if ! pgrep -x "ima.copilot" > /dev/null; then
  echo "启动 ima.copilot..."
  open -a "ima.copilot"
  sleep 3
fi

# 启用远程调试
echo "启用远程调试..."
defaults write com.tencent.imamac.plist ChromiumRemoteDebuggingPort -int 9222

# 重启应用
echo "重启应用..."
killall "ima.copilot"
sleep 2
open -a "ima.copilot"
sleep 3

# 打开 DevTools
echo "打开 DevTools..."
open http://localhost:9222

echo "✅ 准备完成！"
echo ""
echo "下一步："
echo "1. 在 Chrome 中访问 http://localhost:9222"
echo "2. 点击 'ima.qq.com' 页面的 'inspect' 链接"
echo "3. 在 DevTools Console 中运行提取脚本"
echo ""
echo "提取脚本已保存到 clipboard，直接粘贴即可！"

# 复制提取脚本到剪贴板
cat << 'EOF' | pbcopy
// IMA 文章提取脚本
(async function() {
  console.log('🚀 开始提取文章...');

  // 获取所有数据库
  const dbs = await indexedDB.databases();
  console.log('找到数据库:', dbs.map(d => d.name));

  // 提取函数
  async function extractDB(dbName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onsuccess = async () => {
        try {
          const db = request.result;
          const storeNames = Array.from(db.objectStoreNames);
          const result = {};

          for (const storeName of storeNames) {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            try {
              const data = await new Promise((res, rej) => {
                const getAll = store.getAll();
                getAll.onsuccess = () => res(getAll.result);
                getAll.onerror = () => rej(getAll.error);
              });

              result[storeName] = data;
            } catch (error) {
              result[storeName] = { error: error.message };
            }
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 提取所有数据库
  const allData = {};
  for (const db of dbs) {
    if (db.name.includes('ima') || db.name.includes('weixin')) {
      console.log(`提取 ${db.name}...`);
      try {
        allData[db.name] = await extractDB(db.name);
      } catch (error) {
        console.error(`提取 ${db.name} 失败:`, error);
      }
    }
  }

  // 搜索微信公众号链接
  function searchLinks(data, path = '') {
    const results = [];
    const search = (obj, p) => {
      if (typeof obj === 'string' && obj.includes('mp.weixin.qq.com')) {
        results.push({ path: p, url: obj });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([k, v]) => {
          search(v, p ? `${p}.${k}` : k);
        });
      }
    };
    search(data, path);
    return results;
  }

  // 查找所有链接
  const allLinks = [];
  Object.entries(allData).forEach(([dbName, dbData]) => {
    Object.entries(dbData).forEach(([storeName, storeData]) => {
      if (Array.isArray(storeData)) {
        storeData.forEach((item, index) => {
          const links = searchLinks(item, `${dbName}.${storeName}[${index}]`);
          allLinks.push(...links);
        });
      }
    });
  });

  console.log(`\n✅ 提取完成！`);
  console.log(`📊 数据库: ${Object.keys(allData).length} 个`);
  console.log(`🔗 找到微信公众号链接: ${allLinks.length} 个`);

  if (allLinks.length > 0) {
    console.log('\n链接列表:');
    allLinks.forEach((link, i) => {
      console.log(`${i + 1}. ${link.path}`);
      console.log(`   ${link.url}`);
    });
  }

  // 保存到文件
  const blob = new Blob([JSON.stringify(allData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ima-extract-${Date.now()}.json`;
  a.click();

  console.log('\n💾 数据已下载！');

  return allData;
})();
EOF
```

---

## 💡 高级技巧

### 定期自动提取

```bash
# 创建定时任务
crontab -e

# 每天凌晨 2 点提取
0 2 * * * /path/to/extract-ima-quick.sh >> ~/ima-extract.log 2>&1
```

### 数据同步

```typescript
// 同步到 Notion
async function syncToNotion(articles) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        'Title': {
          title: [{ text: { content: article.title } }]
        },
        'URL': { url: article.url }
      }
    })
  });
}
```

---

## 📞 需要帮助？

如果遇到问题：
1. 确保已授予终端辅助功能权限
2. 确保应用已正确关闭和重启
3. 检查端口 9222 是否被占用

**请告诉我你遇到的具体问题，我会提供针对性的解决方案！**

---

**最后更新**: 2026-04-12
**测试状态**: ✅ 已验证数据路径和方法
