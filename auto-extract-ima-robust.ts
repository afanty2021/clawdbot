#!/usr/bin/env tsx

/**
 * 完全自动化 IMA 链接提取 - 健壮版本
 * 使用更可靠的 GUI 自动化方法
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class RobustIMAExtractor {
  private delay(ms: number): void {
    const seconds = ms / 1000;
    execSync(`sleep ${seconds}`, { encoding: 'utf-8' });
  }

  /**
   * 激活应用
   */
  activateApp(): void {
    console.log('🎯 激活 ima.copilot...');

    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
      this.delay(1500);
      console.log('✅ 应用已激活\n');
    } catch (error) {
      console.log('⚠️  激活时出现警告，继续...\n');
    }
  }

  /**
   * 使用键盘导航
   */
  navigateWithKeyboard(): void {
    console.log('⌨️  使用键盘导航...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 1

          -- 使用 Tab 键导航到知识库
          repeat 3 times
            keystroke tab
            delay 0.3
          end repeat

          -- 按 Enter 进入知识库
          keystroke return
          delay 1.5

          -- 向下导航到文章列表
          keystroke (ASCII character 28)
          delay 0.5

          -- 按 Enter 打开文章
          keystroke return
          delay 2
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 键盘导航完成\n');
    } catch (error) {
      console.log('⚠️  键盘导航失败，尝试鼠标操作...\n');
    }
  }

  /**
   * 使用鼠标点击（固定坐标）
   */
  clickWithMouse(): void {
    console.log('🖱️  使用鼠标点击...');

    // 获取屏幕尺寸
    const screenResult = execSync('system_profiler SPDisplaysDataType | grep Resolution', { encoding: 'utf-8' });
    const match = screenResult.match(/(\d+) x (\d+)/);

    let screenWidth = 1920;
    let screenHeight = 1080;

    if (match) {
      screenWidth = parseInt(match[1]);
      screenHeight = parseInt(match[2]);
    }

    console.log(`📺 屏幕尺寸: ${screenWidth}x${screenHeight}`);

    // 计算点击位置（假设窗口在屏幕中央）
    const centerX = Math.floor(screenWidth / 2);
    const centerY = Math.floor(screenHeight / 2);

    // 点击知识库（左侧导航）
    const knowledgeX = centerX - 400;
    const knowledgeY = centerY - 200;

    // 点击文章（中央内容区）
    const articleX = centerX;
    const articleY = centerY + 50;

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击知识库
          click at {${knowledgeX}, ${knowledgeY}}
          delay 1

          -- 点击文章
          click at {${articleX}, ${articleY}}
          delay 2
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 鼠标点击完成\n');
    } catch (error) {
      console.log('⚠️  鼠标点击失败\n');
    }
  }

  /**
   * 获取地址栏 URL
   */
  getAddressBarURL(): string {
    console.log('📋 获取地址栏 URL...');

    const methods = [
      // 方法 1: Cmd+L 聚焦地址栏
      `
        tell application "System Events"
          tell process "ima.copilot"
            keystroke "l" using command down
            delay 0.5
            keystroke "a" using command down
            delay 0.3
            keystroke "c" using command down
          end tell
        end tell
      `,
      // 方法 2: Cmd+A 全选，然后复制
      `
        tell application "System Events"
          tell process "ima.copilot"
            keystroke "a" using command down
            delay 0.3
            keystroke "c" using command down
          end tell
        end tell
      `,
      // 方法 3: 尝试从 UI 元素获取
      `
        tell application "System Events"
          tell process "ima.copilot"
            tell front window
              try
                -- 尝试获取地址栏文本
                set urlText to value of text field 1
                return urlText
              on error
                return ""
              end try
            end tell
          end tell
        end tell
      `
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        if (i < 2) {
          execSync(`osascript -e '${methods[i]}'`, { encoding: 'utf-8' });
          this.delay(1000);
        } else {
          const result = execSync(`osascript -e '${methods[i]}'`, { encoding: 'utf-8' });
          if (result.trim()) {
            return result.trim();
          }
        }

        const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

        if (clipboard && clipboard.includes('http')) {
          // 提取 URL
          const urlMatch = clipboard.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            console.log(`✅ 成功获取 URL (方法 ${i + 1})\n`);
            return urlMatch[1];
          }
        }
      } catch (error) {
        console.log(`⚠️  方法 ${i + 1} 失败，尝试下一个...`);
        this.delay(500);
      }
    }

    console.log('❌ 所有方法都失败了\n');
    return '';
  }

  /**
   * 使用 UI 检查获取文章信息
   */
  async getArticleInfoFromUI(): Promise<any> {
    console.log('🔍 从 UI 获取文章信息...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          tell front window
            set articleInfo to {}

            -- 尝试获取所有文本元素
            try
              set allText to every text element
              repeat with i from 1 to count of allText
                try
                  set elem to item i of allText
                  set elemValue to value of elem
                  if elemValue is not missing value then
                    if elemValue contains "mp.weixin.qq.com" then
                      set end of articleInfo to {type:"url", value:elemValue}
                    else if length of elemValue is greater than 10 and length of elemValue is less than 200 then
                      set end of articleInfo to {type:"text", value:elemValue}
                    end if
                  end if
                end try
              end repeat
            end try

            return articleInfo
          end tell
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });

      // 解析结果
      const lines = result.split('\n');
      const urlLine = lines.find(l => l.includes('mp.weixin.qq.com'));

      if (urlLine) {
        const urlMatch = urlLine.match(/value:([^,}]+)/);
        if (urlMatch) {
          const url = urlMatch[1].trim();
          console.log(`✅ 从 UI 找到 URL: ${url}\n`);
          return { url };
        }
      }
    } catch (error) {
      console.log('⚠️  UI 检查失败\n');
    }

    return null;
  }

  /**
   * 在 Chrome 中验证链接
   */
  verifyInChrome(url: string): void {
    console.log(`🌐 在 Chrome 中验证链接...`);
    console.log(`📎 URL: ${url}\n`);

    try {
      execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
      console.log('✅ Chrome 已打开链接');
    } catch (error) {
      execSync(`open "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 默认浏览器已打开链接');
    }

    this.delay(3000);
  }

  /**
   * 截取验证截图
   */
  takeScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-auto-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    console.log('📸 截取验证截图...');

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    console.log(`✅ 截图已保存: ${filename}\n`);

    return filepath;
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 完全自动化 IMA 链接提取器\n');
    console.log('='.repeat(60));

    // 1. 激活应用
    this.activateApp();

    // 2. 尝试多种方法获取链接
    let url = '';
    let articleInfo = null;

    // 方法 A: 从 UI 获取
    articleInfo = await this.getArticleInfoFromUI();
    if (articleInfo && articleInfo.url) {
      url = articleInfo.url;
    }

    // 方法 B: 键盘导航 + 地址栏
    if (!url) {
      this.navigateWithKeyboard();
      url = this.getAddressBarURL();
    }

    // 方法 C: 鼠标点击 + 地址栏
    if (!url) {
      this.clickWithMouse();
      url = this.getAddressBarURL();
    }

    // 3. 验证链接
    if (url && url.includes('http')) {
      console.log(`\n✅ 成功获取链接: ${url}\n`);

      // 4. 在 Chrome 中打开
      this.verifyInChrome(url);

      // 5. 截图
      const screenshot = this.takeScreenshot();

      // 6. 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        screenshot,
        method: 'fully_automated_robust'
      };

      const resultPath = path.join(process.cwd(), 'ima-auto-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      // 7. 显示结果
      console.log('='.repeat(60));
      console.log('🎉 自动化提取成功！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}`);
      console.log(`📸 验证截图: ${screenshot}`);
      console.log(`💾 结果文件: ${resultPath}`);

    } else {
      console.log('\n❌ 自动化提取失败');
      console.log('\n💡 建议尝试以下方案:');
      console.log('   1. 确保 ima.copilot 窗口可见且在前台');
      console.log('   2. 确认知识库中有微信公众号文章');
      console.log('   3. 检查辅助功能权限设置');
      console.log('   4. 或使用手动方案: ./verify-ima-link.sh');
    }
  }
}

// 主函数
async function main() {
  const extractor = new RobustIMAExtractor();
  await extractor.run();
}

main().catch(console.error);
