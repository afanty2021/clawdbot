/**
 * IMA Extractor - 共享模块
 *
 * 提取 ima-extractor-core.ts 和 ima-extractor-optimized.ts 之间的共享代码
 * 以消除 67% 的代码重复
 */

import { execSync } from 'child_process';
import fs from 'fs';

// ==================== 共享类型定义 ====================

export interface ExtractedArticle {
  url: string;
  title: string;
  timestamp: string;
  index: number;
  extractMethod: string;
  retryCount?: number;
}

export interface ExtractionState {
  lastUpdate: string;
  totalExtracted: number;
  targetCount: number;
  extractedUrls: string[];
  currentBatch: number;
  startTime: string;
  errors: ErrorRecord[];
}

export interface ErrorRecord {
  timestamp: string;
  operation: string;
  error: string;
  recovery: string;
  errorType?: string; // 可选字段，用于优化版本
}

export interface ExtractionResult {
  success: boolean;
  url?: string;
  title?: string;
  method?: string;
  error?: string;
  errorType?: string; // 可选字段，用于优化版本
}

// ==================== 日志系统（共享） ====================

export class Logger {
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

    console.log(message);

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

// ==================== 状态管理（优化版） ====================

/**
 * 优化的状态管理器
 *
 * 改进：
 * - 使用 Set 实现 O(1) 查找而非 O(n) 数组搜索
 * - 防抖保存以减少文件 I/O
 * - 延迟保存策略避免阻塞
 */
export class StateManager {
  private stateFile: string;
  private state: ExtractionState;
  private extractedUrlsSet: Set<string>; // O(1) 查找
  private pendingSave: boolean = false;
  private saveTimer: NodeJS.Timeout | null = null;
  private logger: Logger;

  constructor(stateFile: string, targetCount: number, logger: Logger) {
    this.stateFile = stateFile;
    this.logger = logger;
    this.state = this.loadState(targetCount);
    this.extractedUrlsSet = new Set(this.state.extractedUrls);
  }

  private loadState(targetCount: number): ExtractionState {
    if (fs.existsSync(this.stateFile)) {
      try {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        const loaded = JSON.parse(data);
        this.logger.info(`加载状态: 已提取 ${loaded.totalExtracted} 篇文章`);
        return loaded;
      } catch (error) {
        this.logger.warning('无法加载状态文件，创建新状态');
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

  /**
   * 调度保存（防抖，最多每秒保存一次）
   */
  private scheduleSave(): void {
    if (!this.pendingSave) {
      this.pendingSave = true;
      this.saveTimer = setTimeout(() => {
        this.saveSync();
        this.pendingSave = false;
      }, 1000); // 最多每秒保存一次
    }
  }

  /**
   * 立即保存到文件
   */
  save(): void {
    this.state.lastUpdate = new Date().toISOString();
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('保存状态失败');
    }
  }

  /**
   * 同步保存（内部使用）
   */
  private saveSync(): void {
    this.state.lastUpdate = new Date().toISOString();
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('保存状态失败');
    }
  }

  /**
   * 检查 URL 是否已提取（O(1) 查找）
   */
  isUrlExtracted(url: string): boolean {
    return this.extractedUrlsSet.has(url);
  }

  /**
   * 添加 URL（防抖保存）
   */
  addUrl(url: string): void {
    if (!this.extractedUrlsSet.has(url)) {
      this.extractedUrlsSet.add(url);
      this.state.extractedUrls.push(url); // 保持数组用于序列化
      this.state.totalExtracted++;
      this.scheduleSave(); // 防抖保存，而非立即保存
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
    // 使用循环缓冲区而非创建新数组
    if (this.state.errors.length >= 100) {
      this.state.errors.shift(); // 移除最旧的错误
    }
    this.state.errors.push(error);

    // 仅在每 10 个错误时保存一次，避免频繁 I/O
    if (this.state.errors.length % 10 === 0) {
      this.scheduleSave();
    }
  }

  getState(): ExtractionState {
    return { ...this.state };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.save(); // 最终保存
  }
}
