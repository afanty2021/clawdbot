#!/usr/bin/env tsx

/**
 * ima.copilot 应用探索工具
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const APP_PATH = '/Applications/ima.copilot.app';
const WEREAD_APP_PATH = '/Applications/微信读书.app';

interface AppInfo {
  name: string;
  path: string;
  type: string;
  dataPaths: string[];
  dbFiles: string[];
}

function getAppType(appPath: string): string {
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

  // 检查 Info.plist
  const infoPlistPath = path.join(contentsPath, 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    try {
      const infoPlist = execSync(`/usr/libexec/PlistBuddy -c "Print CFBundleExecutable" "${infoPlistPath}"`, {
        encoding: 'utf-8'
      }).trim();

      console.log(`可执行文件: ${infoPlist}`);
    } catch (error) {
      // 忽略错误
    }
  }

  return 'native';
}

function findDataPaths(appName: string): string[] {
  const home = process.env.HOME || '';
  const possiblePaths = [
    path.join(home, 'Library', 'Application Support', appName),
    path.join(home, 'Library', 'Application Support', appName.replace(/\./g, '')),
    path.join(home, 'Library', 'Containers', appName),
    path.join(home, 'Library', 'Containers', `com.${appName}`),
    path.join(home, `.${appName}`),
  ];

  const foundPaths: string[] = [];

  for (const dataPath of possiblePaths) {
    if (fs.existsSync(dataPath)) {
      foundPaths.push(dataPath);
    }
  }

  return foundPaths;
}

function findDbFiles(basePaths: string[]): string[] {
  const dbFiles: string[] = [];

  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue;

    const searchDir = (dir: string, depth: number = 0) => {
      if (depth > 3) return; // 限制递归深度

      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !file.startsWith('.')) {
            searchDir(fullPath, depth + 1);
          } else if (stat.isFile()) {
            if (
              file.endsWith('.db') ||
              file.endsWith('.sqlite') ||
              file.endsWith('.sqlite3') ||
              file.endsWith('.json') ||
              file.endsWith('.ldb')
            ) {
              dbFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // 跳过无法访问的目录
      }
    };

    searchDir(basePath);
  }

  return dbFiles;
}

function exploreApp(appPath: string, appName: string): AppInfo {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`探索应用: ${appName}`);
  console.log(`路径: ${appPath}`);
  console.log('='.repeat(60));

  const info: AppInfo = {
    name: appName,
    path: appPath,
    type: 'unknown',
    dataPaths: [],
    dbFiles: []
  };

  if (!fs.existsSync(appPath)) {
    console.log('❌ 应用不存在');
    return info;
  }

  // 1. 确定应用类型
  info.type = getAppType(appPath);
  console.log(`\n应用类型: ${info.type}`);

  if (info.type === 'electron') {
    console.log('✅ 这是一个 Electron 应用');
    console.log('   可以使用 CDP (Chrome DevTools Protocol) 探索');
  }

  // 2. 查找数据目录
  info.dataPaths = findDataPaths(appName);
  console.log(`\n数据目录 (${info.dataPaths.length} 个):`);
  if (info.dataPaths.length > 0) {
    info.dataPaths.forEach(p => console.log(`  - ${p}`));
  } else {
    console.log('  未找到');
  }

  // 3. 查找数据库文件
  if (info.dataPaths.length > 0) {
    info.dbFiles = findDbFiles(info.dataPaths);
    console.log(`\n数据库文件 (${info.dbFiles.length} 个):`);
    if (info.dbFiles.length > 0) {
      info.dbFiles.slice(0, 20).forEach(f => {
        const size = (fs.statSync(f).size / 1024).toFixed(2);
        const relPath = path.relative(path.dirname(info.dataPaths[0]), f);
        console.log(`  - ${relPath} (${size} KB)`);
      });

      if (info.dbFiles.length > 20) {
        console.log(`  ... 还有 ${info.dbFiles.length - 20} 个文件`);
      }
    } else {
      console.log('  未找到');
    }
  }

  // 4. 检查应用资源
  const resourcesPath = path.join(appPath, 'Contents', 'Resources');
  if (fs.existsSync(resourcesPath)) {
    console.log(`\n应用资源:`);
    try {
      const resources = fs.readdirSync(resourcesPath);
      resources.slice(0, 10).forEach(r => {
        console.log(`  - ${r}`);
      });

      if (resources.length > 10) {
        console.log(`  ... 还有 ${resources.length - 10} 个文件`);
      }
    } catch (error) {
      console.log('  无法访问');
    }
  }

  return info;
}

async function main() {
  console.log('🚀 ima.copilot 和 微信读书 应用探索\n');

  const apps: AppInfo[] = [];

  // 1. 探索 ima.copilot
  const imaInfo = exploreApp(APP_PATH, 'ima.copilot');
  apps.push(imaInfo);

  // 2. 探索 微信读书
  const wereadInfo = exploreApp(WEREAD_APP_PATH, '微信读书');
  apps.push(wereadInfo);

  // 3. 生成报告
  const reportPath = path.join(process.cwd(), 'ima-apps-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(apps, null, 2), 'utf-8');
  console.log(`\n💾 报告已保存到: ${reportPath}`);

  // 4. 生成 Markdown 摘要
  let summary = '# ima.copilot 和 微信读书 应用分析报告\n\n';
  summary += `**分析时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

  apps.forEach(app => {
    summary += `## ${app.name}\n\n`;
    summary += `- **路径**: \`${app.path}\`\n`;
    summary += `- **类型**: ${app.type}\n`;

    if (app.dataPaths.length > 0) {
      summary += `\n### 数据目录\n\n`;
      app.dataPaths.forEach(p => {
        summary += `- \`${p}\`\n`;
      });
    }

    if (app.dbFiles.length > 0) {
      summary += `\n### 数据库文件\n\n`;
      summary += `找到 ${app.dbFiles.length} 个数据库文件\n\n`;

      // 按文件类型分组
      const dbFiles = app.dbFiles.filter(f => f.endsWith('.db') || f.endsWith('.sqlite') || f.endsWith('.sqlite3'));
      const jsonFiles = app.dbFiles.filter(f => f.endsWith('.json'));

      if (dbFiles.length > 0) {
        summary += `**SQLite 数据库** (${dbFiles.length} 个):\n`;
        dbFiles.slice(0, 10).forEach(f => {
          const size = (fs.statSync(f).size / 1024).toFixed(2);
          summary += `- \`${path.basename(f)}\` (${size} KB)\n`;
        });
      }

      if (jsonFiles.length > 0) {
        summary += `\n**JSON 数据文件** (${jsonFiles.length} 个):\n`;
        jsonFiles.slice(0, 10).forEach(f => {
          const size = (fs.statSync(f).size / 1024).toFixed(2);
          summary += `- \`${path.basename(f)}\` (${size} KB)\n`;
        });
      }
    }

    if (app.type === 'electron') {
      summary += `\n### 推荐的探索方法\n\n`;
      summary += `1. **启用远程调试**\n`;
      summary += `   \`\`\`bash\n`;
      summary += `   open -a "ima.copilot" --args --remote-debugging-port=9222\n`;
      summary += `   \`\`\`\n\n`;
      summary += `2. **使用 CDP 探索**\n`;
      summary += `   \`\`\`bash\n`;
      summary += `   pnpm tsx explore-ima-cdp.ts\n`;
      summary += `   \`\`\`\n\n`;
      summary += `3. **分析本地数据**\n`;
      summary += `   \`\`\`bash\n`;
      summary += `   pnpm add -D -w better-sqlite3\n`;
      summary += `   pnpm tsx explore-ima-desktop.ts\n`;
      summary += `   \`\`\`\n`;
    }

    summary += '\n---\n\n';
  });

  const summaryPath = path.join(process.cwd(), 'ima-apps-summary.md');
  fs.writeFileSync(summaryPath, summary, 'utf-8');
  console.log(`📄 摘要已保存到: ${summaryPath}`);

  // 5. 显示摘要
  console.log('\n' + '='.repeat(60));
  console.log(summary);
  console.log('='.repeat(60));

  console.log('\n✅ 探索完成！');
  console.log('\n下一步建议：');
  console.log('1. 如果是 Electron 应用，尝试启用远程调试');
  console.log('2. 安装数据库依赖后分析本地数据');
  console.log('3. 使用开发者工具探索应用内部状态');
}

main().catch(console.error);
