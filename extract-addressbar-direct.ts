#!/usr/bin/env tsx

/**
 * 从 ima.copilot 地址栏直接获取链接并验证
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class AddressBarExtractor {
  /**
   * 从地址栏复制链接
   */
  copyFromAddressBar(): string {
    console.log('📋 从 ima.copilot 地址栏复制链接...\n');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 聚焦地址栏 (Cmd+L)
          keystroke "l" using command down
          delay 0.5

          -- 全选 (Cmd+A)
          keystroke "a" using command down
          delay 0.3

          -- 复制 (Cmd+C)
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8', stdio: 'inherit' });

      // 从剪贴板读取
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      console.log(`📝 剪贴板内容: ${clipboard}\n`);

      // 检查是否为微信公众号链接
      if (clipboard.includes('mp.weixin.qq.com')) {
        // 提取 URL（去掉可能的多余字符）
        const urlMatch = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[1];
          console.log(`✅ 成功提取链接: ${url}\n`);
          return url;
        }
      }

      // 如果直接复制的就是完整 URL
      if (clipboard.startsWith('http')) {
        console.log(`✅ 成功提取链接: ${clipboard}\n`);
        return clipboard;
      }

      console.log('❌ 未找到有效的微信公众号链接\n');
      return '';
    } catch (error) {
      console.error('❌ 复制失败:', error);
      return '';
    }
  }

  /**
   * 在 Chrome 中打开并验证
   */
  openInChrome(url: string): void {
    console.log('🌐 在 Chrome 中打开链接...');
    console.log(`📎 URL: ${url}\n`);

    try {
      execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
      console.log('✅ Chrome 已打开链接\n');
    } catch (error) {
      // 备用
      execSync(`open "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 默认浏览器已打开链接\n');
    }
  }

  /**
   * 等待并截图
   */
  async waitAndCapture(): Promise<string> {
    console.log('⏳ 等待页面加载...');

    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ 页面已加载\n');

    // 截图
    console.log('📸 截取验证截图...');
    const timestamp = Date.now();
    const filename = `ima-addressbar-verify-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    console.log(`✅ 截图已保存: ${filename}\n`);

    return filepath;
  }

  /**
   * 运行流程
   */
  async run(): Promise<void> {
    console.log('🚀 从 ima.copilot 地址栏获取链接\n');
    console.log('='.repeat(60));
    console.log('📋 前置条件:');
    console.log('   1. ima.copilot 正在运行');
    console.log('   2. 一篇微信公众号文章已打开');
    console.log('   3. 链接显示在地址栏中');
    console.log('='.repeat(60));
    console.log('');

    // 1. 从地址栏复制链接
    const url = this.copyFromAddressBar();

    if (!url) {
      console.log('❌ 未能获取链接');
      console.log('\n💡 请确保:');
      console.log('   - ima.copilot 窗口在前台');
      console.log('   - 文章已打开');
      console.log('   - 地址栏中包含 mp.weixin.qq.com 链接');
      return;
    }

    // 2. 在 Chrome 中打开
    this.openInChrome(url);

    // 3. 等待并截图
    const screenshot = await this.waitAndCapture();

    // 4. 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      url,
      screenshot,
      method: 'address_bar_direct'
    };

    const resultPath = path.join(process.cwd(), 'ima-addressbar-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    // 5. 显示结果
    console.log('='.repeat(60));
    console.log('🎉 成功完成！');
    console.log('='.repeat(60));
    console.log(`📋 文章链接: ${url}`);
    console.log(`📸 验证截图: ${screenshot}`);
    console.log(`💾 结果文件: ${resultPath}\n`);
  }
}

// 主函数
async function main() {
  const extractor = new AddressBarExtractor();
  await extractor.run();
}

main().catch(console.error);
