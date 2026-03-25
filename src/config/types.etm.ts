/**
 * ETM Plus 财务系统集成配置
 */

export type EtmConfig = {
  /** ETM Plus API Base URL (default: http://localhost:8001) */
  api_base?: string;
  /** API 请求超时时间（毫秒，默认: 30000） */
  timeout_ms?: number;
  /** 最大重试次数（默认: 3） */
  max_retries?: number;
  /** 重试延迟（毫秒，默认: 1000） */
  retry_delay_ms?: number;
};
