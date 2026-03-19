# Serper.dev Search Plugin for OpenClaw

[Serper.dev](https://serper.dev) 是一个实时 Google 搜索结果 API，提供与 Google 搜索相同的搜索结果。

## 功能特点

- **实时 Google 结果**: 获取与 Google 搜索相同的结果
- **知识图谱**: 支持 Google 知识图谱数据
- **特色摘要**: 获取 Google 的精选摘要（Featured Snippets）
- "相关问题": 返回"相关问题"结果
- **多种搜索类型**: 支持网页、图片、视频、地点、购物、新闻搜索
- **本地化**: 支持国家和语言设置
- **分页**: 支持分页浏览结果
- **多 API Key 轮换**: 支持配置多个 API key 自动轮换使用

## 安装与配置

### 1. 获取 API 密钥

访问 [Serper.dev](https://serper.dev) 注册账号并获取 API 密钥（新用户有 2,500 次免费请求）。

### 2. 配置 API 密钥

**方法 A: 使用环境变量（支持逗号分隔多个 key）**

```bash
# 单个 key
export SERPER_API_KEY=your-serper-api-key-here

# 多个 key（自动轮换）
export SERPER_API_KEY=key1,key2,key3
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
      serper: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "your-serper-api-key-here",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "serper",
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
      serper: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: ["key1", "key2", "key3"],
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "serper",
      },
    },
  },
}
```

> **提示**: 配置多个 API key 后，每次搜索请求会自动轮换使用，实现负载均衡和故障转移。

## 使用参数

### web_search 工具参数

| 参数       | 类型           | 默认值   | 描述                                                                 |
| ---------- | -------------- | -------- | -------------------------------------------------------------------- |
| `query`    | string (必需)  | -        | 搜索查询                                                             |
| `count`    | number (1-100) | 10       | 返回结果数量                                                         |
| `type`     | string         | "search" | 搜索类型: "search", "images", "videos", "places", "shopping", "news" |
| `country`  | string         | -        | 国家代码 (如 "us", "uk", "de", "cn")                                 |
| `language` | string         | -        | 语言代码 (如 "en", "zh-cn", "de", "fr")                              |
| `page`     | number         | 1        | 页码（从1开始）                                                      |

## 使用示例

### 基础搜索

```typescript
await web_search({
  query: "OpenClaw AI assistant",
});
```

### 中文搜索

```typescript
await web_search({
  query: "人工智能最新进展",
  country: "cn",
  language: "zh-cn",
});
```

### 图片搜索

```typescript
await web_search({
  query: "机器学习",
  type: "images",
  count: 20,
});
```

### 视频搜索

```typescript
await web_search({
  query: "Python 教程",
  type: "videos",
});
```

### 新闻搜索

```typescript
await web_search({
  query: "科技新闻",
  type: "news",
  country: "cn",
});
```

### 分页浏览

```typescript
await web_search({
  query: "搜索查询",
  page: 2,
  count: 10,
});
```

## API 返回格式

```json
{
  "query": "搜索查询",
  "provider": "serper",
  "type": "search",
  "count": 10,
  "tookMs": 1234,
  "knowledgeGraph": {
    "title": "知识图谱标题",
    "type": "类型",
    "description": "描述...",
    "url": "https://example.com",
    "imageUrl": "https://example.com/image.jpg"
  },
  "answerBox": {
    "title": "精选摘要标题",
    "link": "https://example.com",
    "snippet": "精选摘要内容..."
  },
  "peopleAlsoAsk": [
    {
      "question": "相关问题",
      "snippet": "答案片段...",
      "title": "结果标题",
      "link": "https://example.com"
    }
  ],
  "results": [
    {
      "title": "结果标题",
      "url": "https://example.com",
      "description": "结果描述...",
      "position": 1,
      "date": "2024-01-15",
      "siteName": "example.com",
      "sitelinks": [{ "title": "子链接", "link": "https://example.com/page" }]
    }
  ],
  "images": [
    {
      "title": "图片标题",
      "imageUrl": "https://example.com/image.jpg",
      "link": "https://example.com"
    }
  ],
  "videos": [
    {
      "title": "视频标题",
      "link": "https://youtube.com/watch?v=...",
      "imageUrl": "https://img.youtube.com/vi/.../0.jpg"
    }
  ],
  "relatedSearches": [{ "query": "相关搜索 1" }, { "query": "相关搜索 2" }]
}
```

## 国家和语言代码

### 常用国家代码

| 代码 | 国家 |
| ---- | ---- |
| us   | 美国 |
| uk   | 英国 |
| cn   | 中国 |
| de   | 德国 |
| fr   | 法国 |
| jp   | 日本 |
| kr   | 韩国 |

### 常用语言代码

| 代码  | 语言     |
| ----- | -------- |
| en    | 英语     |
| zh-cn | 简体中文 |
| zh-tw | 繁体中文 |
| de    | 德语     |
| fr    | 法语     |
| ja    | 日语     |
| ko    | 韩语     |

## 定价与限制

- **免费额度**: 新用户 2,500 次请求
- **按量付费**: $2.5 / 1,000 次搜索
- **详细定价**: https://serper.dev/pricing

## 相关链接

- [Serper API 文档](https://serper.dev/api-reference)
- [Serper 官网](https://serper.dev)
- [OpenClaw Web 工具文档](https://docs.openclaw.ai/tools/web)
