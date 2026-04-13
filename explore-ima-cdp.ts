#!/usr/bin/env tsx

/**
 * iMa Electron 应用探索工具 (通过 CDP)
 *
 * 如果 iMa 是 Electron 应用，我们可以：
 * 1. 启用 iMa 的开发者工具
 * 2. 通过 Chrome DevTools Protocol (CDP) 连接
 * 3. 获取应用内部数据
 */

import { chromium, CDPSession } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface IMAInternalData {
  localStorage: any;
  sessionStorage: any;
  indexedDB: any;
  internalState: any;
  articles: any[];
}

class IMACDPExplorer {
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private cdp: CDPSession | null = null;

  /**
   * 初始化 CDP 连接
   */
  async init() {
    console.log('🚀 初始化 CDP 连接...');

    // 启动 Chrome 远程调试
    this.browser = await chromium.launch({
      headless: false,
      args: ['--remote-debugging-port=9222'],
      slowMo: 50
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    this.page = await this.context.newPage();

    // 获取 CDP 会话
    this.cdp = await this.page.context().newCDPSession(this.page);

    console.log('✅ CDP 连接已建立');
  }

  /**
   * 启用 iMa 的开发者工具
   */
  async enableIMADevTools() {
    console.log('🔧 启用 iMa 开发者工具...');
    console.log('\n请按以下步骤操作：');
    console.log('1. 打开 iMa 应用');
    console.log('2. 按 Cmd+Option+I (Mac) 或 Ctrl+Shift+I (Windows/Linux) 打开开发者工具');
    console.log('3. 在 Console 标签中，运行以下命令获取应用信息：\n');

    const commands = {
      // 获取应用信息
      appInfo: `
// 获取应用基本信息
console.log('应用标题:', document.title);
console.log('应用 URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('Electron 版本:', process?.versions?.electron || 'N/A');
`,

      // 获取本地存储
      storage: `
// 获取 localStorage
console.log('localStorage:', JSON.stringify(localStorage));

// 获取 sessionStorage
console.log('sessionStorage:', JSON.stringify(sessionStorage));
`,

      // 搜索 IndexedDB
      indexedDB: `
// 列出所有 IndexedDB 数据库
const databases = await indexedDB.databases();
console.log('IndexedDB 数据库:', databases);

// 遍历数据库
for (const db of databases) {
  const request = indexedDB.open(db.name!);
  request.onsuccess = async () => {
    const dbConnection = request.result;
    console.log('数据库', db.name, '对象存储:', Array.from(dbConnection.objectStoreNames));
    dbConnection.close();
  };
}
`,

      // 搜索文章数据
      searchArticles: `
// 搜索可能包含文章数据的全局变量
const articleKeys = Object.keys(window).filter(key =>
  key.includes('article') ||
  key.includes('content') ||
  key.includes('message') ||
  key.includes('collection') ||
  key.includes('library')
);

console.log('可能包含文章数据的全局变量:', articleKeys);

// 尝试获取数据
articleKeys.forEach(key => {
  try {
    const data = window[key];
    if (data && typeof data === 'object') {
      console.log(key, ':', JSON.stringify(data).substring(0, 200));
    }
  } catch (e) {
    // 忽略错误
  }
});
`,

      // 搜索微信公众号链接
      searchWeChatLinks: `
// 搜索所有链接中的微信公众号文章
const links = document.querySelectorAll('a[href*="mp.weixin.qq.com"], a[href*="weixin"]');
console.log('找到', links.length, '个微信公众号链接');

links.forEach((link, index) => {
  console.log(\`\${index + 1}. \${link.textContent}\`);
  console.log(\`   URL: \${link.href}\`);
});
`,

      // 获取 React/Vue 内部状态
      frameworkState: `
// 检查 React
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React 应用已检测到');
  const rootFiber = document.querySelector('__reactRoot')?.['_reactRootContainer']?._internalRoot?.current;
  console.log('React 状态:', rootFiber);
}

// 检查 Vue
if (window.__VUE__) {
  console.log('Vue 应用已检测到');
  console.log('Vue 实例:', window.__VUE__);
}

// 检查 Angular
if (window.ng) {
  console.log('Angular 应用已检测到');
  const probes = window.getAllAngularRootElements?.();
  console.log('Angular 根元素:', probes);
}
`,

      // 网络请求拦截
      networkMonitor: `
// 拦截网络请求，查找 API 调用
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  const url = args[0];

  if (url.includes('api') || url.includes('article') || url.includes('content')) {
    console.log('API 请求:', url);
    response.clone().json().then(data => {
      console.log('API 响应:', data);
    }).catch(() => {});
  }

  return response;
};

console.log('网络请求拦截已启用');
`
    };

    for (const [name, code] of Object.entries(commands)) {
      console.log(`\n=== ${name.toUpperCase()} ===`);
      console.log(code);
    }
  }

  /**
   * 从 iMa 提取数据
   */
  async extractIMaData(): Promise<IMAInternalData> {
    const data: IMAInternalData = {
      localStorage: {},
      sessionStorage: {},
      indexedDB: {},
      internalState: {},
      articles: []
    };

    if (!this.page) {
      throw new Error('页面未初始化');
    }

    try {
      // 获取 localStorage
      data.localStorage = await this.page.evaluate(() => {
        const items: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key);
          }
        }
        return items;
      });

      console.log('✅ 提取 localStorage');

      // 获取 sessionStorage
      data.sessionStorage = await this.page.evaluate(() => {
        const items: any = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            items[key] = sessionStorage.getItem(key);
          }
        }
        return items;
      });

      console.log('✅ 提取 sessionStorage');

      // 搜索微信公众号链接
      data.articles = await this.page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="mp.weixin.qq.com"], a[href*="weixin"]');
        return Array.from(links).map(link => ({
          title: link.textContent?.trim(),
          url: (link as HTMLAnchorElement).href
        }));
      });

      console.log(`✅ 提取到 ${data.articles.length} 个文章链接`);

      // 搜索应用内部状态
      data.internalState = await this.page.evaluate(() => {
        const state: any = {};

        // 搜索常见的全局变量
        const possibleKeys = [
          '__INITIAL_STATE__',
          '__NUXT__',
          '__DATA__',
          'store',
          'app',
          'router',
          '__reactInternalInstance',
          '__REACT_DEVTOOLS_GLOBAL_HOOK__'
        ];

        possibleKeys.forEach(key => {
          if (window[key as keyof Window] !== undefined) {
            state[key] = JSON.stringify(window[key as keyof Window]).substring(0, 500);
          }
        });

        return state;
      });

      console.log('✅ 提取内部状态');

    } catch (error) {
      console.error('❌ 提取数据失败:', error);
    }

    return data;
  }

  /**
   * 保存提取的数据
   */
  async saveData(data: IMAInternalData) {
    const outputPath = path.join(process.cwd(), 'ima-cdp-data.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }, null, 2), 'utf-8');

    console.log(`\n💾 数据已保存到: ${outputPath}`);

    // 同时保存一个可读的摘要
    const summaryPath = path.join(process.cwd(), 'ima-summary.md');
    const summary = `# iMa 数据提取摘要

**提取时间**: ${new Date().toLocaleString('zh-CN')}

## 文章链接

找到 ${data.articles.length} 个微信公众号文章链接：

${data.articles.map((a, i) => `${i + 1}. [${a.title || '(无标题)'}](${a.url})`).join('\n')}

## LocalStorage 键

${Object.keys(data.localStorage).join(', ')}

## SessionStorage 键

${Object.keys(data.sessionStorage).join(', ')}

## 内部状态

${Object.keys(data.internalState).map(key => `### ${key}\n\`\`\`\n${data.internalState[key]}\n\`\`\``).join('\n\n')}
`;

    fs.writeFileSync(summaryPath, summary, 'utf-8');
    console.log(`📄 摘要已保存到: ${summaryPath}`);
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 连接已关闭');
    }
  }

  /**
   * 执行完整的探索流程
   */
  async run() {
    try {
      console.log('🚀 开始探索 iMa Electron 应用...\n');

      // 1. 初始化
      await this.init();

      // 2. 显示开发者工具使用说明
      await this.enableIMADevTools();

      console.log('\n⏸️  请按照上述说明在 iMa 中运行代码，然后按任意键继续...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });

      console.log('\n🔍 如果 iMa 是 Electron 应用，请找到其远程调试端口...');
      console.log('通常在启动参数中添加 --remote-debugging-port=9222');

      // 3. 如果能连接到 iMa 的 CDP，提取数据
      console.log('\n尝试连接到 iMa 的 CDP 端点...');

      try {
        // 尝试连接到可能的 CDP 端点
        const cdpUrls = [
          'http://localhost:9222',
          'http://localhost:9223',
          'http://localhost:9224'
        ];

        for (const url of cdpUrls) {
          try {
            console.log(`尝试连接: ${url}`);
            const response = await fetch(`${url}/json/list`);
            const targets = await response.json();

            if (targets.length > 0) {
              console.log(`✅ 成功连接到 CDP 端点: ${url}`);
              console.log('可用的目标:', targets.map((t: any) => t.title));

              // 找到 iMa 的页面
              const imaTarget = targets.find((t: any) =>
                t.title.includes('iMa') ||
                t.title.includes('微信阅读')
              );

              if (imaTarget) {
                console.log(`找到 iMa 页面: ${imaTarget.title}`);

                // 导航到 iMa 的 DevTools URL
                await this.page.goto(imaTarget.url);
                await this.page.waitForTimeout(2000);

                // 提取数据
                const data = await this.extractIMaData();
                await this.saveData(data);

                console.log('\n✅ 数据提取完成！');
                break;
              }
            }
          } catch (error) {
            console.log(`❌ 连接失败: ${url}`);
            continue;
          }
        }
      } catch (error) {
        console.error('❌ CDP 连接失败:', error);
      }

      console.log('\n按任意键退出...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });

    } catch (error) {
      console.error('❌ 发生错误:', error);
    } finally {
      await this.close();
    }
  }
}

// 主函数
async function main() {
  const explorer = new IMACDPExplorer();
  await explorer.run();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { IMACDPExplorer, IMAInternalData };
