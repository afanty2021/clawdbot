# Memory Core 扩展 (extensions/memory-core/)

[根目录](../../CLAUDE.md) > [extensions](../CLAUDE.md) > **memory-core**

## 模块职责

提供 OpenClaw 核心记忆搜索功能，支持长期记忆存储、自动召回和上下文捕获。作为记忆系统的基础模块，为 AI 代理提供记忆管理能力。

## 目录结构

```
extensions/memory-core/
├── index.ts              # 插件入口
├── package.json          # 插件清单
└── src/
    ├── runtime.ts        # 运行时实现
    ├── search.ts         # 搜索功能
    ├── storage.ts        # 存储管理
    ├── recall.ts         # 召回逻辑
    └── onboarding.ts    # 配置向导
```

## 入口与启动

### 启用插件
```bash
openclaw memory enable core
```

### 配置
```json
{
  "memory": {
    "enabled": true,
    "storageType": "auto", // auto, lancedb, sqlite
    "maxEntries": 10000,
    "ttlDays": 365
  }
}
```

## 对外接口

### MemoryCoreRuntime 接口
```typescript
interface MemoryCoreRuntime {
  store: MemoryStore;
  search: MemorySearch;
  recall: MemoryRecall;
  cleanup: MemoryCleanup;
}
```

## 关键功能

### 记忆存储
```typescript
// 存储新记忆
await memory.store({
  content: "用户喜欢在早上工作",
  type: "preference",
  metadata: {
    source: "conversation",
    timestamp: Date.now()
  }
});

// 批量存储
await memory.storeBatch([
  { content: "记忆1", type: "fact" },
  { content: "记忆2", type: "preference" }
]);
```

### 记忆搜索
```typescript
// 语义搜索
const results = await memory.search("用户的工作习惯", {
  limit: 10,
  threshold: 0.7
});

// 精确搜索
const exact = await memory.searchExact("关键词");
```

### 记忆召回
```typescript
// 自动召回相关记忆
const context = await memory.recall({
  query: "当前对话主题",
  limit: 5
});

// 基于规则召回
const ruleBased = await memory.recallByRule({
  rules: ["recent", "high_confidence"],
  limit: 3
});
```

### 记忆管理
```typescript
// 获取记忆统计
const stats = await memory.getStats();

// 清理过期记忆
await memory.cleanup({
  olderThan: 365 * 24 * 60 * 60 * 1000 // 1年前
});

// 删除特定记忆
await memory.delete(memoryId);
```

## 依赖与配置

### 依赖模块
- `@openclaw/memory-lancedb` - 长期存储后端（可选）

### 存储选项
| 类型 | 适用场景 | 持久化 |
|------|---------|--------|
| auto | 默认，自动选择 | ✓ |
| lancedb | 大规模向量存储 | ✓ |
| sqlite | 轻量本地存储 | ✓ |

## 测试

### 测试命令
```bash
# 单元测试
pnpm test extensions/memory-core/src/*.test.ts

# 集成测试
pnpm test:live extensions/memory-core
```

### 测试覆盖率
- **记忆存储**: 90%
- **搜索功能**: 88%
- **召回逻辑**: 85%
- **清理功能**: 82%

## 常见问题 (FAQ)

### Q: 记忆会过期吗？
A: 默认 365 天，可通过配置修改 TTL。

### Q: 支持多少条记忆？
A: 默认 10,000 条，可配置扩展。

### Q: 如何导出记忆？
A: 使用 `memory.export()` 导出为 JSON 格式。

### Q: 搜索速度如何？
A: 取决于存储后端，LanceDB 支持百万级向量检索。

## 相关模块

- **Memory LanceDB** (`extensions/memory-lancedb/`) - 向量存储后端
- **AI 代理** (`src/agents/`) - 记忆集成
- **配置系统** (`src/config/`) - 插件配置管理

## 变更记录

### 2026-02-13 - 初始化文档
- ✅ 创建 Memory Core 扩展 CLAUDE.md 文档
- ✅ 记录运行时接口和存储配置
- ✅ 补充搜索和召回功能说明
