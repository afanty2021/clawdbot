#!/usr/bin/env tsx

/**
 * 测试：手动打开文章后测试URL提取方法
 *
 * 使用说明：
 * 1. 运行此脚本
 * 2. 手动在 ima.copilot 中打开一篇微信公众号文章
 * 3. 脚本将尝试多种方法提取URL
 * 4. 找到有效方法后告诉我
 */

import { execSync } from 'child_process';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

async function testURLExtraction() {
  console.log('🧪 URL提取方法测试\n');
  console.log('请按以下步骤操作：');
  console.log('1. 在 ima.copilot 中打开一篇微信公众号文章');
  console.log('2. 确保文章完全加载，地址栏可见');
  console.log('3. 回到终端，按 Enter 继续\n');

  // 等待用户准备
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  console.log('\n开始测试...\n');

  // 方法1: Cmd+L
  console.log('方法1: Cmd+L 聚焦地址栏');
  try {
    const script1 = `
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
    execSync(`osascript -e '${script1}'`, { encoding: 'utf-8' });
    delay(1000);
    const clipboard1 = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`结果: ${clipboard1.substring(0, 100)}...`);
    if (clipboard1.startsWith('http')) {
      console.log('✅ 成功！\n');
      return;
    }
  } catch (error) {
    console.log('❌ 失败\n');
  }

  // 方法2: 点击顶部中央
  console.log('\n方法2: 点击顶部中央 (960, 50)');
  try {
    const script2 = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {960, 50}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
          delay 0.5
        end tell
      end tell
    `;
    execSync(`osascript -e '${script2}'`, { encoding: 'utf-8' });
    delay(1000);
    const clipboard2 = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`结果: ${clipboard2.substring(0, 100)}...`);
    if (clipboard2.startsWith('http')) {
      console.log('✅ 成功！\n');
      return;
    }
  } catch (error) {
    console.log('❌ 失败\n');
  }

  // 方法3: 右键菜单"复制链接"
  console.log('\n方法3: 右键菜单尝试复制链接');
  try {
    const script3 = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 右键点击地址栏区域
          click at {960, 50}
          delay 0.5

          -- 模拟右键
          keystroke "2" using control down
          delay 1.0

          -- 尝试按"C"键（复制）
          keystroke "c"
          delay 0.5

          -- 按Esc关闭菜单
          keystroke (ASCII character 27)
        end tell
      end tell
    `;
    execSync(`osascript -e '${script3}'`, { encoding: 'utf-8' });
    delay(1000);
    const clipboard3 = execSync('pbpaste', { encoding: 'utf-8' }).trim();
    console.log(`结果: ${clipboard3.substring(0, 100)}...`);
    if (clipboard3.startsWith('http')) {
      console.log('✅ 成功！\n');
      return;
    }
  } catch (error) {
    console.log('❌ 失败\n');
  }

  // 方法4: 检查是否有"分享"按钮
  console.log('\n方法4: 查找分享按钮');
  const sharePositions = [
    { x: 1700, y: 50 },
    { x: 1800, y: 50 },
    { x: 1700, y: 100 },
    { x: 1800, y: 100 },
  ];

  for (const pos of sharePositions) {
    console.log(`   尝试位置: (${pos.x}, ${pos.y})`);
    try {
      const script4 = `
        tell application "System Events"
          tell process "ima.copilot"
            set frontmost to true
            delay 0.3
            click at {${pos.x}, ${pos.y}}
            delay 1.0
          end tell
        end tell
      `;
      execSync(`osascript -e '${script4}'`, { encoding: 'utf-8' });
      delay(1500);

      // 检查剪贴板
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();
      if (clipboard.startsWith('http')) {
        console.log(`✅ 找到分享按钮！URL: ${clipboard}\n`);
        return;
      }

      // 按Esc关闭可能的菜单
      execSync(`osascript -e 'tell application "System Events" to keystroke (ASCII character 27)'`, { encoding: 'utf-8' });
      delay(500);
    } catch (error) {
      // Continue
    }
  }

  console.log('\n❌ 所有方法都失败了');
  console.log('\n💡 建议：');
  console.log('1. 检查 ima.copilot 是否真的有地址栏显示URL');
  console.log('2. 或者考虑从Chrome历史记录中获取URL');
  console.log('3. 或者使用OCR识别屏幕上的URL\n');
}

testURLExtraction().catch(console.error);
