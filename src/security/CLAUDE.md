# 安全模块 (src/security/)

[根目录](../CLAUDE.md) > **security**

## 模块职责

OpenClaw 安全审计和策略 enforcement。包括消息审计、工具策略、DM 策略、文件系统安全和外部内容过滤。

## 目录结构

```
src/security/
├── audit.ts              # 主审计模块
├── audit-channel.ts      # 渠道审计
├── audit-extra.ts        # 额外审计
├── audit-extra.sync.ts   # 同步审计
├── audit-extra.async.ts  # 异步审计
├── audit-fs.ts           # 文件系统审计
├── audit-tool-policy.ts  # 工具策略审计
├── skill-scanner.ts      # 技能扫描器
├── external-content.ts   # 外部内容过滤
├── fix.ts                # 安全修复
├── dm-policy-shared.ts   # DM 策略共享
├── dangerous-tools.ts    # 危险工具列表
├── scan-paths.ts         # 扫描路径
├── temp-path-guard.ts    # 临时路径保护
├── windows-acl.ts        # Windows ACL
├── secret-equal.ts       # 密钥比较
└── channel-metadata.ts   # 渠道元数据
```

## 核心功能

### 1. 主审计模块 (`audit.ts`)

```typescript
// 审计上下文
interface AuditContext {
  accountId: string;
  channelId: string;
  senderId: string;
  messageType: "dm" | "group";
}

// 审计结果
interface AuditResult {
  allowed: boolean;
  reason?: string;
  modified?: boolean;
}

// 审计消息
async function auditMessage(params: {
  message: InboundMessage;
  context: AuditContext;
}): Promise<AuditResult>
```

### 2. 渠道审计 (`audit-channel.ts`)

```typescript
// 渠道元数据审计
interface ChannelMetadataAudit {
  allowedMessageTypes: string[];
  maxMessageLength: number;
  allowedMediaTypes: string[];
}

// 审计渠道元数据
function auditChannelMetadata(
  metadata: unknown
): ChannelMetadataAudit
```

### 3. 同步审计 (`audit-extra.sync.ts`)

```typescript
// 同步安全检查
interface SyncAudit {
  checkMessageLength(message: string, maxLength: number): boolean;
  checkMediaType(mediaType: string, allowed: string[]): boolean;
  checkToolName(toolName: string, allowed: string[]): boolean;
}
```

### 4. 异步审计 (`audit-extra.async.ts`)

```typescript
// 异步安全检查
interface AsyncAudit {
  scanFileForMalware(filePath: string): Promise<boolean>;
  checkUrlReputation(url: string): Promise<boolean>;
  validateExternalContent(content: string): Promise<boolean>;
}
```

### 5. 文件系统审计 (`audit-fs.ts`)

```typescript
// 文件系统安全
interface FsAuditConfig {
  allowedPaths: string[];
  denyPatterns: RegExp[];
  maxFileSize: number;
}

// 审计文件操作
function auditFileOperation(params: {
  operation: "read" | "write" | "delete";
  path: string;
  config: FsAuditConfig;
}): AuditResult
```

### 6. 工具策略审计 (`audit-tool-policy.ts`)

```typescript
// 工具策略
interface ToolPolicy {
  allowedTools: string[];
  deniedTools: string[];
  requireConfirmation: string[];
}

// 审计工具调用
function auditToolCall(params: {
  toolName: string;
  policy: ToolPolicy;
}): AuditResult
```

### 7. 技能扫描器 (`skill-scanner.ts`)

```typescript
// 扫描技能中的安全问题
async function scanSkillForSecurityIssues(
  skillPath: string
): Promise<SecurityIssue[]>
```

### 8. 外部内容过滤 (`external-content.ts`)

```typescript
// 外部内容检查
interface ExternalContentConfig {
  allowExternalUrls: boolean;
  allowExternalImages: boolean;
  allowedDomains: string[];
}

// 过滤外部内容
function filterExternalContent(
  content: string,
  config: ExternalContentConfig
): { filtered: string; modified: boolean }
```

### 9. DM 策略 (`dm-policy-shared.ts`)

```typescript
// DM 策略
interface DmPolicy {
  allowFrom: AllowFrom;
  requireMention: boolean;
  maxMessageLength: number;
}

// 检查 DM 策略
function checkDmPolicy(params: {
  senderId: string;
  policy: DmPolicy;
}): boolean
```

### 10. 危险工具列表 (`dangerous-tools.ts`)

```typescript
// 危险工具列表
const DANGEROUS_TOOLS = [
  "exec", "spawn", "eval", "fs.write",
  "http.request", "child_process"
];

// 检查工具是否危险
function isDangerousTool(toolName: string): boolean
```

### 11. 安全修复 (`fix.ts`)

```typescript
// 自动修复安全问题
async function fixSecurityIssue(params: {
  issue: SecurityIssue;
  autoFix: boolean;
}): Promise<FixResult>
```

### 12. 扫描路径 (`scan-paths.ts`)

```typescript
// 获取安全扫描路径
function getSecurityScanPaths(): string[]

// 添加扫描路径
function addScanPath(path: string): void
```

### 13. 临时路径保护 (`temp-path-guard.ts`)

```typescript
// 临时路径保护
interface TempPathGuard {
  acquire(): Promise<string>;
  release(path: string): Promise<void>;
}

// 创建临时路径保护
function createTempPathGuard(): TempPathGuard
```

### 14. Windows ACL (`windows-acl.ts`)

```typescript
// Windows 访问控制列表
interface AclEntry {
  trustee: string;
  access: "read" | "write" | "full";
}

// 设置文件 ACL
async function setFileAcl(params: {
  path: string;
  acl: AclEntry[];
}): Promise<void>
```

### 15. 密钥比较 (`secret-equal.ts`)

```typescript
// 安全的密钥比较（防时序攻击）
function secretEqual(a: string, b: string): boolean
```

## 审计流程

```
入站消息
    ↓
渠道审计
    ↓
同步审计
    ↓
异步审计
    ↓
策略检查
    ↓
┌─────────────┬─────────────┐
│   允许      │   拒绝     │
└─────────────┴─────────────┘
```

## 对外接口

```typescript
// 主审计
export { auditMessage } from "./audit.js";

// 策略检查
export { checkDmPolicy } from "./dm-policy-shared.js";
export { auditToolCall } from "./audit-tool-policy.js";

// 内容过滤
export { filterExternalContent } from "./external-content.js";

// 工具
export { isDangerousTool } from "./dangerous-tools.js";
export { secretEqual } from "./secret-equal.js";
```

## 相关模块

- **`src/config/`** - 配置管理
- **`src/agents/`** - Agent 策略

## 变更记录

### 2026-02-20 - 创建安全模块文档
- ✅ 创建 `src/security/CLAUDE.md` 文档
- 📋 记录审计和策略功能
- 🔗 建立安全检查流程
