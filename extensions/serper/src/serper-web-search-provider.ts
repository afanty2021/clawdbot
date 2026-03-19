/**
 * Serper.dev Search API Provider for OpenClaw
 *
 * Serper is a real-time Google Search Results API.
 * API Docs: https://serper.dev/api-reference
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

const SERPER_SEARCH_ENDPOINT = "https://google.serper.dev/search";

/**
 * API key rotation state
 */
let serperKeyIndex = 0;

/**
 * Serper search types
 */
type SerperType = "search" | "images" | "videos" | "places" | "shopping" | "news";

/**
 * Serper knowledge graph result
 */
type SerperKnowledgeGraph = {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  attributes?: Array<{ name: string; value: string }>;
};

/**
 * Serper organic result
 */
type SerperOrganicResult = {
  title: string;
  link: string;
  snippet: string;
  position?: number;
  date?: string;
  sitelinks?: Array<{ title: string; link: string }>;
};

/**
 * Serper answer result (featured snippet)
 */
type SerperAnswer = {
  title?: string;
  link?: string;
  snippet?: string;
};

/**
 * Serper people also ask result
 */
type SerperPeopleAlsoAsk = {
  question: string;
  snippet?: string;
  title?: string;
  link?: string;
};

/**
 * Serper API response
 */
type SerperSearchResponse = {
  searchParameters?: {
    q: string;
    type: string;
    engine?: string;
  };
  knowledgeGraph?: SerperKnowledgeGraph;
  answerBox?: SerperAnswer;
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  organic?: SerperOrganicResult[];
  images?: Array<{ title?: string; imageUrl?: string; link?: string }>;
  videos?: Array<{ title?: string; link?: string; imageUrl?: string }>;
  relatedSearches?: Array<{ query: string }>;
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
 * Resolve Serper API key from config or environment
 * Supports multiple keys for rotation (array or comma-separated string)
 */
function resolveSerperApiKey(searchConfig?: SearchConfigRecord): string | undefined {
  // Try config first (supports both single key and array)
  const configKey =
    getApiKeyValue(searchConfig?.apiKey) ??
    getApiKeyValue(
      searchConfig?.apiKey !== undefined
        ? searchConfig?.apiKey
        : readConfiguredSecretString(undefined, "plugins.entries.serper.config.webSearch.apiKey"),
    );

  // Try environment variable (supports comma-separated)
  // 使用 readProviderEnvValue 直接读取环境变量
  const envKey = readProviderEnvValue(["SERPER_API_KEY"]);
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
  const key = keys[serperKeyIndex % keys.length];
  serperKeyIndex = (serperKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Normalize search type parameter
 */
function normalizeSearchType(value: unknown): SerperType | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  const validTypes: SerperType[] = ["search", "images", "videos", "places", "shopping", "news"];
  if (validTypes.includes(trimmed as SerperType)) {
    return trimmed as SerperType;
  }
  return undefined;
}

/**
 * Run Serper search API call
 */
async function runSerperSearch(params: {
  query: string;
  apiKey: string;
  timeoutSeconds: number;
  type: SerperType;
  country?: string;
  language?: string;
  num?: number;
  page?: number;
}): Promise<{
  knowledgeGraph?: SerperKnowledgeGraph;
  answerBox?: SerperAnswer;
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  results: Array<{
    title: string;
    url: string;
    description: string;
    position?: number;
    date?: string;
    siteName?: string;
    sitelinks?: Array<{ title: string; link: string }>;
  }>;
  images?: Array<{ title?: string; imageUrl?: string; link?: string }>;
  videos?: Array<{ title?: string; link?: string; imageUrl?: string }>;
  relatedSearches?: Array<{ query: string }>;
}> {
  const url = new URL(SERPER_SEARCH_ENDPOINT);
  url.searchParams.set("q", params.query);
  url.searchParams.set("type", params.type);

  if (params.country) {
    url.searchParams.set("gl", params.country);
  }
  if (params.language) {
    url.searchParams.set("hl", params.language);
  }
  if (params.num !== undefined) {
    url.searchParams.set("num", String(params.num));
  }
  if (params.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }

  return withTrustedWebSearchEndpoint(
    {
      url: url.toString(),
      timeoutSeconds: params.timeoutSeconds,
      init: {
        method: "GET",
        headers: {
          "X-API-KEY": params.apiKey,
          "Content-Type": "application/json",
        },
      },
    },
    async (res) => {
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Serper API error (${res.status}): ${detail || res.statusText}`);
      }

      const data = (await res.json()) as SerperSearchResponse;

      const results = (data.organic ?? []).map((entry) => ({
        title: entry.title ? wrapWebContent(entry.title, "web_search") : "",
        url: entry.link,
        description: entry.snippet ? wrapWebContent(entry.snippet, "web_search") : "",
        position: entry.position,
        date: entry.date || undefined,
        siteName: resolveSiteName(entry.link) || undefined,
        sitelinks: entry.sitelinks?.map((sl) => ({
          title: sl.title,
          link: sl.link,
        })),
      }));

      return {
        knowledgeGraph: data.knowledgeGraph,
        answerBox: data.answerBox,
        peopleAlsoAsk: data.peopleAlsoAsk,
        results,
        images: data.images,
        videos: data.videos,
        relatedSearches: data.relatedSearches,
      };
    },
  );
}

/**
 * Create schema for Serper search tool
 */
function createSerperSchema() {
  return Type.Object({
    query: Type.String({ description: "Search query string." }),
    count: Type.Optional(
      Type.Number({
        description: "Number of results to return (1-100).",
        minimum: 1,
        maximum: MAX_SEARCH_COUNT,
      }),
    ),
    type: Type.Optional(
      Type.String({
        description:
          "Search type: 'search', 'images', 'videos', 'places', 'shopping', or 'news'. Default: 'search'.",
      }),
    ),
    country: Type.Optional(
      Type.String({
        description: "Country code for region-specific results (e.g., 'us', 'uk', 'de').",
      }),
    ),
    language: Type.Optional(
      Type.String({
        description: "Language code (e.g., 'en', 'de', 'fr', 'zh-cn').",
      }),
    ),
    page: Type.Optional(
      Type.Number({
        description: "Page number for pagination (1-based).",
        minimum: 1,
      }),
    ),
  });
}

/**
 * Error payload when API key is missing
 */
function missingSerperKeyPayload() {
  return {
    error: "missing_serper_api_key",
    message: `web_search (serper) needs a Serper API key. Run \`${formatCliCommand("openclaw configure --section web")}\` to store it, or set SERPER_API_KEY in the Gateway environment.`,
    docs: "https://serper.dev/api-reference",
  };
}

/**
 * Create Serper tool definition
 */
function createSerperToolDefinition(
  searchConfig?: SearchConfigRecord,
): WebSearchProviderToolDefinition {
  return {
    description:
      "Search the web using Serper.dev API (Google Search results). Returns real-time Google Search results including knowledge graph, featured snippets, organic results, images, and videos. Supports country/language localization and multiple search types.",
    parameters: createSerperSchema(),
    execute: async (args) => {
      const apiKey = resolveSerperApiKey(searchConfig);
      if (!apiKey) {
        return missingSerperKeyPayload();
      }

      const params = args as Record<string, unknown>;
      const query = readStringParam(params, "query", { required: true });
      const count =
        readNumberParam(params, "count", { integer: true }) ??
        searchConfig?.maxResults ??
        undefined;
      const searchType = normalizeSearchType(params.type) ?? "search";
      const country = readStringParam(params, "country");
      const language = readStringParam(params, "language");
      const page = readNumberParam(params, "page", { integer: true });

      // Validate type
      if (params.type !== undefined && !normalizeSearchType(params.type)) {
        return {
          error: "invalid_type",
          message:
            "type must be one of: 'search', 'images', 'videos', 'places', 'shopping', 'news'.",
          docs: "https://serper.dev/api-reference",
        };
      }

      const cacheKey = buildSearchCacheKey([
        "serper",
        query,
        resolveSearchCount(count, DEFAULT_SEARCH_COUNT),
        searchType,
        country,
        language,
        page,
      ]);
      const cached = readCachedSearchPayload(cacheKey);
      if (cached) {
        return cached;
      }

      const start = Date.now();
      const timeoutSeconds = resolveSearchTimeoutSeconds(searchConfig);
      const cacheTtlMs = resolveSearchCacheTtlMs(searchConfig);

      const { knowledgeGraph, answerBox, peopleAlsoAsk, results, images, videos, relatedSearches } =
        await runSerperSearch({
          query,
          apiKey,
          timeoutSeconds,
          type: searchType,
          country: country ?? undefined,
          language: language ?? undefined,
          num: resolveSearchCount(count, DEFAULT_SEARCH_COUNT),
          page,
        });

      const payload: Record<string, unknown> = {
        query,
        provider: "serper",
        type: searchType,
        count: results.length,
        tookMs: Date.now() - start,
        externalContent: {
          untrusted: true,
          source: "web_search",
          provider: "serper",
          wrapped: true,
        },
        results,
      };

      if (knowledgeGraph) {
        payload.knowledgeGraph = {
          title: knowledgeGraph.title,
          type: knowledgeGraph.type,
          description: knowledgeGraph.description
            ? wrapWebContent(knowledgeGraph.description, "web_search")
            : undefined,
          url: knowledgeGraph.url,
          imageUrl: knowledgeGraph.imageUrl,
          attributes: knowledgeGraph.attributes,
        };
      }

      if (answerBox) {
        payload.answerBox = {
          title: answerBox.title,
          link: answerBox.link,
          snippet: answerBox.snippet ? wrapWebContent(answerBox.snippet, "web_search") : undefined,
        };
      }

      if (peopleAlsoAsk && peopleAlsoAsk.length > 0) {
        payload.peopleAlsoAsk = peopleAlsoAsk.map((paa) => ({
          question: paa.question,
          snippet: paa.snippet ? wrapWebContent(paa.snippet, "web_search") : undefined,
          title: paa.title,
          link: paa.link,
        }));
      }

      if (images && images.length > 0) {
        payload.images = images;
      }

      if (videos && videos.length > 0) {
        payload.videos = videos;
      }

      if (relatedSearches && relatedSearches.length > 0) {
        payload.relatedSearches = relatedSearches;
      }

      writeCachedSearchPayload(cacheKey, payload, cacheTtlMs);
      return payload;
    },
  };
}

/**
 * Create Serper web search provider plugin
 */
export function createSerperWebSearchProvider(): WebSearchProviderPlugin {
  return {
    id: "serper",
    label: "Serper (Google)",
    hint: "Real-time Google Search · knowledge graph · rich snippets",
    envVars: ["SERPER_API_KEY"],
    placeholder: "Serper API key",
    signupUrl: "https://serper.dev",
    docsUrl: "https://serper.dev/api-reference",
    autoDetectOrder: 12,
    credentialPath: "plugins.entries.serper.config.webSearch.apiKey",
    inactiveSecretPaths: ["plugins.entries.serper.config.webSearch.apiKey"],
    getCredentialValue: (searchConfig) => searchConfig?.apiKey,
    setCredentialValue: setTopLevelCredentialValue,
    getConfiguredCredentialValue: (config) =>
      resolveProviderWebSearchPluginConfig(config, "serper")?.apiKey,
    setConfiguredCredentialValue: (configTarget, value) => {
      setProviderWebSearchPluginConfigValue(configTarget, "serper", "apiKey", value);
    },
    createTool: (ctx) => {
      const searchConfig = ctx.searchConfig as SearchConfigRecord | undefined;
      const pluginConfig = resolveProviderWebSearchPluginConfig(ctx.config, "serper");

      const mergedConfig: SearchConfigRecord | undefined = pluginConfig
        ? {
            ...(searchConfig ?? {}),
            ...(pluginConfig.apiKey === undefined ? {} : { apiKey: pluginConfig.apiKey }),
          }
        : searchConfig;

      return createSerperToolDefinition(mergedConfig);
    },
  };
}

export const __testing = {
  normalizeSearchType,
} as const;
