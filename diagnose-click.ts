#!/usr/bin/env tsx

/**
 * 诊断脚本：每步截图，了解实际界面状态
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

function screenshot(name: string): void {
  const timestamp = Date.now();
  const filename = `/Users/berton/Github/OpenClaw/debug-${name}-${timestamp}.png`;
  execSync(`screencapture -x -R0,0,1920,1080 "${filename}"`, { encoding: 'utf-8' });
  console.log(`📸 截图: ${filename}`);
}

async function diagnose() {
  console.log('🔍 诊断：单击文章后界面状态\n');

  // 1. 激活应用
  console.log('1️⃣ 激活 ima.copilot');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  delay(2000);
  screenshot('01-activated');

  // 2. 单击位置 (600, 350)
  console.log('\n2️⃣ 单击位置 (600, 350)');
  const clickScript = `
    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.3
        click at {600, 350}
      end tell
    end tell
  `;
  execSync(`osascript -e '${clickScript}'`, { encoding: 'utf-8' });
  delay(2000);
  screenshot('02-after-click');

  // 3. 尝试 Cmd+L 聚焦地址栏
  console.log('\n3️⃣ 尝试 Cmd+L');
  const cmdLScript = `
    tell application "System Events"
      tell process "ima.copilot"
        keystroke "l" using command down
        delay 1.0
      end tell
    end tell
  `;
  execSync(`osascript -e '${cmdLScript}'`, { encoding: 'utf-8' });
  delay(1500);
  screenshot('03-after-cmd-l');

  // 4. 复制并检查剪贴板
  console.log('\n4️⃣ 复制剪贴板');
  const copyScript = `
    tell application "System Events"
      tell process "ima.copilot"
        keystroke "a" using command down
        delay 0.3
        keystroke "c" using command down
        delay 0.5
      end tell
    end tell
  `;
  execSync(`osascript -e '${copyScript}'`, { encoding: 'utf-8' });
  delay(1000);
  screenshot('04-after-copy');

  const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();
  console.log(`\n📋 剪贴板内容: ${clipboard.substring(0, 200)}...`);

  if (clipboard.startsWith('http')) {
    console.log('\n✅ 成功提取URL！');
  } else {
    console.log('\n❌ 未提取到URL');
    console.log('\n💡 请检查截图文件：');
    console.log('   - debug-01-activated-*.png：激活后的界面');
    console.log('   - debug-02-after-click-*.png：单击后的界面');
    console.log('   - debug-03-after-cmd-l-*.png：Cmd+L后的界面');
    console.log('   - debug-04-after-copy-*.png：复制后的界面\n');
  }
}

diagnose().catch(console.error);
