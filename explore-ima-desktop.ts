#!/usr/bin/env tsx

/**
 * iMa 桌面应用 GUI 探索工具
 * 目标：自动化获取知识库中的微信公众号文章链接
 *
 * iMa 是桌面应用，我们需要：
 * 1. 确定 iMa 的技术栈（Electron/原生/其他）
 * 2. 找到本地数据存储位置
 * 3. 或使用 Accessibility API 获取界面元素
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface IMAStructure {
  appPath?: string;
  appType?: 'electron' | 'native' | 'flutter' | 'unknown';
  dataPath?: string;
  dbPath?: string;
  cachePath?: string;
}

class IMADesktopExplorer {
  /**
   * 查找 iMa 应用位置
   */
  findIMAApp(): string | null {
    const possiblePaths = [
      '/Applications/iMa.app',
      '/Applications/微信阅读.app',
      '/Applications/wechat-read.app',
      path.join(process.env.HOME || '', 'Applications/iMa.app'),
    ];

    for (const appPath of possiblePaths) {
      if (fs.existsSync(appPath)) {
        console.log(`✅ 找到 iMa 应用: ${appPath}`);
        return appPath;
      }
    }

    console.log('❌ 未找到 iMa 应用');
    return null;
  }

  /**
   * 确定 iMa 应用类型
   */
  determineAppType(appPath: string): 'electron' | 'native' | 'flutter' | 'unknown' {
    const contentsPath = path.join(appPath, 'Contents');

    if (!fs.existsSync(contentsPath)) {
      return 'unknown';
    }

    // 检查是否为 Electron 应用
    const electronPath = path.join(contentsPath, 'Frameworks', 'Electron Framework.framework');
    if (fs.existsSync(electronPath)) {
      console.log('✅ 检测到 Electron 应用');
      return 'electron';
    }

    // 检查是否为 Flutter 应用
    const flutterPath = path.join(contentsPath, 'Frameworks', 'flutter_assets');
    if (fs.existsSync(flutterPath)) {
      console.log('✅ 检测到 Flutter 应用');
      return 'flutter';
    }

    // 检查 Info.plist 中的信息
    const infoPlistPath = path.join(contentsPath, 'Info.plist');
    if (fs.existsSync(infoPlistPath)) {
      try {
        const infoPlist = execSync(`/usr/libexec/PlistBuddy -c "Print :" "${infoPlistPath}"`, {
          encoding: 'utf-8'
        });

        if (infoPlist.includes('Electron')) {
          return 'electron';
        }
      } catch (error) {
        // 忽略错误
      }
    }

    console.log('ℹ️  可能是原生 macOS 应用');
    return 'native';
  }

  /**
   * 查找 iMa 数据存储位置
   */
  findIMADataPath(): string[] {
    const home = process.env.HOME || '';
    const possiblePaths = [
      path.join(home, 'Library', 'Application Support', 'iMa'),
      path.join(home, 'Library', 'Application Support', '微信阅读'),
      path.join(home, 'Library', 'Application Support', 'WeChat Read'),
      path.join(home, 'Library', 'Containers', 'com.tencentweread'),
      path.join(home, 'Library', 'Containers', 'com.weread'),
      path.join(home, '.ima'),
      path.join(home, '.weread'),
    ];

    const foundPaths: string[] = [];

    for (const dataPath of possiblePaths) {
      if (fs.existsSync(dataPath)) {
        console.log(`✅ 找到数据目录: ${dataPath}`);
        foundPaths.push(dataPath);
      }
    }

    if (foundPaths.length === 0) {
      console.log('❌ 未找到 iMa 数据目录');
    }

    return foundPaths;
  }

  /**
   * 搜索数据库文件
   */
  findDatabaseFiles(basePath: string): string[] {
    const dbFiles: string[] = [];

    const searchDir = (dir: string) => {
      try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // 递归搜索子目录
            searchDir(fullPath);
          } else if (
            file.endsWith('.db') ||
            file.endsWith('.sqlite') ||
            file.endsWith('.sqlite3') ||
            file.endsWith('.json')
          ) {
            console.log(`📄 找到数据文件: ${fullPath}`);
            dbFiles.push(fullPath);
          }
        }
      } catch (error) {
        // 跳过无法访问的目录
      }
    };

    searchDir(basePath);
    return dbFiles;
  }

  /**
   * 分析 SQLite 数据库
   */
  async analyzeSQLiteDatabase(dbPath: string): Promise<any[]> {
    const Database = require('better-sqlite3');
    const articles: any[] = [];

    try {
      console.log(`🔍 分析数据库: ${dbPath}`);

      const db = new Database(dbPath, { readonly: true });

      // 获取所有表名
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      console.log('📋 数据库表:', tables.map((t: any) => t.name));

      // 搜索可能包含文章数据的表
      const possibleTables = tables
        .map((t: any) => t.name)
        .filter((name: string) =>
          name.includes('article') ||
          name.includes('content') ||
          name.includes('message') ||
          name.includes('wechat') ||
          name.includes('mp') ||
          name.includes('collection')
        );

      console.log('🔍 可能包含文章数据的表:', possibleTables);

      // 分析每个表的结构
      for (const tableName of possibleTables) {
        try {
          const schema = db.pragma(`table_info(${tableName})`);
          console.log(`\n表 ${tableName} 的结构:`, schema);

          // 检查是否有链接字段
          const hasUrl = schema.some((col: any) =>
            col.name.includes('url') ||
            col.name.includes('link') ||
            col.name.includes('href')
          );

          if (hasUrl) {
            console.log(`✅ 表 ${tableName} 可能包含链接数据`);

            // 尝试提取数据
            const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 10`).all();
            console.log(`样本数据:`, rows);

            articles.push(...rows);
          }
        } catch (error) {
          console.error(`❌ 分析表 ${tableName} 失败:`, error);
        }
      }

      // 全文搜索微信公众号链接
      console.log('\n🔍 搜索微信公众号链接...');
      const tablesToSearch = tables.map((t: any) => t.name);

      for (const tableName of tablesToSearch) {
        try {
          const columns = db.pragma(`table_info(${tableName})`);
          const textColumns = columns
            .filter((col: any) => col.type.toUpperCase().includes('TEXT'))
            .map((col: any) => col.name);

          for (const col of textColumns) {
            try {
              const rows = db.prepare(
                `SELECT * FROM ${tableName} WHERE ${col} LIKE '%mp.weixin.qq.com%' LIMIT 10`
              ).all();

              if (rows.length > 0) {
                console.log(`✅ 在表 ${tableName}.${col} 中找到微信公众号链接`);
                console.log('数据:', rows);
                articles.push(...rows);
              }
            } catch (error) {
              // 忽略查询错误
            }
          }
        } catch (error) {
          // 忽略表结构错误
        }
      }

      db.close();
    } catch (error) {
      console.error(`❌ 分析数据库失败:`, error);
    }

    return articles;
  }

  /**
   * 分析 JSON 数据文件
   */
  analyzeJSONFile(jsonPath: string): any[] {
    const articles: any[] = [];

    try {
      console.log(`🔍 分析 JSON 文件: ${jsonPath}`);

      const content = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(content);

      // 递归搜索微信公众号链接
      const searchObject = (obj: any, path: string = '') => {
        if (typeof obj === 'string' && obj.includes('mp.weixin.qq.com')) {
          console.log(`✅ 找到微信公众号链接: ${path} = ${obj}`);
          articles.push({ path, url: obj });
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            searchObject(value, `${path}.${key}`);
          }
        }
      };

      searchObject(data);

    } catch (error) {
      console.error(`❌ 分析 JSON 文件失败:`, error);
    }

    return articles;
  }

  /**
   * 使用 macOS Accessibility API 获取界面元素
   */
  async exploreWithAccessibility(): Promise<any[]> {
    const articles: any[] = [];

    try {
      console.log('🔍 使用 Accessibility API 探索 iMa 界面...');

      // 使用 AppleScript 获取 iMa 窗口信息
      const script = `
        tell application "System Events"
          set processList to name of every process whose background only is false
          return processList
        end tell
      `;

      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' });
      console.log('运行中的进程:', result);

      // 查找 iMa 进程
      if (result.includes('iMa') || result.includes('微信阅读')) {
        console.log('✅ 找到 iMa 进程');

        // 获取窗口元素（需要辅助功能权限）
        const uiScript = `
          tell application "System Events"
            tell process "iMa"
              set windowElements to every element of front window
              return properties of windowElements
            end tell
          end tell
        `;

        try {
          const uiResult = execSync(`osascript -e '${uiScript}'`, { encoding: 'utf-8' });
          console.log('UI 元素:', uiResult);
        } catch (error) {
          console.log('⚠️  需要授予辅助功能权限');
        }
      }

    } catch (error) {
      console.error('❌ Accessibility API 探索失败:', error);
    }

    return articles;
  }

  /**
   * 执行完整的探索流程
   */
  async run(): Promise<IMAStructure & { articles: any[] }> {
    const structure: IMAStructure = {};
    const allArticles: any[] = [];

    console.log('🚀 开始探索 iMa 桌面应用...\n');

    // 1. 查找应用
    const appPath = this.findIMAApp();
    if (appPath) {
      structure.appPath = appPath;

      // 2. 确定应用类型
      structure.appType = this.determineAppType(appPath);

      // 3. 查找数据目录
      const dataPaths = this.findIMADataPath();
      if (dataPaths.length > 0) {
        structure.dataPath = dataPaths[0];

        // 4. 查找数据库文件
        for (const dataPath of dataPaths) {
          const dbFiles = this.findDatabaseFiles(dataPath);

          // 5. 分析数据库
          for (const dbFile of dbFiles) {
            if (dbFile.endsWith('.db') || dbFile.endsWith('.sqlite') || dbFile.endsWith('.sqlite3')) {
              const articles = await this.analyzeSQLiteDatabase(dbFile);
              allArticles.push(...articles);
            } else if (dbFile.endsWith('.json')) {
              const articles = this.analyzeJSONFile(dbFile);
              allArticles.push(...articles);
            }
          }
        }
      }
    }

    // 6. 使用 Accessibility API 探索界面
    const uiArticles = await this.exploreWithAccessibility();
    allArticles.push(...uiArticles);

    // 7. 保存结果
    const outputPath = path.join(process.cwd(), 'ima-desktop-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      structure,
      articles: allArticles,
      timestamp: new Date().toISOString()
    }, null, 2), 'utf-8');

    console.log(`\n💾 分析结果已保存到: ${outputPath}`);
    console.log(`\n📊 总共找到 ${allArticles.length} 条相关数据`);

    return {
      ...structure,
      articles: allArticles
    };
  }
}

// 主函数
async function main() {
  const explorer = new IMADesktopExplorer();
  const result = await explorer.run();

  console.log('\n✅ 探索完成！');
  console.log('\n📝 摘要:');
  console.log(`   应用路径: ${result.appPath || '未找到'}`);
  console.log(`   应用类型: ${result.appType || '未知'}`);
  console.log(`   数据目录: ${result.dataPath || '未找到'}`);
  console.log(`   文章数据: ${result.articles.length} 条`);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { IMADesktopExplorer, IMAStructure };
