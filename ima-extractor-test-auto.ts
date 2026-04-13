#!/usr/bin/env tsx

/**
 * IMA 提取器 - 自动化系统测试（非交互式）
 */

import { execSync } from 'child_process';

const CONFIG = {
  ADDRESS_BAR: { x: 960, y: 100 },
  TEST_ARTICLE_POS: { x: 600, y: 450 },
};

class IMAExtractorAutoTest {
  private passCount = 0;
  private failCount = 0;

  log(message: string): void {
    console.log(message);
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
    this.passCount++;
  }

  error(message: string): void {
    console.log(`❌ ${message}`);
    this.failCount++;
  }

  warning(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  delay(ms: number): void {
    const seconds = ms / 1000;
    execSync(`sleep ${seconds}`, { encoding: 'utf-8' });
  }

  test1_CheckAppRunning(): boolean {
    this.log('\n📋 测试 1: 检查 ima.copilot 运行状态');

    try {
      const result = execSync('pgrep -x "ima.copilot"', { encoding: 'utf-8' });
      if (result.trim()) {
        this.success('ima.copilot 正在运行');
        return true;
      }
    } catch (error) {
      this.error('ima.copilot 未运行');
      return false;
    }

    return false;
  }

  test2_ActivateApp(): boolean {
    this.log('\n📋 测试 2: 激活 ima.copilot');

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

  test3_ClickTest(): boolean {
    this.log('\n📋 测试 3: 坐标点击测试');

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
      return false;
    }

    return false;
  }

  test4_KeyboardTest(): boolean {
    this.log('\n📋 测试 4: 键盘快捷键测试');

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

  test5_ClipboardTest(): boolean {
    this.log('\n📋 测试 5: 剪贴板读取测试');

    try {
      // 设置测试内容到剪贴板
      execSync(`echo "https://mp.weixin.qq.com/s/test123" | pbcopy`, { encoding: 'utf-8' });
      this.delay(500);

      // 读取剪贴板
      const clipboard = execSync('pbpaste', { encoding: 'utf-8' }).trim();

      if (clipboard.includes('mp.weixin.qq.com')) {
        this.success('剪贴板读取正常');
        return true;
      } else {
        this.error('剪贴板内容不匹配');
        return false;
      }
    } catch (error: any) {
      this.error(`剪贴板测试失败: ${error.message}`);
      return false;
    }
  }

  test6_FileSystemTest(): boolean {
    this.log('\n📋 测试 6: 文件系统测试');

    try {
      const testState = {
        test: true,
        timestamp: new Date().toISOString(),
      };

      execSync(`echo '${JSON.stringify(testState)}' > ima-test-state.json`, {
        encoding: 'utf-8',
      });

      const content = execSync('cat ima-test-state.json', { encoding: 'utf-8' });
      const parsed = JSON.parse(content);

      if (parsed.test) {
        this.success('文件系统读写正常');

        execSync('rm ima-test-state.json', { encoding: 'utf-8' });

        return true;
      }
    } catch (error: any) {
      this.error(`文件系统测试失败: ${error.message}`);
      return false;
    }

    return false;
  }

  test7_DependencyTest(): boolean {
    this.log('\n📋 测试 7: 依赖检查');

    try {
      // 检查 Node.js
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      this.info(`Node.js 版本: ${nodeVersion}`);

      // 检查 tsx
      try {
        const tsxVersion = execSync('npx tsx --version', { encoding: 'utf-8' }).trim();
        this.info(`tsx 版本: ${tsxVersion}`);
      } catch (error) {
        this.warning('tsx 未全局安装，将使用 npx');
      }

      this.success('依赖检查完成');
      return true;
    } catch (error: any) {
      this.error(`依赖检查失败: ${error.message}`);
      return false;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('\n🧪 IMA 提取器 - 自动化系统测试');
    console.log('='.repeat(60));

    // 运行所有测试
    this.test1_CheckAppRunning();
    this.test2_ActivateApp();
    this.test3_ClickTest();
    this.test4_KeyboardTest();
    this.test5_ClipboardTest();
    this.test6_FileSystemTest();
    this.test7_DependencyTest();

    // 测试结果汇总
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log('');

    const total = this.passCount + this.failCount;
    const percentage = total > 0 ? ((this.passCount / total) * 100).toFixed(1) : '0';

    console.log(`✅ 通过: ${this.passCount}/${total} (${percentage}%)`);
    console.log(`❌ 失败: ${this.failCount}/${total}`);

    if (this.passCount === total) {
      console.log('');
      this.success('🎉 所有测试通过！系统运行正常。');
      console.log('');
      console.log('💡 您可以开始使用提取器：');
      console.log('   ./ima-extractor.sh');
    } else {
      console.log('');
      this.warning('⚠️  部分测试失败');
      console.log('');
      console.log('💡 建议检查：');
      console.log('   1. 终端是否有辅助功能权限');
      console.log('   2. ima.copilot 是否正常运行');
      console.log('   3. 坐标配置是否正确');
    }

    console.log('');
  }
}

// 主函数
async function main() {
  const tester = new IMAExtractorAutoTest();
  await tester.runAllTests();
}

main().catch(console.error);
