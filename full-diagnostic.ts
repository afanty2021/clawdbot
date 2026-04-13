#!/usr/bin/env tsx

/**
 * 完整自动化诊断：尝试所有方法并记录结果
 */

import { execSync } from 'child_process';
import fs from 'fs';

const delay = (ms: number) => execSync(`sleep ${ms / 1000}`, { encoding: 'utf-8' });

function screenshot(name: string): string {
  const timestamp = Date.now();
  const filename = `/Users/berton/Github/OpenClaw/diag-${name}-${timestamp}.png`;
  execSync(`screencapture -x -R0,0,1920,1080 "${filename}"`, { encoding: 'utf-8' });
  return filename;
}

function getClipboard(): string {
  return execSync('pbpaste', { encoding: 'utf-8' }).trim();
}

const results: Array<{
  method: string;
  screenshot: string;
  clipboard: string;
  success: boolean;
}> = [];

async function testMethod(methodName: string, action: () => Promise<void>) {
  console.log(`\n📋 测试: ${methodName}`);
  console.log('='.repeat(60));

  try {
    await action();
    await new Promise(resolve => setTimeout(resolve, 2000));

    const clip = getClipboard();
    const screen = screenshot(methodName.replace(/[^a-zA-Z0-9]/g, '-'));

    const success = clip.startsWith('http');

    results.push({
      method: methodName,
      screenshot: screen,
      clipboard: clip.substring(0, 100),
      success
    });

    if (success) {
      console.log(`✅ 成功！URL: ${clip.substring(0, 80)}...\n`);
    } else {
      console.log(`❌ 失败。剪贴板: ${clip.substring(0, 100)}...`);
      console.log(`📸 截图: ${screen}\n`);
    }
  } catch (error: any) {
    console.log(`❌ 错误: ${error.message}\n`);
  }
}

async function runDiagnostics() {
  console.log('🔍 IMA URL提取 - 完整自动化诊断');
  console.log('='.repeat(60));
  console.log('\n将测试多种方法，每种方法都会截图记录\n');

  // 初始状态
  console.log('1️⃣ 激活 ima.copilot');
  execSync(`osascript -e 'tell application "ima.copilot" to activate'`, { encoding: 'utf-8' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  const initScreen = screenshot('00-initial');
  console.log(`📸 初始截图: ${initScreen}\n`);

  // 方法1: 单击文章列表位置 (600, 350)
  await testMethod('01-single-click-600-350', async () => {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3
          click at {600, 350}
          delay 2.0
          click at {960, 100}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  });

  // 方法2: 双击文章列表位置 (600, 350)
  await testMethod('02-double-click-600-350', async () => {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3
          click at {600, 350}
          delay 0.15
          click at {600, 350}
          delay 2.5
          click at {960, 100}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  });

  // 方法3: 使用向下箭头选择第一篇，然后Enter
  await testMethod('03-arrow-down-enter', async () => {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          -- 尝试聚焦到列表
          click at {600, 400}
          delay 0.5
          -- 向下箭头
          keystroke (ASCII character 31)
          delay 0.5
          -- Enter
          keystroke return
          delay 2.5
          -- 提取URL
          click at {960, 100}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  });

  // 方法4: 点击多个可能的文章位置
  await testMethod('04-multiple-positions', async () => {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3

          -- 尝试多个位置
          click at {500, 300}
          delay 0.3
          click at {600, 300}
          delay 0.3
          click at {700, 300}
          delay 2.0

          -- 提取URL
          click at {960, 100}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  });

  // 方法5: 使用Tab键导航
  await testMethod('05-tab-navigation', async () => {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- 多次Tab键
          repeat 10 times
            keystroke tab
            delay 0.2
          end repeat

          delay 1.0
          keystroke return
          delay 2.5

          -- 提取URL
          click at {960, 100}
          delay 0.5
          keystroke "a" using command down
          delay 0.3
          keystroke "c" using command down
        end tell
      end tell
    `;
    execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
  });

  // 生成报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 诊断报告');
  console.log('='.repeat(60) + '\n');

  const successCount = results.filter(r => r.success).length;

  console.log(`总测试方法: ${results.length}`);
  console.log(`成功方法: ${successCount}`);
  console.log(`失败方法: ${results.length - successCount}\n`);

  if (successCount > 0) {
    console.log('✅ 成功的方法:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   - ${r.method}`);
      console.log(`     截图: ${r.screenshot}`);
      console.log(`     URL: ${r.clipboard}...`);
    });
  } else {
    console.log('❌ 所有方法都失败了');
    console.log('\n💡 建议检查:');
    console.log('   1. ima.copilot 是否已打开AI知识库');
    console.log('   2. 文章列表是否可见');
    console.log('   3. 是否有文章可以点击');
    console.log('   4. 查看截图了解实际界面状态\n');
  }

  console.log('\n📁 所有截图文件:');
  console.log('   ls -lt diag-*.png\n');

  // 保存结果到JSON
  const reportPath = '/Users/berton/Github/OpenClaw/diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 详细报告已保存: ${reportPath}\n`);
}

runDiagnostics().catch(console.error);
