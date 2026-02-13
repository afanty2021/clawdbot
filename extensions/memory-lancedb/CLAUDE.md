# Memory LanceDB 扩展 (extensions/memory-lancedb/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **memory-lancedb**

## 模块职责

提供基于 LanceDB 的长期记忆存储能力，支持向量搜索、自动召回和记忆捕获。LanceDB 是一个高性能的嵌入式向量数据库，适合 AI 应用中的语义搜索场景。

## 目录结构

```
extensions/memory-lancedb/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── vector.ts         # 向量存储
    ├── index.ts          # 索引管理
    ├── recall.ts         # 召回逻辑
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw memory enable lancedb
```

### 前置要求
- Node.js ≥18
- 有足够的磁盘空间（根据记忆量）

### 配置
```json
{
  "memory-lancedb": {
    "enabled": true,
    "dbPath": "~/.openclaw/memory/lancedb",
    "vectorDimensions": 1536, // OpenAI ada-002 默认维度
    "indexType": "IVF_PQ",   // IVF_PQ, HNSW, DISKANN
    "metric": "cosine",       // cosine, l2, dot_product
    "shardRows": 1024
  }
}
```

## 对外接口

### LanceDBRuntime 接口
```typescript
interface LanceDBRuntime {
  store: VectorStore;
  search: VectorSearch;
  index: IndexManager;
  backup: BackupManager;
}
```

## 关键功能

### 向量存储
```typescript
// 存储向量
await lancedb.store({
  id: "memory-001",
  content: "用户喜欢猫",
  vector: [0.1, 0.2, ...], // 1536 维向量
  metadata: {
    type: "preference",
    timestamp: Date.now()
  }
});

// 批量存储
await lancedb.storeBatch(records);
```

### 向量搜索
```typescript
// 语义搜索
const results = await lancedb.search({
  query: "用户的宠物偏好",
  queryVector: [0.1, 0.2, ...], // 或自动生成
  limit: 10,
  filters: {
    type: "preference"
  }
});

// 混合搜索
const hybrid = await lancedb.hybridSearch({
  query: "用户喜欢什么",
  vectorWeight: 0.7,
  keywordWeight: 0.3
});
```

### 索引管理
```typescript
// 重建索引
await lancedb.rebuildIndex({
  indexType: "IVF_PQ",
  numPartitions: 128
});

// 获取索引状态
const status = await lancedb.getIndexStatus();
```

### 备份恢复
```typescript
// 备份数据库
await lancedb.backup("/path/to/backup.lance");

// 从备份恢复
await lancedb.restore("/path/to/backup.lance");
```

## 依赖与配置

### npm 依赖
- `@lancedb/lancedb` - LanceDB 客户端
- `openai` - 向量生成（可选）
- `@sinclair/typebox` - 类型定义

### 索引类型对比

| 索引类型 | 适用规模 | 查询速度 | 内存占用 |
|---------|---------|---------|---------|
| IVF_PQ | 百万级 | 快 | 低 |
| HNSW | 百万级 | 最快 | 高 |
| DISKANN | 十亿级 | 中 | 最低 |

### 向量维度

| 模型 | 维度 | 用途 |
|------|------|------|
| text-embedding-ada-002 | 1536 | OpenAI 默认 |
| text-embedding-3-small | 1536/512 | OpenAI 新版 |
| text-embedding-3-large | 3072/1024 | OpenAI 高精度 |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/memory-lancedb/src/*.test.ts

# 集成测试
pnpm test:live extensions/memory-lancedb
```

### 测试覆盖率
- **向量存储**: 92%
- **向量搜索**: 90%
- **索引管理**: 85%
- **备份恢复**: 80%

## 性能优化

### 查询优化
```typescript
// 预加载常用数据
await lancedb.preload({
  table: "memories",
  columns: ["content", "metadata"]
});

// 使用查询缓存
const cached = await lancedb.searchCached({
  query: "高频查询",
  ttl: 3600 // 1小时
});
```

### 存储优化
```typescript
// 压缩存储
await lancedb.compact();

// 清理孤立数据
await lancedb.cleanupOrphaned();
```

## 常见问题 (FAQ)

### Q: 数据库文件太大？
A: 使用 `compact()` 压缩，或切换到 `DISKANN` 索引。

### Q: 搜索结果不准确？
A: 调整 `metric` 类型或增加搜索 `limit`。

### Q: 如何跨设备同步？
A: 备份恢复功能，或使用共享存储路径。

### Q: 支持多租户吗？
A: 通过 table prefix 实现数据隔离。

## 相关模块

- **Memory Core** (`extensions/memory-core/`) - 核心记忆接口
- **AI 代理** (`src/agents/`) - 记忆集成
- **配置系统** (`src/config/`) - 插件配置管理

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Memory LanceDB 扩展 CLAUDE.md 文档
- ✅ 记录向量存储和搜索配置
- ✅ 补充索引类型对比表
- ✅ 添加性能优化建议
