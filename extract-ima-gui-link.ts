#!/usr/bin/env tsx

/**
 * 通过 GUI 自动化获取 ima.copilot 中的微信公众号文章链接
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class IMAGUIExtractor {
  /**
   * 检查应用是否运行
   */
  isRunning(): boolean {
    try {
      const result = execSync('pgrep -x "ima.copilot"', { encoding: 'utf-8' });
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 启动应用
   */
  launch() {
    console.log('🚀 启动 ima.copilot...');
    execSync('open -a "ima.copilot"', { encoding: 'utf-8' });
    console.log('⏳ 等待应用加载...');
    execSync('sleep 3');
  }

  /**
   * 激活应用窗口
   */
  activateWindow() {
    console.log('🎯 激活 ima.copilot 窗口...');
    const script = `
      tell application "ima.copilot"
        activate
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
    execSync('sleep 1');
  }

  /**
   * 获取当前窗口的 UI 元素
   */
  getUIElements(): any[] {
    console.log('🔍 获取 UI 元素...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          tell front window
            set elements to {}

            -- 获取所有文本元素
            try
              set textElements to every text element
              repeat with elem in textElements
                try
                  set elemValue to value of elem
                  if elemValue is not missing value and length of elemValue > 0 then
                    set end of elements to {type:"text", value:elemValue}
                  end if
                on error
                  -- 跳过
                end try
              end repeat
            end try

            -- 获取所有按钮
            try
              set buttons to every button
              repeat with btn in buttons
                try
                  set btnTitle to title of btn
                  if btnTitle is not missing value and length of btnTitle > 0 then
                    set end of elements to {type:"button", value:btnTitle}
                  end if
                on error
                  -- 跳过
                end try
              end repeat
            end try

            -- 获取所有文本框
            try
              set textFields to every text field
              repeat with field in textFields
                try
                  set fieldValue to value of field
                  if fieldValue is not missing value and length of fieldValue > 0 then
                    set end of elements to {type:"textfield", value:fieldValue}
                  end if
                on error
                  -- 跳过
                end try
              end repeat
            end try

            return elements
          end tell
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      // 解析结果
      const lines = result.trim().split('\n');
      const elements: any[] = [];

      lines.forEach(line => {
        try {
          if (line.includes('{type:') && line.includes('value:')) {
            const match = line.match(/\{type:"([^"]+)", value:"([^"]+)"\}/);
            if (match) {
              elements.push({
                type: match[1],
                value: match[2]
              });
            }
          }
        } catch (e) {
          // 跳过无法解析的行
        }
      });

      console.log(`✅ 找到 ${elements.length} 个 UI 元素`);
      return elements;
    } catch (error) {
      console.error('❌ 获取 UI 元素失败:', error);
      return [];
    }
  }

  /**
   * 搜索包含微信公众号链接的元素
   */
  findWeChatLinks(elements: any[]): string[] {
    console.log('🔗 搜索微信公众号链接...');

    const links = elements
      .filter(e => e.value && (
        e.value.includes('mp.weixin.qq.com') ||
        e.value.includes('weixin') ||
        e.value.includes('公众号')
      ))
      .map(e => e.value);

    console.log(`✅ 找到 ${links.length} 个相关元素`);
    return links;
  }

  /**
   * 使用键盘导航提取文章信息
   */
  async extractWithKeyboard(): Promise<any[]> {
    console.log('⌨️  使用键盘导航提取文章...');

    const articles: any[] = [];

    try {
      // 模拟键盘操作
      const script = `
        tell application "System Events"
          tell process "ima.copilot"
            -- 确保 ima.copilot 是前台应用
            set frontmost to true
            delay 0.5

            -- 尝试使用 Tab 键导航
            tell front window
              -- 按 Tab 键多次，尝试聚焦到文章列表
              repeat 5 times
                keystroke tab
                delay 0.3
              end repeat

              -- 按 Command+A 全选
              keystroke "a" using command down
              delay 0.5

              -- 按 Command+C 复制
              keystroke "c" using command down
              delay 0.5
            end tell
          end tell
        end tell
      `;

      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });

      // 等待复制完成
      execSync('sleep 1');

      // 获取剪贴板内容
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' });
      console.log('📋 剪贴板内容长度:', clipboard.length);

      // 解析剪贴板内容
      if (clipboard.length > 0) {
        // 按行分割
        const lines = clipboard.split('\n').filter(l => l.trim().length > 0);

        // 查找包含微信公众号链接的行
        lines.forEach(line => {
          if (line.includes('mp.weixin.qq.com')) {
            // 提取 URL
            const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              articles.push({
                url: urlMatch[1],
                text: line.trim()
              });
            }
          }
        });
      }

    } catch (error) {
      console.error('❌ 键盘导航失败:', error);
    }

    return articles;
  }

  /**
   * 使用鼠标点击提取
   */
  async extractWithMouse(): Promise<any[]> {
    console.log('🖱️  使用鼠标操作提取文章...');

    const articles: any[] = [];

    try {
      // 使用 robotjs 或 AppleScript 模拟鼠标操作
      const script = `
        tell application "System Events"
          tell process "ima.copilot"
            set frontmost to true
            delay 0.5

            tell front window
              -- 尝试点击列表中的第一个元素
              try
                -- 获取窗口位置和大小
                set windowBounds to bounds
                set windowX to item 1 of windowBounds
                set windowY to item 2 of windowBounds
                set windowWidth to item 3 of windowBounds - item 1 of windowBounds
                set windowHeight to item 4 of windowBounds - item 2 of windowBounds

                -- 计算点击位置（列表区域，通常在左侧或中间）
                set clickX to windowX + (windowWidth / 2)
                set clickY to windowY + 200

                -- 点击
                click at {clickX, clickY}
                delay 1

                -- 右键点击
                click at {clickX, clickY} using {option down}
                delay 0.5

                -- 按 "复制链接" 或 "复制"
                keystroke "c" using command down
                delay 0.5

              on error errorMsg
                log "无法执行鼠标操作: " & errorMsg
              end try
            end tell
          end tell
        end tell
      `;

      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });

      // 获取剪贴板
      execSync('sleep 1');
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' });

      if (clipboard && clipboard.includes('mp.weixin.qq.com')) {
        articles.push({
          url: clipboard.trim(),
          method: 'mouse'
        });
      }

    } catch (error) {
      console.error('❌ 鼠标操作失败:', error);
    }

    return articles;
  }

  /**
   * 截取屏幕并分析
   */
  captureAndAnalyze(): any {
    console.log('📸 截取屏幕并分析...');

    const timestamp = Date.now();
    const screenshotPath = path.join(process.cwd(), `ima-screen-${timestamp}.png`);

    try {
      // 截图
      execSync(`screencapture -x -R0,0,1920,1080 "${screenshotPath}"`, { encoding: 'utf-8' });
      console.log(`✅ 截图已保存: ${screenshotPath}`);

      return {
        screenshot: screenshotPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 截图失败:', error);
      return null;
    }
  }

  /**
   * 执行完整的提取流程
   */
  async run(): Promise<void> {
    console.log('🚀 开始通过 GUI 提取文章链接\n');
    console.log('='.repeat(60));

    // 1. 检查应用是否运行
    if (!this.isRunning()) {
      this.launch();
    } else {
      console.log('✅ ima.copilot 已在运行');
    }

    // 2. 激活窗口
    this.activateWindow();

    // 3. 截取初始屏幕
    const initialCapture = this.captureAndAnalyze();

    // 4. 获取 UI 元素
    const elements = this.getUIElements();

    // 5. 搜索链接
    const links = this.findWeChatLinks(elements);

    if (links.length > 0) {
      console.log('\n✅ 在 UI 元素中找到链接:');
      links.forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.substring(0, 100)}...`);
      });
    }

    // 6. 使用键盘导航
    console.log('\n⌨️  尝试键盘导航...');
    const keyboardArticles = await this.extractWithKeyboard();

    if (keyboardArticles.length > 0) {
      console.log('\n✅ 通过键盘导航找到文章:');
      keyboardArticles.forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.url}`);
      });
    }

    // 7. 使用鼠标操作
    console.log('\n🖱️  尝试鼠标操作...');
    const mouseArticles = await this.extractWithMouse();

    if (mouseArticles.length > 0) {
      console.log('\n✅ 通过鼠标操作找到文章:');
      mouseArticles.forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.url}`);
      });
    }

    // 8. 汇总结果
    const allArticles = [...keyboardArticles, ...mouseArticles];

    // 9. 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      initialCapture,
      uiElements: elements.slice(0, 20),
      linksFromUI: links,
      articlesFromKeyboard: keyboardArticles,
      articlesFromMouse: mouseArticles,
      totalArticles: allArticles.length
    };

    const resultPath = path.join(process.cwd(), 'ima-gui-extract-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    // 10. 显示摘要
    console.log('\n' + '='.repeat(60));
    console.log('📊 提取结果摘要');
    console.log('='.repeat(60));
    console.log(`UI 元素: ${elements.length} 个`);
    console.log(`UI 中找到的链接: ${links.length} 个`);
    console.log(`键盘导航提取: ${keyboardArticles.length} 篇`);
    console.log(`鼠标操作提取: ${mouseArticles.length} 篇`);
    console.log(`总计: ${allArticles.length} 篇文章`);

    if (allArticles.length > 0) {
      console.log('\n🎉 成功提取的文章链接:');
      allArticles.forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.url}`);
        if (article.text) {
          console.log(`   ${article.text.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('\n⚠️  未找到文章链接');
      console.log('\n💡 建议:');
      console.log('1. 确保 ima.copilot 窗口在前台');
      console.log('2. 确保知识库中有微信公众号文章');
      console.log('3. 尝试手动点击一篇文档后重试');
      console.log('4. 查看 ima-final-guide.md 中的其他方案');
    }

    console.log(`\n💾 详细结果已保存到: ${resultPath}`);
    console.log('\n✅ 提取完成！');
  }
}

// 主函数
async function main() {
  const extractor = new IMAGUIExtractor();
  await extractor.run();
}

// 运行
main().catch(console.error);
