/**
 * iMa (微信阅读) GUI 探索工具
 * 目标：自动化获取知识库中的微信公众号文章链接
 *
 * 使用方法：
 * 1. 确保 iMa (weread.qq.com) 已登录
 * 2. 运行此脚本探索 GUI 结构
 * 3. 分析提取的文章链接数据
 */

import Stagehand from '@browser-use/base/dist';
import { chromium } from '@playwright/test';

interface ArticleInfo {
  title: string;
  url: string;
  author?: string;
  publishTime?: string;
  summary?: string;
}

interface KnowledgeBase {
  name: string;
  articles: ArticleInfo[];
}

class IMAExplorer {
  private stagehand: Stagehand | null = null;
  private browser: any = null;
  private context: any = null;
  private page: any = null;

  /**
   * 初始化浏览器和 Stagehand
   */
  async init(headless: boolean = false) {
    console.log('🚀 初始化浏览器...');

    this.browser = await chromium.launch({
      headless,
      slowMo: 50 // 减慢操作速度以便观察
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    this.page = await this.context.newPage();

    this.stagehand = new Stagehand(this.page, {
      verbose: 1,
      modelApiKeys: {
        openai: process.env.OPENAI_API_KEY || '',
        anthropic: process.env.ANTHROPIC_API_KEY || ''
      }
    });

    await this.stagehand.init();

    console.log('✅ 浏览器初始化完成');
  }

  /**
   * 导航到 iMa 主页
   */
  async navigateToIMA() {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    console.log('📍 导航到 iMa (微信阅读)...');
    await this.page.goto('https://weread.qq.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 等待页面加载完成
    await this.page.waitForTimeout(2000);
    console.log('✅ 页面加载完成');
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false;

    // 检查是否有登录按钮（未登录状态）
    const loginButton = await this.page.$('text=登录');
    if (loginButton) {
      console.log('⚠️  未登录状态，请先登录 iMa');
      return false;
    }

    console.log('✅ 已登录状态');
    return true;
  }

  /**
   * 探索知识库页面
   */
  async exploreKnowledgeBase() {
    if (!this.page || !this.stagehand) {
      throw new Error('浏览器未初始化');
    }

    console.log('📚 探索知识库页面...');

    // 方法1：尝试直接访问知识库页面
    const kbUrls = [
      'https://weread.qq.com/web/category/knowledge',
      'https://weread.qq.com/web/knowledge',
      'https://weread.qq.com/web/shelf'
    ];

    for (const url of kbUrls) {
      try {
        console.log(`   尝试访问: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await this.page.waitForTimeout(1000);

        // 检查页面是否有效加载
        const title = await this.page.title();
        console.log(`   页面标题: ${title}`);

        // 截图保存
        await this.page.screenshot({
          path: `ima-screenshot-${Date.now()}.png`,
          fullPage: true
        });

        // 如果页面有效，停止尝试其他 URL
        if (!title.includes('错误') && !title.includes('Error')) {
          console.log(`✅ 成功访问: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`   ❌ 访问失败: ${url}`);
        continue;
      }
    }

    // 使用 Stagehand 分析页面结构
    console.log('\n🔍 分析页面结构...');
    const observations = await this.stagehand.observe({
      instruction: '分析当前页面的结构，找出：1. 知识库列表 2. 文章列表 3. 文章链接',
      onlyElements: true
    });

    console.log('📊 页面元素分析结果:');
    console.log(JSON.stringify(observations, null, 2));

    return observations;
  }

  /**
   * 获取知识库列表
   */
  async getKnowledgeBaseList(): Promise<KnowledgeBase[]> {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    console.log('📋 获取知识库列表...');

    const knowledgeBases: KnowledgeBase[] = [];

    try {
      // 尝试找到知识库选择器或列表
      const kbSelectors = [
        '.knowledge-base-list',
        '.kb-list',
        '[class*="knowledge"]',
        '[class*="collection"]',
        '.shelf-list'
      ];

      for (const selector of kbSelectors) {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          console.log(`找到 ${elements.length} 个知识库元素 (选择器: ${selector})`);

          for (const element of elements) {
            const name = await element.textContent();
            if (name) {
              knowledgeBases.push({
                name: name.trim(),
                articles: []
              });
            }
          }
          break;
        }
      }

      // 如果没有找到，使用 Stagehand 智能识别
      if (knowledgeBases.length === 0 && this.stagehand) {
        const result = await this.stagehand.act({
          instruction: '找到并点击知识库或收藏夹列表',
          verify: true
        });
        console.log('Stagehand 识别结果:', result);
      }

    } catch (error) {
      console.error('❌ 获取知识库列表失败:', error);
    }

    return knowledgeBases;
  }

  /**
   * 从当前页面提取文章链接
   */
  async extractArticleLinks(): Promise<ArticleInfo[]> {
    if (!this.page) {
      throw new Error('浏览器未初始化');
    }

    console.log('🔗 提取文章链接...');

    const articles: ArticleInfo[] = [];

    try {
      // 常见的微信公众号文章链接选择器
      const linkSelectors = [
        'a[href*="mp.weixin.qq.com"]',
        'a[href*="weixin"]',
        'a[href*="article"]',
        '.article-title a',
        '.book-title a',
        '[class*="article"] a',
        '[class*="title"] a'
      ];

      for (const selector of linkSelectors) {
        const links = await this.page.$$(selector);
        console.log(`找到 ${links.length} 个链接 (选择器: ${selector})`);

        for (const link of links) {
          try {
            const url = await link.getAttribute('href');
            const title = await link.textContent();
            const parent = await link.evaluateHandle((el: any) => el.parentElement);

            if (url && title) {
              // 过滤微信公众号文章链接
              if (url.includes('mp.weixin.qq.com') || url.includes('weixin')) {
                articles.push({
                  title: title.trim(),
                  url: url.startsWith('http') ? url : `https://weread.qq.com${url}`
                });
              }
            }
          } catch (error) {
            // 跳过无法处理的链接
            continue;
          }
        }

        if (articles.length > 0) {
          console.log(`✅ 提取到 ${articles.length} 个文章链接`);
          break;
        }
      }

      // 如果没有找到，使用 Stagehand 智能提取
      if (articles.length === 0 && this.stagehand) {
        console.log('🤖 使用 Stagehand 智能提取...');
        const result = await this.stagehand.extract({
          instruction: '提取页面中所有微信公众号文章的标题和链接',
          schema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    url: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        if (result && result.articles) {
          articles.push(...result.articles);
        }
      }

    } catch (error) {
      console.error('❌ 提取文章链接失败:', error);
    }

    return articles;
  }

  /**
   * 滚动页面加载更多内容
   */
  async scrollAndLoadMore(maxScrolls: number = 5) {
    if (!this.page) return;

    console.log('📜 滚动加载更多内容...');

    for (let i = 0; i < maxScrolls; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(1500);
      console.log(`   滚动 ${i + 1}/${maxScrolls}`);
    }
  }

  /**
   * 保存结果到文件
   */
  async saveResults(data: any, filename: string = 'ima-articles.json') {
    const fs = require('fs');
    const path = require('path');

    const outputPath = path.join(process.cwd(), filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 结果已保存到: ${outputPath}`);
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 浏览器已关闭');
    }
  }

  /**
   * 执行完整的探索流程
   */
  async run() {
    try {
      // 1. 初始化
      await this.init(false); // 设置为 false 以观察浏览器操作

      // 2. 导航到 iMa
      await this.navigateToIMA();

      // 3. 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        console.log('⏸️  请在浏览器中手动登录 iMa，然后按任意键继续...');
        await this.page.waitForTimeout(30000); // 等待 30 秒用于登录
      }

      // 4. 探索知识库
      const observations = await this.exploreKnowledgeBase();

      // 5. 获取知识库列表
      const knowledgeBases = await this.getKnowledgeBaseList();
      console.log(`\n📚 找到 ${knowledgeBases.length} 个知识库`);

      // 6. 滚动加载更多内容
      await this.scrollAndLoadMore();

      // 7. 提取文章链接
      const articles = await this.extractArticleLinks();
      console.log(`\n📝 提取到 ${articles.length} 篇文章`);

      // 8. 显示结果
      console.log('\n📊 文章列表:');
      articles.slice(0, 10).forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   ${article.url}`);
      });

      if (articles.length > 10) {
        console.log(`\n... 还有 ${articles.length - 10} 篇文章`);
      }

      // 9. 保存结果
      await this.saveResults({
        timestamp: new Date().toISOString(),
        knowledgeBases,
        articles,
        pageStructure: observations
      });

      console.log('\n✅ 探索完成！');

      // 保持浏览器打开以便查看
      console.log('\n按 Ctrl+C 退出...');
      await new Promise(() => {}); // 无限等待

    } catch (error) {
      console.error('❌ 发生错误:', error);
    } finally {
      await this.close();
    }
  }
}

// 主函数
async function main() {
  const explorer = new IMAExplorer();
  await explorer.run();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { IMAExplorer, ArticleInfo, KnowledgeBase };
