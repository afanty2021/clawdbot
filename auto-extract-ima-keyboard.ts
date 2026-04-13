#!/usr/bin/env tsx

/**
 * 键盘导航版 IMA 自动化流程
 * 使用 Tab 键和方向键导航到文章并打开
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class KeyboardNavExtractor {
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
   * 模拟键盘按键
   */
  pressKey(key: string, modifiers: string[] = []): void {
    let script = '';

    if (modifiers.length === 0) {
      script = `
        tell application "System Events"
          tell process "ima.copilot"
            keystroke "${key}"
          end tell
        end tell
      `;
    } else {
      const modifierStr = modifiers.join(' & ');
      script = `
        tell application "System Events"
          tell process "ima.copilot"
            keystroke "${key}" using {${modifierStr}}
          end tell
        end tell
      `;
    }

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(200);
    } catch (error) {
      console.log(`⚠️  按键失败: ${key}`);
    }
  }

  /**
   * 使用键盘导航到知识库
   */
  navigateToKnowledgeBase(): void {
    console.log('⌨️  使用键盘导航到知识库...');

    // 尝试 Option+1 或 Option+2 等快捷键
    const shortcuts = ['1', '2', '3', '4'];

    for (const key of shortcuts) {
      console.log(`  尝试 Option+${key}...`);
      this.pressKey(key, ['option down']);
      this.delay(1000);
    }
  }

  /**
   * 使用方向键浏览文章列表
   */
  browseArticles(): void {
    console.log('⬇️  使用方向键浏览文章...');

    // 按多次向下箭头键
    for (let i = 0; i < 10; i++) {
      this.pressKey('ASCII character 31'); // down arrow
      this.delay(300);
    }

    console.log('✅ 已浏览多篇文章\n');
  }

  /**
   * 尝试打开文章
   */
  openArticle(): void {
    console.log('📄 尝试打开文章...');

    // 方法1: 按 Enter 键
    console.log('方法 1: 按 Enter 键');
    this.pressKey('return');
    this.delay(2000);

    // 检查是否成功
    const url = this.extractFromAddressBar();
    if (url) {
      this.success(url);
      return;
    }

    // 方法2: 按 Space 键
    console.log('\n方法 2: 按 Space 键');
    this.pressKey('space');
    this.delay(2000);

    const url2 = this.extractFromAddressBar();
    if (url2) {
      this.success(url2);
      return;
    }

    // 方法3: 双击（使用脚本）
    console.log('\n方法 3: 双击文章区域');
    this.doubleClickArticle();
  }

  /**
   * 双击文章区域
   */
  doubleClickArticle(): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 双击主内容区域
          click at {600, 400}
          delay 0.3
          click at {600, 400}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(2500);
    } catch (error) {
      console.log('⚠️  双击失败');
    }
  }

  /**
   * 从地址栏提取链接
   */
  extractFromAddressBar(): string {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏
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

      if (clipboard.startsWith('http')) {
        console.log(`✅ 成功提取链接\n`);
        return clipboard;
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 成功处理
   */
  async success(url: string): Promise<void> {
    console.log(`\n✅ 成功获取链接: ${url.substring(0, 80)}...\n`);

    // 在 Chrome 中打开
    console.log('🌐 在 Chrome 中打开...');
    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });

    console.log('⏳ 等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 截图
    const timestamp = Date.now();
    const filename = `ima-keyboard-${timestamp}.png`;
    execSync(`screencapture -x "${filename}"`, { encoding: 'utf-8' });

    // 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      url,
      method: 'keyboard_navigation'
    };

    const resultPath = path.join(process.cwd(), 'ima-keyboard-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 键盘导航自动化成功！');
    console.log('='.repeat(60));
    console.log(`📋 文章链接: ${url}`);
    console.log(`📸 截图: ${filename}`);
    console.log(`💾 结果: ${resultPath}\n`);
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 键盘导航版 IMA 自动化流程\n');
    console.log('='.repeat(60));

    // 1. 激活应用
    this.activateApp();

    // 2. 尝试键盘导航到知识库
    this.navigateToKnowledgeBase();

    // 3. 等待加载
    console.log('⏳ 等待知识库加载...');
    this.delay(2000);

    // 4. 浏览文章
    this.browseArticles();

    // 5. 尝试打开文章
    this.openArticle();
  }
}

// 主函数
async function main() {
  const extractor = new KeyboardNavExtractor();
  await extractor.run();
}

main().catch(console.error);
