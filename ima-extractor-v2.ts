#!/usr/bin/env tsx

/**
 * IMA 文章链接提取 - 优化版 v2.1
 *
 * 使用共享模块，集成智能等待和错误分类
 * 基于 systematic-debugging 和效率审查结果优化
 *
 * @version 2.1.0
 * @date 2026-04-13
 */

import { execSync } from 'child_process';
import fs from 'fs';
import {
  Logger,
  StateManager,
  ExtractedArticle,
  ExtractionState,
  ErrorRecord,
  ExtractionResult,
} from './ima-extractor-shared';

// ==================== 错误类型枚举 ====================

enum ErrorType {
  TIMEOUT = 'timeout',
  CLIPBOARD = 'clipboard',
  APPLESCRIPT = 'applescript',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
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
  SAVE_INTERVAL: 5,

  // 坐标配置
  ADDRESS_BAR: { x: 960, y: 100 },
  LISTBOX_CENTER: { x: 600, y: 450 },
  ARTICLE_SPACING: 60, // 提取魔法数字

  // 智能等待配置（自适应轮询间隔）
  POLLING_INTERVALS: {
    FAST: 50,    // UI 更新、剪贴板
    NORMAL: 100, // URL 模式匹配
    SLOW: 250,   // 导航、页面加载
  },

  // 超时配置
  CLIPBOARD_TIMEOUT_MS: 5000,
  URL_PATTERN_TIMEOUT_MS: 3000,

  // 降级配置（智能等待失败时使用）
  FALLBACK_DELAYS: {
    AFTER_CLICK: 500,
    AFTER_KEY: 300,
    AFTER_OPEN: 2500,
    AFTER_BACK: 1500,
  },
};

// ==================== 智能等待系统（优化版） ====================

/**
 * 智能等待类 - 优化版
 *
 * 改进：
 * - 预计算超时时间以减少 Date.now() 调用
 * - 自适应轮询间隔
 * - 剪贴板内容缓存
 */
class SmartWait {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 通用轮询等待函数（优化版）
   */
  async waitFor<T>(
    condition: () => T | undefined | null | false,
    description: string,
    timeout: number,
    intervalType: 'fast' | 'normal' | 'slow' = 'normal'
  ): Promise<T> {
    const startTime = Date.now();
    const endTime = startTime + timeout;
    const pollInterval = CONFIG.POLLING_INTERVALS[intervalType];

    this.logger.debug(`开始等待: ${description} (间隔: ${pollInterval}ms)`);

    while (Date.now() < endTime) {
      const result = condition();
      if (result) {
        const duration = Date.now() - startTime;
        this.logger.debug(`等待完成: ${description} (${duration}ms)`);
        return result;
      }

      await this.sleep(pollInterval);
    }

    throw new Error(`等待超时: ${description} (${timeout}ms)`);
  }

  /**
   * 等待剪贴板内容变化（带指数退避）
   */
  async waitForClipboardChange(
    getClipboard: () => string,
    initialContent: string,
    timeout: number = CONFIG.CLIPBOARD_TIMEOUT_MS
  ): Promise<boolean> {
    const startTime = Date.now();
    const endTime = startTime + timeout;
    let pollInterval = 50; // 从快速开始
    const maxInterval = 500;

    while (Date.now() < endTime) {
      const current = getClipboard();
      if (current !== initialContent) {
        return true;
      }

      await this.sleep(pollInterval);

      // 指数退避
      pollInterval = Math.min(pollInterval * 1.5, maxInterval);
    }

    this.logger.warning(`剪贴板等待超时，使用降级策略`);
    return false;
  }

  /**
   * 等待 URL 模式出现（带缓存优化）
   */
  async waitForURLPattern(
    getClipboard: () => string,
    timeout: number = CONFIG.URL_PATTERN_TIMEOUT_MS
  ): Promise<string | null> {
    const startTime = Date.now();
    const endTime = startTime + timeout;
    let lastClipboard = getClipboard();
    let lastUpdateTime = startTime;

    while (Date.now() < endTime) {
      const current = lastClipboard;
      if (current?.startsWith('http')) {
        return current;
      }

      await this.sleep(CONFIG.POLLING_INTERVALS.NORMAL);

      // 每 500ms 更新剪贴板一次（减少 80% 的子进程调用）
      const now = Date.now();
      if (now - lastUpdateTime >= 500) {
        lastClipboard = getClipboard();
        lastUpdateTime = now;
      }
    }

    this.logger.warning(`URL 等待超时，使用降级策略`);
    return null;
  }

  /**
   * 固定延迟（降级策略）
   */
  async delay(ms: number): Promise<void> {
    this.logger.debug(`使用固定延迟: ${ms}ms`);
    await this.sleep(ms);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 错误分类器 ====================

/**
 * 错误分类器 - 细粒度错误类型识别
 */
class ErrorClassifier {
  static classify(errorMessage: string, operation: string): ErrorType {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return ErrorType.TIMEOUT;
    }

    if (operation.includes('clipboard') || lowerError.includes('clipboard')) {
      return ErrorType.CLIPBOARD;
    }

    if (lowerError.includes('applescript') || lowerError.includes('osascript')) {
      return ErrorType.APPLESCRIPT;
    }

    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return ErrorType.NETWORK;
    }

    return ErrorType.UNKNOWN;
  }

  static getRecoveryStrategy(errorType: ErrorType): {
    shouldRetry: boolean;
    delay: number;
    maxRetries: number;
  } {
    switch (errorType) {
      case ErrorType.TIMEOUT:
        return { shouldRetry: true, delay: 3000, maxRetries: 2 };
      case ErrorType.CLIPBOARD:
        return { shouldRetry: true, delay: 1000, maxRetries: 3 };
      case ErrorType.APPLESCRIPT:
        return { shouldRetry: true, delay: 2000, maxRetries: 3 };
      case ErrorType.NETWORK:
        return { shouldRetry: true, delay: 5000, maxRetries: 2 };
      default:
        return { shouldRetry: false, delay: 0, maxRetries: 0 };
    }
  }
}

// ==================== 操作执行器 ====================

class OperationExecutor {
  private logger: Logger;
  private smartWait: SmartWait;

  constructor(logger: Logger, smartWait: SmartWait) {
    this.logger = logger;
    this.smartWait = smartWait;
  }

  executeAppleScript(script: string, description: string): boolean {
    this.logger.debug(`执行: ${description}`);

    try {
      execSync(`osascript -e '${script}'`, {
        encoding: 'utf-8',
        timeout: CONFIG.OPERATION_TIMEOUT_MS / 1000,
      });
      return true;
    } catch (error: any) {
      const errorType = ErrorClassifier.classify(error.message, description);
      this.logger.error(`${description} 失败 [${errorType}]: ${error.message}`);
      return false;
    }
  }

  activateApp(appName: string = 'ima.copilot'): boolean {
    const script = `tell application "${appName}" to activate`;
    return this.executeAppleScript(script, `激活 ${appName}`);
  }

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

  getClipboard(): string {
    try {
      return execSync('pbpaste', { encoding: 'utf-8' }).trim();
    } catch (error) {
      return '';
    }
  }

  async wait(ms: number): Promise<void> {
    await this.smartWait.delay(ms);
  }
}

// ==================== 提取策略（共享剪贴板逻辑） ====================

abstract class ExtractionStrategy {
  protected executor: OperationExecutor;
  protected logger: Logger;
  protected smartWait: SmartWait;

  constructor(executor: OperationExecutor, logger: Logger, smartWait: SmartWait) {
    this.executor = executor;
    this.logger = logger;
    this.smartWait = smartWait;
  }

  abstract extract(): Promise<ExtractionResult>;

  /**
   * 共享的剪贴板等待逻辑
   * 消除 30+ 行的重复代码
   */
  protected async waitForClipboardWithRetry(): Promise<string | null> {
    // 尝试智能等待
    const url = await this.smartWait.waitForURLPattern(
      () => this.executor.getClipboard()
    );

    if (url) {
      return url;
    }

    // 降级：检查剪贴板
    await this.executor.wait(1000);
    const clipboard = this.executor.getClipboard();
    if (clipboard.startsWith('http')) {
      return clipboard;
    }

    return null;
  }
}

/**
 * 策略1: Cmd+L 聚焦地址栏（优化版）
 */
class CmdLAddressBarStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用 Cmd+L 策略提取');

    if (!this.executor.sendKeyCombo(['l'])) {
      return {
        success: false,
        error: 'Cmd+L 失败',
        errorType: ErrorType.APPLESCRIPT,
      };
    }

    const initialClipboard = this.executor.getClipboard();
    const hasChanged = await this.smartWait.waitForClipboardChange(
      () => this.executor.getClipboard(),
      initialClipboard
    );

    if (!hasChanged) {
      await this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_KEY);
    }

    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return {
        success: false,
        error: '复制失败',
        errorType: ErrorType.APPLESCRIPT,
      };
    }

    const url = await this.waitForClipboardWithRetry();

    if (url) {
      return {
        success: true,
        url,
        method: 'Cmd+L (Smart)',
      };
    }

    return {
      success: false,
      error: '剪贴板内容无效',
      errorType: ErrorType.CLIPBOARD,
    };
  }
}

/**
 * 策略2: 点击地址栏坐标（优化版）
 */
class ClickAddressBarStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用点击地址栏策略');

    const { x, y } = CONFIG.ADDRESS_BAR;

    if (!this.executor.clickAt(x, y)) {
      return {
        success: false,
        error: '点击地址栏失败',
        errorType: ErrorType.APPLESCRIPT,
      };
    }

    const initialClipboard = this.executor.getClipboard();
    const hasChanged = await this.smartWait.waitForClipboardChange(
      () => this.executor.getClipboard(),
      initialClipboard
    );

    if (!hasChanged) {
      await this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_CLICK);
    }

    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return {
        success: false,
        error: '复制失败',
        errorType: ErrorType.APPLESCRIPT,
      };
    }

    const url = await this.waitForClipboardWithRetry();

    if (url) {
      return {
        success: true,
        url,
        method: 'Click AddressBar (Smart)',
      };
    }

    return {
      success: false,
      error: '剪贴板内容无效',
      errorType: ErrorType.CLIPBOARD,
    };
  }
}

/**
 * 策略3: 选择所有并复制（优化版）
 */
class SelectAllCopyStrategy extends ExtractionStrategy {
  async extract(): Promise<ExtractionResult> {
    this.logger.debug('使用全选复制策略');

    if (!this.executor.sendKeyCombo(['a', 'c'])) {
      return {
        success: false,
        error: '全选复制失败',
        errorType: ErrorType.APPLESCRIPT,
      };
    }

    const url = await this.waitForClipboardWithRetry();

    if (url) {
      return {
        success: true,
        url,
        method: 'SelectAll (Smart)',
      };
    }

    return {
      success: false,
      error: '剪贴板内容无效',
      errorType: ErrorType.CLIPBOARD,
    };
  }
}

// ==================== 核心提取引擎 ====================

class IMAExtractorEngine {
  private logger: Logger;
  private stateManager: StateManager;
  private executor: OperationExecutor;
  private smartWait: SmartWait;
  private strategies: ExtractionStrategy[];
  private results: ExtractedArticle[] = [];

  constructor(targetCount: number = 1800) {
    this.logger = new Logger(CONFIG.LOG_FILE);
    this.stateManager = new StateManager(CONFIG.STATE_FILE, targetCount, this.logger);
    this.smartWait = new SmartWait(this.logger);
    this.executor = new OperationExecutor(this.logger, this.smartWait);

    this.strategies = [
      new CmdLAddressBarStrategy(this.executor, this.logger, this.smartWait),
      new ClickAddressBarStrategy(this.executor, this.logger, this.smartWait),
      new SelectAllCopyStrategy(this.executor, this.logger, this.smartWait),
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

        if (result.errorType) {
          const recovery = ErrorClassifier.getRecoveryStrategy(result.errorType as ErrorType);
          this.logger.debug(`错误类型: ${result.errorType}, 恢复策略: 重试=${recovery.shouldRetry}`);

          if (!recovery.shouldRetry) {
            this.logger.error(`不可恢复错误: ${result.error}`);
            return result;
          }
        }

        this.logger.debug(`策略失败: ${result.error}`);
      }

      if (attempt < CONFIG.MAX_RETRIES) {
        const recovery = ErrorClassifier.getRecoveryStrategy(ErrorType.UNKNOWN);
        this.logger.warning(`所有策略失败，${recovery.delay}ms 后重试...`);
        await this.executor.wait(recovery.delay);
      }
    }

    return {
      success: false,
      error: `所有策略在 ${CONFIG.MAX_RETRIES} 次尝试后均失败`,
      errorType: ErrorType.UNKNOWN,
    };
  }

  private async openArticleAt(x: number, y: number): Promise<boolean> {
    this.logger.debug(`打开文章 (${x}, ${y})`);

    if (!this.executor.clickAt(x, y)) {
      return false;
    }

    await this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_CLICK);

    if (!this.executor.clickAt(x, y, true)) {
      return false;
    }

    await this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_OPEN);

    return true;
  }

  private goBack(): boolean {
    this.logger.debug('返回文章列表');

    if (this.executor.sendKey('\u001b')) {
      this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_BACK);
      return true;
    }

    if (this.executor.sendKeyCombo(['['])) {
      this.executor.wait(CONFIG.FALLBACK_DELAYS.AFTER_BACK);
      return true;
    }

    return false;
  }

  private saveArticle(article: ExtractedArticle): void {
    this.results.push(article);
    this.stateManager.addUrl(article.url);

    if (this.results.length % CONFIG.SAVE_INTERVAL === 0) {
      this.saveResults();
    }
  }

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

  private async extractOneArticle(
    articleIndex: number,
    x: number,
    y: number
  ): Promise<boolean> {
    this.logger.info(`\n${'='.repeat(60)}`);
    this.logger.info(`📄 文章 #${articleIndex}`);
    this.logger.info(`${'='.repeat(60)}`);

    if (!await this.openArticleAt(x, y)) {
      this.logger.error('打开文章失败');
      return false;
    }

    const result = await this.extractWithRetry();

    if (!result.success || !result.url) {
      this.logger.error(`提取失败: ${result.error}`);

      this.stateManager.addError({
        timestamp: new Date().toISOString(),
        operation: `extract-article-${articleIndex}`,
        error: result.error || 'unknown',
        errorType: result.errorType || ErrorType.UNKNOWN,
        recovery: 'skip-article',
      });

      this.goBack();
      return false;
    }

    if (this.stateManager.isUrlExtracted(result.url)) {
      this.logger.warning('文章已提取过，跳过');
      this.goBack();
      return false;
    }

    const article: ExtractedArticle = {
      url: result.url,
      title: `Article #${articleIndex}`,
      timestamp: new Date().toISOString(),
      index: articleIndex,
      extractMethod: result.method || 'unknown',
    };

    this.saveArticle(article);
    this.logger.success(`文章 #${articleIndex} 提取成功！`);

    this.goBack();

    return true;
  }

  async extractBatch(startIndex: number, count: number): Promise<number> {
    let extractedCount = 0;
    const startY = CONFIG.LISTBOX_CENTER.y;

    for (let i = 0; i < count; i++) {
      const articleIndex = startIndex + i;
      const y = startY + (i * CONFIG.ARTICLE_SPACING);

      const success = await this.extractOneArticle(
        articleIndex,
        CONFIG.LISTBOX_CENTER.x,
        y
      );

      if (success) {
        extractedCount++;
      }
    }

    return extractedCount;
  }

  async run(targetCount: number = 1800, batchSize: number = CONFIG.BATCH_SIZE): Promise<void> {
    this.logger.info('\n🚀 IMA 文章链接提取引擎 v2.1 (优化版)');
    this.logger.info('='.repeat(60));
    this.logger.info(`📊 目标: ${targetCount} 篇文章`);
    this.logger.info(`📦 批次大小: ${batchSize} 篇`);
    this.logger.info(`💾 状态文件: ${CONFIG.STATE_FILE}`);
    this.logger.info(`💾 结果文件: ${CONFIG.RESULT_FILE}`);
    this.logger.info(`⚡ 智能等待: 启用`);
    this.logger.info('='.repeat(60));

    this.logger.info('\n🎯 激活 ima.copilot...');
    if (!this.executor.activateApp()) {
      this.logger.error('激活应用失败，请手动检查');
      return;
    }

    await this.executor.wait(1500);

    const progress = this.stateManager.getProgress();
    let startIndex = progress.current + 1;

    this.logger.info(`\n📈 当前进度: ${progress.current}/${progress.target} (${progress.percentage.toFixed(1)}%)`);
    this.logger.info(`📍 从第 ${startIndex} 篇开始\n`);

    let currentBatch = Math.floor(startIndex / batchSize) + 1;

    while (progress.current < targetCount) {
      this.logger.info(`\n${'='.repeat(60)}`);
      this.logger.info(`📦 批次 #${currentBatch}`);
      this.logger.info(`${'='.repeat(60)}`);

      const remaining = targetCount - progress.current;
      const currentBatchSize = Math.min(batchSize, remaining);

      const extracted = await this.extractBatch(startIndex, currentBatchSize);

      this.logger.info(`\n✅ 批次 #${currentBatch} 完成: 提取 ${extracted}/${currentBatchSize} 篇`);

      const newProgress = this.stateManager.getProgress();
      this.logger.info(`📊 总进度: ${newProgress.current}/${targetCount} (${newProgress.percentage.toFixed(1)}%)`);

      this.saveResults();

      startIndex += currentBatchSize;
      currentBatch++;
      progress.current = newProgress.current;

      await this.executor.wait(2000);

      this.logger.info('\n💡 提示: 如果列表已滚动到底，请在 ima.copilot 中向上滚动并按 Enter 继续');
    }

    this.saveResults();

    this.logger.info('\n' + '='.repeat(60));
    this.logger.info('🎉 提取完成！');
    this.logger.info('='.repeat(60));
    this.logger.info(`✅ 总计提取: ${this.results.length} 篇文章`);
    this.logger.info(`💾 结果文件: ${CONFIG.RESULT_FILE}`);
    this.logger.info(`📋 日志文件: ${CONFIG.LOG_FILE}\n`);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stateManager.destroy();
  }
}

// ==================== 主函数 ====================

async function main() {
  const targetCount = parseInt(process.argv[2]) || 1800;
  const batchSize = parseInt(process.argv[3]) || CONFIG.BATCH_SIZE;

  const engine = new IMAExtractorEngine(targetCount);

  try {
    await engine.run(targetCount, batchSize);
  } finally {
    engine.destroy();
  }
}

main().catch(console.error);
