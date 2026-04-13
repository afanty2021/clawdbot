#!/usr/bin/env tsx

/**
 * ima.copilot UI 探索工具
 * 使用 AppleScript 和 Accessibility API 获取界面元素和数据
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface UIElement {
  type: string;
  name: string;
  value: string;
  position: string;
  children?: UIElement[];
}

interface ArticleData {
  title: string;
  url: string;
  source: string;
}

class IMAUIExplorer {
  /**
   * 检查 ima.copilot 是否正在运行
   */
  isIMARunning(): boolean {
    try {
      const result = execSync('pgrep -x "ima.copilot"', { encoding: 'utf-8' });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 启动 ima.copilot
   */
  launchIMA(): void {
    console.log('🚀 启动 ima.copilot...');
    try {
      execSync('open -a "ima.copilot"', { encoding: 'utf-8' });
      console.log('✅ ima.copilot 已启动');
      console.log('⏸️  等待应用加载...');
      execSync('sleep 3');
    } catch (error) {
      console.error('❌ 启动失败:', error);
    }
  }

  /**
   * 获取 ima.copilot 的窗口信息
   */
  getIMAWindowInfo(): any {
    console.log('🔍 获取窗口信息...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set windowInfo to {}
          set frontWindow to front window
          try
            set windowName to name of frontWindow
            set windowBounds to bounds of frontWindow
            set end of windowInfo to {name:windowName, bounds:windowBounds}
          on error
            set end of windowInfo to {error:"无法获取窗口信息"}
          end try
          return windowInfo
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('✅ 窗口信息:', result);
      return result;
    } catch (error) {
      console.error('❌ 获取窗口信息失败');
      console.error('\n💡 请授予终端辅助功能权限：');
      console.error('   系统设置 > 隐私与安全性 > 辅助功能 > 添加终端');
      return null;
    }
  }

  /**
   * 获取所有 UI 元素
   */
  getAllUIElements(): UIElement[] {
    console.log('🔍 获取 UI 元素...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set uiElements to {}
          try
            set frontWindow to front window
            tell frontWindow
              set allElements to every UI element
              repeat with elem in allElements
                try
                  set elemClass to class of elem as string
                  set elemName to name of elem as string
                  set elemValue to value of elem as string
                  set end of uiElements to {type:elemClass, name:elemName, value:elemValue}
                on error
                  -- 跳过无法访问的元素
                end try
              end repeat
            end tell
          on error
            set end of uiElements to {error:"无法获取 UI 元素"}
          end try
          return uiElements
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(`✅ 找到 ${result.split('\n').filter(l => l.trim()).length} 个 UI 元素`);
      return JSON.parse(result);
    } catch (error) {
      console.error('❌ 获取 UI 元素失败');
      return [];
    }
  }

  /**
   * 查找包含微信公众号链接的文本元素
   */
  findWeChatLinks(): ArticleData[] {
    console.log('🔍 搜索微信公众号链接...');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set links to {}
          try
            tell front window
              -- 查找所有文本元素
              set textElements to every text element
              repeat with txt in textElements
                try
                  set txtContent to value of txt as string
                  if txtContent contains "mp.weixin.qq.com" or txtContent contains "weixin" then
                    set end of links to {content:txtContent}
                  end if
                on error
                  -- 跳过
                end try
              end repeat

              -- 查找所有按钮
              set buttons to every button
              repeat with btn in buttons
                try
                  set btnTitle to title of btn as string
                  if btnTitle contains "mp.weixin.qq.com" or btnTitle contains "weixin" then
                    set end of links to {content:btnTitle, type:"button"}
                  end if
                on error
                  -- 跳过
                end try
              end repeat
            end tell
          on error
            set end of links to {error:"无法搜索链接"}
          end try
          return links
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log(`✅ 找到链接`);
      return JSON.parse(result);
    } catch (error) {
      console.error('❌ 搜索链接失败');
      return [];
    }
  }

  /**
   * 使用模拟点击和键盘操作导航
   */
  async navigateAndExtract(): Promise<ArticleData[]> {
    const articles: ArticleData[] = [];

    console.log('🖱️  使用 UI 自动化导航...');

    try {
      // 1. 点击知识库按钮（如果存在）
      const clickScript = `
        tell application "System Events"
          tell process "ima.copilot"
            try
              -- 尝试找到并点击知识库相关按钮
              click button 1 of toolbar 1 of front window
              return {success:true, action:"点击工具栏按钮"}
            on error
              return {success:false, error:"无法点击按钮"}
            end try
          end tell
        end tell
      `;

      const clickResult = execSync(`osascript -e '${clickScript}'`, { encoding: 'utf-8' });
      console.log('点击结果:', clickResult);

      // 2. 等待界面加载
      execSync('sleep 2');

      // 3. 获取列表内容
      const listScript = `
        tell application "System Events"
          tell process "ima.copilot"
            try
              tell front window
                -- 尝试获取表格或列表内容
                if exists table 1 then
                  set tableData to rows of table 1
                  return {type:"table", count:count of tableData}
                else if exists outline 1 then
                  set outlineData to rows of outline 1
                  return {type:"outline", count:count of outlineData}
                else if exists scroll area 1 then
                  tell scroll area 1
                    if exists table 1 then
                      set tableData to rows of table 1
                      return {type:"scroll_table", count:count of tableData}
                    end if
                  end tell
                end if
                return {type:"unknown"}
              end tell
            on error
              return {error:"无法获取列表内容"}
            end try
          end tell
        end tell
      `;

      const listResult = execSync(`osascript -e '${listScript}'`, { encoding: 'utf-8' });
      console.log('列表信息:', listResult);

    } catch (error) {
      console.error('❌ UI 自动化失败:', error);
    }

    return articles;
  }

  /**
   * 截取屏幕截图
   */
  takeScreenshot(filename: string): void {
    console.log(`📸 截取屏幕截图: ${filename}`);

    try {
      execSync(`screencapture -x -R0,0,1920,1080 "${filename}"`, { encoding: 'utf-8' });
      console.log('✅ 截图已保存');
    } catch (error) {
      console.error('❌ 截图失败');
    }
  }

  /**
   * 生成操作指南
   */
  generateGuide(): string {
    return `# ima.copilot 自动化探索指南

## 当前状态

✅ **ima.copilot 支持 AppleScript**
- 可以使用 System Events 访问 UI 元素
- 可以模拟点击和键盘操作

## 手动操作步骤

由于自动 UI 探索有限，建议手动操作：

### 1. 获取应用数据

**方法 A: 使用 SQLite 浏览器**
\`\`\`bash
# 安装 SQLite 浏览器
brew install sqlitebrowser

# 查找数据库文件
find ~/Library -name "*.db" -o -name "*.sqlite" 2>/dev/null | grep -i ima
\`\`\`

**方法 B: 使用开发者工具（如果应用支持）**
\`\`\`bash
# 启用 Web Inspector（如果是 WebView 应用）
defaults write com.tencent.imac WebKitDeveloperExtras -bool true
\`\`\`

### 2. 使用 Accessibility API

授予终端辅助功能权限后，可以：
\`\`\`bash
# 运行此脚本
pnpm tsx explore-ima-ui.ts
\`\`\`

### 3. 使用网络代理

如果应用使用网络 API：
\`\`\`bash
# 设置代理
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080

# 启动应用
open -a "ima.copilot"
\`\`\`

然后使用代理工具（如 Charles、mitmproxy）抓包。

### 4. 直接从应用导出

检查应用是否有导出功能：
- 文件菜单 > 导出
- 设置 > 数据管理 > 导出
- 右键菜单 > 导出

## 推荐的工作流程

1. **先尝试手动导出** - 最简单
2. **查看本地数据库** - 最直接
3. **使用网络代理** - 如果数据在线
4. **UI 自动化** - 最后手段

## 数据位置

可能的数据存储位置：
- \`~/Library/Application Support/ima.copilot/\`
- \`~/Library/Containers/com.tencent.imac/\`
- \`~/Library/ima.copilot/\`
- \`~/.ima.copilot/\`

## 数据库查询示例

如果找到 SQLite 数据库：
\`\`\`sql
-- 查找所有表
SELECT name FROM sqlite_master WHERE type='table';

-- 搜索微信公众号链接
SELECT * FROM articles WHERE url LIKE '%mp.weixin.qq.com%';

-- 按日期排序
SELECT * FROM articles ORDER BY publish_date DESC;
\`\`\`

## AppleScript 示例

\`\`\`applescript
-- 获取当前选中的文章
tell application "System Events"
  tell process "ima.copilot"
    tell front window
      -- 获取选中的行
      tell table 1
        set selectedRow to selection
        -- 获取单元格内容
        tell selectedRow
          set cellValue to value of cell 1
        end tell
      end tell
    end tell
  end tell
end tell
\`\`\`
`;
  }

  /**
   * 运行完整的探索流程
   */
  async run(): Promise<void> {
    console.log('🚀 ima.copilot UI 探索\n');
    console.log('='.repeat(60));

    // 1. 检查应用是否运行
    if (!this.isIMARunning()) {
      this.launchIMA();
    } else {
      console.log('✅ ima.copilot 已在运行');
    }

    // 2. 截取初始屏幕
    const screenshotPath = path.join(process.cwd(), 'ima-screen-initial.png');
    this.takeScreenshot(screenshotPath);

    // 3. 获取窗口信息
    const windowInfo = this.getIMAWindowInfo();

    if (!windowInfo) {
      console.log('\n⚠️  需要授予辅助功能权限');
      console.log('请按照以下步骤操作：');
      console.log('1. 打开"系统设置"');
      console.log('2. 进入"隐私与安全性" > "辅助功能"');
      console.log('3. 添加"终端"应用');
      console.log('4. 重新运行此脚本\n');

      // 生成指南
      const guide = this.generateGuide();
      const guidePath = path.join(process.cwd(), 'ima-automation-guide.md');
      fs.writeFileSync(guidePath, guide, 'utf-8');
      console.log(`📄 自动化指南已保存到: ${guidePath}`);

      return;
    }

    // 4. 获取 UI 元素
    const uiElements = this.getAllUIElements();

    // 5. 搜索链接
    const links = this.findWeChatLinks();

    // 6. 尝试 UI 自动化
    const articles = await this.navigateAndExtract();

    // 7. 保存结果
    const result = {
      timestamp: new Date().toISOString(),
      windowInfo,
      uiElements: uiElements.slice(0, 50), // 限制数量
      links,
      articles,
      screenshot: screenshotPath
    };

    const resultPath = path.join(process.cwd(), 'ima-ui-exploration.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\n💾 探索结果已保存到: ${resultPath}`);

    // 8. 生成摘要
    console.log('\n' + '='.repeat(60));
    console.log('📊 探索摘要');
    console.log('='.repeat(60));
    console.log(`UI 元素: ${uiElements.length} 个`);
    console.log(`找到链接: ${links.length} 个`);
    console.log(`提取文章: ${articles.length} 篇`);
    console.log(`屏幕截图: ${screenshotPath}`);

    console.log('\n✅ 探索完成！');
    console.log('\n下一步建议：');
    console.log('1. 查看屏幕截图了解界面布局');
    console.log('2. 检查 ~/Library 中的数据库文件');
    console.log('3. 尝试使用网络代理抓包');
    console.log('4. 检查应用是否有导出功能');
  }
}

// 主函数
async function main() {
  const explorer = new IMAUIExplorer();
  await explorer.run();
}

// 如果直接运行此脚本
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;

if (isMainModule) {
  main().catch(console.error);
}

export { IMAUIExplorer, UIElement, ArticleData };
