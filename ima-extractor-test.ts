#!/usr/bin/env tsx

/**
 * IMA 提取器 - 快速测试脚本
 *
 * 用于验证系统是否正常工作
 * 测试内容：
 * - 应用激活
 * - 坐标点击
 * - 链接提取
 * - 策略切换
 */

import { execSync } from 'child_process';

// 测试配置
const CONFIG = {
  ADDRESS_BAR: { x: 960, y: 100 },
  TEST_ARTICLE_POS: { x: 600, y: 450 },
};

class IMAExtractorTester {
  private log(message: string): void {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] ${message}`);
  }

  private success(message: string): void {
    console.log(`✅ ${message}`);
  }

  private error(message: string): void {
    console.log(`❌ ${message}`);
  }

  private warning(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  private info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  private delay(ms: number): void {
    const seconds = ms / 1000;
    execSync(`sleep ${seconds}`, { encoding: 'utf-8' });
  }

  /**
   * 测试 1: 检查应用是否运行
   */
  test1_CheckAppRunning(): boolean {
    this.log('测试 1: 检查 ima.copilot 运行状态');

    try {
      const result = execSync('pgrep -x "ima.copilot"', { encoding: 'utf-8' });
      if (result.trim()) {
        this.success('ima.copilot 正在运行');
        return true;
      }
    } catch (error) {
      this.error('ima.copilot 未运行');
      this.info('请先启动 ima.copilot 应用');
      return false;
    }

    return false;
  }

  /**
   * 测试 2: 激活应用
   */
  test2_ActivateApp(): boolean {
    this.log('\n测试 2: 激活 ima.copilot');

    try {
      execSync(`osascript -e 'tell application "ima.copilot" to activate'`, {
        encoding: 'utf-8',
      });
      this.delay(1500);
      this.success('应用激活成功');
      return true;
    } catch (error: any) {
      this.error(`应用激活失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 测试 3: 坐标点击测试
   */
  test3_ClickTest(): boolean {
    this.log('\n测试 3: 坐标点击测试');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          click at {${CONFIG.ADDRESS_BAR.x}, ${CONFIG.ADDRESS_BAR.y}}
          return "clicked"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      if (result.trim() === 'clicked') {
        this.success(`坐标点击成功 (${CONFIG.ADDRESS_BAR.x}, ${CONFIG.ADDRESS_BAR.y})`);
        return true;
      }
    } catch (error: any) {
      this.error(`坐标点击失败: ${error.message}`);
      this.warning('可能需要调整坐标配置');
      return false;
    }

    return false;
  }

  /**
   * 测试 4: 键盘快捷键测试
   */
  test4_KeyboardTest(): boolean {
    this.log('\n测试 4: 键盘快捷键测试');

    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5
          keystroke "l" using command down
          delay 1
          return "success"
        end tell
      end tell
    `;

    try {
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      if (result.trim() === 'success') {
        this.success('快捷键 Cmd+L 发送成功');
        return true;
      }
    } catch (error: any) {
      this.error(`快捷键发送失败: ${error.message}`);
      return false;
    }

    return false;
  }

  /**
   * 测试 5: 链接提取测试
   */
  test5_ExtractLinkTest(): boolean {
    this.log('\n测试 5: 链接提取测试');

    this.info('请确保 ima.copilot 中有一篇文章已打开');
    this.delay(2000);

    // 尝试使用 Cmd+L 策略
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.5

          -- Cmd+L 聚焦地址栏
          keystroke "l" using command down
          delay 1

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

      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      if (clipboard.startsWith('http')) {
        this.success('链接提取成功！');
        this.info(`提取的链接: ${clipboard.substring(0, 60)}...`);
        return true;
      } else {
        this.warning('剪贴板内容不是链接');
        this.info(`剪贴板内容: ${clipboard.substring(0, 100)}...`);
        return false;
      }
    } catch (error: any) {
      this.error(`链接提取失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 测试 6: 文件系统测试
   */
  test6_FileSystemTest(): boolean {
    this.log('\n测试 6: 文件系统测试');

    try {
      // 测试写入状态文件
      const testState = {
        test: true,
        timestamp: new Date().toISOString(),
      };

      execSync(`echo '${JSON.stringify(testState)}' > ima-test-state.json`, {
        encoding: 'utf-8',
      });

      // 测试读取
      const content = execSync('cat ima-test-state.json', { encoding: 'utf-8' });
      const parsed = JSON.parse(content);

      if (parsed.test) {
        this.success('文件系统读写正常');

        // 清理测试文件
        execSync('rm ima-test-state.json', { encoding: 'utf-8' });

        return true;
      }
    } catch (error: any) {
      this.error(`文件系统测试失败: ${error.message}`);
      return false;
    }

    return false;
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 IMA 提取器 - 系统测试');
    console.log('='.repeat(60));
    console.log('');

    const results: { name: string; passed: boolean }[] = [];

    // 测试 1: 检查应用
    results.push({ name: '应用运行状态', passed: this.test1_CheckAppRunning() });

    if (!results[0].passed) {
      this.error('\n❌ ima.copilot 未运行，无法继续测试');
      this.info('请先启动 ima.copilot 后再运行测试');
      return;
    }

    // 测试 2: 激活应用
    results.push({ name: '应用激活', passed: this.test2_ActivateApp() });

    // 测试 3: 坐标点击
    results.push({ name: '坐标点击', passed: this.test3_ClickTest() });

    // 测试 4: 键盘快捷键
    results.push({ name: '键盘快捷键', passed: this.test4_KeyboardTest() });

    // 测试 5: 链接提取
    results.push({ name: '链接提取', passed: this.test5_ExtractLinkTest() });

    // 测试 6: 文件系统
    results.push({ name: '文件系统', passed: this.test6_FileSystemTest() });

    // 测试结果汇总
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log('');

    let passedCount = 0;
    results.forEach((result, index) => {
      const status = result.passed ? '✅ 通过' : '❌ 失败';
      console.log(`${index + 1}. ${result.name}: ${status}`);
      if (result.passed) passedCount++;
    });

    console.log('');
    console.log(`总计: ${passedCount}/${results.length} 测试通过`);

    if (passedCount === results.length) {
      console.log('');
      this.success('🎉 所有测试通过！系统运行正常。');
      console.log('');
      console.log('💡 您可以开始使用提取器：');
      console.log('   ./ima-extractor.sh');
    } else {
      console.log('');
      this.warning('⚠️  部分测试失败，请检查上述错误信息');
      console.log('');
      console.log('💡 建议操作：');
      console.log('   1. 确保 ima.copilot 正在运行');
      console.log('   2. 确保一篇文章已在应用中打开');
      console.log('   3. 检查坐标配置是否正确');
      console.log('   4. 确保终端有辅助功能权限');
    }

    console.log('');
  }
}

// 主函数
async function main() {
  console.log('\n⚠️  测试前准备：');
  console.log('   1. 确保 ima.copilot 正在运行');
  console.log('   2. 在 ima.copilot 中打开一篇文章');
  console.log('   3. 确保终端有辅助功能权限');
  console.log('');
  console.log('按 Enter 开始测试，或 Ctrl+C 取消...');

  // 等待用户确认
  process.stdin.once('data', async () => {
    const tester = new IMAExtractorTester();
    await tester.runAllTests();
    process.exit(0);
  });
}

main().catch(console.error);
