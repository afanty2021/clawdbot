#!/usr/bin/env tsx

/**
 * 测试：确保焦点在 ima.copilot
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

async function testFocus() {
  console.log('🎯 测试：确保焦点在 ima.copilot\n');

  // 1. 激活并等待
  console.log('1️⃣ 激活 ima.copilot 并等待');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  delay(3000); // 增加等待时间

  // 2. 清空剪贴板
  console.log('\n2️⃣ 清空剪贴板');
  execSync(`echo '' | pbcopy`, { encoding: 'utf-8' });
  delay(500);

  // 3. 点击文章列表区域
  console.log('\n3️⃣ 点击文章列表区域 (600, 400)');

  const clickScript = `
    tell application "ima.copilot"
      activate
      delay 1.0
    end tell

    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        click at {600, 400}
        delay 2.0
      end tell
    end tell
  `;

  execSync(`osascript -e '${clickScript}'`, { encoding: 'utf-8' });

  // 4. 检查焦点是否正确（通过尝试获取窗口标题）
  console.log('\n4️⃣ 检查焦点状态');

  const checkScript = `
    tell application "System Events"
      set frontApp to name of first application process whose frontmost is true
      return frontApp
    end tell
  `;

  const frontApp = execSync(`osascript -e '${checkScript}'`, { encoding: 'utf-8' }).trim();
  console.log(`   当前前台应用: ${frontApp}`);

  if (frontApp !== 'ima.copilot') {
    console.log('   ⚠️  焦点不在 ima.copilot！');
    console.log('   尝试重新激活...');
    execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
    delay(2000);
  }

  // 5. 提取URL
  console.log('\n5️⃣ 提取URL');

  const extractScript = `
    tell application "ima.copilot"
      activate
      delay 0.5
    end tell

    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        click at {960, 100}
        delay 0.5
        keystroke "a" using command down
        delay 0.3
        keystroke "c" using command down
        delay 0.5
      end tell
    end tell
  `;

  execSync(`osascript -e '${extractScript}'`, { encoding: 'utf-8' });
  delay(1000);

  const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

  console.log(`\n📋 剪贴板内容:`);
  console.log(`   ${clipboard.substring(0, 150)}...\n`);

  if (clipboard.startsWith('http')) {
    console.log(`✅ 成功提取URL！`);
    console.log(`\n完整URL:\n${clipboard}\n`);
  } else if (clipboard.includes('tsx') || clipboard.includes('npx')) {
    console.log('❌ 焦点仍在终端');
    console.log('\n💡 问题：');
    console.log('   - 脚本运行时终端保持焦点');
    console.log('   - 需要使用不同的方法确保焦点转移');
    console.log('   - 或者文章列表确实为空\n');
  } else if (clipboard === 'AI' || clipboard === '') {
    console.log('❌ 文章可能未打开');
    console.log('\n💡 问题：');
    console.log('   - 点击位置可能没有文章');
    console.log('   - 文章列表可能为空');
    console.log('   - 需要手动检查界面状态\n');
  } else {
    console.log('❓ 未知状态');
    console.log('\n💡 请检查实际界面状态\n');
  }
}

testFocus().catch(console.error);
