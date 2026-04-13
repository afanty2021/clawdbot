#!/usr/bin/env tsx

/**
 * IMA 列表框滚动提取方案
 *
 * 布局理解（修正版）：
 * - 左侧导航栏：x: 0-200（知识库图标在这里）
 * - 知识库列表：导航栏右侧显示（个人知识库、共享知识库等）
 * - 文章列表框：中间偏下的固定列表框（关键！）
 * - 地址栏：顶部固定位置（提取URL的地方）
 *
 * 工作流程：
 * 1. 点击列表框获取焦点
 * 2. 使用键盘导航（↓、↑）选择文章
 * 3. 按 Enter 打开文章
 * 4. 从地址栏提取 URL
 * 5. 按 Esc 或 Cmd+[ 返回列表
 * 6. 重复步骤 2-5
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

class ListboxExtractor {
  private resultFile = 'ima-listbox-results.json';
  private extractedUrls = new Set<string>();

  constructor() {
    this.loadExistingResults();
  }

  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  /**
   * 加载已提取的URL，避免重复
   */
  private loadExistingResults(): void {
    if (fs.existsSync(this.resultFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.resultFile, 'utf-8'));
        const articles = data.articles || [];
        articles.forEach((article: ExtractedArticle) => {
          this.extractedUrls.add(article.url);
        });
        console.log(`✅ 已加载 ${this.extractedUrls.size} 篇已提取的文章\n`);
      } catch (error) {
        console.log('⚠️  无法加载已有结果\n');
      }
    }
  }

  /**
   * 保存提取结果
   */
  private saveResult(article: ExtractedArticle): void {
    let data: { articles: ExtractedArticle[] } = { articles: [] };

    if (fs.existsSync(this.resultFile)) {
      data = JSON.parse(fs.readFileSync(this.resultFile, 'utf-8'));
    }

    data.articles.push(article);
    fs.writeFileSync(this.resultFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 点击列表框获取焦点
   * 基于截图分析，列表框应该在中间偏下位置
   * 坐标估计：x: 300-1500, y: 300-800
   */
  focusListbox(): void {
    console.log('🎯 点击列表框获取焦点...');

    // 尝试多个可能的列表框位置
    const listboxPositions = [
      { x: 600, y: 400 }, // 列表框中央
      { x: 600, y: 500 },
      { x: 600, y: 600 },
      { x: 800, y: 400 },
      { x: 800, y: 500 },
    ];

    for (const pos of listboxPositions) {
      this.clickAt(pos.x, pos.y);
      this.delay(300);
    }

    console.log('✅ 已尝试点击列表框\n');
    this.delay(500);
  }

  /**
   * 在指定坐标单击
   */
  private clickAt(x: number, y: number): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.2
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
   * 在指定坐标双击
   */
  private doubleClickAt(x: number, y: number): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.2
          -- 双击
          click at {${x}, ${y}}
          delay 0.1
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
   * 使用键盘导航选择文章
   * count: 向下移动的次数
   */
  private selectArticle(count: number): void {
    console.log(`📝 选择文章（向下移动 ${count} 次）...`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 使用向下箭头选择文章
          repeat ${count} times
            keystroke (ASCII character 31) -- ↓ arrow
            delay 0.2
          end repeat

          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
    } catch (error) {
      console.log('❌ 选择文章失败\n');
    }
  }

  /**
   * 单击打开文章（使用成功案例的方法）
   */
  private openArticleAt(listboxX: number, listboxY: number): void {
    console.log(`🔓 单击打开文章（位置: ${listboxX}, ${listboxY}）...`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 单击文章项（不是双击）
          click at {${listboxX}, ${listboxY}}

          delay 2.5 -- 等待文章完全加载（成功案例的等待时间）
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 已单击文章\n');
    } catch (error) {
      console.log('❌ 打开文章失败\n');
    }
  }

  /**
   * 从地址栏提取 URL
   * 使用 Cmd+L 聚焦地址栏，然后复制
   */
  private extractFromAddressBar(): string {
    console.log('📋 从地址栏提取 URL...');

    // 使用 Cmd+L 聚焦到地址栏（更可靠）
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 使用 Cmd+L 聚焦到地址栏
          keystroke "l" using command down
          delay 1.0

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
        console.log(`✅ 成功提取: ${clipboard.substring(0, 80)}...\n`);
        return clipboard;
      } else {
        console.log(`⚠️  剪贴板内容: ${clipboard.substring(0, 100)}\n`);

        // 如果 Cmd+L 不起作用，尝试点击地址栏
        console.log('🔄 尝试备用方案：点击地址栏...');
        return this.extractFromAddressBarClick();
      }
    } catch (error) {
      console.log('❌ 提取失败\n');
      return '';
    }
  }

  /**
   * 备用方案：通过点击地址栏提取（使用成功案例的坐标）
   */
  private extractFromAddressBarClick(): string {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 使用成功案例的地址栏坐标：{960, 100}
          click at {960, 100}
          delay 0.5
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
        console.log(`✅ 备用方案成功: ${clipboard.substring(0, 80)}...\n`);
        return clipboard;
      } else {
        console.log(`❌ 备用方案失败: ${clipboard.substring(0, 100)}\n`);
        return '';
      }
    } catch (error) {
      console.log('❌ 备用方案失败\n');
      return '';
    }
  }

  /**
   * 返回文章列表
   */
  private goBack(): void {
    console.log('⬅️  返回文章列表...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 尝试 Esc 键
          keystroke (ASCII character 27) -- Esc
          delay 1.0
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 已返回\n');
    } catch (error) {
      console.log('⚠️  返回失败，尝试快捷键...\n');

      // 备用方案：Cmd+[
      const backupScript = `
        tell application "System Events"
          tell process "ima.copilot"
            keystroke "[" using command down
            delay 1.5
          end tell
        end tell
      `;
      try {
        execSync(`osascript -e '${backupScript}'`, { encoding: 'utf-8' });
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * 提取单篇文章（使用固定坐标遍历）
   */
  private async extractOneArticle(articleIndex: number, listboxY: number): Promise<boolean> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 文章 #${articleIndex}`);
    console.log(`${'='.repeat(60)}\n`);

    // 列表框的X坐标（中央位置）
    const listboxX = 600;

    // 1. 双击打开指定位置的文章
    this.openArticleAt(listboxX, listboxY);

    // 2. 提取 URL
    const url = this.extractFromAddressBar();

    if (!url) {
      console.log('⚠️  未提取到 URL，跳过\n');
      this.goBack();
      return false;
    }

    // 检查是否已提取
    if (this.extractedUrls.has(url)) {
      console.log('⏭️  文章已提取过，跳过\n');
      this.goBack();
      return false;
    }

    // 3. 保存结果
    const article: ExtractedArticle = {
      url,
      title: `Article #${articleIndex}`,
      timestamp: new Date().toISOString(),
      index: articleIndex
    };

    this.saveResult(article);
    this.extractedUrls.add(url);

    console.log(`✅ 文章 #${articleIndex} 提取成功！`);
    console.log(`📋 URL: ${url}\n`);

    // 4. 返回列表
    this.goBack();

    return true;
  }

  /**
   * 完全自动化批量提取
   * @param targetCount 目标提取数量（如1800）
   * @param autoSelectKB 是否自动选择知识库
   */
  async runFullAuto(targetCount: number = 1800, autoSelectKB: boolean = true): Promise<void> {
    console.log('\n🚀 IMA 完全自动化提取方案');
    console.log('='.repeat(60));
    console.log(`📊 目标: 提取 ${targetCount} 篇文章`);
    console.log(`🤖 模式: 完全自动（无需手动操作）`);
    console.log('='.repeat(60));
    console.log('\n⏳ 脚本将自动：');
    console.log('   1. 激活 ima.copilot');
    console.log('   2. 点击知识库图标');
    console.log('   3. 选择知识库（如"AI"）');
    console.log('   4. 在列表框内通过坐标遍历所有文章');
    console.log('   5. 提取并保存URL');
    console.log('   6. 自动返回并继续下一篇\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库图标（左侧导航栏）
    if (autoSelectKB) {
      this.clickKnowledgeBaseIcon();
      this.delay(1000);

      // 3. 选择知识库
      this.selectKnowledgeBase('AI');
      this.delay(2000);
    }

    // 4. 定义列表框参数
    const listboxStartY = 350; // 列表框起始Y坐标
    const listItemHeight = 60;  // 每篇文章项的高度
    const listboxX = 600;       // 列表框中央X坐标

    let extractedCount = 0;
    let consecutiveFailures = 0;
    const maxFailures = 20;

    for (let i = 1; i <= targetCount; i++) {
      // 计算当前文章的Y坐标
      const currentY = listboxStartY + (i - 1) * listItemHeight;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 进度: ${i}/${targetCount} (已提取: ${extractedCount})`);
      console.log(`📍 坐标: (${listboxX}, ${currentY})`);
      console.log(`${'='.repeat(60)}\n`);

      const success = await this.extractOneArticle(i, currentY);

      if (success) {
        extractedCount++;
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }

      // 检查是否连续失败过多（可能到达列表末尾或超出可视区域）
      if (consecutiveFailures >= maxFailures) {
        console.log(`\n⚠️  连续 ${maxFailures} 次提取失败`);
        console.log('💡 可能原因：到达列表末尾或需要滚动列表框');
        console.log('🛑 自动停止提取\n');
        break;
      }

      console.log(`📊 实时统计: ${extractedCount}/${targetCount} 篇文章已提取 (${(extractedCount/targetCount*100).toFixed(1)}%)`);
      console.log(`⏱️  预计剩余时间: ${this.estimateTime(targetCount - extractedCount)}\n`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 完全自动化提取完成！');
    console.log('='.repeat(60));
    console.log(`✅ 成功提取: ${extractedCount} 篇文章`);
    console.log(`📁 结果文件: ${this.resultFile}`);
    console.log(`📊 总体完成度: ${(extractedCount/targetCount*100).toFixed(1)}%\n`);
  }

  /**
   * 激活应用
   */
  private activateApp(): void {
    console.log('🎯 激活 ima.copilot...');
    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 已激活\n');
    } catch (error) {
      console.log('⚠️  激活失败\n');
    }
  }

  /**
   * 点击左侧导航栏的知识库图标
   */
  private clickKnowledgeBaseIcon(): void {
    console.log('📚 点击知识库图标（左侧导航栏）...');

    // 左侧导航栏的知识库图标位置
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {100, 80} -- 左侧导航栏顶部
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 已点击知识库图标\n');
    } catch (error) {
      console.log('⚠️  点击失败\n');
    }
  }

  /**
   * 选择知识库
   */
  private selectKnowledgeBase(kbName: string): void {
    console.log(`📂 选择知识库 "${kbName}"...`);

    // 知识库列表出现在导航栏右侧，尝试点击
    const kbPositions = [
      { x: 250, y: 120 }, // 第一个知识库
      { x: 250, y: 170 }, // 第二个知识库
      { x: 250, y: 220 }, // 第三个知识库
    ];

    for (const pos of kbPositions) {
      this.clickAt(pos.x, pos.y);
      this.delay(500);
    }

    console.log('✅ 已尝试选择知识库\n');
  }

  /**
   * 估算剩余时间
   */
  private estimateTime(remaining: number): string {
    const avgTimePerArticle = 5; // 秒
    const seconds = remaining * avgTimePerArticle;

    if (seconds < 60) {
      return `${seconds} 秒`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)} 分钟`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours} 小时 ${mins} 分钟`;
    }
  }
}

// 主函数
async function main() {
  const targetCount = parseInt(process.argv[2]) || 1800;
  const autoSelectKB = process.argv[3] !== '--no-auto-select';

  console.log('\n🤖 IMA 完全自动化文章链接提取器');
  console.log('基于列表框滚动方案\n');

  const extractor = new ListboxExtractor();
  await extractor.runFullAuto(targetCount, autoSelectKB);
}

main().catch(console.error);
