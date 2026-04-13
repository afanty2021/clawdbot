#!/usr/bin/env tsx

/**
 * 在 Chrome 中打开并验证微信公众号文章链接
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface WeChatArticle {
  title: string;
  url: string;
  author: string;
  publishTime: string;
}

class WeChatLinkValidator {
  /**
   * 在 Chrome 中打开链接
   */
  openInChrome(url: string): void {
    console.log(`\n🌐 在 Chrome 中打开链接...`);
    console.log(`URL: ${url}`);

    try {
      // 使用 Chrome 打开链接
      execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 已在 Chrome 中打开');

      // 等待页面加载
      console.log('⏳ 等待页面加载...');
      execSync('sleep 3');

    } catch (error) {
      console.error('❌ 打开链接失败:', error);
      // 备用方案：使用默认浏览器
      console.log('🔄 尝试使用默认浏览器...');
      execSync(`open "${url}"`, { encoding: 'utf-8' });
    }
  }

  /**
   * 截取页面截图
   */
  capturePage(): string {
    const timestamp = Date.now();
    const screenshotPath = path.join(process.cwd(), `wechat-article-${timestamp}.png`);

    try {
      // 截取屏幕
      execSync(`screencapture -x "${screenshotPath}"`, { encoding: 'utf-8' });
      console.log(`📸 页面截图已保存: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('❌ 截图失败:', error);
      return '';
    }
  }

  /**
   * 使用 Playwright 验证链接（如果可用）
   */
  async validateWithPlaywright(url: string): Promise<any> {
    console.log('\n🔍 使用 Playwright 验证链接...');

    try {
      // 动态导入 puppeteer 或 playwright
      const { chromium } = await import('playwright');

      const browser = await chromium.launch({ headless: false });
      const page = await browser.newPage();

      console.log('📄 导航到页面...');
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 提取文章信息
      const articleInfo = await page.evaluate(() => {
        return {
          title: document.querySelector('#activity-name')?.textContent?.trim() ||
                 document.querySelector('.rich_media_title')?.textContent?.trim() ||
                 document.title,
          author: document.querySelector('#js_author_name')?.textContent?.trim() ||
                   document.querySelector('.rich_media_meta_link')?.textContent?.trim(),
          publishTime: document.querySelector('#publish_time')?.textContent?.trim() ||
                        document.querySelector('.rich_media_meta_text')?.textContent?.trim(),
          content: document.querySelector('#js_content')?.textContent?.substring(0, 200) ||
                    document.querySelector('.rich_media_content')?.textContent?.substring(0, 200)
        };
      });

      console.log('\n✅ 文章信息:');
      console.log(`标题: ${articleInfo.title}`);
      console.log(`作者: ${articleInfo.author}`);
      console.log(`发布时间: ${articleInfo.publishTime}`);
      console.log(`内容预览: ${articleInfo.content}...`);

      // 截图
      const screenshotPath = path.join(process.cwd(), `wechat-article-validated-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`\n📸 验证截图已保存: ${screenshotPath}`);

      await browser.close();

      return articleInfo;

    } catch (error) {
      console.error('❌ Playwright 验证失败:', error);
      console.log('💡 建议安装 Playwright: pnpm add -D playwright');
      return null;
    }
  }

  /**
   * 使用简单 HTTP 请求验证
   */
  async validateWithHTTP(url: string): Promise<any> {
    console.log('\n🔍 使用 HTTP 请求验证链接...');

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // 简单解析 HTML
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
      const urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/);

      const info = {
        title: titleMatch?.[1] || '',
        description: descMatch?.[1] || '',
        url: urlMatch?.[1] || url,
        statusCode: response.status
      };

      console.log('\n✅ 链接验证成功:');
      console.log(`状态码: ${info.statusCode}`);
      console.log(`标题: ${info.title}`);
      console.log(`描述: ${info.description.substring(0, 100)}...`);

      return info;

    } catch (error) {
      console.error('❌ HTTP 验证失败:', error);
      return null;
    }
  }

  /**
   * 运行验证流程
   */
  async run(url: string): Promise<void> {
    console.log('🚀 开始验证微信公众号文章链接\n');
    console.log('='.repeat(60));

    // 1. 在 Chrome 中打开
    this.openInChrome(url);

    // 2. 尝试使用 Playwright 验证
    const playwrightInfo = await this.validateWithPlaywright(url);

    if (!playwrightInfo) {
      // 3. 备用方案：使用 HTTP 验证
      const httpInfo = await this.validateWithHTTP(url);
    }

    // 4. 截取最终状态
    const finalScreenshot = this.capturePage();

    // 5. 保存验证结果
    const result = {
      timestamp: new Date().toISOString(),
      url,
      playwrightInfo,
      screenshot: finalScreenshot
    };

    const resultPath = path.join(process.cwd(), 'wechat-link-validation.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('✅ 验证完成！');
    console.log(`\n💾 结果已保存到: ${resultPath}`);
    console.log('\n📋 验证摘要:');
    console.log(`- URL: ${url}`);
    console.log(`- Playwright 验证: ${playwrightInfo ? '✅ 成功' : '❌ 失败'}`);
    console.log(`- 截图: ${finalScreenshot}`);
  }
}

// 主函数
async function main() {
  // 示例微信公众号文章链接（可以根据实际需要替换）
  const exampleURL = 'https://mp.weixin.qq.com/s/xxxxxxxxxxxxx';

  console.log('📝 使用方法：');
  console.log('1. 从 ima.copilot 中复制一个微信公众号文章链接');
  console.log('2. 运行此脚本: pnpm tsx validate-wechat-link.ts <链接>');
  console.log('3. 或者直接运行使用示例链接进行演示\n');

  // 获取命令行参数或使用示例
  const url = process.argv[2] || exampleURL;

  console.log(`🔗 验证链接: ${url}\n`);

  const validator = new WeChatLinkValidator();
  await validator.run(url);
}

// 运行
main().catch(console.error);
