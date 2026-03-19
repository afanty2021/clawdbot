/**
 * Tavily Search API Provider for OpenClaw
 *
 * Tavily is an AI-optimized search API designed for LLM applications.
 * API Docs: https://docs.tavily.com
 */

import { Type } from "@sinclair/typebox";
import {
  buildSearchCacheKey,
  DEFAULT_SEARCH_COUNT,
  MAX_SEARCH_COUNT,
  formatCliCommand,
  readCachedSearchPayload,
  readConfiguredSecretString,
  readNumberParam,
  readProviderEnvValue,
  readStringArrayParam,
  readStringParam,
  resolveProviderWebSearchPluginConfig,
  resolveSearchCacheTtlMs,
  resolveSearchCount,
  resolveSearchTimeoutSeconds,
  resolveSiteName,
  setProviderWebSearchPluginConfigValue,
  setTopLevelCredentialValue,
  type SearchConfigRecord,
  type WebSearchProviderPlugin,
  type WebSearchProviderToolDefinition,
  withTrustedWebSearchEndpoint,
  wrapWebContent,
  writeCachedSearchPayload,
} from "openclaw/plugin-sdk/provider-web-search";

const TAVILY_SEARCH_ENDPOINT = "https://api.tavily.com/search";

/**
 * API key rotation state
 */
let tavilyKeyIndex = 0;

/**
 * Tavily-specific search depth options
 */
type TavilySearchDepth = "basic" | "advanced";

/**
 * Tavily API request body
 */
type TavilySearchRequest = {
  api_key: string;
  query: string;
  search_depth?: TavilySearchDepth;
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
  include_image_descriptions?: boolean;
  days?: number; // Time range in days (1-365)
  topic?: "general" | "news";
  exclude_domains?: string[];
  include_domains?: string[];
};

/**
 * Tavily search result
 */
type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
};

/**
 * Tavily API response
 */
type TavilySearchResponse = {
  answer?: string;
  query: string;
  response_time: number;
  images?: Array<{ url: string; description?: string }>;
  results: TavilyResult[];
};

/**
 * Get a single API key value, supporting both strings and arrays
 */
function getApiKeyValue(value: unknown): string | string[] | undefined {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
  }
  return undefined;
}

/**
 * Resolve Tavily API key from config or environment
 * Supports multiple keys for rotation (array or comma-separated string)
 */
function resolveTavilyApiKey(searchConfig?: SearchConfigRecord): string | undefined {
  // Try config first (supports both single key and array)
  const configKey =
    getApiKeyValue(searchConfig?.apiKey) ??
    getApiKeyValue(
      searchConfig?.apiKey !== undefined
        ? searchConfig?.apiKey
        : readConfiguredSecretString(undefined, "plugins.entries.tavily.config.webSearch.apiKey"),
    );

  // Try environment variable (supports comma-separated)
  // 使用 readProviderEnvValue 直接读取环境变量
  const envKey = readProviderEnvValue(["TAVILY_API_KEY"]);
  const envKeys =
    typeof envKey === "string"
      ? envKey
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : undefined;

  const keys = Array.isArray(configKey) ? configKey : configKey ? [configKey] : envKeys;

  if (!keys || keys.length === 0) {
    return undefined;
  }

  // Round-robin rotation
  const key = keys[tavilyKeyIndex % keys.length];
  tavilyKeyIndex = (tavilyKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Normalize search depth parameter
 */
function normalizeSearchDepth(value: unknown): TavilySearchDepth | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "basic" || trimmed === "advanced") {
    return trimmed;
  }
  return undefined;
}

/**
 * Normalize days parameter (1-365)
 */
function normalizeDays(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num) || num < 1 || num > 365) return undefined;
  return num;
}

/**
 * Normalize topic parameter
 */
function normalizeTopic(value: unknown): "general" | "news" | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "general" || trimmed === "news") {
    return trimmed;
  }
  return undefined;
}

/**
 * Run Tavily search API call
 */
async function runTavilySearch(params: {
  query: string;
  apiKey: string;
  timeoutSeconds: number;
  searchDepth?: TavilySearchDepth;
  maxResults: number;
  includeAnswer: boolean;
  includeRawContent: boolean;
  days?: number;
  topic?: "general" | "news";
  excludeDomains?: string[];
  includeDomains?: string[];
}): Promise<{
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    description: string;
    score: number;
    published?: string;
    siteName?: string;
  }>;
  images?: Array<{ url: string; description?: string }>;
}> {
  const requestBody: TavilySearchRequest = {
    api_key: params.apiKey,
    query: params.query,
    search_depth: params.searchDepth ?? "basic",
    max_results: params.maxResults,
    include_answer: params.includeAnswer,
    include_raw_content: params.includeRawContent,
  };

  // Add optional parameters
  if (params.days !== undefined) {
    requestBody.days = params.days;
  }
  if (params.topic !== undefined) {
    requestBody.topic = params.topic;
  }
  if (params.excludeDomains && params.excludeDomains.length > 0) {
    requestBody.exclude_domains = params.excludeDomains;
  }
  if (params.includeDomains && params.includeDomains.length > 0) {
    requestBody.include_domains = params.includeDomains;
  }

  return withTrustedWebSearchEndpoint(
    {
      url: TAVILY_SEARCH_ENDPOINT,
      timeoutSeconds: params.timeoutSeconds,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    },
    async (res) => {
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Tavily API error (${res.status}): ${detail || res.statusText}`);
      }

      const data = (await res.json()) as TavilySearchResponse;

      const results = (data.results ?? []).map((entry) => ({
        title: entry.title ? wrapWebContent(entry.title, "web_search") : "",
        url: entry.url,
        description: entry.content ? wrapWebContent(entry.content, "web_search") : "",
        score: entry.score,
        published: entry.published_date || undefined,
        siteName: resolveSiteName(entry.url) || undefined,
      }));

      return {
        answer: data.answer,
        results,
        images: data.images,
      };
    },
  );
}

/**
 * Create schema for Tavily search tool
 */
function createTavilySchema() {
  return Type.Object({
    query: Type.String({ description: "Search query string." }),
    count: Type.Optional(
      Type.Number({
        description: "Number of results to return (1-10).",
        minimum: 1,
        maximum: MAX_SEARCH_COUNT,
      }),
    ),
    search_depth: Type.Optional(
      Type.String({
        description:
          "Search depth: 'basic' (fast) or 'advanced' (deeper, slower). Default: 'basic'.",
      }),
    ),
    topic: Type.Optional(
      Type.String({
        description: "Search topic: 'general' or 'news'. Default: 'general'.",
      }),
    ),
    days: Type.Optional(
      Type.Number({
        description: "Time range in days (1-365) for recent results.",
        minimum: 1,
        maximum: 365,
      }),
    ),
    include_answer: Type.Optional(
      Type.Boolean({
        description: "Include AI-generated answer from Tavily. Default: true.",
      }),
    ),
    include_raw_content: Type.Optional(
      Type.Boolean({
        description: "Include raw HTML content in results. Default: false.",
      }),
    ),
    exclude_domains: Type.Optional(
      Type.Array(Type.String({ description: "Domain to exclude from results." }), {
        description: "List of domains to exclude.",
      }),
    ),
    include_domains: Type.Optional(
      Type.Array(Type.String({ description: "Domain to include in results." }), {
        description: "List of domains to restrict search to.",
      }),
    ),
  });
}

/**
 * Error payload when API key is missing
 */
function missingTavilyKeyPayload() {
  return {
    error: "missing_tavily_api_key",
    message: `web_search (tavily) needs a Tavily API key. Run \`${formatCliCommand("openclaw configure --section web")}\` to store it, or set TAVILY_API_KEY in the Gateway environment.`,
    docs: "https://docs.tavily.com",
  };
}

/**
 * Create Tavily tool definition
 */
function createTavilyToolDefinition(
  searchConfig?: SearchConfigRecord,
): WebSearchProviderToolDefinition {
  return {
    description:
      "Search the web using Tavily Search API. AI-optimized search with optional AI-generated answers. Supports domain filtering, time ranges, and news-specific search. Returns titles, URLs, content snippets, and relevance scores.",
    parameters: createTavilySchema(),
    execute: async (args) => {
      const apiKey = resolveTavilyApiKey(searchConfig);
      if (!apiKey) {
        return missingTavilyKeyPayload();
      }

      const params = args as Record<string, unknown>;
      const query = readStringParam(params, "query", { required: true });
      const count =
        readNumberParam(params, "count", { integer: true }) ??
        searchConfig?.maxResults ??
        undefined;
      const searchDepth = normalizeSearchDepth(params.search_depth);
      const topic = normalizeTopic(params.topic);
      const days = normalizeDays(params.days);
      const includeAnswer = params.include_answer !== false; // Default true
      const includeRawContent = params.include_raw_content === true;
      const excludeDomains = readStringArrayParam(params, "exclude_domains");
      const includeDomains = readStringArrayParam(params, "include_domains");

      // Validate search_depth
      if (params.search_depth !== undefined && !searchDepth) {
        return {
          error: "invalid_search_depth",
          message: "search_depth must be either 'basic' or 'advanced'.",
          docs: "https://docs.tavily.com",
        };
      }

      // Validate topic
      if (params.topic !== undefined && !topic) {
        return {
          error: "invalid_topic",
          message: "topic must be either 'general' or 'news'.",
          docs: "https://docs.tavily.com",
        };
      }

      // Validate days
      if (params.days !== undefined && days === undefined) {
        return {
          error: "invalid_days",
          message: "days must be a number between 1 and 365.",
          docs: "https://docs.tavily.com",
        };
      }

      const cacheKey = buildSearchCacheKey([
        "tavily",
        query,
        resolveSearchCount(count, DEFAULT_SEARCH_COUNT),
        searchDepth,
        topic,
        days,
        includeAnswer,
        includeRawContent,
        ...(excludeDomains ?? []),
        ...(includeDomains ?? []),
      ]);
      const cached = readCachedSearchPayload(cacheKey);
      if (cached) {
        return cached;
      }

      const start = Date.now();
      const timeoutSeconds = resolveSearchTimeoutSeconds(searchConfig);
      const cacheTtlMs = resolveSearchCacheTtlMs(searchConfig);

      const { answer, results, images } = await runTavilySearch({
        query,
        apiKey,
        timeoutSeconds,
        searchDepth,
        maxResults: resolveSearchCount(count, DEFAULT_SEARCH_COUNT),
        includeAnswer,
        includeRawContent,
        days,
        topic,
        excludeDomains,
        includeDomains,
      });

      const payload: Record<string, unknown> = {
        query,
        provider: "tavily",
        count: results.length,
        tookMs: Date.now() - start,
        externalContent: {
          untrusted: true,
          source: "web_search",
          provider: "tavily",
          wrapped: true,
        },
        results,
      };

      if (answer) {
        payload.answer = wrapWebContent(answer, "web_search");
      }

      if (images && images.length > 0) {
        payload.images = images;
      }

      writeCachedSearchPayload(cacheKey, payload, cacheTtlMs);
      return payload;
    },
  };
}

/**
 * Create Tavily web search provider plugin
 */
export function createTavilyWebSearchProvider(): WebSearchProviderPlugin {
  return {
    id: "tavily",
    label: "Tavily Search",
    hint: "AI-optimized search · domain filtering · news search",
    envVars: ["TAVILY_API_KEY"],
    placeholder: "tvly-...",
    signupUrl: "https://tavily.com",
    docsUrl: "https://docs.tavily.com",
    autoDetectOrder: 15,
    credentialPath: "plugins.entries.tavily.config.webSearch.apiKey",
    inactiveSecretPaths: ["plugins.entries.tavily.config.webSearch.apiKey"],
    getCredentialValue: (searchConfig) => searchConfig?.apiKey,
    setCredentialValue: setTopLevelCredentialValue,
    getConfiguredCredentialValue: (config) =>
      resolveProviderWebSearchPluginConfig(config, "tavily")?.apiKey,
    setConfiguredCredentialValue: (configTarget, value) => {
      setProviderWebSearchPluginConfigValue(configTarget, "tavily", "apiKey", value);
    },
    createTool: (ctx) => {
      const searchConfig = ctx.searchConfig as SearchConfigRecord | undefined;
      const pluginConfig = resolveProviderWebSearchPluginConfig(ctx.config, "tavily");

      const mergedConfig: SearchConfigRecord | undefined = pluginConfig
        ? {
            ...(searchConfig ?? {}),
            ...(pluginConfig.apiKey === undefined ? {} : { apiKey: pluginConfig.apiKey }),
          }
        : searchConfig;

      return createTavilyToolDefinition(mergedConfig);
    },
  };
}

export const __testing = {
  normalizeSearchDepth,
  normalizeDays,
  normalizeTopic,
} as const;
