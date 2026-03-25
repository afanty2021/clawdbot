# WhatsApp 适配器 (src/whatsapp/)

[根目录](../CLAUDE.md) > **whatsapp**

## 模块职责

WhatsApp 平台目标解析辅助模块。处理 WhatsApp 目标地址的解析和规范化。

## 目录结构

```
src/whatsapp/
├── resolve-outbound-target.ts  # 出站目标解析
├── normalize.ts                # 号码规范化
└── constants.ts                # 常量定义
```

## 核心功能

### 1. 目标解析 (`resolve-outbound-target.ts`)

```typescript
// 解析出站目标
function resolveWhatsAppOutboundTarget(
  targetString: string
): OutboundTarget

// 目标格式
// "1234567890" - 电话号码
// "+1234567890" - 带国家代码
// "1234567890@s.whatsapp.net" - 完整 JID
// "1234567890@g.us" - 群组 ID
```

### 2. 号码规范化 (`normalize.ts`)

```typescript
// 规范化电话号码
function normalizeWhatsAppNumber(
  phoneNumber: string
): string

// 处理逻辑
// 1. 移除所有非数字字符
// 2. 添加国家代码（如果需要）
// 3. 验证号码格式
// 4. 返回规范化号码
```

## 对外接口

```typescript
export { resolveWhatsAppOutboundTarget } from "./resolve-outbound-target.js";
export { normalizeWhatsAppNumber } from "./normalize.js";
```

## 相关模块

- **`extensions/whatsapp/`** - WhatsApp 扩展插件（主要实现）

## 变更记录

### 2026-02-20 - 创建 WhatsApp 适配器文档
- ✅ 创建 `src/whatsapp/CLAUDE.md` 文档
- 📋 记录目标解析功能
