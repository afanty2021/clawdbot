#!/usr/bin/env tsx

/**
 * 测试：使用鼠标滚轮在列表中滚动
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

async function testMouseScroll() {
  console.log('🖱️  测试：使用鼠标滚轮滚动\n');

  // 1. 激活应用
  console.log('1️⃣ 激活 ima.copilot');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  delay(2000);

  // 2. 在文章列表区域使用鼠标滚轮
  console.log('\n2️⃣ 在文章列表区域滚动鼠标滚轮\n');

  const listboxCenterX = 600;
  const listboxCenterY = 400;

  for (let i = 1; i <= 5; i++) {
    console.log(`   向下滚动 #${i}`);

    const scrollScript = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 移动鼠标到列表区域
          do script "move mouse to {${listboxCenterX}, ${listboxCenterY}}"
          delay 0.3

          -- 模拟鼠标滚轮向下滚动（使用鼠标滚轮事件）
          -- 这在AppleScript中不容易实现，我们尝试其他方法

          -- 方法：使用辅助功能的滚动命令
          try
            -- 使用AXScrollWheel
            scroll wheel {0, -3} at {${listboxCenterX}, ${listboxCenterY}}
          on error
            -- 如果不支持，使用键盘快捷键
            keystroke space -- 空格键通常向下滚动页面
          end try

          delay 0.5
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${scrollScript}'`, { encoding: 'utf-8' });
    } catch (error) {
      // 如果滚动命令失败，使用空格键
      const fallbackScript = `
        tell application "System Events"
          tell process "ima.copilot"
            set frontmost to true
            delay 0.3
            keystroke space
            delay 0.5
          end tell
        end tell
      `;
      execSync(`osascript -e '${fallbackScript}'`, { encoding: 'utf-8' });
    }

    delay(1000);
  }

  // 3. 尝试点击文章
  console.log('\n3️⃣ 尝试点击文章\n');

  const clickScript = `
    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        click at {${listboxCenterX}, ${listboxCenterY}}
        delay 2.5
      end tell
    end tell
  `;

  execSync(`osascript -e '${clickScript}'`, { encoding: 'utf-8' });

  // 4. 提取URL
  console.log('\n4️⃣ 提取URL\n');

  const extractScript = `
    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        click at {960, 100}
        delay 0.5
        keystroke "a" using command down
        delay 0.3
        keystroke "c" using command down
      end tell
    end tell
  `;

  execSync(`osascript -e '${extractScript}'`, { encoding: 'utf-8' });
  delay(1000);

  const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

  console.log(`📋 剪贴板: ${clipboard.substring(0, 100)}...\n`);

  if (clipboard.startsWith('http')) {
    console.log(`✅ 成功！URL: ${clipboard}\n`);
  } else {
    console.log(`❌ 未提取到URL\n`);
  }
}

testMouseScroll().catch(console.error);
