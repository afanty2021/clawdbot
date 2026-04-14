#!/usr/bin/env tsx

/**
 * ima.copilot 数据文件快速查找工具
 * 帮助你快速定位应用的数据库和配置文件
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface DataFile {
  path: string;
  type: string;
  size: string;
  modified: string;
}

const results: DataFile[] = [];

console.log('🔍 查找 ima.copilot 数据文件...\n');

// 搜索位置
const searchPaths = [
  path.join(process.env.HOME || '', 'Library', 'Application Support'),
  path.join(process.env.HOME || '', 'Library', 'Containers'),
  path.join(process.env.HOME || '', 'Library', 'Caches'),
  path.join(process.env.HOME || '', 'Library', 'Preferences'),
  path.join(process.env.HOME || '', 'Library', 'Saved Application State'),
];

// 关键词
const keywords = ['ima', 'copilot', 'tencent', 'weread', '微信读书', '微信'];

console.log('📂 搜索位置：');
searchPaths.forEach(p => console.log(`  - ${p}`));
console.log('\n🔑 搜索关键词：');
keywords.forEach(k => console.log(`  - ${k}`));

console.log('\n' + '='.repeat(60));

// 递归搜索函数
function searchDirectory(dir: string, depth: number = 0) {
  if (depth > 5) {return;} // 限制深度

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      // 检查目录名是否匹配关键词
      const matchesKeyword = keywords.some(k =>
        file.toLowerCase().includes(k.toLowerCase())
      );

      if (stat.isDirectory()) {
        // 如果匹配关键词，深入搜索
        if (matchesKeyword) {
          searchDirectory(fullPath, depth + 1);
        } else if (depth < 2) {
          // 浅层搜索其他目录
          searchDirectory(fullPath, depth + 1);
        }
      } else if (stat.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(file).toLowerCase();
        const validExts = ['.db', '.sqlite', '.sqlite3', '.json', '.plist', '.ldb'];

        if (validExts.includes(ext) || matchesKeyword) {
          const size = (stat.size / 1024).toFixed(2);
          const modified = new Date(stat.mtime).toLocaleString('zh-CN');

          results.push({
            path: fullPath,
            type: ext || 'file',
            size: `${size} KB`,
            modified
          });
        }
      }
    }
  } catch (error) {
    // 跳过无法访问的目录
  }
}

// 执行搜索
console.log('⏳ 正在搜索...\n');
searchPaths.forEach(p => {
  if (fs.existsSync(p)) {
    searchDirectory(p);
  }
});

// 显示结果
if (results.length === 0) {
  console.log('❌ 未找到相关数据文件\n');
  console.log('💡 建议：');
  console.log('1. 确保 ima.copilot 至少运行过一次');
  console.log('2. 检查应用是否有数据导出功能');
  console.log('3. 尝试使用网络抓包工具');
} else {
  console.log(`✅ 找到 ${results.length} 个相关文件\n`);

  // 按类型分组
  const byType = results.reduce((acc, file) => {
    const type = file.type || 'other';
    if (!acc[type]) {acc[type] = [];}
    acc[type].push(file);
    return acc;
  }, {} as Record<string, DataFile[]>);

  // 显示数据库文件
  if (byType['.db'] || byType['.sqlite'] || byType['.sqlite3']) {
    console.log('📊 数据库文件：');
    const dbFiles = [
      ...(byType['.db'] || []),
      ...(byType['.sqlite3'] || []),
      ...(byType['.sqlite'] || [])
    ];

    dbFiles.slice(0, 10).forEach(file => {
      console.log(`  📄 ${path.basename(file.path)}`);
      console.log(`     路径: ${file.path}`);
      console.log(`     大小: ${file.size} | 修改: ${file.modified}`);
    });

    if (dbFiles.length > 0) {
      console.log(`\n💡 推荐操作：`);
      const firstDb = dbFiles[0].path;
      console.log(`\n安装 SQLite 工具：`);
      console.log(`  brew install sqlite3`);
      console.log(`\n查看数据库内容：`);
      console.log(`  sqlite3 "${firstDb}" "SELECT name FROM sqlite_master WHERE type='table';"`);
      console.log(`\n导出数据：`);
      console.log(`  sqlite3 "${firstDb}" ".dump" > backup.sql`);
    }
  }

  // 显示配置文件
  if (byType['.plist']) {
    console.log('\n⚙️  配置文件：');
    byType['.plist'].slice(0, 5).forEach(file => {
      console.log(`  📄 ${path.basename(file.path)}`);
      console.log(`     路径: ${file.path}`);
    });
  }

  // 显示 JSON 文件
  if (byType['.json']) {
    console.log('\n📋 JSON 文件：');
    byType['.json'].slice(0, 5).forEach(file => {
      console.log(`  📄 ${path.basename(file.path)}`);
      console.log(`     路径: ${file.path}`);
      console.log(`     大小: ${file.size}`);
    });
  }

  // 保存完整结果
  const outputPath = path.join(process.cwd(), 'ima-data-files.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n💾 完整结果已保存到: ${outputPath}`);
}

console.log('\n' + '='.repeat(60));
console.log('🎯 下一步建议：\n');

if (results.some(r => r.path.includes('.db') || r.path.includes('.sqlite'))) {
  console.log('1. ✅ 找到数据库文件');
  console.log('   → 使用 SQLite 工具查看内容');
  console.log('   → 运行: pnpm tsx explore-ima-database.ts <数据库路径>');
} else {
  console.log('1. ⚠️  未找到数据库文件');
  console.log('   → 应用可能使用在线存储');
  console.log('   → 尝试网络抓包方案');
}

console.log('\n2. 📖 查看完整方案文档');
console.log('   → cat ima-solutions.md');

console.log('\n3. 🤖 需要帮助？');
console.log('   → 告诉我找到的文件路径，我帮你分析');

console.log('\n✅ 搜索完成！');
