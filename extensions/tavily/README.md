# Tavily Search Plugin for OpenClaw

[Tavily](https://tavily.com) 是一个专为 AI 应用优化的搜索 API，提供高质量的搜索结果和 AI 生成的答案。

## 功能特点

- **AI 优化搜索**: 专为 LLM 应用设计的搜索 API
- **深度搜索模式**: 支持 `basic` (快速) 和 `advanced` (深度) 两种搜索模式
- **AI 答案**: 可选的 AI 生成答案摘要
- **新闻搜索**: 专门的新闻搜索模式
- **时间过滤**: 支持按天数过滤结果 (1-365 天)
- **域名过滤**: 支持包含/排除特定域名
- **相关性评分**: 每个结果包含相关性分数
- **多 API Key 轮换**: 支持配置多个 API key 自动轮换使用

## 安装与配置

### 1. 获取 API 密钥

访问 [Tavily 官网](https://tavily.com) 注册账号并获取 API 密钥。

### 2. 配置 API 密钥

**方法 A: 使用环境变量（支持逗号分隔多个 key）**

```bash
# 单个 key
export TAVILY_API_KEY=tvly-your-api-key-here

# 多个 key（自动轮换）
export TAVILY_API_KEY=tvly-key1,tvly-key2,tvly-key3
```

**方法 B: 使用配置命令**

```bash
openclaw configure --section web
```

**方法 C: 手动配置（支持数组形式的多个 key）**
编辑 `~/.openclaw/openclaw.json`:

单个 key:

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-your-api-key-here",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "tavily",
      },
    },
  },
}
```

多个 key（自动轮换）:

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: ["tvly-key1", "tvly-key2", "tvly-key3"],
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "tavily",
      },
    },
  },
}
```

> **提示**: 配置多个 API key 后，每次搜索请求会自动轮换使用，实现负载均衡和故障转移。

## 使用参数

### web_search 工具参数

| 参数                  | 类型                  | 默认值    | 描述                   |
| --------------------- | --------------------- | --------- | ---------------------- |
| `query`               | string (必需)         | -         | 搜索查询               |
| `count`               | number (1-10)         | 5         | 返回结果数量           |
| `search_depth`        | "basic" \| "advanced" | "basic"   | 搜索深度               |
| `topic`               | "general" \| "news"   | "general" | 搜索主题               |
| `days`                | number (1-365)        | -         | 时间范围（天）         |
| `include_answer`      | boolean               | true      | 是否包含 AI 生成的答案 |
| `include_raw_content` | boolean               | false     | 是否包含原始 HTML 内容 |
| `exclude_domains`     | string[]              | -         | 要排除的域名列表       |
| `include_domains`     | string[]              | -         | 要限制的域名列表       |

## 使用示例

### 基础搜索

```typescript
await web_search({
  query: "最新 AI 发展动态",
});
```

### 新闻搜索（最近7天）

```typescript
await web_search({
  query: "科技新闻",
  topic: "news",
  days: 7,
});
```

### 深度搜索

```typescript
await web_search({
  query: "深度研究主题",
  search_depth: "advanced",
  count: 10,
});
```

### 域名过滤

```typescript
await web_search({
  query: "Python 教程",
  include_domains: ["github.com", "stackoverflow.com"],
  exclude_domains: ["pinterest.com"],
});
```

## API 返回格式

```json
{
  "query": "搜索查询",
  "provider": "tavily",
  "count": 5,
  "tookMs": 1234,
  "answer": "AI 生成的答案摘要...",
  "results": [
    {
      "title": "结果标题",
      "url": "https://example.com",
      "description": "结果描述...",
      "score": 0.95,
      "published": "2024-01-15",
      "siteName": "example.com"
    }
  ],
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "description": "图片描述"
    }
  ]
}
```

## 定价与限制

- 免费套餐: 每月 1,000 次请求
- 基础套餐: $5/月，5,000 次请求
- 详细定价: https://tavily.com/pricing

## 相关链接

- [Tavily API 文档](https://docs.tavily.com)
- [Tavily 官网](https://tavily.com)
- [OpenClaw Web 工具文档](https://docs.openclaw.ai/tools/web)
