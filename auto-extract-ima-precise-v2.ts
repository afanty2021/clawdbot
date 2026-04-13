#!/usr/bin/env tsx

/**
 * 精确版 IMA 自动化 - 基于实际界面截图
 *
 * 界面布局（基于实际截图）：
 * - 左侧导航栏：x: 0-200, y: 30-1080
 * - 知识库列表：x: 0-200, y: 100-400（在左侧导航栏内）
 * - "内容(***)"标签：x: 200-300, y: 30-60
 * - 文章列表：x: 200-1920, y: 60-1080
 * - 地址栏：x: 0-1920, y: 0-30
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ExtractedArticle {
  url: string;
  title: string;
  timestamp: string;
  index: number;
}

class PreciseLayoutExtractor {
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
   * 点击左侧导航栏的知识库图标
   * 坐标：左侧导航栏顶部区域
   */
  clickKnowledgeBaseIcon(): void {
    console.log('📚 点击知识库图标（左侧导航栏）...');

    // 根据截图分析，知识库图标在左侧导航栏顶部
    // 点击位置：x: 100, y: 80（左侧导航栏中心偏上）
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {100, 80}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 已点击知识库图标\n');
    } catch (error) {
      console.log('❌ 点击失败\n');
    }
  }

  /**
   * 从知识库列表中选择"AI"知识库
   * 知识库列表位置：x: 0-200, y: 100-400
   */
  selectKnowledgeBase(kbName: string): void {
    console.log(`📂 选择知识库 "${kbName}"...`);
    console.log('   知识库列表应该在左侧导航栏出现\n');

    // 知识库列表在左侧导航栏，垂直排列
    // 尝试多个Y坐标位置
    const kbPositions = [
      { x: 100, y: 120 }, // 第一个知识库
      { x: 100, y: 170 }, // 第二个知识库
      { x: 100, y: 220 }, // 第三个知识库
      { x: 100, y: 270 }, // 第四个知识库
      { x: 100, y: 320 }, // 第五个知识库
    ];

    for (const pos of kbPositions) {
      this.clickAt(pos.x, pos.y, `尝试知识库位置 (${pos.x}, ${pos.y})`);
      this.delay(800);
    }

    console.log('✅ 已尝试选择知识库\n');

    // 等待文章列表加载
    console.log('⏳ 等待微信公众号文章列表加载...');
    this.delay(2500);
  }

  /**
   * 点击文章标题
   * 文章列表位置：x: 200-1920, y: 60-1080
   */
  clickArticleTitle(attemptIndex: number): boolean {
    console.log(`📄 点击文章标题（尝试 ${attemptIndex + 1}）...`);

    // 根据截图分析，文章列表在右侧区域
    // 文章项包含缩略图+标题，垂直排列
    // 每个文章项高度约120px

    // 计算文章项的Y坐标
    const baseY = 100; // 文章列表起始Y坐标
    const itemHeight = 130; // 每篇文章项的高度（包含间距）
    const yPosition = baseY + (attemptIndex % 8) * itemHeight;

    // 文章标题在缩略图右侧，尝试多个X坐标
    const titlePositions = [
      { x: 350, y: yPosition + 20 },  // 标题位置
      { x: 450, y: yPosition + 20 },  // 标题右侧
      { x: 550, y: yPosition + 20 },  // 标题更右侧
      { x: 400, y: yPosition + 50 },  // 描述位置
    ];

    for (const pos of titlePositions) {
      console.log(`  🖱️  尝试位置 (${pos.x}, ${pos.y})`);

      // 双击打开文章
      this.doubleClickAt(pos.x, pos.y);
      this.delay(1200);

      // 检查是否成功打开文章
      const url = this.extractFromAddressBar(false);
      if (url) {
        console.log(`  ✅ 成功打开文章\n`);
        return true;
      }

      // 如果没成功，返回并尝试下一个位置
      this.goBack();
      this.delay(1000);
    }

    return false;
  }

  /**
   * 双击指定坐标
   */
  doubleClickAt(x: number, y: number): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3
          -- 第一次点击
          click at {${x}, ${y}}
          delay 0.2
          -- 第二次点击（双击）
          click at {${x}, ${y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
    } catch (error) {
      // Ignore
    }
  }

  /**
   * 在指定坐标单击
   */
  clickAt(x: number, y: number, description: string): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3
          click at {${x}, ${y}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
    } catch (error) {
      // Ignore
    }
  }

  /**
   * 从地址栏提取链接
   * 地址栏位置：x: 0-1920, y: 0-30
   */
  extractFromAddressBar(verbose: boolean = true): string {
    if (verbose) console.log('📋 从地址栏提取链接...');

    // 地址栏在顶部，点击中央位置
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏中央位置
          click at {960, 15}
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
        if (verbose) {
          console.log(`✅ 成功提取链接: ${clipboard.substring(0, 80)}...\n`);
        }
        return clipboard;
      } else {
        if (verbose) {
          console.log(`⚠️  剪贴板内容: ${clipboard.substring(0, 100)}...\n`);
        }
        return '';
      }
    } catch (error) {
      if (verbose) console.log('❌ 提取失败\n');
      return '';
    }
  }

  /**
   * 返回文章列表
   */
  goBack(): void {
    console.log('⬅️  返回文章列表...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 使用快捷键返回
          keystroke "[" using command down
          delay 1.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
    } catch (error) {
      // Ignore
    }
  }

  /**
   * 运行单篇提取流程
   */
  async runSingle(knowledgeBaseName: string = 'AI'): Promise<void> {
    console.log('🚀 精确版 IMA 单篇提取（基于实际界面截图）\n');
    console.log('='.repeat(60));
    console.log('📐 界面布局（基于截图分析）：');
    console.log('   左侧导航栏：x: 0-200, y: 30-1080');
    console.log('   知识库列表：x: 0-200, y: 100-400');
    console.log('   "内容(***)"标签：x: 200-300, y: 30-60');
    console.log('   文章列表：x: 200-1920, y: 60-1080');
    console.log('   地址栏：x: 0-1920, y: 0-30');
    console.log('='.repeat(60));
    console.log('');

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库图标
    this.clickKnowledgeBaseIcon();

    // 3. 选择知识库
    this.selectKnowledgeBase(knowledgeBaseName);

    // 4. 点击文章标题
    let clicked = false;
    for (let i = 0; i < 5; i++) {
      clicked = this.clickArticleTitle(i);
      if (clicked) break;
    }

    if (clicked) {
      // 5. 提取链接
      const url = this.extractFromAddressBar();

      if (url) {
        // 6. 保存结果
        this.saveResult(url);

        console.log('='.repeat(60));
        console.log('🎉 单篇提取成功！');
        console.log('='.repeat(60));
        console.log(`📋 文章链接: ${url}\n`);
      }
    } else {
      console.log('⚠️  未能成功点击文章标题');
      console.log('\n💡 建议：');
      console.log('   1. 确认知识库已正确选择');
      console.log('   2. 确认文章列表已显示');
      console.log('   3. 尝试手动点击一篇文章验证流程\n');
    }
  }

  /**
   * 保存结果
   */
  saveResult(url: string): void {
    const result = {
      timestamp: new Date().toISOString(),
      url,
      method: 'precise_layout_based',
      layout: {
        leftSidebar: { xMin: 0, xMax: 200, yMin: 30, yMax: 1080 },
        knowledgeBaseList: { xMin: 0, xMax: 200, yMin: 100, yMax: 400 },
        contentTab: { xMin: 200, xMax: 300, yMin: 30, yMax: 60 },
        articleList: { xMin: 200, xMax: 1920, yMin: 60, yMax: 1080 },
        addressBar: { xMin: 0, xMax: 1920, yMin: 0, yMax: 30 }
      }
    };

    const resultPath = path.join(process.cwd(), 'ima-precise-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 结果已保存: ${resultPath}\n`);
  }
}

// 主函数
async function main() {
  const kbName = process.argv[2] || 'AI';

  const extractor = new PreciseLayoutExtractor();
  await extractor.runSingle(kbName);
}

main().catch(console.error);
