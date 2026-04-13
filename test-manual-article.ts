#!/usr/bin/env tsx

/**
 * 简单测试：手动打开文章后测试URL提取
 *
 * 步骤：
 * 1. 运行此脚本
 * 2. 手动在 ima.copilot 中打开一篇微信公众号文章
 * 3. 确保文章完全加载，可以看到地址栏中的URL
 * 4. 回到终端按 Enter
 * 5. 脚本尝试提取URL
 */

import { execSync } from 'child_process';

async function testManualArticle() {
  console.log('🧪 手动文章URL提取测试\n');
  console.log('请按以下步骤操作：');
  console.log('1. 在 ima.copilot 中打开一篇微信公众号文章');
  console.log('2. 确保文章完全加载，地址栏可见');
  console.log('3. 确认地址栏中显示了URL（以https://mp.weixin.qq.com开头）');
  console.log('4. 回到终端，按 Enter 继续\n');

  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n开始提取URL...\n');

  // 方法1: 直接点击地址栏（成功案例的坐标）
  console.log('方法1: 点击地址栏 {960, 100}');
  const script1 = `
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

  try {
    execSync(`osascript -e '${script1}'`, { encoding: 'utf-8' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const clipboard1 = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`剪贴板: ${clipboard1.substring(0, 100)}...`);

    if (clipboard1.startsWith('http')) {
      console.log('\n✅ 成功提取URL！');
      console.log(`完整URL: ${clipboard1}\n`);
      return;
    }
  } catch (error) {
    console.log('❌ 方法1失败\n');
  }

  // 方法2: Cmd+L
  console.log('\n方法2: Cmd+L 聚焦地址栏');
  const script2 = `
    tell application "System Events"
      tell process "ima.copilot"
        set frontmost to true
        delay 0.5
        keystroke "l" using command down
        delay 1.0
        keystroke "c" using command down
        delay 0.5
      end tell
    end tell
  `;

  try {
    execSync(`osascript -e '${script2}'`, { encoding: 'utf-8' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const clipboard2 = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`剪贴板: ${clipboard2.substring(0, 100)}...`);

    if (clipboard2.startsWith('http')) {
      console.log('\n✅ 成功提取URL！');
      console.log(`完整URL: ${clipboard2}\n`);
      return;
    }
  } catch (error) {
    console.log('❌ 方法2失败\n');
  }

  console.log('\n❌ 所有方法都失败了');
  console.log('\n💡 可能原因：');
  console.log('1. 文章没有完全加载');
  console.log('2. 地址栏不可见或不可点击');
  console.log('3. ima.copilot 的版本或界面发生了变化');
  console.log('4. 需要特殊的权限或设置\n');
}

testManualArticle().catch(console.error);
