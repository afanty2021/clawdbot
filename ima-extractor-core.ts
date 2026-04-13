#!/usr/bin/env tsx

/**
 * IMA 文章链接提取 - 稳定可靠核心引擎
 *
 * 核心特性：
 * - ✅ 多种提取策略自动切换
 * - ✅ 智能重试和错误恢复
 * - ✅ 进度保存和断点续传
 * - ✅ 详细的状态监控和日志
 * - ✅ 去重和数据验证
 * - ✅ 优雅的异常处理
 *
 * @version 2.0.0
 * @author AI Assistant
 * @date 2026-04-13
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ==================== 类型定义 ====================

interface ExtractedArticle {
  url: string;
  title: string;
  timestamp: string;
  index: number;
  extractMethod: string;
  retryCount?: number;
}

interface ExtractionState {
  lastUpdate: string;
  totalExtracted: number;
  targetCount: number;
  extractedUrls: string[];
  currentBatch: number;
  startTime: string;
  errors: ErrorRecord[];
}

interface ErrorRecord {
  timestamp: string;
  operation: string;
  error: string;
  recovery: string;
}

interface ExtractionResult {
  success: boolean;
  url?: string;
  title?: string;
  method?: string;
  error?: string;
}

// ==================== 配置常量 ====================

const CONFIG = {
  // 文件路径
  STATE_FILE: 'ima-extractor-state.json',
  RESULT_FILE: 'ima-extracted-articles.json',
  LOG_FILE: 'ima-extractor.log',

  // 重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  OPERATION_TIMEOUT_MS: 10000,

  // 批量配置
  BATCH_SIZE: 10,
  SAVE_INTERVAL: 5, // 每提取5篇保存一次

  // 坐标配置
  ADDRESS_BAR: { x: 960, y: 100 },
  LISTBOX_CENTER: { x: 600, y: 450 },
  KNOWLEDGE_BASE_ICON: { x: 100, y: 80 },

  // 延迟配置（毫秒）
  DELAY_AFTER_CLICK: 500,
  DELAY_AFTER_KEY: 300,
  DELAY_AFTER_OPEN: 2500,
  DELAY_AFTER_BACK: 1500,
};

// ==================== 日志系统 ====================

class Logger {
  private logFile: string;

  constructor(logFile: string) {
    this.logFile = logFile;
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '', 'utf-8');
    }
  }

  private writeLog(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;

    // 输出到控制台
    console.log(message);

    // 写入文件
    try {
      fs.appendFileSync(this.logFile, logLine, 'utf-8');
    } catch (error) {
      // Ignore file write errors
    }
  }

  info(message: string): void {
    this.writeLog('INFO', message);
  }

  success(message: string): void {
    this.writeLog('SUCCESS', `✅ ${message}`);
  }

  warning(message: string): void {
    this.writeLog('WARNING', `⚠️  ${message}`);
  }

  error(message: string): void {
    this.writeLog('ERROR', `❌ ${message}`);
  }

  debug(message: string): void {
    this.writeLog('DEBUG', `🔍 ${message}`);
  }
}

// ==================== 状态管理 ====================

class StateManager {
  private stateFile: string;
  private state: ExtractionState;

  constructor(stateFile: string, targetCount: number) {
    this.stateFile = stateFile;
    this.state = this.loadState(targetCount);
  }

  private loadState(targetCount: number): ExtractionState {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        const loaded = JSON.parse(data);
        this.log(`加载状态: 已提取 ${loaded.totalExtracted} 篇文章`);
        return loaded;
      } catch (error) {
        this.log('无法加载状态文件，创建新状态');
      }
    }

    return {
      lastUpdate: new Date().toISOString(),
      totalExtracted: 0,
      targetCount,
      extractedUrls: [],
      currentBatch: 1,
      startTime: new Date().toISOString(),
      errors: [],
    };
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  save(): void {
    this.state.lastUpdate = new Date().toISOString();
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存状态失败:', error);
    }
  }

  isUrlExtracted(url: string): boolean {
    return this.state.extractedUrls.includes(url);
  }

  addUrl(url: string): void {
    if (!this.isUrlExtracted(url)) {
      this.state.extractedUrls.push(url);
      this.state.totalExtracted++;
      this.save();
    }
  }

  getProgress(): { current: number; target: number; percentage: number } {
    return {
      current: this.state.totalExtracted,
      target: this.state.targetCount,
      percentage: (this.state.totalExtracted / this.state.targetCount) * 100,
    };
  }

  addError(error: ErrorRecord): void {
    this.state.errors.push(error);
    if (this.state.errors.length > 100) {
      this.state.errors = this.state.errors.slice(-100); // 保留最近100个错误
    }
    this.save();
  }

  getState(): ExtractionState {
    return { ...this.state };
  }
}

// ==================== 操作执行器 ====================

class OperationExecutor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private delay(ms: number): void {
    const seconds = ms / 1000;
    execSync(`sleep ${seconds}`, { encoding: 'utf-8' });
  }

  /**
   * 执行 AppleScript 并处理错误
   */
  executeAppleScript(script: string, description: string): boolean {
    this.logger.debug(`执行: ${description}`);

    try {
      execSync(`osascript -e '${script}'`, {
        encoding: 'utf-8',
        timeout: CONFIG.OPERATION_TIMEOUT_MS / 1000
      });
      return true;
    } catch (error: any) {
      this.logger.error(`${description} 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 激活应用
   */
  activateApp(appName: string = 'ima.copilot'): boolean {
    const script = `tell application "${appName}" to activate`;
    return this.executeAppleScript(script, `激活 ${appName}`);
  }

  /**
   * 在指定坐标点击
   */
  clickAt(x: number, y: number, doubleClick: boolean = false): boolean {
    const clicks = doubleClick ? 2 : 1;
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.2
          ${doubleClick ? `
            click at {${x}, ${y}}
            delay 0.1
            click at {${x}, ${y}}
          ` : `
            click at {${x}, ${y}}
          `}
        end tell
      end tell
    `;

    return this.executeAppleScript(script, `点击坐标 (${x}, ${y})${doubleClick ? ' (双击)' : ''}`);
  }

  /**
   * 发送键盘快捷键
   */
  sendKeyCombo(keys: string[]): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          set frontmost to true
          delay 0.3
          ${keys.map(key => `keystroke "${key}" using command down\n delay 0.3`).join('')}
        end tell
      end tell
    `;

    return this.executeAppleScript(script, `发送快捷键: ${keys.join('+')}`);
  }

  /**
   * 发送单个按键
   */
  sendKey(key: string): boolean {
    const script = `
      tell application "System Events"
        tell process "ima.copilot"
          keystroke "${key}"
          delay 0.2
        end tell
      end tell
    `;

    return this.executeAppleScript(script, `发送按键: ${key}`);
  }

  /**
   * 从剪贴板读取内容
   */
  getClipboard(): string {
    try {
      return execSync('pbpaste', { encoding: 'utf-8' }).trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * 等待指定时间
   */
  wait(ms: number): void {
    this.delay(ms);
  }
}

// ==================== 提取策略 ====================

abstract class ExtractionStrategy {
  protected executor: OperationExecutor;
  protected logger: Logger;

  constructor(executor: OperationExecutor, logger: Logger) {
    this.executor = executor;
    this.logger = logger;
  }

  abstract extract(): Promise<ExtractionResult>;
}

/**
 * 策略1: Cmd+L 聚焦地址栏
 */
class CmdLAddressBarStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用 Cmd+L 策略提取');

    // 发送 Cmd+L 聚焦地址栏
    if (!this.executor.sendKeyCombo(['l'])) {
      return { success: false, error: 'Cmd+L 失败' };
    }

    this.executor.wait(1000);

    // 全选并复制
    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return { success: false, error: '复制失败' };
    }

    this.executor.wait(1000);

    const clipboard = this.executor.getClipboard();

    if (clipboard.startsWith('http')) {
      return {
        success: true,
        url: clipboard,
        method: 'Cmd+L',
      };
    }

    return { success: false, error: '剪贴板内容无效' };
  }
}

/**
 * 策略2: 点击地址栏坐标
 */
class ClickAddressBarStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用点击地址栏策略');

    const { x, y } = CONFIG.ADDRESS_BAR;

    if (!this.executor.clickAt(x, y)) {
      return { success: false, error: '点击地址栏失败' };
    }

    this.executor.wait(CONFIG.DELAY_AFTER_CLICK);

    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return { success: false, error: '复制失败' };
    }

    this.executor.wait(1000);

    const clipboard = this.executor.getClipboard();

    if (clipboard.startsWith('http')) {
      return {
        success: true,
        url: clipboard,
        method: 'Click AddressBar',
      };
    }

    return { success: false, error: '剪贴板内容无效' };
  }
}

/**
 * 策略3: 选择所有并复制（针对选中状态）
 */
class SelectAllCopyStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用全选复制策略');

    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return { success: false, error: '全选复制失败' };
    }

    this.executor.wait(1000);

    const clipboard = this.executor.getClipboard();

    if (clipboard.startsWith('http')) {
      return {
        success: true,
        url: clipboard,
        method: 'SelectAll',
      };
    }

    return { success: false, error: '剪贴板内容无效' };
  }
}

// ==================== 核心提取引擎 ====================

class IMAExtractorEngine {
  private logger: Logger;
  private stateManager: StateManager;
  private executor: OperationExecutor;
  private strategies: ExtractionStrategy[];
  private results: ExtractedArticle[] = [];

  constructor(targetCount: number = 1800) {
    this.logger = new Logger(CONFIG.LOG_FILE);
    this.stateManager = new StateManager(CONFIG.STATE_FILE, targetCount);
    this.executor = new OperationExecutor(this.logger);

    // 初始化提取策略（按优先级排序）
    this.strategies = [
      new CmdLAddressBarStrategy(this.executor, this.logger),
      new ClickAddressBarStrategy(this.executor, this.logger),
      new SelectAllCopyStrategy(this.executor, this.logger),
    ];

    this.loadExistingResults();
  }

  private loadExistingResults(): void {
    if (fs.existsSync(CONFIG.RESULT_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(CONFIG.RESULT_FILE, 'utf-8'));
        this.results = data.articles || [];
        this.logger.info(`加载已有结果: ${this.results.length} 篇文章`);
      } catch (error) {
        this.logger.warning('无法加载已有结果文件');
      }
    }
  }

  /**
   * 使用所有策略尝试提取，直到成功
   */
  private async extractWithRetry(): Promise<ExtractionResult> {
    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      this.logger.debug(`提取尝试 ${attempt}/${CONFIG.MAX_RETRIES}`);

      for (const strategy of this.strategies) {
        const result = await strategy.extract();

        if (result.success) {
          this.logger.success(`提取成功 (${result.method})`);
          return result;
        }

        this.logger.debug(`策略失败: ${result.error}`);
      }

      // 所有策略都失败，等待后重试
      if (attempt < CONFIG.MAX_RETRIES) {
        this.logger.warning(`所有策略失败，${CONFIG.RETRY_DELAY_MS}ms 后重试...`);
        this.executor.wait(CONFIG.RETRY_DELAY_MS);
      }
    }

    return {
      success: false,
      error: `所有策略在 ${CONFIG.MAX_RETRIES} 次尝试后均失败`,
    };
  }

  /**
   * 打开指定位置的文章
   */
  private async openArticleAt(x: number, y: number): Promise<boolean> {
    this.logger.debug(`打开文章 (${x}, ${y})`);

    // 先单击选中
    if (!this.executor.clickAt(x, y)) {
      return false;
    }

    this.executor.wait(CONFIG.DELAY_AFTER_CLICK);

    // 再双击打开
    if (!this.executor.clickAt(x, y, true)) {
      return false;
    }

    this.executor.wait(CONFIG.DELAY_AFTER_OPEN);

    return true;
  }

  /**
   * 返回文章列表
   */
  private goBack(): boolean {
    this.logger.debug('返回文章列表');

    // 尝试 Esc 键
    if (this.executor.sendKey('\u001b')) { // Escape character
      this.executor.wait(CONFIG.DELAY_AFTER_BACK);
      return true;
    }

    // 备用: Cmd+[
    if (this.executor.sendKeyCombo(['['])) {
      this.executor.wait(CONFIG.DELAY_AFTER_BACK);
      return true;
    }

    return false;
  }

  /**
   * 保存单篇文章结果
   */
  private saveArticle(article: ExtractedArticle): void {
    this.results.push(article);
    this.stateManager.addUrl(article.url);

    // 定期保存到文件
    if (this.results.length % CONFIG.SAVE_INTERVAL === 0) {
      this.saveResults();
    }
  }

  /**
   * 保存所有结果到文件
   */
  private saveResults(): void {
    const data = {
      timestamp: new Date().toISOString(),
      totalArticles: this.results.length,
      articles: this.results,
    };

    try {
      fs.writeFileSync(CONFIG.RESULT_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.logger.success(`保存结果: ${this.results.length} 篇文章`);
    } catch (error) {
      this.logger.error('保存结果失败');
    }
  }

  /**
   * 提取单篇文章
   */
  private async extractOneArticle(articleIndex: number, x: number, y: number): Promise<boolean> {
    this.logger.info(`\n${'='.repeat(60)}`);
    this.logger.info(`📄 文章 #${articleIndex}`);
    this.logger.info(`${'='.repeat(60)}`);

    // 打开文章
    if (!await this.openArticleAt(x, y)) {
      this.logger.error('打开文章失败');
      return false;
    }

    // 提取链接
    const result = await this.extractWithRetry();

    if (!result.success || !result.url) {
      this.logger.error(`提取失败: ${result.error}`);
      this.goBack();
      return false;
    }

    // 检查重复
    if (this.stateManager.isUrlExtracted(result.url)) {
      this.logger.warning('文章已提取过，跳过');
      this.goBack();
      return false;
    }

    // 保存文章
    const article: ExtractedArticle = {
      url: result.url,
      title: `Article #${articleIndex}`,
      timestamp: new Date().toISOString(),
      index: articleIndex,
      extractMethod: result.method || 'unknown',
    };

    this.saveArticle(article);
    this.logger.success(`文章 #${articleIndex} 提取成功！`);

    // 返回列表
    this.goBack();

    return true;
  }

  /**
   * 批量提取文章
   */
  async extractBatch(startIndex: number, count: number): Promise<number> {
    let extractedCount = 0;
    const startY = CONFIG.LISTBOX_CENTER.y;

    for (let i = 0; i < count; i++) {
      const articleIndex = startIndex + i;
      const y = startY + (i * 60); // 每篇文章间隔60px

      const success = await this.extractOneArticle(articleIndex, CONFIG.LISTBOX_CENTER.x, y);

      if (success) {
        extractedCount++;
      }
    }

    return extractedCount;
  }

  /**
   * 运行完整提取流程
   */
  async run(targetCount: number = 1800, batchSize: number = CONFIG.BATCH_SIZE): Promise<void> {
    this.logger.info('\n🚀 IMA 文章链接提取引擎 v2.0');
    this.logger.info('='.repeat(60));
    this.logger.info(`📊 目标: ${targetCount} 篇文章`);
    this.logger.info(`📦 批次大小: ${batchSize} 篇`);
    this.logger.info(`💾 状态文件: ${CONFIG.STATE_FILE}`);
    this.logger.info(`💾 结果文件: ${CONFIG.RESULT_FILE}`);
    this.logger.info('='.repeat(60));

    // 激活应用
    this.logger.info('\n🎯 激活 ima.copilot...');
    if (!this.executor.activateApp()) {
      this.logger.error('激活应用失败，请手动检查');
      return;
    }

    this.executor.wait(1500);

    // 获取当前进度
    const progress = this.stateManager.getProgress();
    const startIndex = progress.current + 1;

    this.logger.info(`\n📈 当前进度: ${progress.current}/${progress.target} (${progress.percentage.toFixed(1)}%)`);
    this.logger.info(`📍 从第 ${startIndex} 篇开始\n`);

    // 分批提取
    let currentBatch = Math.floor(startIndex / batchSize) + 1;

    while (progress.current < targetCount) {
      this.logger.info(`\n${'='.repeat(60)}`);
      this.logger.info(`📦 批次 #${currentBatch}`);
      this.logger.info(`${'='.repeat(60)}`);

      const remaining = targetCount - progress.current;
      const currentBatchSize = Math.min(batchSize, remaining);

      const extracted = await this.extractBatch(startIndex, currentBatchSize);

      this.logger.info(`\n✅ 批次 #${currentBatch} 完成: 提取 ${extracted}/${currentBatchSize} 篇`);

      // 更新进度
      const newProgress = this.stateManager.getProgress();
      this.logger.info(`📊 总进度: ${newProgress.current}/${targetCount} (${newProgress.percentage.toFixed(1)}%)`);

      // 保存结果
      this.saveResults();

      // 准备下一批
      startIndex += currentBatchSize;
      currentBatch++;
      progress.current = newProgress.current;

      // 批次间延迟
      this.executor.wait(2000);

      // 提示用户手动滚动（如果需要）
      this.logger.info('\n💡 提示: 如果列表已滚动到底，请在 ima.copilot 中向上滚动并按 Enter 继续');
      this.logger.info('输入 q 退出，或按 Enter 继续下一批...');

      // 等待用户确认（在实际自动化中可以移除）
      // const readline = require('readline');
      // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      // const answer = await new Promise(resolve => rl.question('', resolve));
      // rl.close();
      // if (answer === 'q') break;
    }

    // 最终保存
    this.saveResults();

    this.logger.info('\n' + '='.repeat(60));
    this.logger.info('🎉 提取完成！');
    this.logger.info('='.repeat(60));
    this.logger.info(`✅ 总计提取: ${this.results.length} 篇文章`);
    this.logger.info(`💾 结果文件: ${CONFIG.RESULT_FILE}`);
    this.logger.info(`📋 日志文件: ${CONFIG.LOG_FILE}\n`);
  }
}

// ==================== 主函数 ====================

async function main() {
  const targetCount = parseInt(process.argv[2]) || 1800;
  const batchSize = parseInt(process.argv[3]) || CONFIG.BATCH_SIZE;

  const engine = new IMAExtractorEngine(targetCount);
  await engine.run(targetCount, batchSize);
}

main().catch(console.error);
