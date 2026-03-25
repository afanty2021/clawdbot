/**
 * 审批状态管理模块
 *
 * 管理发票审批请求的状态，包括：
 * - 存储待处理审批
 * - 会话与审批 ID 映射
 * - 超时清理
 * - 持久化存储
 *
 * @module Approval State
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { logDebug, logError } from "../../logger.js";

// ============================================================================
// 类型定义
// ============================================================================

/** 审批选项类型 */
export type ApprovalChoice = "1" | "2" | "3";

/** 待处理审批状态 */
export interface PendingApproval {
  /** 申请 ID */
  application_id: number;
  /** 申请人 ID */
  applicant_id: string;
  /** 申请人姓名 */
  applicant_name: string;
  /** 审批者 ID */
  approver_id: string;
  /** 审批者姓名 */
  approver_name: string;
  /** 创建时间（Unix 时间戳，毫秒） */
  created_at: number;
  /** 过期时间（Unix 时间戳，毫秒） */
  expires_at: number;
  /** 发票详情 */
  invoice_details: InvoiceDetails;
  /** 会话键（用于回复匹配） */
  session_key?: string;
  /** 消息 ID（用于更新审批消息） */
  message_id?: string;
  /** 频道 ID */
  channel_id?: string;
}

/** 发票详情 */
export interface InvoiceDetails {
  /** 发票 ID */
  invoice_id: number;
  /** 文件名 */
  file_name: string;
  /** 金额 */
  amount: string;
  /** 供应商名称 */
  vendor_name: string;
  /** 发票号码 */
  invoice_number: string;
  /** 发票日期 */
  invoice_date: string;
  /** 支付方式 */
  payment_method: string;
}

/** 审批结果 */
export interface ApprovalResult {
  /** 申请 ID */
  application_id: number;
  /** 审批选择 */
  choice: ApprovalChoice;
  /** 审批选择文本 */
  choice_text: string;
  /** 审批者 ID */
  approver_id: string;
  /** 审批者姓名 */
  approver_name: string;
  /** 审批时间 */
  approved_at: number;
}

/** 状态存储数据 */
interface ApprovalStateData {
  /** 版本 */
  version: 1;
  /** 待处理审批列表 */
  pending: Record<string, PendingApproval>;
  /** 已完成审批列表（用于历史记录） */
  completed: Record<string, ApprovalResult>;
  /** 最后清理时间 */
  last_cleanup_at: number;
}

// ============================================================================
// 常量定义
// ============================================================================

/** 默认超时时间（24 小时） */
const DEFAULT_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/** 状态文件路径 */
const STATE_DIR = join(homedir(), ".openclaw", "data");
const STATE_FILE = join(STATE_DIR, "approvals.json");

/** 清理间隔（1 小时） */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// ============================================================================
// 状态管理器
// ============================================================================

/**
 * 审批状态管理器
 */
export class ApprovalStateManager {
  private data: ApprovalStateData;
  private statePath: string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(statePath: string = STATE_FILE) {
    this.statePath = statePath;
    this.data = {
      version: 1,
      pending: {},
      completed: {},
      last_cleanup_at: Date.now(),
    };
  }

  /**
   * 初始化状态管理器
   */
  async initialize(): Promise<void> {
    try {
      // 确保目录存在
      await mkdir(dirname(this.statePath), { recursive: true });

      // 加载现有状态
      if (existsSync(this.statePath)) {
        const content = await readFile(this.statePath, "utf-8");
        this.data = JSON.parse(content) as ApprovalStateData;
        logDebug(`[ApprovalState] 加载了 ${Object.keys(this.data.pending).length} 个待处理审批`);
      } else {
        // 创建新状态文件
        await this.save();
      }

      // 启动清理定时器
      this.startCleanupTimer();
    } catch (error) {
      logError(
        `[ApprovalState] 初始化失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      // 使用空状态
      this.data = {
        version: 1,
        pending: {},
        completed: {},
        last_cleanup_at: Date.now(),
      };
    }
  }

  /**
   * 保存状态到文件
   */
  private async save(): Promise<void> {
    try {
      await writeFile(this.statePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      logError(
        `[ApprovalState] 保存失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 生成审批键
   */
  private generateKey(applicationId: number): string {
    return `approval_${applicationId}`;
  }

  /**
   * 添加待处理审批
   */
  async addPendingApproval(approval: PendingApproval): Promise<void> {
    const key = this.generateKey(approval.application_id);
    this.data.pending[key] = approval;
    await this.save();
    logDebug(`[ApprovalState] 添加待处理审批: ${key}`);
  }

  /**
   * 获取待处理审批
   */
  getPendingApproval(applicationId: number): PendingApproval | null {
    const key = this.generateKey(applicationId);
    return this.data.pending[key] ?? null;
  }

  /**
   * 通过会话键获取待处理审批
   */
  getPendingApprovalBySession(sessionKey: string): PendingApproval | null {
    for (const approval of Object.values(this.data.pending)) {
      if (approval.session_key === sessionKey) {
        return approval;
      }
    }
    return null;
  }

  /**
   * 获取所有待处理审批
   */
  getAllPendingApprovals(): PendingApproval[] {
    return Object.values(this.data.pending);
  }

  /**
   * 完成审批
   */
  async completeApproval(result: ApprovalResult): Promise<void> {
    const key = this.generateKey(result.application_id);

    // 移动到已完成
    if (this.data.pending[key]) {
      delete this.data.pending[key];
    }

    this.data.completed[key] = result;
    await this.save();
    logDebug(`[ApprovalState] 完成审批: ${key}, 选择: ${result.choice}`);
  }

  /**
   * 检查并清理过期审批
   */
  async cleanupExpiredApprovals(): Promise<number> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, approval] of Object.entries(this.data.pending)) {
      if (approval.expires_at < now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      delete this.data.pending[key];
      logDebug(`[ApprovalState] 清理过期审批: ${key}`);
    }

    if (expiredKeys.length > 0) {
      this.data.last_cleanup_at = now;
      await this.save();
    }

    return expiredKeys.length;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(async () => {
      const count = await this.cleanupExpiredApprovals();
      if (count > 0) {
        logDebug(`[ApprovalState] 定期清理: 移除了 ${count} 个过期审批`);
      }
    }, CLEANUP_INTERVAL_MS);

    logDebug("[ApprovalState] 启动清理定时器");
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logDebug("[ApprovalState] 停止清理定时器");
    }
  }

  /**
   * 获取状态统计
   */
  getStats(): {
    pending: number;
    completed: number;
    last_cleanup: number;
  } {
    return {
      pending: Object.keys(this.data.pending).length,
      completed: Object.keys(this.data.completed).length,
      last_cleanup: this.data.last_cleanup_at,
    };
  }

  /**
   * 关闭状态管理器
   */
  async shutdown(): Promise<void> {
    this.stopCleanupTimer();
    await this.save();
    logDebug("[ApprovalState] 状态管理器已关闭");
  }

  /**
   * 清空所有状态（用于测试）
   */
  async clear(): Promise<void> {
    this.data.pending = {};
    this.data.completed = {};
    this.data.last_cleanup_at = Date.now();
    await this.save();
  }
}

// ============================================================================
// 全局单例
// ============================================================================

let globalInstance: ApprovalStateManager | null = null;

/**
 * 获取全局状态管理器实例
 */
export function getApprovalStateManager(): ApprovalStateManager {
  if (!globalInstance) {
    globalInstance = new ApprovalStateManager();
  }
  return globalInstance;
}

/**
 * 初始化全局状态管理器
 */
export async function initializeApprovalStateManager(): Promise<void> {
  const manager = getApprovalStateManager();
  await manager.initialize();
}

/**
 * 关闭全局状态管理器
 */
export async function shutdownApprovalStateManager(): Promise<void> {
  if (globalInstance) {
    await globalInstance.shutdown();
    globalInstance = null;
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建待处理审批对象
 */
export function createPendingApproval(params: {
  application_id: number;
  applicant_id: string;
  applicant_name: string;
  approver_id: string;
  approver_name: string;
  invoice_details: InvoiceDetails;
  session_key?: string;
  message_id?: string;
  channel_id?: string;
  timeout_ms?: number;
}): PendingApproval {
  const now = Date.now();
  const timeout = params.timeout_ms ?? DEFAULT_TIMEOUT_MS;

  return {
    application_id: params.application_id,
    applicant_id: params.applicant_id,
    applicant_name: params.applicant_name,
    approver_id: params.approver_id,
    approver_name: params.approver_name,
    created_at: now,
    expires_at: now + timeout,
    invoice_details: params.invoice_details,
    session_key: params.session_key,
    message_id: params.message_id,
    channel_id: params.channel_id,
  };
}

/**
 * 创建审批结果对象
 */
export function createApprovalResult(params: {
  application_id: number;
  choice: ApprovalChoice;
  approver_id: string;
  approver_name: string;
}): ApprovalResult {
  return {
    application_id: params.application_id,
    choice: params.choice,
    choice_text: getApprovalChoiceText(params.choice),
    approver_id: params.approver_id,
    approver_name: params.approver_name,
    approved_at: Date.now(),
  };
}

/**
 * 获取审批选项文本
 */
export function getApprovalChoiceText(choice: ApprovalChoice): string {
  const map: Record<ApprovalChoice, string> = {
    "1": "立即报销",
    "2": "次月生成报销单",
    "3": "对公支付，无需报销",
  };
  return map[choice];
}

// ============================================================================
// 导出
// ============================================================================

export const __testing = {
  DEFAULT_TIMEOUT_MS,
  CLEANUP_INTERVAL_MS,
  STATE_DIR,
  STATE_FILE,
  ApprovalStateManager,
};
