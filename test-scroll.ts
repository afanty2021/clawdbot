#!/usr/bin/env tsx

/**
 * 测试：在文章列表区域滚动
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

async function testScrolling() {
  console.log('🔄 测试：在文章列表区域滚动\n');

  // 1. 激活应用
  console.log('1️⃣ 激活 ima.copilot');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  delay(2000);

  // 2. 点击文章列表区域获取焦点
  console.log('\n2️⃣ 点击文章列表区域');
  const focusScript = `
    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        click at {600, 400}
        delay 0.5
      end tell
    end tell
  `;
  execSync(`osascript -e '${focusScript}'`, { encoding: 'utf-8' });

  // 3. 尝试多次向下滚动
  console.log('\n3️⃣ 向下滚动（尝试多次）\n');

  for (let i = 1; i <= 10; i++) {
    console.log(`   滚动 #${i}`);

    const scrollScript = `
      tell application "System Events"
        tell process "ima.copilot"
          -- 尝试多种滚动方法
          -- 方法1: Page Down
          keystroke (ASCII character 12) -- Page Down
          delay 0.3

          -- 方法2: 向下箭头（多次）
          -- repeat 5 times
          --   keystroke (ASCII character 31)
          --   delay 0.1
          -- end repeat

          -- 方法3: 空格键
          -- keystroke space
          -- delay 0.3
        end tell
      end tell
    `;

    execSync(`osascript -e '${scrollScript}'`, { encoding: 'utf-8' });
    delay(500);

    // 每3次滚动尝试点击一次
    if (i % 3 === 0) {
      console.log('   🖱️  尝试点击文章');

      const clickScript = `
        tell application "System Events"
          tell process "ima.copilot"
            click at {600, 400}
            delay 2.0
          end tell
        end tell
      `;

      execSync(`osascript -e '${clickScript}'`, { encoding: 'utf-8' });
      delay(2500);

      // 检查是否有URL
      const checkScript = `
        tell application "System Events"
          tell process "ima.copilot"
            click at {960, 100}
            delay 0.5
            keystroke "a" using command down
            delay 0.3
            keystroke "c" using command down
          end tell
        end tell
      `;

      execSync(`osascript -e '${checkScript}'`, { encoding: 'utf-8' });
      delay(1000);

      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      if (clipboard.startsWith('http')) {
        console.log(`\n✅ 成功！URL: ${clipboard.substring(0, 80)}...\n`);
        return;
      } else {
        console.log(`   剪贴板: ${clipboard.substring(0, 50)}...`);
      }
    }
  }

  console.log('\n❌ 滚动后仍未找到文章\n');
  console.log('💡 可能原因：');
  console.log('   1. 文章列表确实是空的');
  console.log('   2. 需要先执行特定操作才能加载文章');
  console.log('   3. AI知识库的界面布局与预期不同\n');
}

testScrolling().catch(console.error);
