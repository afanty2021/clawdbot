#!/usr/bin/env tsx

/**
 * 简单可靠的方法：
 * 1. 在 ima.copilot 中手动复制文章链接
 * 2. 自动从剪贴板读取并验证
 * 3. 在 Chrome 中打开验证
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ArticleLink {
  url: string;
  title?: string;
  timestamp: string;
}

class SimpleIMACopilotExtractor {
  /**
   * 从剪贴板获取链接
   */
  getFromClipboard(): string {
    console.log('📋 从剪贴板读取...\n');

    try {
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' });
      return clipboard.trim();
    } catch (error) {
      console.error('❌ 读取剪贴板失败:', error);
      return '';
    }
  }

  /**
   * 验证是否为微信公众号链接
   */
  isWeChatLink(text: string): boolean {
    return text.includes('mp.weixin.qq.com') ||
           text.includes('weixin.qq.com') ||
           text.includes('mp.weixin');
  }

  /**
   * 提取链接（支持纯文本或包含链接的文本）
   */
  extractLink(text: string): string | null {
    // 如果直接是链接
    if (text.startsWith('http')) {
      return text.split('\n')[0].trim();
    }

    // 如果文本中包含链接
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    return null;
  }

  /**
   * 在 Chrome 中打开链接
   */
  openInChrome(url: string): void {
    console.log(`\n🌐 在 Chrome 中打开链接...`);
    console.log(`📎 URL: ${url}\n`);

    try {
      execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 已在 Chrome 中打开\n');
    } catch (error) {
      // 备用：使用默认浏览器
      execSync(`open "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 已在默认浏览器中打开\n');
    }
  }

  /**
   * 等待并验证页面加载
   */
  async waitForPageLoad(): Promise<void> {
    console.log('⏳ 等待页面加载...');
    execSync('sleep 3');
    console.log('✅ 页面已加载\n');
  }

  /**
   * 截取屏幕验证
   */
  captureVerification(): string {
    const timestamp = Date.now();
    const filename = `ima-verification-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    console.log('📸 截取验证截图...');

    try {
      execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
      console.log(`✅ 截图已保存: ${filepath}\n`);
      return filepath;
    } catch (error) {
      console.error('❌ 截图失败');
      return '';
    }
  }

  /**
   * 显示操作指南
   */
  showGuide(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📖 操作指南');
    console.log('='.repeat(60));
    console.log('\n步骤 1: 在 ima.copilot 中复制文章链接');
    console.log('  1. 确保 ima.copilot 窗口在前台');
    console.log('  2. 在知识库中找到一篇微信公众号文章');
    console.log('  3. 右键点击文章，选择"复制链接"或"分享"');
    console.log('  4. 或者点击文章进入详情页，复制浏览器地址栏的链接');
    console.log('\n步骤 2: 返回终端');
    console.log('  - 按 Enter 键继续');
    console.log('\n步骤 3: 自动验证');
    console.log('  - 脚本会自动读取剪贴板');
    console.log('  - 在 Chrome 中打开链接');
    console.log('  - 截取验证截图');
    console.log('\n' + '='.repeat(60));
  }

  /**
   * 等待用户确认
   */
  waitForUser(): void {
    console.log('\n⏸️  请按照上述指南在 ima.copilot 中复制文章链接');
    console.log('📋 复制完成后，按 Enter 键继续...\n');

    // 等待用户输入
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise<void>((resolve) => {
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 IMA Copilot 文章链接提取工具\n');

    // 显示指南
    this.showGuide();

    // 等待用户操作
    await this.waitForUser();

    // 从剪贴板读取
    const clipboard = this.getFromClipboard();

    if (!clipboard) {
      console.log('❌ 剪贴板为空');
      return;
    }

    console.log(`📝 剪贴板内容 (${clipboard.length} 字符):`);
    console.log(clipboard.substring(0, 200) + (clipboard.length > 200 ? '...' : ''));
    console.log();

    // 检查是否为微信公众号链接
    if (!this.isWeChatLink(clipboard)) {
      console.log('⚠️  剪贴板内容不包含微信公众号链接');
      console.log('💡 请确保复制的是 mp.weixin.qq.com 链接');
      console.log('\n重新运行脚本重试');
      return;
    }

    // 提取链接
    const url = this.extractLink(clipboard);

    if (!url) {
      console.log('❌ 无法从剪贴板提取链接');
      return;
    }

    console.log(`✅ 成功提取链接: ${url}\n`);

    // 在 Chrome 中打开
    this.openInChrome(url);

    // 等待页面加载
    await this.waitForPageLoad();

    // 截取验证
    const screenshot = this.captureVerification();

    // 保存结果
    const result: ArticleLink = {
      url,
      title: clipboard.substring(0, 100),
      timestamp: new Date().toISOString()
    };

    const resultPath = path.join(process.cwd(), 'ima-article-link.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log('💾 结果已保存到: ' + resultPath);
    console.log('📸 验证截图: ' + screenshot);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 提取和验证完成！');
    console.log('='.repeat(60));
    console.log('\n📋 摘要:');
    console.log(`  链接: ${url}`);
    console.log(`  时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(`  截图: ${screenshot}`);
    console.log('\n💡 提示: 如果需要提取更多链接，重新运行脚本即可');
  }
}

// 主函数
async function main() {
  const extractor = new SimpleIMACopilotExtractor();
  await extractor.run();
}

// 运行
main().catch(console.error);
