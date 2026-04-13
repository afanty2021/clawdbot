#!/usr/bin/env tsx

/**
 * 基于固定坐标的完全自动化提取器
 * 假设地址栏位置固定，直接点击坐标获取链接
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class FixedCoordinateExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  /**
   * 获取窗口信息以确定地址栏坐标
   */
  getAddressBarCoordinates(): { x: number; y: number } | null {
    console.log('📍 获取地址栏坐标...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          tell front window
            set b to bounds
            set x to item 1 of b
            set y to item 2 of b
            set w to item 3 of b - item 1 of b
            set h to item 4 of b - item 2 of b

            -- 地址栏通常在窗口顶部中央
            set addressX to x + (w / 2)
            set addressY to y + 50

            return addressX & "," & addressY
          end tell
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      const [x, y] = result.trim().split(',').map(Number);
      console.log(`✅ 地址栏坐标: (${x}, ${y})\n`);
      return { x, y };
    } catch (error) {
      console.log('⚠️  无法自动获取坐标，使用默认值');
      // 默认值：屏幕中央偏上
      return { x: 960, y: 100 };
    }
  }

  /**
   * 使用固定坐标点击地址栏并复制
   */
  extractWithFixedCoordinates(): string {
    console.log('🖱️  使用固定坐标操作...\n');

    const coords = this.getAddressBarCoordinates();

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏位置
          click at {${coords.x}, ${coords.y}}
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
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1000);

      // 从剪贴板读取
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();
      console.log(`📋 剪贴板内容: ${clipboard}\n`);

      // 检查是否为链接
      if (clipboard.includes('mp.weixin.qq.com')) {
        const urlMatch = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[1];
          console.log(`✅ 成功提取链接: ${url}\n`);
          return url;
        }
      }

      // 如果直接复制的就是 URL
      if (clipboard.startsWith('http')) {
        console.log(`✅ 成功提取链接: ${clipboard}\n`);
        return clipboard;
      }

      console.log('⚠️  剪贴板内容不是预期的链接\n');
      return '';

    } catch (error) {
      console.error('❌ 固定坐标操作失败:', error);
      return '';
    }
  }

  /**
   * 在 Chrome 中验证
   */
  async verifyInChrome(url: string): Promise<void> {
    console.log('🌐 在 Chrome 中打开验证...');
    console.log(`📎 URL: ${url}\n`);

    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
    console.log('✅ Chrome 已打开');

    console.log('⏳ 等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const screenshot = this.captureScreenshot();
    console.log(`📸 验证截图: ${screenshot}\n`);
  }

  /**
   * 截取屏幕
   */
  captureScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-fixed-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    return filename;
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 基于固定坐标的完全自动化提取器\n');
    console.log('='.repeat(60));

    // 激活应用
    console.log('🎯 激活 ima.copilot...');
    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 应用已激活\n');
    } catch (error) {
      console.log('⚠️  激活失败，继续尝试...');
    }

    // 使用固定坐标提取
    const url = this.extractWithFixedCoordinates();

    if (url) {
      // 验证
      await this.verifyInChrome(url);

      // 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        method: 'fixed_coordinates'
      };

      const resultPath = path.join(process.cwd(), 'ima-fixed-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log('='.repeat(60));
      console.log('🎉 成功完成！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}`);
      console.log(`💾 结果文件: ${resultPath}\n`);

    } else {
      console.log('❌ 未能提取链接');
      console.log('\n💡 可能的原因:');
      console.log('   1. 地址栏坐标不正确');
      console.log('   2. ima.copilot 窗口未在前台');
      console.log('   3. 文章未完全加载');
      console.log('\n🔧 故障排除:');
      console.log('   • 确保 ima.copilot 窗口可见且最大化');
      console.log('   • 确认一篇文章已在应用中打开');
      console.log('   • 检查终端是否有辅助功能权限');
    }
  }
}

// 主函数
async function main() {
  const extractor = new FixedCoordinateExtractor();
  await extractor.run();
}

main().catch(console.error);
