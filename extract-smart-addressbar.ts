#!/usr/bin/env tsx

/**
 * 智能地址栏链接提取器 - 多种方法尝试
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class SmartAddressBarExtractor {
  /**
   * 方法 1: 使用 Cmd+L 聚焦地址栏
   */
  method1_FocusAddressBar(): string {
    console.log('📍 方法 1: Cmd+L 聚焦地址栏...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 聚焦地址栏
          keystroke "l" using command down
          delay 0.5

          -- 全选
          keystroke "a" using command down
          delay 0.3

          -- 复制
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      if (clipboard.includes('mp.weixin.qq.com')) {
        const urlMatch = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          console.log(`✅ 方法 1 成功: ${urlMatch[1]}\n`);
          return urlMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️  方法 1 失败\n');
    }

    return '';
  }

  /**
   * 方法 2: 使用 Alt+D (Chrome 快捷键)
   */
  method2_AltD(): string {
    console.log('📍 方法 2: Alt+D 聚焦地址栏...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- Alt+D 聚焦地址栏
          keystroke "d" using option down
          delay 0.5

          -- 全选
          keystroke "a" using command down
          delay 0.3

          -- 复制
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      if (clipboard.includes('mp.weixin.qq.com')) {
        const urlMatch = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          console.log(`✅ 方法 2 成功: ${urlMatch[1]}\n`);
          return urlMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️  方法 2 失败\n');
    }

    return '';
  }

  /**
   * 方法 3: 直接从 UI 元素获取 URL
   */
  method3_UIElements(): string {
    console.log('📍 方法 3: 从 UI 元素获取 URL...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          tell front window
            try
              -- 尝试获取地址栏文本框
              set textFields to every text field
              repeat with textField in textFields
                try
                  set fieldValue to value of textField
                  if fieldValue is not missing value and fieldValue contains "mp.weixin.qq.com" then
                    return fieldValue
                  end if
                end try
              end repeat

              -- 尝试获取所有静态文本
              set staticTexts to every static text
              repeat with staticText in staticTexts
                try
                  set textValue to value of staticText
                  if textValue is not missing value and textValue contains "mp.weixin.qq.com" then
                    return textValue
                  end if
                end try
              end repeat

            on error
              return ""
            end try
          end tell
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' }).trim();

      if (result && result.includes('mp.weixin.qq.com')) {
        const urlMatch = result.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          console.log(`✅ 方法 3 成功: ${urlMatch[1]}\n`);
          return urlMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️  方法 3 失败\n');
    }

    return '';
  }

  /**
   * 方法 4: 使用 AppleScript 获取窗口标题（可能包含 URL）
   */
  method4_WindowTitle(): string {
    console.log('📍 方法 4: 从窗口标题获取...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set windowTitle to title of front window
          return windowTitle
        end tell
      end tell
    `;

    try {
      const title = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' }).trim();

      if (title && title.includes('mp.weixin.qq.com')) {
        const urlMatch = title.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
        if (urlMatch) {
          console.log(`✅ 方法 4 成功: ${urlMatch[1]}\n`);
          return urlMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️  方法 4 失败\n');
    }

    return '';
  }

  /**
   * 在 Chrome 中验证
   */
  async verifyInChrome(url: string): Promise<string> {
    console.log('🌐 在 Chrome 中打开验证...');
    console.log(`📎 URL: ${url}\n`);

    execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });

    // 等待加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 截图
    const timestamp = Date.now();
    const filename = `ima-chrome-verify-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
    console.log(`📸 截图已保存: ${filename}\n`);

    return filepath;
  }

  /**
   * 运行完整流程
   */
  async run(): Promise<void> {
    console.log('🚀 智能地址栏链接提取器\n');
    console.log('='.repeat(60));

    let url = '';

    // 尝试所有方法
    url = this.method1_FocusAddressBar();
    if (!url) {url = this.method2_AltD();}
    if (!url) {url = this.method3_UIElements();}
    if (!url) {url = this.method4_WindowTitle();}

    if (url) {
      // 验证
      const screenshot = await this.verifyInChrome(url);

      // 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        screenshot
      };

      const resultPath = path.join(process.cwd(), 'ima-smart-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log('='.repeat(60));
      console.log('🎉 成功！');
      console.log('='.repeat(60));
      console.log(`📋 链接: ${url}`);
      console.log(`📸 截图: ${screenshot}`);
      console.log(`💾 结果: ${resultPath}\n`);

    } else {
      console.log('❌ 所有方法都失败了');
      console.log('\n💡 建议:');
      console.log('   1. 确认文章已在 ima.copilot 中打开');
      console.log('   2. 地址栏可见且包含 mp.weixin.qq.com');
      console.log('   3. 或者手动复制链接后使用: ./verify-ima-link.sh');
    }
  }
}

// 主函数
async function main() {
  const extractor = new SmartAddressBarExtractor();
  await extractor.run();
}

main().catch(console.error);
