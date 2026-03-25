/**
 * ETM Plus API Client Tool
 *
 * 提供与 ETM Plus 财务系统的集成接口，支持：
 * - 发票上传和处理
 * - 审批回复推送
 * - 健康检查
 *
 * API Base URL: http://localhost:8001
 *
 * @module ETM API Tool
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../config/config.js";
import { logDebug, logError } from "../../logger.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

// ============================================================================
// 类型定义
// ============================================================================

/** 审批选项类型 */
type ApprovalChoice = "1" | "2" | "3";

/** API 操作类型 */
type EtmApiAction =
  | "upload_invoice"
  | "approval_reply"
  | "health_check"
  | "create_reimbursement_application";

/** 发票上传参数 */
interface InvoiceUploadParams {
  file_path?: string;
  file_buffer?: string; // Base64 编码的文件内容
  applicant_id: string;
  applicant_name: string;
  payment_method: string; // "个人" | "对公"
  description?: string;
}

/** 审批回复参数 */
interface ApprovalReplyParams {
  user_id: string;
  user_name: string;
  application_id: number;
  choice: ApprovalChoice;
}

/** API 响应 */
interface EtmApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

/** 发票上传响应 */
interface InvoiceUploadResponse {
  invoice_id: number;
  file_name: string;
  archive_path: string;
  invoice_date: string;
  amount: string;
  vendor_name: string;
  invoice_number: string;
  reimbursement_status: string;
  payment_method: string;
}

/** 审批回复响应 */
interface ApprovalReplyResponse {
  application_id: number;
  choice: string;
  choice_text: string;
  result: string;
}

/** 创建报销申请响应 */
interface CreateApplicationResponse {
  application_id: number;
  application_no: string;
  message_id?: string;
}

// ============================================================================
// Schema 定义
// ============================================================================

const EtmApiToolSchema = Type.Object({
  action: Type.Union([
    Type.Literal("upload_invoice"),
    Type.Literal("approval_reply"),
    Type.Literal("health_check"),
    Type.Literal("create_reimbursement_application"),
  ]),

  // 发票上传参数
  file_path: Type.Optional(Type.String({ description: "发票文件路径" })),
  file_buffer: Type.Optional(Type.String({ description: "Base64 编码的文件内容" })),
  applicant_id: Type.Optional(Type.String({ description: "申请人ID（企业微信UserID）" })),
  applicant_name: Type.Optional(Type.String({ description: "申请人姓名" })),
  payment_method: Type.Optional(Type.String({ description: "支付方式：个人/对公" })),
  description: Type.Optional(Type.String({ description: "备注说明" })),

  // 审批回复参数
  user_id: Type.Optional(Type.String({ description: "审批人ID" })),
  user_name: Type.Optional(Type.String({ description: "审批人姓名" })),
  application_id: Type.Optional(Type.Number({ description: "申请ID" })),
  choice: Type.Optional(Type.Union([Type.Literal("1"), Type.Literal("2"), Type.Literal("3")])), // 审批选择

  // 创建报销申请参数
  invoice_id: Type.Optional(Type.Number({ description: "发票 ID（upload_invoice 返回）" })),
  amount: Type.Optional(Type.Number({ description: "发票金额" })),
  approver_id: Type.Optional(Type.String({ description: "审批人 ID（企业微信 UserID）" })),

  // API 配置
  api_base: Type.Optional(Type.String({ description: "ETM Plus API Base URL" })),
  timeout_ms: Type.Optional(Type.Number({ description: "请求超时时间（毫秒）" })),
});

// ============================================================================
// 常量定义
// ============================================================================

const DEFAULT_API_BASE = "http://localhost:8001";
const DEFAULT_TIMEOUT_MS = 30000; // 30 秒
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// 审批选项映射
const APPROVAL_CHOICE_MAP: Record<ApprovalChoice, string> = {
  "1": "立即报销",
  "2": "次月生成报销单",
  "3": "对公支付，无需报销",
};

// ============================================================================
// HTTP 客户端
// ============================================================================

/**
 * ETM API HTTP 客户端
 */
class EtmApiClient {
  private apiBase: string;
  private timeoutMs: number;

  constructor(apiBase: string = DEFAULT_API_BASE, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.apiBase = apiBase;
    this.timeoutMs = timeoutMs;
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      headers?: Record<string, string>;
      body?: FormData | string;
      retries?: number;
    } = {},
  ): Promise<EtmApiResponse<T>> {
    const { method = "POST", headers = {}, body, retries = MAX_RETRIES } = options;
    const url = `${this.apiBase}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logDebug(`[ETM API] ${method} ${url} (attempt ${attempt + 1}/${retries + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method,
          headers: {
            ...(typeof body === "string" && { "Content-Type": "application/json" }),
            ...headers,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as EtmApiResponse<T>;
        logDebug(`[ETM API] Response: ${JSON.stringify(data)}`);
        return data;
      } catch (error) {
        lastError = error as Error;
        logError(`[ETM API] Request failed (attempt ${attempt + 1}): ${lastError.message}`);

        if (attempt < retries) {
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }

    throw new Error(`ETM API 请求失败: ${lastError?.message ?? "未知错误"}`);
  }

  /**
   * 上传发票
   */
  async uploadInvoice(params: InvoiceUploadParams): Promise<EtmApiResponse<InvoiceUploadResponse>> {
    const formData = new FormData();

    // 处理文件
    if (params.file_buffer) {
      // 从 Base64 解码
      const buffer = Buffer.from(params.file_buffer, "base64");
      formData.append("file", new Blob([buffer]), "invoice.pdf");
    } else if (params.file_path) {
      // 从文件路径读取（在 Node.js 环境中）
      const fs = await import("node:fs/promises");
      const buffer = await fs.readFile(params.file_path);
      formData.append("file", new Blob([buffer]), "invoice.pdf");
    } else {
      throw new Error("必须提供 file_path 或 file_buffer");
    }

    // 添加表单字段
    formData.append("applicant_id", params.applicant_id);
    formData.append("applicant_name", params.applicant_name);
    formData.append("payment_method", params.payment_method);
    if (params.description) {
      formData.append("description", params.description);
    }

    return this.request<InvoiceUploadResponse>("/api/v2/invoice/upload", {
      method: "POST",
      body: formData,
      // FormData 会自动设置 Content-Type
    });
  }

  /**
   * 提交审批回复
   */
  async approvalReply(params: ApprovalReplyParams): Promise<EtmApiResponse<ApprovalReplyResponse>> {
    const body = JSON.stringify({
      user_id: params.user_id,
      user_name: params.user_name,
      application_id: params.application_id,
      choice: params.choice,
    });

    return this.request<ApprovalReplyResponse>("/api/v2/wecom/approval-reply", {
      method: "POST",
      body,
    });
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<
    EtmApiResponse<{ financial_db: string; archive_path: string; timestamp: string }>
  > {
    return this.request("/health");
  }

  /**
   * 创建报销申请
   */
  async createReimbursementApplication(params: {
    invoice_id: number;
    applicant_id: string;
    applicant_name: string;
    amount: number;
    approver_id: string;
    description?: string;
  }): Promise<EtmApiResponse<CreateApplicationResponse>> {
    const formData = new FormData();
    formData.append("invoice_id", params.invoice_id.toString());
    formData.append("applicant_id", params.applicant_id);
    formData.append("applicant_name", params.applicant_name);
    formData.append("amount", params.amount.toString());
    formData.append("approver_id", params.approver_id);
    if (params.description) {
      formData.append("description", params.description);
    }

    return this.request<CreateApplicationResponse>("/api/v2/reimbursement/create-application", {
      method: "POST",
      body: formData,
    });
  }
}

// ============================================================================
// 工具创建
// ============================================================================

/**
 * 创建 ETM API 工具
 */
export function createEtmApiTool(config?: OpenClawConfig): AnyAgentTool {
  // 从配置中读取 API Base URL
  const apiBase = config?.etm?.api_base ?? DEFAULT_API_BASE;
  const timeoutMs = config?.etm?.timeout_ms ?? DEFAULT_TIMEOUT_MS;

  const client = new EtmApiClient(apiBase, timeoutMs);

  return {
    label: "ETM Plus API",
    name: "etm_api",
    description: `与 ETM Plus 财务系统交互，支持发票上传、审批回复和报销申请。

**操作类型**：
- \`upload_invoice\`: 上传成本发票，自动识别、重命名、归档、入库
- \`approval_reply\`: 提交审批回复（1=立即报销, 2=次月报销, 3=对公支付）
- \`health_check\`: 检查 ETM Plus API 服务状态
- \`create_reimbursement_application\`: 创建报销申请（上传发票后调用）

**发票上传示例**：
\`\`\`
{
  "action": "upload_invoice",
  "file_path": "/path/to/invoice.pdf",
  "applicant_id": "HuangZhengBo",
  "applicant_name": "黄正波",
  "payment_method": "个人",
  "description": "办公用品采购"
}
\`\`\`

**审批回复示例**：
\`\`\`
{
  "action": "approval_reply",
  "user_id": "HuangZhengBo",
  "user_name": "黄正波",
  "application_id": 1,
  "choice": "1"
}
\`\`\`

**创建报销申请示例**：
\`\`\`
{
  "action": "create_reimbursement_application",
  "invoice_id": 123,
  "applicant_id": "HuangZhengBo",
  "applicant_name": "黄正波",
  "amount": 100.50,
  "approver_id": "HuangZhengBo",
  "description": "办公用品采购"
}
\`\`\`

**审批选项**：
- \`1\`: 立即报销
- \`2\`: 次月生成报销单
- \`3\`: 对公支付，无需报销

**API 地址**: ${apiBase}
**超时时间**: ${timeoutMs}ms`,
    parameters: EtmApiToolSchema,
    execute: async (_toolCallId, args, signal) => {
      // 检查是否已中止
      if (signal?.aborted) {
        const err = new Error("ETM API call aborted");
        err.name = "AbortError";
        throw err;
      }

      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true }) as EtmApiAction;

      // 获取自定义配置
      const customApiBase = readStringParam(params, "api_base");
      const customTimeout = params.timeout_ms as number | undefined;

      // 创建客户端
      const apiClient =
        customApiBase || customTimeout
          ? new EtmApiClient(customApiBase ?? apiBase, customTimeout ?? timeoutMs)
          : client;

      try {
        switch (action) {
          case "upload_invoice": {
            const file_path = readStringParam(params, "file_path");
            const file_buffer = readStringParam(params, "file_buffer");
            const applicant_id = readStringParam(params, "applicant_id", { required: true });
            const applicant_name = readStringParam(params, "applicant_name", { required: true });
            const payment_method = readStringParam(params, "payment_method", { required: true });
            const description = readStringParam(params, "description");

            if (!file_path && !file_buffer) {
              throw new Error("必须提供 file_path 或 file_buffer");
            }

            const result = await apiClient.uploadInvoice({
              file_path,
              file_buffer,
              applicant_id,
              applicant_name,
              payment_method,
              description,
            });

            return jsonResult(result);
          }

          case "approval_reply": {
            const user_id = readStringParam(params, "user_id", { required: true });
            const user_name = readStringParam(params, "user_name", { required: true });
            const application_id = params.application_id as number;
            const choice = readStringParam(params, "choice", { required: true }) as ApprovalChoice;

            if (typeof application_id !== "number") {
              throw new Error("application_id 必须是数字");
            }

            if (!["1", "2", "3"].includes(choice)) {
              throw new Error("choice 必须是 1、2 或 3");
            }

            const result = await apiClient.approvalReply({
              user_id,
              user_name,
              application_id,
              choice,
            });

            return jsonResult(result);
          }

          case "health_check": {
            const result = await apiClient.healthCheck();
            return jsonResult(result);
          }

          case "create_reimbursement_application": {
            const invoice_id = params.invoice_id as number;
            const applicant_id = readStringParam(params, "applicant_id", { required: true });
            const applicant_name = readStringParam(params, "applicant_name", { required: true });
            const amount = params.amount as number;
            const approver_id = readStringParam(params, "approver_id", { required: true });
            const description = readStringParam(params, "description");

            if (typeof invoice_id !== "number") {
              throw new Error("invoice_id 必须是数字");
            }
            if (typeof amount !== "number") {
              throw new Error("amount 必须是数字");
            }

            const result = await apiClient.createReimbursementApplication({
              invoice_id,
              applicant_id,
              applicant_name,
              amount,
              approver_id,
              description,
            });

            return jsonResult(result);
          }

          default:
            throw new Error(`未知操作: ${String(action)}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(`[ETM API] ${String(action)} 失败: ${errorMessage}`);
        return jsonResult({
          success: false,
          message: `ETM API 调用失败: ${errorMessage}`,
          data: null,
        });
      }
    },
  };
}

// ============================================================================
// 导出
// ============================================================================

export {
  type ApprovalChoice,
  type ApprovalReplyParams,
  type InvoiceUploadParams,
  APPROVAL_CHOICE_MAP,
};
export const __testing = {
  DEFAULT_API_BASE,
  DEFAULT_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  EtmApiClient,
};
