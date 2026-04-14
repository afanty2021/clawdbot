#!/usr/bin/env tsx

/**
 * 精确版 IMA 自动化流程 - 基于实际界面布局
 *
 * 界面布局：
 * 1. 左侧导航栏 → 知识库图标
 * 2. 导航栏右侧 → 知识库列表（个人知识库、共享知识库）
 * 3. 知识库列表右侧 → 微信公众号文章列表（带"内容(***)"标签）
 * 4. 单击文章标题 → 文章全文显示 + 地址栏出现
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class LayoutAwareExtractor {
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
   * 步骤 1: 点击左侧导航栏的"知识库"图标
   */
  clickKnowledgeBaseIcon(): void {
    console.log('📚 步骤 1: 点击左侧导航栏的知识库图标');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          -- 左侧导航栏，知识库图标位置
          click at {60, 120}
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
   * 步骤 2: 选择知识库（从知识库列表中）
   * 知识库列表出现在导航栏右侧
   */
  selectKnowledgeBase(kbName: string): void {
    console.log(`📂 步骤 2: 选择知识库 "${kbName}"`);
    console.log('   知识库列表应该出现在导航栏右侧\n');

    // 知识库列表的可能位置（在导航栏右侧）
    const possiblePositions = [
      { x: 200, y: 150 },  // 列表顶部
      { x: 200, y: 200 },  // 列表中上部
      { x: 200, y: 250 },  // 列表中部
      { x: 200, y: 300 },  // 列表中下部
    ];

    // 尝试查找并点击知识库名称
    const found = this.clickByText(kbName, 250, 100, 400); // 在 x=200-400 范围内搜索

    if (!found) {
      console.log(`⚠️  未找到"${kbName}"，尝试点击知识库列表位置`);

      // 尝试点击知识库列表的位置
      for (const pos of possiblePositions) {
        this.clickAt(pos.x, pos.y, `知识库列表位置 (${pos.x}, ${pos.y})`);
        this.delay(1000);
      }
    } else {
      console.log(`✅ 已选择知识库: ${kbName}\n`);
    }

    // 等待文章列表加载
    console.log('⏳ 等待微信公众号文章列表加载...');
    this.delay(2500);
  }

  /**
   * 步骤 3: 在"内容(***)"标签下查找并点击文章标题
   */
  clickArticleTitle(): void {
    console.log('📄 步骤 3: 在"内容(***)"标签下查找文章');
    console.log('   文章列表应该出现在知识库列表右侧\n');

    // "内容(***)"标签下方是文章列表
    // 文章列表的大致位置：x: 400-800, y: 150-500
    const articleListArea = {
      xMin: 400,
      xMax: 800,
      yMin: 150,
      yMax: 500
    };

    // 尝试多种方法点击文章
    let clicked = false;

    // 方法1: 尝试查找"微信公众号"文本
    console.log('方法 1: 查找"微信公众号"文本');
    clicked = this.clickByText('微信公众号', articleListArea.xMin, articleListArea.yMin, articleListArea.xMax);

    if (!clicked) {
      // 方法2: 在文章列表区域尝试多个位置
      console.log('方法 2: 在文章列表区域尝试点击');

      const articlePositions = [
        { x: 500, y: 200 },
        { x: 600, y: 200 },
        { x: 700, y: 200 },
        { x: 500, y: 250 },
        { x: 600, y: 250 },
        { x: 700, y: 250 },
        { x: 500, y: 300 },
        { x: 600, y: 300 },
        { x: 700, y: 300 },
      ];

      for (const pos of articlePositions) {
        this.clickAt(pos.x, pos.y, `文章列表位置 (${pos.x}, ${pos.y})`);
        this.delay(800);

        // 检查是否成功打开文章
        if (this.checkArticleOpened()) {
          clicked = true;
          break;
        }
      }
    }

    if (clicked) {
      console.log('✅ 已点击文章标题\n');
    } else {
      console.log('⚠️  可能需要手动点击文章标题\n');
    }
  }

  /**
   * 通过文本内容点击
   */
  clickByText(text: string, xMin: number, yMin: number, xMax: number): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          try
            tell window 1
              set allTexts to every static text
              repeat with txt in allTexts
                try
                  set txtValue to value of txt
                  set txtPos to position of txt
                  set txtX to item 1 of txtPos
                  set txtY to item 2 of txtPos

                  -- 检查文本是否匹配且在指定区域内
                  if txtValue contains "${text}" and txtX ≥ ${xMin} and txtX ≤ ${xMax} and txtY ≥ ${yMin} then
                    -- 点击文本位置
                    click at txtPos
                    return "Found"
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
      if (result.includes('Found')) {
        this.delay(1000);
        return true;
      }
    } catch (error) {
      // Ignore
    }
    return false;
  }

  /**
   * 在指定坐标点击
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
      console.log(`  🖱️  点击 ${description}`);
    } catch (error) {
      console.log(`  ⚠️  点击失败: ${description}`);
    }
  }

  /**
   * 检查文章是否已打开（通过检查剪贴板）
   */
  checkArticleOpened(): boolean {
    // 尝试从地址栏提取链接
    const url = this.extractFromAddressBar(false); // false = 不打印日志
    return url !== '';
  }

  /**
   * 步骤 4: 从地址栏提取链接
   */
  extractFromAddressBar(verbose: boolean = true): string {
    if (verbose) {console.log('📋 步骤 4: 从地址栏提取链接');}

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

      if (clipboard.startsWith('http')) {
        if (verbose) {console.log(`✅ 成功提取链接: ${clipboard.substring(0, 80)}...\n`);}
        return clipboard;
      } else {
        if (verbose) {console.log(`⚠️  剪贴板内容: ${clipboard.substring(0, 100)}...\n`);}
        return '';
      }
    } catch (error) {
      if (verbose) {console.log('❌ 提取失败\n');}
      return '';
    }
  }

  /**
   * 步骤 5: 在 Chrome 中验证
   */
  async verifyInChrome(url: string): Promise<void> {
    console.log('🌐 步骤 5: 在 Chrome 中验证');
    console.log(`📎 URL: ${url}\n`);

    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
    console.log('✅ Chrome 已打开');

    console.log('⏳ 等待页面加载...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const screenshot = this.captureScreenshot();
    console.log(`📸 验证截图: ${screenshot}\n`);

    // 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      url,
      method: 'layout_aware_automation',
      layout: {
        knowledgeBaseIcon: { x: 60, y: 120 },
        knowledgeBaseList: { xMin: 200, xMax: 400, yRange: '150-300' },
        articleList: { xMin: 400, xMax: 800, yRange: '150-500' },
        addressBar: { x: 960, y: 100 }
      }
    };

    const resultPath = path.join(process.cwd(), 'ima-layout-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`💾 结果已保存: ${resultPath}\n`);
  }

  /**
   * 截图
   */
  captureScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-layout-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    return filename;
  }

  /**
   * 运行完整流程
   */
  async run(knowledgeBaseName: string = 'AI'): Promise<void> {
    console.log('🚀 基于界面布局的精确自动化流程\n');
    console.log('='.repeat(60));
    console.log('📐 界面布局理解：');
    console.log('   1. 左侧导航栏 → 知识库图标');
    console.log('   2. 导航栏右侧 → 知识库列表（个人、共享等）');
    console.log('   3. 知识库列表右侧 → 文章列表（"内容(***)"标签）');
    console.log('   4. 单击文章标题 → 文章全文 + 地址栏');
    console.log('='.repeat(60));
    console.log('');

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库图标
    this.clickKnowledgeBaseIcon();

    // 3. 选择知识库
    this.selectKnowledgeBase(knowledgeBaseName);

    // 4. 点击文章标题
    this.clickArticleTitle();

    // 5. 等待文章全文显示
    console.log('⏳ 等待文章全文显示（地址栏出现）...');
    this.delay(3000);

    // 6. 从地址栏提取链接
    const url = this.extractFromAddressBar();

    if (url) {
      // 7. 验证
      await this.verifyInChrome(url);

      console.log('='.repeat(60));
      console.log('🎉 完整自动化流程成功！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}\n`);
    } else {
      console.log('='.repeat(60));
      console.log('⚠️  未能自动提取链接');
      console.log('='.repeat(60));
      console.log('\n💡 建议：');
      console.log('   1. 确认知识库已正确选择');
      console.log('   2. 确认文章列表已显示（"内容(***)"标签）');
      console.log('   3. 确认文章标题已被单击');
      console.log('   4. 确认文章全文已显示（地址栏可见）');
      console.log('\n🔧 或者使用半自动化方案：');
      console.log('   1. 手动完成上述步骤');
      console.log('   2. 运行: npx tsx extract-fixed-coordinates.ts\n');
    }
  }
}

// 主函数
async function main() {
  // 可以指定知识库名称，默认为 "AI"
  const knowledgeBaseName = process.argv[2] || 'AI';

  const extractor = new LayoutAwareExtractor();
  await extractor.run(knowledgeBaseName);
}

main().catch(console.error);
