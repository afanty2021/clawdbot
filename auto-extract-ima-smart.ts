#!/usr/bin/env tsx

/**
 * 智能版 IMA Copilot 自动化流程
 * 通过分析 UI 结构来精确操作
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class SmartIMAExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  /**
   * 激活应用
   */
  activateApp(): boolean {
    console.log('🎯 激活 ima.copilot...');
    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 已激活\n');
      return true;
    } catch (error) {
      console.log('⚠️  激活失败\n');
      return false;
    }
  }

  /**
   * 智能点击：通过多种方法尝试点击
   */
  smartClick(targetName: string, maxAttempts: number = 3): boolean {
    console.log(`🎯 智能点击: "${targetName}"`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`  尝试 ${attempt}/${maxAttempts}...`);

      // 方法1: 通过名称查找并点击
      const method1 = this.clickByName(targetName);
      if (method1) {return true;}

      // 方法2: 通过文本内容查找
      const method2 = this.clickByTextContent(targetName);
      if (method2) {return true;}

      // 方法3: 通过坐标推测
      const method3 = this.clickByInferredPosition(targetName);
      if (method3) {return true;}

      this.delay(500);
    }

    console.log(`❌ 所有方法都失败了\n`);
    return false;
  }

  /**
   * 通过元素名称点击
   */
  clickByName(name: string): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          try
            tell window 1
              -- 在所有按钮中查找
              set allButtons to every button
              repeat with btn in allButtons
                try
                  if name of btn is "${name}" then
                    click btn
                    return "Clicked"
                  end if
                end try
              end repeat
            end tell
          end try
          return "Not found"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      if (result.includes('Clicked')) {
        console.log('  ✅ 通过名称点击成功');
        this.delay(800);
        return true;
      }
    } catch (error) {
      // Ignore
    }
    return false;
  }

  /**
   * 通过文本内容点击
   */
  clickByTextContent(text: string): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          try
            tell window 1
              set allTexts to every static text
              repeat with txt in allTexts
                try
                  if value of txt contains "${text}" then
                    set pos to position of txt
                    click at pos
                    return "Clicked"
                  end if
                end try
              end repeat
            end tell
          end try
          return "Not found"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      if (result.includes('Clicked')) {
        console.log('  ✅ 通过文本点击成功');
        this.delay(800);
        return true;
      }
    } catch (error) {
      // Ignore
    }
    return false;
  }

  /**
   * 通过推测的位置点击
   */
  clickByInferredPosition(target: string): boolean {
    // 定义常见元素的大致位置
    const positions: Record<string, { x: number; y: number }> = {
      '知识库': { x: 60, y: 120 },
      'AI': { x: 60, y: 200 },
      '微信公众号': { x: 400, y: 300 },
    };

    const pos = positions[target];
    if (!pos) {return false;}

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          click at {${pos.x}, ${pos.y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(`  ✅ 点击坐标 (${pos.x}, ${pos.y})`);
      this.delay(800);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 双击以确保文章打开
   */
  doubleClickAt(x: number, y: number): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          -- 第一次点击
          click at {${x}, ${y}}
          delay 0.3
          -- 第二次点击（双击）
          click at {${x}, ${y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(`🖱️  双击 (${x}, ${y})`);
    } catch (error) {
      console.log('⚠️  双击失败');
    }
  }

  /**
   * 使用固定坐标从地址栏提取链接
   */
  extractLinkFromAddressBar(): string {
    console.log('📋 从地址栏提取链接...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏（固定坐标）
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
      } else {
        console.log(`⚠️  剪贴板不是链接: ${clipboard.substring(0, 50)}...\n`);
        return '';
      }
    } catch (error) {
      console.log('❌ 提取失败\n');
      return '';
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
      method: 'smart_automation'
    };

    const resultPath = path.join(process.cwd(), 'ima-smart-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 结果已保存: ${resultPath}\n`);
  }

  /**
   * 截图
   */
  captureScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-smart-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    return filename;
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 智能版 IMA 自动化流程\n');
    console.log('='.repeat(60));

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库
    console.log('📚 点击知识库...');
    const kbClicked = this.smartClick('知识库');

    if (!kbClicked) {
      console.log('⚠️  无法点击知识库，使用默认坐标');
      this.doubleClickAt(60, 120);
    }

    // 3. 等待加载
    console.log('⏳ 等待知识库加载...');
    this.delay(2000);

    // 4. 选择 AI 知识库
    console.log('📂 选择 AI 知识库...');
    const aiClicked = this.smartClick('AI');

    if (!aiClicked) {
      console.log('⚠️  无法找到 AI，尝试默认位置');
      this.doubleClickAt(60, 200);
    }

    // 5. 等待文章列表加载
    console.log('⏳ 等待文章列表加载...');
    this.delay(2000);

    // 6. 查找并点击微信公众号文章
    console.log('📄 查找微信公众号文章...');
    const articleClicked = this.smartClick('微信公众号');

    if (!articleClicked) {
      console.log('⚠️  无法找到文章，尝试主内容区域');
      // 在主内容区域尝试多次点击
      for (let i = 0; i < 3; i++) {
        this.doubleClickAt(600, 300 + i * 50);
        this.delay(1000);
      }
    }

    // 7. 等待文章完全加载（地址栏出现）
    console.log('⏳ 等待文章完全加载...');
    this.delay(2000);

    // 8. 提取链接
    const url = this.extractLinkFromAddressBar();

    if (url) {
      // 9. 验证
      await this.verifyInChrome(url);

      console.log('='.repeat(60));
      console.log('🎉 智能自动化成功！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}\n`);
    } else {
      console.log('❌ 未能提取链接');
      console.log('\n💡 建议：');
      console.log('   1. 确保 ima.copilot 窗口在前台');
      console.log('   2. 确认文章已完全打开（地址栏可见）');
      console.log('   3. 尝试手动操作一次，观察正确的流程');
    }
  }
}

// 主函数
async function main() {
  const extractor = new SmartIMAExtractor();
  await extractor.run();
}

main().catch(console.error);
