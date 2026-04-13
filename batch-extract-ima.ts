#!/usr/bin/env tsx

/**
 * 批量提取 IMA 知识库中的所有文章链接
 * 支持滚动遍历，自动去重，进度跟踪
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

interface BatchResult {
  knowledgeBase: string;
  totalArticles: number;
  articles: ExtractedArticle[];
  startTime: string;
  endTime: string;
}

class BatchIMAExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  private extractedURLs: Set<string> = new Set();
  private results: ExtractedArticle[] = [];
  private maxArticles: number = 10; // 默认提取10篇，可配置
  private scrollAttempts: number = 0;
  private maxScrollAttempts: number = 50; // 最大滚动次数

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
   * 点击知识库图标
   */
  clickKnowledgeBaseIcon(): void {
    console.log('📚 点击知识库图标...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {60, 120}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 已点击\n');
    } catch (error) {
      console.log('❌ 点击失败\n');
    }
  }

  /**
   * 选择知识库
   */
  selectKnowledgeBase(kbName: string): void {
    console.log(`📂 选择知识库 "${kbName}"...`);

    // 尝试点击知识库列表中的位置
    const positions = [
      { x: 200, y: 150 },
      { x: 200, y: 200 },
      { x: 200, y: 250 },
    ];

    for (const pos of positions) {
      this.clickAt(pos.x, pos.y, `尝试位置 (${pos.x}, ${pos.y})`);
      this.delay(800);
    }

    console.log('✅ 已选择知识库\n');
    this.delay(2000);
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
    } catch (error) {
      // Ignore
    }
  }

  /**
   * 滚动文章列表
   */
  scrollArticleList(direction: 'down' | 'up' = 'down'): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 使用 Page Down/Page Up 键进行大幅度滚动
          if "${direction}" is "down" then
            -- Page Down (scroll down one page)
            keystroke (ASCII character 29) -- page down
          else
            -- Page Up (scroll up one page)
            keystroke (ASCII character 28) -- page up
          end if
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(800);
      this.scrollAttempts++;
    } catch (error) {
      console.log('⚠️  滚动失败');
    }
  }

  /**
   * 滚动到文章列表中的不同位置
   */
  scrollToArticle(index: number): void {
    console.log(`📜 滚动到第 ${index + 1} 篇文章...`);

    // 每篇文章需要滚动一定次数
    const scrollTimes = Math.floor(index / 2) + 1;

    for (let i = 0; i < scrollTimes; i++) {
      this.scrollArticleList('down');
    }
  }

  /**
   * 点击文章标题
   */
  clickArticleTitle(index: number): boolean {
    console.log(`📄 点击第 ${index + 1} 篇文章...`);

    // 根据索引计算Y坐标偏移，确保每次点击不同的文章
    // 假设每篇文章占用约60px的垂直空间
    const baseY = 180;
    const yStep = 60;
    const yOffset = (index % 5) * yStep; // 在可见区域内循环

    const positions = [
      { x: 450, y: baseY + yOffset },
      { x: 550, y: baseY + yOffset },
      { x: 650, y: baseY + yOffset },
      { x: 500, y: baseY + yOffset + 20 },
      { x: 600, y: baseY + yOffset + 20 },
    ];

    for (const pos of positions) {
      this.clickAt(pos.x, pos.y, `尝试位置 (${pos.x}, ${pos.y})`);
      this.delay(600);

      // 检查是否成功打开文章
      const url = this.extractFromAddressBar(false);
      if (url) {
        return true;
      }

      // 如果第一次没成功，尝试双击
      this.clickAt(pos.x, pos.y, `双击 (${pos.x}, ${pos.y})`);
      this.delay(800);

      const url2 = this.extractFromAddressBar(false);
      if (url2) {
        return true;
      }
    }

    return false;
  }

  /**
   * 从地址栏提取链接
   */
  extractFromAddressBar(verbose: boolean = true): string {
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
        return clipboard;
      } else {
        // 尝试从文本中提取URL
        const urlMatch = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          return urlMatch[1];
        }
      }
    } catch (error) {
      // Ignore
    }

    return '';
  }

  /**
   * 提取文章标题（从剪贴板）
   */
  extractTitle(): string {
    try {
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      // 如果不是URL，可能是标题
      if (!clipboard.startsWith('http') && clipboard.length > 0 && clipboard.length < 200) {
        return clipboard.split('\n')[0].substring(0, 100);
      }
    } catch (error) {
      // Ignore
    }

    return `Article ${this.results.length + 1}`;
  }

  /**
   * 返回上一级（关闭文章）
   */
  goBack(): void {
    console.log('⬅️  返回文章列表...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 尝试使用快捷键返回
          keystroke "[" using command down
          delay 1
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1500);
    } catch (error) {
      // 如果快捷键失败，尝试点击返回按钮
      this.clickAt(100, 100, '返回按钮');
      this.delay(1500);
    }
  }

  /**
   * 检查是否已经提取过这个URL
   */
  isAlreadyExtracted(url: string): boolean {
    return this.extractedURLs.has(url);
  }

  /**
   * 保存文章信息
   */
  saveArticle(url: string, index: number): void {
    const title = this.extractTitle();

    const article: ExtractedArticle = {
      url,
      title,
      timestamp: new Date().toISOString(),
      index: index + 1
    };

    this.results.push(article);
    this.extractedURLs.add(url);

    // 实时保存到文件
    this.saveToFile();

    console.log(`✅ 已保存第 ${index + 1} 篇文章: ${title.substring(0, 50)}...`);
    console.log(`   URL: ${url.substring(0, 80)}...\n`);
  }

  /**
   * 保存到文件
   */
  saveToFile(): void {
    const result: BatchResult = {
      knowledgeBase: 'AI',
      totalArticles: this.results.length,
      articles: this.results,
      startTime: this.results[0]?.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString()
    };

    const resultPath = path.join(process.cwd(), 'ima-batch-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
  }

  /**
   * 显示进度
   */
  showProgress(): void {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 批量提取进度`);
    console.log('='.repeat(60));
    console.log(`📚 知识库: AI`);
    console.log(`✅ 已提取: ${this.results.length} 篇`);
    console.log(`🎯 目标: ${this.maxArticles} 篇`);
    console.log(`📜 滚动次数: ${this.scrollAttempts}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * 运行批量提取
   */
  async run(maxArticles: number = 10): Promise<void> {
    this.maxArticles = maxArticles;

    console.log('🚀 批量提取 IMA 知识库文章\n');
    console.log('='.repeat(60));
    console.log(`📋 配置:`);
    console.log(`   知识库: AI`);
    console.log(`   目标数量: ${maxArticles} 篇`);
    console.log(`   最大滚动: ${this.maxScrollAttempts} 次`);
    console.log('='.repeat(60));
    console.log('');

    // 1. 激活应用
    this.activateApp();

    // 2. 点击知识库图标
    this.clickKnowledgeBaseIcon();

    // 3. 选择知识库
    this.selectKnowledgeBase('AI');

    // 4. 等待文章列表加载
    console.log('⏳ 等待文章列表加载...');
    this.delay(2500);

    // 5. 开始批量提取
    console.log('🔄 开始批量提取...\n');

    for (let i = 0; i < maxArticles && this.scrollAttempts < this.maxScrollAttempts; i++) {
      // 滚动到文章位置
      if (i > 0) {
        this.scrollToArticle(i);
      }

      // 点击文章标题
      const clicked = this.clickArticleTitle(i);

      if (clicked) {
        // 提取链接
        const url = this.extractFromAddressBar();

        if (url && !this.isAlreadyExtracted(url)) {
          // 保存文章
          this.saveArticle(url, i);

          // 显示进度
          if ((i + 1) % 5 === 0) {
            this.showProgress();
          }

          // 返回文章列表
          this.goBack();
          this.delay(1500);
        } else if (url && this.isAlreadyExtracted(url)) {
          console.log(`⚠️  文章已提取过，跳过\n`);
          this.goBack();
          this.delay(1500);
        } else {
          console.log(`⚠️  未能提取链接，尝试下一篇\n`);
        }
      } else {
        console.log(`⚠️  未能点击文章，滚动后重试\n`);
        // 额外滚动
        this.scrollArticleList('down');
        this.scrollArticleList('down');
      }

      // 防止无限循环
      if (this.scrollAttempts > this.maxScrollAttempts) {
        console.log('⚠️  达到最大滚动次数，停止提取\n');
        break;
      }
    }

    // 6. 最终报告
    this.showProgress();

    console.log('💾 结果已保存到: ima-batch-result.json');
    console.log('');

    // 统计信息
    if (this.results.length > 0) {
      console.log('✅ 提取完成！');
      console.log(`📊 总共提取: ${this.results.length} 篇文章`);

      // 显示前5篇
      console.log('\n📝 前5篇文章:');
      this.results.slice(0, 5).forEach(article => {
        console.log(`   ${article.index}. ${article.title}`);
        console.log(`      ${article.url.substring(0, 60)}...`);
      });

      if (this.results.length > 5) {
        console.log(`   ... 还有 ${this.results.length - 5} 篇`);
      }
    } else {
      console.log('⚠️  未能提取到文章');
      console.log('\n💡 建议：');
      console.log('   1. 确认知识库中有文章');
      console.log('   2. 确认文章列表已显示');
      console.log('   3. 尝试手动点击一篇文章验证流程');
    }
  }
}

// 主函数
async function main() {
  // 从命令行参数获取要提取的文章数量
  const maxArticles = parseInt(process.argv[2]) || 10;

  const extractor = new BatchIMAExtractor();
  await extractor.run(maxArticles);
}

main().catch(console.error);
