#!/usr/bin/env tsx

/**
 * iMa 桌面应用基础信息探索
 * 不需要数据库依赖，快速获取应用基本信息
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface IMABasicInfo {
  appPath: string | null;
  appType: string;
  dataPaths: string[];
  possibleDbFiles: string[];
  summary: string;
}

function findIMAApp(): string | null {
  const possiblePaths = [
    '/Applications/iMa.app',
    '/Applications/微信阅读.app',
    '/Applications/wechat-read.app',
    '/Applications/Weread.app',
    path.join(process.env.HOME || '', 'Applications/iMa.app'),
  ];

  console.log('🔍 搜索 iMa 应用...\n');

  for (const appPath of possiblePaths) {
    if (fs.existsSync(appPath)) {
      console.log(`✅ 找到应用: ${appPath}`);
      return appPath;
    }
  }

  console.log('❌ 未找到应用');
  console.log('\n提示: 尝试使用 Spotlight 搜索 "iMa" 或 "微信阅读"');
  return null;
}

function determineAppType(appPath: string): string {
  const contentsPath = path.join(appPath, 'Contents');

  if (!fs.existsSync(contentsPath)) {
    return 'unknown';
  }

  // 检查 Electron
  const electronPath = path.join(contentsPath, 'Frameworks', 'Electron Framework.framework');
  if (fs.existsSync(electronPath)) {
    return 'electron';
  }

  // 检查 Flutter
  const flutterPath = path.join(contentsPath, 'Frameworks', 'flutter_assets');
  if (fs.existsSync(flutterPath)) {
    return 'flutter';
  }

  // 检查 NW.js
  const nwPath = path.join(contentsPath, 'Frameworks', 'nwjs.framework');
  if (fs.existsSync(nwPath)) {
    return 'nwjs';
  }

  return 'native';
}

function findIMADataPaths(): string[] {
  const home = process.env.HOME || '';
  const possiblePaths = [
    path.join(home, 'Library', 'Application Support', 'iMa'),
    path.join(home, 'Library', 'Application Support', '微信阅读'),
    path.join(home, 'Library', 'Application Support', 'WeChat Read'),
    path.join(home, 'Library', 'Application Support', 'Weread'),
    path.join(home, 'Library', 'Application Support', 'com.tencent.weread'),
    path.join(home, 'Library', 'Containers', 'com.tencentweread'),
    path.join(home, 'Library', 'Containers', 'com.weread'),
    path.join(home, 'Library', 'Containers', 'com.tencent.weread'),
    path.join(home, '.ima'),
    path.join(home, '.weread'),
  ];

  console.log('\n🔍 搜索数据目录...\n');

  const foundPaths: string[] = [];

  for (const dataPath of possiblePaths) {
    if (fs.existsSync(dataPath)) {
      console.log(`✅ 找到数据目录: ${dataPath}`);
      foundPaths.push(dataPath);
    }
  }

  if (foundPaths.length === 0) {
    console.log('❌ 未找到数据目录');
    console.log('\n提示: iMa 可能使用不同的数据存储位置');
  }

  return foundPaths;
}

function findPossibleDbFiles(basePaths: string[]): string[] {
  const dbFiles: string[] = [];

  console.log('\n🔍 搜索数据库文件...\n');

  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue;

    try {
      const files = fs.readdirSync(basePath);

      for (const file of files) {
        const fullPath = path.join(basePath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          if (
            file.endsWith('.db') ||
            file.endsWith('.sqlite') ||
            file.endsWith('.sqlite3') ||
            file.endsWith('.json') ||
            file.endsWith('.ldb') || // LevelDB
            file.endsWith('.data')
          ) {
            const size = (stat.size / 1024).toFixed(2);
            console.log(`📄 ${file} (${size} KB)`);
            dbFiles.push(fullPath);
          }
        } else if (stat.isDirectory() && !file.startsWith('.')) {
          // 递归搜索一级子目录
          try {
            const subFiles = fs.readdirSync(fullPath);
            for (const subFile of subFiles) {
              const subPath = path.join(fullPath, subFile);
              try {
                const subStat = fs.statSync(subPath);
                if (subStat.isFile() && (
                  subFile.endsWith('.db') ||
                  subFile.endsWith('.sqlite') ||
                  subFile.endsWith('.sqlite3') ||
                  subFile.endsWith('.json')
                )) {
                  const size = (subStat.size / 1024).toFixed(2);
                  console.log(`📄 ${path.join(file, subFile)} (${size} KB)`);
                  dbFiles.push(subPath);
                }
              } catch (e) {
                // 跳过无法访问的文件
              }
            }
          } catch (e) {
            // 跳过无法访问的目录
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  无法访问目录: ${basePath}`);
    }
  }

  return dbFiles;
}

function generateSummary(info: IMABasicInfo): string {
  let summary = '# iMa 应用信息摘要\n\n';

  summary += `**探索时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

  summary += '## 应用信息\n\n';
  summary += `- **应用路径**: ${info.appPath || '未找到'}\n`;
  summary += `- **应用类型**: ${info.appType || '未知'}\n`;

  if (info.appType === 'electron') {
    summary += `\n✅ 这是一个 Electron 应用，可以尝试以下方法：\n`;
    summary += `1. 启用远程调试：在启动参数中添加 \`--remote-debugging-port=9222\`\n`;
    summary += `2. 使用 CDP 探索：运行 \`pnpm tsx explore-ima-cdp.ts\`\n`;
    summary += `3. 检查应用资源：查看 \`Contents/Resources/app.asar\`\n`;
  }

  summary += '\n## 数据目录\n\n';
  if (info.dataPaths.length > 0) {
    info.dataPaths.forEach(p => {
      summary += `- ${p}\n`;
    });
  } else {
    summary += '未找到数据目录\n';
  }

  summary += '\n## 数据库文件\n\n';
  if (info.possibleDbFiles.length > 0) {
    summary += `找到 ${info.possibleDbFiles.length} 个可能的数据文件：\n\n`;
    info.possibleDbFiles.slice(0, 10).forEach(f => {
      const name = path.basename(f);
      const dir = path.dirname(f);
      summary += `- **${name}**\n`;
      summary += `  - 路径: \`${dir}\`\n`;
    });

    if (info.possibleDbFiles.length > 10) {
      summary += `\n... 还有 ${info.possibleDbFiles.length - 10} 个文件\n`;
    }

    summary += `\n💡 **下一步**：安装数据库依赖后运行完整分析\n`;
    summary += `\`\`\`bash\n`;
    summary += `pnpm add -D -w better-sqlite3\n`;
    summary += `pnpm tsx explore-ima-desktop.ts\n`;
    summary += `\`\`\`\n`;
  } else {
    summary += '未找到数据库文件\n';
  }

  summary += '\n## 推荐的下一步操作\n\n';

  if (info.appType === 'electron') {
    summary += '### 方案 1: 使用 CDP 探索（推荐）\n';
    summary += '1. 启用 iMa 的远程调试\n';
    summary += '2. 运行 CDP 探索脚本\n';
    summary += '3. 提取应用内部数据\n\n';
  }

  if (info.possibleDbFiles.length > 0) {
    summary += '### 方案 2: 分析本地数据库\n';
    summary += '1. 安装数据库依赖\n';
    summary += '2. 运行数据库探索脚本\n';
    summary += '3. 搜索微信公众号链接\n\n';
  }

  summary += '### 方案 3: 使用 Accessibility API\n';
  summary += '1. 授予终端辅助功能权限\n';
  summary += '2. 运行界面探索脚本\n';
  summary += '3. 提取可见的界面元素\n\n';

  return summary;
}

async function main() {
  console.log('🚀 iMa 应用基础信息探索\n');
  console.log('=' .repeat(50));

  const info: IMABasicInfo = {
    appPath: null,
    appType: 'unknown',
    dataPaths: [],
    possibleDbFiles: [],
    summary: ''
  };

  // 1. 查找应用
  info.appPath = findIMAApp();

  if (info.appPath) {
    // 2. 确定应用类型
    info.appType = determineAppType(info.appPath);
    console.log(`\n应用类型: ${info.appType}`);
  }

  // 3. 查找数据目录
  info.dataPaths = findIMADataPaths();

  // 4. 查找数据库文件
  if (info.dataPaths.length > 0) {
    info.possibleDbFiles = findPossibleDbFiles(info.dataPaths);
  }

  // 5. 生成摘要
  info.summary = generateSummary(info);

  // 6. 保存结果
  const outputPath = path.join(process.cwd(), 'ima-basic-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(info, null, 2), 'utf-8');
  console.log(`\n💾 详细信息已保存到: ${outputPath}`);

  const summaryPath = path.join(process.cwd(), 'ima-summary.md');
  fs.writeFileSync(summaryPath, info.summary, 'utf-8');
  console.log(`📄 摘要已保存到: ${summaryPath}`);

  // 7. 显示摘要
  console.log('\n' + '='.repeat(50));
  console.log(info.summary);
  console.log('='.repeat(50));

  console.log('\n✅ 探索完成！');
}

main().catch(console.error);
