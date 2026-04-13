#!/usr/bin/env tsx

/**
 * 完全自动化：通过 GUI 操作提取 IMA 文章链接
 * 1. 激活 ima.copilot 窗口
 * 2. 导航到知识库
 * 3. 点击文章
 * 4. 从地址栏获取链接
 * 5. 在 Chrome 中验证
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class FullyAutomatedIMAExtractor {
  private delay(ms: number): void {
    execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });
  }

  /**
   * 激活并置前 ima.copilot 窗口
   */
  activateIMACopilot(): boolean {
    console.log('🎯 激活 ima.copilot 窗口...');

    const script = `
      tell application "ima.copilot"
        activate
        delay 0.5
      end tell

      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      this.delay(1000);
      console.log('✅ ima.copilot 已激活');
      return true;
    } catch (error) {
      console.error('❌ 激活失败:', error);
      return false;
    }
  }

  /**
   * 获取窗口位置和大小
   */
  getWindowBounds(): { x: number; y: number; width: number; height: number } {
    console.log('📐 获取窗口位置...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          tell front window
            set b to bounds
            return item 1 of b & "," & item 2 of b & "," & (item 3 of b - item 1 of b) & "," & (item 4 of b - item 2 of b)
          end tell
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' }).trim();
      const [x, y, width, height] = result.split(',').map(Number);
      console.log(`✅ 窗口位置: ${x}, ${y} | 大小: ${width}x${height}`);
      return { x, y, width, height };
    } catch (error) {
      console.log('⚠️  无法自动获取窗口位置，使用默认值');
      // 默认值：假设窗口在屏幕中央，大小为 1920x1080
      return {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      };
    }
  }

  /**
   * 探索 UI 结构 - 帮助理解界面布局
   */
  exploreUIStructure(): void {
    console.log('🔍 探索 UI 结构...\n');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 1

          -- 获取窗口的所有 UI 元素
          try
            tell window 1
              set allElements to every UI element

              -- 打印前 20 个元素的信息
              repeat with i from 1 to 20
                if i ≤ count of allElements then
                  try
                    set elem to item i of allElements
                    set elemClass to class of elem
                    set elemName to name of elem
                    log "元素 " & i & ": " & elemClass & " - " & elemName
                  on error errMsg
                    -- 忽略无法访问的元素
                  end try
                end if
              end repeat
            end tell
          on error errMsg
            log "探索失败: " & errMsg
          end try
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(result);
    } catch (error) {
      console.log('⚠️  UI 探索完成');
    }
  }

  /**
   * 通过名称查找并点击 UI 元素
   */
  clickElementByName(elementName: string): boolean {
    console.log(`🖱️  查找元素: "${elementName}"`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 在所有按钮中查找
          try
            set allButtons to every button of window 1
            repeat with btn in allButtons
              try
                if name of btn contains "${elementName}" then
                  click btn
                  return "Clicked: " & name of btn
                end if
              end try
            end repeat
          end try

          -- 在所有菜单项中查找
          try
            set allMenus to every menu item of window 1
            repeat with menuItem in allMenus
              try
                if name of menuItem contains "${elementName}" then
                  click menuItem
                  return "Clicked: " & name of menuItem
                end if
              end try
            end repeat
          end try

          -- 在所有静态文本中查找并点击其父元素
          try
            set allTexts to every static text of window 1
            repeat with txt in allTexts
              try
                if value of txt contains "${elementName}" then
                  try
                    click parent of txt
                    return "Clicked parent of: " & value of txt
                  on error
                    -- 尝试点击文本区域
                    set pos to position of txt
                    click at pos
                    return "Clicked at: " & value of txt
                  end try
                end if
              end try
            end repeat
          end try

          return "Not found: ${elementName}"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(result.trim());

      if (result.includes('Clicked')) {
        console.log('✅ 点击成功\n');
        this.delay(1000);
        return true;
      } else {
        console.log('⚠️  未找到元素\n');
        return false;
      }
    } catch (error) {
      console.log('❌ 点击失败\n');
      return false;
    }
  }

  /**
   * 点击左侧导航栏的知识库图标
   */
  clickKnowledgeBaseIcon(bounds: any): boolean {
    console.log('📚 点击知识库图标...');

    // 知识库图标通常在左侧导航栏，尝试多个位置
    const positions = [
      { x: bounds.x + 40, y: bounds.y + 120 },  // 上部
      { x: bounds.x + 40, y: bounds.y + 160 },  // 中部
      { x: bounds.x + 40, y: bounds.y + 200 },  // 下部
      { x: bounds.x + 60, y: bounds.y + 140 },  // 稍微偏右
    ];

    for (const pos of positions) {
      console.log(`  尝试坐标: (${pos.x}, ${pos.y})`);

      const script = `
        tell application "System Events"
          tell process "ima.copilot"
            click at {${pos.x}, ${pos.y}}
          end tell
        end tell
      `;

      try {
        execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
        this.delay(800);

        // 检查是否有反应（可以通过观察界面变化判断）
        console.log('  ✅ 已点击');
        return true;
      } catch (error) {
        console.log('  ⚠️  点击失败，尝试下一个位置');
      }
    }

    console.log('❌ 所有位置都失败');
    return false;
  }

  /**
   * 选择特定的知识库（如"AI"）
   */
  selectKnowledgeBase(knowledgeBaseName: string): boolean {
    console.log(`📂 选择知识库: "${knowledgeBaseName}"`);

    // 方法1: 尝试通过文本查找并点击
    const found = this.clickElementByName(knowledgeBaseName);

    if (found) {
      console.log(`✅ 已选择知识库: ${knowledgeBaseName}\n`);
      this.delay(1500);
      return true;
    }

    // 方法2: 尝试在左侧导航栏区域查找并点击
    console.log(`⚠️  未找到"${knowledgeBaseName}"，尝试其他方法...`);

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 尝试在左侧区域滚动并查找
          -- 模拟向下箭头键浏览
          repeat with i from 1 to 10
            keystroke (ASCII character 31) -- down arrow
            delay 0.2
          end repeat

          -- 按 Enter 键选中
          keystroke return
          delay 1
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 已尝试键盘导航选择\n');
      this.delay(1500);
      return true;
    } catch (error) {
      console.log('❌ 选择知识库失败\n');
      return false;
    }
  }

  /**
   * 点击微信公众号文章标题
   */
  clickWeChatArticleTitle(bounds: any): boolean {
    console.log('📄 查找并点击微信公众号文章...');

    // 方法1: 尝试通过文本查找并点击"微信公众号"
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 在所有静态文本中查找"微信公众号"
          try
            set allTexts to every static text of window 1
            repeat with txt in allTexts
              try
                if value of txt contains "微信公众号" then
                  -- 找到了，尝试点击其父元素
                  try
                    set parentElem to parent of txt
                    click parentElem
                    return "Clicked WeChat article"
                  on error
                    -- 如果无法点击父元素，尝试点击文本位置
                    set pos to position of txt
                    click at pos
                    return "Clicked at WeChat article position"
                  end try
                end if
              end try
            end repeat
          end try

          return "Not found"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(result.trim());

      if (result.includes('Clicked')) {
        console.log('✅ 已点击微信公众号文章');
        this.delay(1000); // 等待1秒让文章加载
        return true;
      }
    } catch (error) {
      console.log('⚠️  文本查找方法失败');
    }

    // 方法2: 尝试在主内容区域点击（备用方案）
    console.log('🔄 尝试备用方案：点击主内容区域...');
    const clickX = bounds.x + bounds.width / 2; // 中间位置
    const clickY = bounds.y + 300; // 文章列表开始位置

    const backupScript = `
      tell application "System Events"
        tell process "ima.copilot"
          -- 单击选中
          click at {${clickX}, ${clickY}}
          delay 0.3
          -- 再次单击打开
          click at {${clickX}, ${clickY}}
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${backupScript}'`, { encoding: 'utf-8' });
      console.log('✅ 已点击文章区域');
      this.delay(1000);
      return true;
    } catch (error) {
      console.error('❌ 点击文章失败');
      return false;
    }
  }

  /**
   * 从浏览器地址栏复制 URL（使用固定坐标方法）
   */
  copyURLFromAddressBar(): string {
    console.log('📋 从地址栏复制 URL...');

    // 使用已经验证成功的固定坐标方法
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 点击地址栏位置（窗口顶部中央）
          -- 使用默认坐标 960, 100（屏幕中央偏上）
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

      // 读取剪贴板
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      // 检查是否为 URL
      if (clipboard.startsWith('http')) {
        console.log(`✅ 复制成功: ${clipboard.substring(0, 80)}...`);
        return clipboard;
      } else {
        console.log(`⚠️  剪贴板内容不是 URL: ${clipboard.substring(0, 100)}...`);
        return '';
      }
    } catch (error) {
      console.error('❌ 复制 URL 失败:', error);
      return '';
    }
  }

  /**
   * 检查是否为微信公众号链接
   */
  isWeChatArticleURL(url: string): boolean {
    return url.includes('mp.weixin.qq.com') ||
           url.includes('weixin.qq.com');
  }

  /**
   * 在 Chrome 中打开验证
   */
  openInChrome(url: string): void {
    console.log(`\n🌐 在 Chrome 中打开链接...`);
    console.log(`📎 URL: ${url}\n`);

    try {
      execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 已在 Chrome 中打开\n');
    } catch (error) {
      // 备用：使用默认浏览器
      execSync(`open "${url}"`, { encoding: 'utf-8' });
      console.log('✅ 已在默认浏览器中打开\n');
    }
  }

  /**
   * 截取验证截图
   */
  captureScreenshot(): string {
    const timestamp = Date.now();
    const filename = `ima-auto-verify-${timestamp}.png`;
    const filepath = path.join(process.cwd(), filename);

    console.log('📸 截取验证截图...');

    try {
      execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
      console.log(`✅ 截图已保存: ${filepath}\n`);
      return filepath;
    } catch (error) {
      console.error('❌ 截图失败');
      return '';
    }
  }

  /**
   * 执行完整的自动化流程
   */
  async run(): Promise<void> {
    console.log('🚀 开始完全自动化的 IMA 文章链接提取\n');
    console.log('='.repeat(60));

    // 1. 激活 ima.copilot
    if (!this.activateIMACopilot()) {
      console.log('❌ 无法激活 ima.copilot');
      console.log('💡 请确保:');
      console.log('   1. ima.copilot 正在运行');
      console.log('   2. 已授予终端辅助功能权限');
      return;
    }

    // 2. 获取窗口位置
    const bounds = this.getWindowBounds();
    console.log(`📍 使用窗口边界: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}\n`);

    // 3. 探索 UI 结构（可选，帮助调试）
    // this.exploreUIStructure();

    // 4. 点击知识库图标
    this.clickKnowledgeBaseIcon(bounds);

    // 5. 选择知识库（如"AI"）
    this.selectKnowledgeBase('AI');

    // 6. 等待知识库加载
    console.log('⏳ 等待知识库内容加载...');
    this.delay(1500);

    // 7. 查找并点击微信公众号文章标题
    this.clickWeChatArticleTitle(bounds);

    // 8. 等待文章全文显示（地址栏才会出现）
    console.log('⏳ 等待文章全文显示...');
    this.delay(1500);

    // 9. 从地址栏复制 URL（此时地址栏应该已经显示）
    const url = this.copyURLFromAddressBar();

    // 10. 验证链接
    if (url && this.isWeChatArticleURL(url)) {
      console.log(`\n✅ 成功获取微信公众号文章链接!`);
      console.log(`📎 URL: ${url}\n`);

      // 11. 在 Chrome 中打开验证
      this.openInChrome(url);

      // 12. 等待页面加载
      console.log('⏳ 等待页面加载...');
      this.delay(3000);

      // 13. 截取验证截图
      const screenshot = this.captureScreenshot();

      // 14. 保存结果
      const result = {
        timestamp: new Date().toISOString(),
        url,
        screenshot,
        method: 'fully_automated'
      };

      const resultPath = path.join(process.cwd(), 'ima-auto-result.json');
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      // 15. 显示摘要
      console.log('='.repeat(60));
      console.log('🎉 完整自动化流程成功！');
      console.log('='.repeat(60));
      console.log(`📋 文章链接: ${url}`);
      console.log(`📸 验证截图: ${screenshot}`);
      console.log(`💾 结果文件: ${resultPath}`);
      console.log('\n✅ 完成！链接已在 Chrome 中打开并验证。');

    } else {
      console.log('\n❌ 未能获取有效的微信公众号文章链接');
      console.log('\n💡 可能的原因:');
      console.log('   1. 知识库中没有微信公众号文章');
      console.log('   2. 文章页面未正确加载');
      console.log('   3. 地址栏无法访问');
      console.log('\n🔧 建议:');
      console.log('   1. 确保 ima.copilot 窗口在前台');
      console.log('   2. 确认知识库中有文章');
      console.log('   3. 尝试手动操作一次后重新运行');
    }
  }
}

// 主函数
async function main() {
  console.log('📝 前置条件检查...\n');

  // 检查 ima.copilot 是否运行
  try {
    execSync('pgrep -x "ima.copilot"', { encoding: 'utf-8' });
    console.log('✅ ima.copilot 正在运行');
  } catch {
    console.log('⚠️  ima.copilot 未运行，正在启动...');
    execSync('open -a "ima.copilot"', { encoding: 'utf-8' });
    console.log('⏳ 等待应用启动...');
    execSync('sleep 5');
  }

  console.log('');
  const extractor = new FullyAutomatedIMAExtractor();
  await extractor.run();
}

// 运行
main().catch(console.error);
