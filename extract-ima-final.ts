#!/usr/bin/env tsx

/**
 * 简单可靠的 IMA 文章链接提取和验证工具
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function getUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function getClipboard(): string {
  try {
    return execSync('pbpaste', { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function openInChrome(url: string): void {
  console.log(`\n🌐 在 Chrome 中打开: ${url}`);
  execSync(`open -a "Google Chrome" "${url}"`, { encoding: 'utf-8' });
}

function captureScreen(): string {
  const timestamp = Date.now();
  const filename = `ima-verify-${timestamp}.png`;
  const filepath = path.join(process.cwd(), filename);

  execSync(`screencapture -x "${filepath}"`, { encoding: 'utf-8' });
  return filepath;
}

async function main() {
  console.log('🚀 IMA 文章链接提取和验证工具\n');
  console.log('='.repeat(60));

  console.log('\n📖 操作指南：\n');
  console.log('1. 在 ima.copilot 中找到一篇微信公众号文章');
  console.log('2. 右键点击文章，选择"复制链接"');
  console.log('3. 或者点击文章进入详情页，复制地址栏链接');
  console.log('4. 确保链接包含 mp.weixin.qq.com\n');

  console.log('⏸️  完成后按 Enter 继续...');
  await getUserInput('');

  // 从剪贴板读取
  console.log('\n📋 从剪贴板读取...');
  const clipboard = getClipboard();

  if (!clipboard) {
    console.log('❌ 剪贴板为空');
    return;
  }

  console.log(`剪贴板内容: ${clipboard.substring(0, 100)}${clipboard.length > 100 ? '...' : ''}\n`);

  // 提取 URL
  let url = '';
  if (clipboard.startsWith('http')) {
    url = clipboard.split('\n')[0].split(' ')[0];
  } else {
    const match = clipboard.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]+)/);
    if (match) {
      url = match[1];
    }
  }

  if (!url || !url.includes('mp.weixin.qq.com')) {
    console.log('❌ 未找到有效的微信公众号链接');
    console.log('💡 确保复制的是 mp.weixin.qq.com 链接');
    return;
  }

  console.log(`✅ 提取到链接: ${url}\n`);

  // 在 Chrome 中打开
  openInChrome(url);

  // 等待加载
  console.log('⏳ 等待页面加载...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 截图验证
  console.log('\n📸 截取验证截图...');
  const screenshot = captureScreen();
  console.log(`✅ 截图已保存: ${screenshot}\n`);

  // 保存结果
  const result = {
    url,
    timestamp: new Date().toISOString(),
    screenshot
  };

  const resultPath = path.join(process.cwd(), 'ima-link-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log('='.repeat(60));
  console.log('✅ 提取和验证完成！\n');
  console.log(`📋 链接: ${url}`);
  console.log(`📸 截图: ${screenshot}`);
  console.log(`💾 结果: ${resultPath}`);
  console.log('\n💡 如需提取更多链接，重新运行脚本即可');
}

main().catch(console.error);
