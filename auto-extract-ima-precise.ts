#!/usr/bin/env tsx

/**
 * 精确版 IMA 自动化流程
 * 使用已验证的固定坐标方法，但增加等待和验证步骤
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class PreciseIMAExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  /**
   * 激活应用
   */
  activateApp(): void {
    console.log('🎯 激活 ima.copilot...');
    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
      this.delay(2000);
      console.log('✅ 已激活\n');
    } catch (error) {
      console.log('⚠️  激活失败\n');
    }
  }

  /**
   * 点击坐标并验证
   */
  clickAndVerify(x: number, y: number, description: string): void {
    console.log(`🖱️  点击 ${description} (${x}, ${y})...`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {${x}, ${y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1000);
      console.log(`✅ 已点击\n`);
    } catch (error) {
      console.log('❌ 点击失败\n');
    }
  }

  /**
   * 双击坐标（用于打开文章）
   */
  doubleClick(x: number, y: number, description: string): void {
    console.log(`🖱️  双击 ${description} (${x}, ${y})...`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          -- 第一次点击
          click at {${x}, ${y}}
          delay 0.3
          -- 第二次点击
          click at {${x}, ${y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log(`✅ 已双击\n`);
    } catch (error) {
      console.log('❌ 双击失败\n');
    }
  }

  /**
   * 尝试从地址栏提取链接
   */
  extractFromAddressBar(): string {
    console.log('📋 从地址栏提取链接...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏（固定坐标：屏幕中央偏上）
          click at {960, 100}
          delay 0.5

          -- 全选并复制
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1000);

      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      // 检查是否为 URL
      if (clipboard.startsWith('http')) {
        console.log(`✅ 成功提取链接: ${clipboard.substring(0, 80)}...\n`);
        return clipboard;
      } else {
        console.log(`⚠️  剪贴板内容不是 URL`);
        console.log(`   内容: ${clipboard.substring(0, 100)}...\n`);
        return '';
      }
    } catch (error) {
      console.log('❌ 提取失败\n');
      return '';
    }
  }

  /**
   * 检查剪贴板内容类型
   */
  checkClipboardType(): string {
    const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

    if (clipboard.startsWith('http')) {
      return 'URL';
    } else if (clipboard.includes('SubAgent') || clipboard.includes('Agent')) {
      return 'ARTICLE_TITLE';
    } else if (clipboard.length > 200) {
      return 'ARTICLE_CONTENT';
    } else {
      return 'OTHER';
    }
  }

  /**
   * 在 Chrome 中验证
   */
  async verifyInChrome(url: string): Promise<void> {
    console.log('🌐 在 Chrome 中打开...');
    console.log(`📎 URL: ${url}\n`);

    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
    console.log('✅ Chrome 已打开');

    console.log('⏳ 等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const screenshot = this.captureScreenshot();
    console.log(`📸 截图: ${screenshot}\n`);

    // 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      url,
      method: 'precise_automation'
    };

    const resultPath = path.join(process.cwd(), 'ima-precise-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 结果已保存: ${resultPath}\n`);
  }

  /**
   * 截图
   */
  captureScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-precise-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    return filename;
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 精确版 IMA 自动化流程\n');
    console.log('='.repeat(60));

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库（左侧导航栏）
    this.clickAndVerify(60, 120, '知识库图标');

    // 3. 等待知识库加载
    console.log('⏳ 等待知识库加载...');
    this.delay(2500);

    // 4. 点击 AI 知识库
    this.clickAndVerify(60, 200, 'AI 知识库');

    // 5. 等待文章列表加载
    console.log('⏳ 等待文章列表加载...');
    this.delay(2500);

    // 6. 尝试多种方法打开文章
    console.log('📄 尝试打开微信公众号文章...\n');

    // 方法1: 单击主内容区域
    console.log('方法 1: 单击文章区域');
    this.clickAndVerify(600, 300, '文章区域');

    // 检查剪贴板
    const type1 = this.checkClipboardType();
    console.log(`剪贴板类型: ${type1}`);

    if (type1 === 'URL') {
      const url = this.extractFromAddressBar();
      if (url) {
        await this.verifyInChrome(url);
        this.successSummary(url);
        return;
      }
    }

    // 方法2: 双击文章区域
    console.log('\n方法 2: 双击文章区域');
    this.doubleClick(600, 350, '文章区域');

    // 检查剪贴板
    const type2 = this.checkClipboardType();
    console.log(`剪贴板类型: ${type2}`);

    if (type2 === 'URL') {
      const url = this.extractFromAddressBar();
      if (url) {
        await this.verifyInChrome(url);
        this.successSummary(url);
        return;
      }
    }

    // 方法3: 尝试点击其他位置
    console.log('\n方法 3: 尝试其他位置');
    const positions = [
      { x: 500, y: 300 },
      { x: 700, y: 300 },
      { x: 600, y: 400 },
      { x: 600, y: 500 },
    ];

    for (const pos of positions) {
      this.doubleClick(pos.x, pos.y, `位置 (${pos.x}, ${pos.y})`);

      const type = this.checkClipboardType();
      console.log(`剪贴板类型: ${type}`);

      if (type === 'URL') {
        // 等待地址栏出现
        console.log('⏳ 检测到 URL，等待地址栏加载...');
        this.delay(1500);

        const url = this.extractFromAddressBar();
        if (url) {
          await this.verifyInChrome(url);
          this.successSummary(url);
          return;
        }
      }

      this.delay(1000);
    }

    // 所有方法都失败
    console.log('\n' + '='.repeat(60));
    console.log('❌ 所有方法都未能成功提取链接');
    console.log('='.repeat(60));
    console.log('\n💡 可能的问题：');
    console.log('   1. 文章没有完全打开');
    console.log('   2. 地址栏还没有出现');
    console.log('   3. 点击位置不正确');
    console.log('\n🔧 建议：');
    console.log('   1. 手动在 ima.copilot 中打开一篇文章');
    console.log('   2. 确认地址栏可见并包含链接');
    console.log('   3. 然后运行: npx tsx extract-fixed-coordinates.ts');
  }

  /**
   * 成功摘要
   */
  successSummary(url: string): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 成功提取链接！');
    console.log('='.repeat(60));
    console.log(`📋 文章链接: ${url}\n`);
  }
}

// 主函数
async function main() {
  const extractor = new PreciseIMAExtractor();
  await extractor.run();
}

main().catch(console.error);
