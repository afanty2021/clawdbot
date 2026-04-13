#!/usr/bin/env tsx

/**
 * 使用 Chrome DevTools Protocol 从 ima.copilot 提取数据
 */

import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function extractWithDevTools() {
  console.log('🔧 使用 Chrome DevTools Protocol 提取数据\n');
  console.log('='.repeat(60));

  // 首先启用远程调试
  console.log('📝 启用远程调试...');
  try {
    execSync('defaults write com.tencent.imamac.plist ChromiumRemoteDebuggingPort -int 9222', {
      encoding: 'utf-8'
    });
    console.log('✅ 远程调试已启用');
  } catch (error) {
    console.log('⚠️  启用远程调试时出现警告');
  }

  // 重启应用
  console.log('\n🔄 重启 ima.copilot...');
  execSync('killall "ima.copilot"', { encoding: 'utf-8' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  execSync('open -a "ima.copilot"', { encoding: 'utf-8' });
  console.log('⏳ 等待应用启动...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 连接到 CDP
  console.log('\n🔗 连接到 Chrome DevTools Protocol...');

  try {
    // 尝试连接到 CDP 端点
    const cdpResponse = await fetch('http://localhost:9222/json');
    const targets = await cdpResponse.json();

    console.log(`✅ 找到 ${targets.length} 个目标`);

    // 查找 ima.copilot 相关的页面
    const imaPages = targets.filter((t: any) =>
      t.title.includes('ima') ||
      t.title.includes('微信') ||
      t.url.includes('ima.qq.com')
    );

    if (imaPages.length > 0) {
      console.log(`\n✅ 找到 ima.copilot 页面:`);
      imaPages.forEach((page: any) => {
        console.log(`   - ${page.title}`);
        console.log(`     URL: ${page.url}`);
      });

      // 使用 Playwright 连接到现有页面
      const browser = await chromium.connect('http://localhost:9222');
      const context = browser.contexts()[0];
      const pages = context.pages();

      console.log(`\n📄 找到 ${pages.length} 个页面`);

      for (const page of pages) {
        try {
          const url = page.url();
          console.log(`\n检查页面: ${url}`);

          if (url.includes('ima.qq.com') || url.includes('weixin.qq.com')) {
            console.log(`✅ 找到目标页面!`);

            // 获取页面内容
            const articles = await page.evaluate(() => {
              const results: any[] = [];

              // 获取所有链接
              const links = document.querySelectorAll('a[href*="mp.weixin.qq.com"]');
              links.forEach(link => {
                results.push({
                  type: 'link',
                  url: (link as HTMLAnchorElement).href,
                  text: link.textContent?.trim()
                });
                                      });

              // 获取所有文本
                                      const textElements = document.querySelectorAll('*');
                                      textElements.forEach(el => {
                                        const text = el.textContent;
                                        if (text && text.includes('mp.weixin.qq.com')) {
                                          const match = text.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
                                          if (match && !results.some(r => r.url === match[1])) {
                                            results.push({
                                              type: 'text',
                                              url: match[1]
                                            });
                                          }
                                        }
                                      });

              return results;
            });

            console.log(`\n📊 找到 ${articles.length} 个链接:`);
            articles.slice(0, 5).forEach((article, i) => {
              console.log(`  ${i + 1}. ${article.url}`);
              if (article.text) {
                                        console.log(`     ${article.text.substring(0, 50)}...`);
                                      }
                                    });

            if (articles.length > 0) {
              // 使用第一个链接进行验证
                                      const firstArticle = articles[0];
                                      console.log(`\n🌐 在 Chrome 中打开第一个链接进行验证...`);

                                      // 打开新的 Chrome 窗口验证
                                      execSync(`open -a "Google Chrome" "${firstArticle.url}"`, {
                                        encoding: 'utf-8'
                                      });

                                      await new Promise(resolve => setTimeout(resolve, 3000));

                                      // 截图
                                      const timestamp = Date.now();
                                      const filename = `ima-devtools-verify-${timestamp}.png`;
                                      const filepath = path.join(process.cwd(), filename);
                                      execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });

                                      console.log(`\n✅ 验证完成!`);
                                      console.log(`📋 链接: ${firstArticle.url}`);
                                      console.log(`📸 截图: ${filename}`);

                                      // 保存结果
                                      const result = {
                                        timestamp: new Date().toISOString(),
                                        articles,
                                        verified: firstArticle.url,
                                        screenshot: filename
                                      };

                                      const resultPath = path.join(process.cwd(), 'ima-devtools-result.json');
                                      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
                                      console.log(`💾 结果: ${resultPath}`);
                                    }

            await browser.close();
            return;
          }
        } catch (error) {
          console.log(`⚠️  页面检查失败: ${error}`);
        }
      }

    } else {
      console.log('\n❌ 未找到 ima.copilot 页面');
      console.log('\n💡 可能的原因:');
      console.log('   1. 应用未使用 CEF (Chromium Embedded Framework)');
      console.log('   2. 远程调试端口未正确启用');
      console.log('   3. 需要在应用中打开一篇文章');
    }

  } catch (error) {
    console.error('❌ CDP 连接失败:', error);
    console.log('\n💡 建议使用以下替代方案:');
    console.log('   1. 手动复制链接: ./verify-ima-link.sh');
    console.log('   2. 直接读取数据库: ima-final-guide.md');
  }

  console.log('\n' + '='.repeat(60));
}

// 主函数
extractWithDevTools().catch(console.error);
