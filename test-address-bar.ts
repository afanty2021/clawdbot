#!/usr/bin/env tsx

/**
 * 测试：使用 Tab 键导航找到地址栏
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

async function testAddressBarAccess() {
  console.log('🧪 测试：使用 Tab 键寻找地址栏\n');

  // 1. 激活应用
  console.log('1️⃣ 激活 ima.copilot...');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  delay(2000);

  // 2. 尝试多次 Tab 键，看看能否聚焦到地址栏
  console.log('2️⃣ 尝试 Tab 键导航...\n');

  for (let i = 1; i <= 20; i++) {
    console.log(`   Tab #${i}`);

    // 按 Tab 键
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          keystroke tab
          delay 0.5
        end tell
      end tell
    `;

    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });

    // 每5次 Tab 尝试复制一次
    if (i % 5 === 0) {
      console.log('   📋 尝试复制...');

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

      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();
      console.log(`   剪贴板: ${clipboard.substring(0, 100)}...`);

      if (clipboard.startsWith('http')) {
        console.log(`\n✅ 找到地址栏！URL: ${clipboard}\n`);
        return;
      }
    }

    delay(500);
  }

  console.log('\n❌ 通过 Tab 键未找到地址栏\n');

  // 3. 尝试 F6 或其他快捷键
  console.log('3️⃣ 尝试其他快捷键...\n');

  const shortcuts = [
    { key: 'l', mod: 'command down', name: 'Cmd+L' },
    { key: 'd', mod: 'command down', name: 'Cmd+D' },
    { key: 'a', mod: 'command down', name: 'Cmd+A' },
    { key: 'l', mod: 'control down', name: 'Ctrl+L' },
  ];

  for (const shortcut of shortcuts) {
    console.log(`   尝试: ${shortcut.name}`);

    const scScript = `
      tell application "System Events"
        tell process "ima.copilot"
          keystroke "${shortcut.key}" using ${shortcut.mod}
          delay 1.0
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;

    execSync(`osascript -e '${scScript}'`, { encoding: 'utf-8' });
    delay(1000);

    const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`   剪贴板: ${clipboard.substring(0, 100)}...`);

    if (clipboard.startsWith('http')) {
      console.log(`\n✅ ${shortcut.name} 有效！URL: ${clipboard}\n`);
      return;
    }
  }

  console.log('\n❌ 所有方法都失败了\n');
}

testAddressBarAccess().catch(console.error);
