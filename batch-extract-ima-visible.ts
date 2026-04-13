#!/usr/bin/env tsx

/**
 * 实用版批量提取 - 提取当前可见区域的文章
 * 适用于大型知识库（1800+篇文章）
 *
 * 使用方法：
 * 1. 手动在 ima.copilot 中打开知识库
 * 2. 手动滚动到想要提取的文章位置
 * 3. 运行此脚本提取当前可见区域的5-10篇文章
 * 4. 重复上述步骤提取更多文章
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

class VisibleAreaExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  private extractedURLs: Set<string> = new Set();
  private results: ExtractedArticle[] = [];

  /**
   * 从当前可见区域提取文章
   */
  async extractFromVisibleArea(maxArticles: number = 10): Promise<void> {
    console.log('🚀 从当前可见区域提取文章\n');
    console.log('='.repeat(60));
    console.log(`📋 目标数量: ${maxArticles} 篇`);
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 提示：');
    console.log('   - 确保 ima.copilot 已打开知识库');
    console.log('   - 手动滚动到想要提取的文章位置');
    console.log('   - 脚本将自动提取可见区域的文章\n');

    this.delay(3000);

    let extractedCount = 0;
    let attempts = 0;
    const maxAttempts = maxArticles * 3; // 最多尝试3倍次数

    while (extractedCount < maxArticles && attempts < maxAttempts) {
      attempts++;

      console.log(`\n🔄 尝试 ${attempts}/${maxAttempts} - 已提取 ${extractedCount}/${maxArticles} 篇`);

      // 计算点击位置 - 在可见区域内垂直分布
      const yPos = 180 + ((attempts - 1) % 8) * 50; // 从180开始，每次50px，共8个位置
      const xPos = 450 + ((attempts - 1) % 3) * 100; // 水平位置也变化

      console.log(`🖱️  点击位置 (${xPos}, ${yPos})...`);

      // 点击文章
      const clicked = this.clickArticle(xPos, yPos);

      if (clicked) {
        // 提取链接
        const url = this.extractURL();

        if (url && !this.isDuplicate(url)) {
          // 保存文章
          this.saveArticle(url, extractedCount);
          extractedCount++;

          // 实时保存
          this.saveToFile();

          // 每5篇显示一次进度
          if (extractedCount % 5 === 0) {
            this.showProgress();
          }
        }

        // 返回文章列表
        this.goBack();
        this.delay(1500);
      }

      this.delay(500);
    }

    // 最终报告
    console.log('\n' + '='.repeat(60));
    console.log('📊 提取完成！');
    console.log('='.repeat(60));
    console.log(`✅ 成功提取: ${this.results.length} 篇文章`);
    console.log(`💾 结果文件: ima-visible-result.json`);

    if (this.results.length > 0) {
      console.log('\n📝 提取的文章列表：');
      this.results.forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ${article.url}`);
      });
    }

    console.log('\n💡 继续提取更多文章：');
    console.log('   1. 在 ima.copilot 中向下滚动');
    console.log('   2. 再次运行此脚本');
    console.log('   3. 重复上述步骤\n');
  }

  /**
   * 点击文章
   */
  clickArticle(x: number, y: number): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 单击选中
          click at {${x}, ${y}}
          delay 0.3

          -- 双击打开
          click at {${x}, ${y}}
          delay 1
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 提取URL
   */
  extractURL(): string {
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
      }
    } catch (error) {
      // Ignore
    }

    return '';
  }

  /**
   * 检查是否重复
   */
  isDuplicate(url: string): boolean {
    if (this.extractedURLs.has(url)) {
      console.log('⚠️  文章已提取过，跳过');
      return true;
    }
    return false;
  }

  /**
   * 保存文章信息
   */
  saveArticle(url: string, index: number): void {
    // 尝试从剪贴板获取标题
    let title = this.getArticleTitle();

    const article: ExtractedArticle = {
      url,
      title,
      timestamp: new Date().toISOString(),
      index: index + 1
    };

    this.results.push(article);
    this.extractedURLs.add(url);

    console.log(`✅ 已保存: ${title.substring(0, 60)}...`);
  }

  /**
   * 获取文章标题
   */
  getArticleTitle(): string {
    try {
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      // 如果剪贴板不是URL，可能是标题
      if (!clipboard.startsWith('http') && clipboard.length > 0 && clipboard.length < 200) {
        return clipboard.split('\n')[0].trim();
      }
    } catch (error) {
      // Ignore
    }

    return `Article ${this.results.length + 1}`;
  }

  /**
   * 返回文章列表
   */
  goBack(): void {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 使用 Command+[ 返回
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
   * 显示进度
   */
  showProgress(): void {
    console.log('\n' + '-'.repeat(60));
    console.log(`📊 进度: 已提取 ${this.results.length} 篇文章`);
    console.log('-'.repeat(60));
  }

  /**
   * 保存到文件
   */
  saveToFile(): void {
    const result = {
      timestamp: new Date().toISOString(),
      totalArticles: this.results.length,
      articles: this.results
    };

    const resultPath = path.join(process.cwd(), 'ima-visible-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
  }
}

// 主函数
async function main() {
  const maxArticles = parseInt(process.argv[2]) || 10;

  const extractor = new VisibleAreaExtractor();
  await extractor.extractFromVisibleArea(maxArticles);
}

main().catch(console.error);
