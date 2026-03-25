# 企业微信发票审批流程集成计划

## 上下文

为 OpenClaw 网关添加企业微信发票审批流程功能，实现从发票接收到审批完成的自动化流程。

### 业务流程

1. **接收阶段**: 企业微信用户发送发票文件/图片 → OpenClaw 网关接收
2. **处理阶段**: 调用 ETM Plus API 进行发票识别、重命名、压平、入库
3. **审批发起**: 发起审批流程，通过企业微信通道发送审批消息
4. **审批决策**: 审批者选择选项（1=立即报销, 2=次月报销, 3=对公支付）
5. **结果推送**: OpenClaw 接收审批回复 → 推送到 ETM Plus API

### 技术现状

| 组件           | 状态      | 说明                                   |
| -------------- | --------- | -------------------------------------- |
| 企业微信插件   | ✅ 已安装 | `@wecom/wecom-openclaw-plugin` v1.0.13 |
| ETM Plus API   | ✅ 就绪   | `localhost:8001`                       |
| 交互式消息模式 | ✅ 已有   | 飞书/Discord 审批卡片参考              |
| 文件处理       | ✅ 已有   | `message-tool.ts` 支持媒体/文件        |

## 实现方案

### 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                      企业微信发票审批流程架构                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │  企业微信     │──────│ OpenClaw     │──────│  ETM Plus    │      │
│  │  用户/审批者  │      │  网关         │      │  后端服务    │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│                                │                      │            │
│                                │                      │            │
│                     ┌──────────▼──────────┐        │            │
│                     │  技能 (Skill)       │        │            │
│                     │  - invoice-approval│        │            │
│                     │  - etm-api-client  │        │            │
│                     └─────────────────────┘        │            │
│                                │                      │            │
│                                ▼                      ▼            │
│                     ┌─────────────────────────────────────┐       │
│                     │           API 调用                    │       │
│                     │  POST /api/v2/invoice/upload        │       │
│                     │  POST /api/v2/wecom/approval-reply  │       │
│                     └─────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 实现步骤

#### 阶段 1: 创建 ETM Plus API 客户端工具

**文件**: `src/agents/tools/etm-api-tool.ts`

**功能**:

- 封装 ETM Plus API 调用
- 发票上传 (`/api/v2/invoice/upload`)
- 审批回复推送 (`/api/v2/wecom/approval-reply`)
- 错误处理和重试逻辑

**接口设计**:

```typescript
export const EtmApiToolSchema = Type.Object({
  action: Type.Union([Type.Literal("upload_invoice"), Type.Literal("approval_reply")]),
  // upload_invoice 参数
  file_path: Type.Optional(Type.String()),
  file_buffer: Type.Optional(Type.String()),
  applicant_id: Type.Optional(Type.String()),
  applicant_name: Type.Optional(Type.String()),
  payment_method: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  // approval_reply 参数
  user_id: Type.Optional(Type.String()),
  user_name: Type.Optional(Type.String()),
  application_id: Type.Optional(Type.Integer()),
  choice: Type.Optional(Type.String()), // "1", "2", "3"
  // 通用参数
  api_base: Type.Optional(Type.String()), // 默认 http://localhost:8001
});
```

#### 阶段 2: 创建发票审批技能

**文件**: `skills/invoice-approval/`

**结构**:

```
skills/invoice-approval/
├── skill.json              # 技能配置
├── instructions.md         # 技能指令
└── etm-client.ts           # ETM API 客户端（可选）
```

**技能指令** (`instructions.md`):

```markdown
# 企业微信发票审批技能

## 触发条件

当检测到以下情况时自动触发：

1. 企业微信消息包含发票文件（PDF/图片）
2. 消息发送到指定的发票处理群组或用户

## 处理流程

### 步骤 1: 接收发票

- 从消息中提取文件
- 保存到临时目录
- 获取发送者信息（user_id, user_name）

### 步骤 2: 调用 ETM Plus API

使用 etm-api-tool 调用发票上传接口：

- file: 发票文件
- applicant_id: 发送者 user_id
- applicant_name: 发送者姓名
- payment_method: 默认 "个人"

### 步骤 3: 获取审批信息

从 ETM Plus 响应中获取：

- application_id
- invoice_details
- approval_url（如有）

### 步骤 4: 发送审批消息

使用 message-tool 发送交互式审批消息给审批者：

- 标题: "发票审批请求"
- 内容: 发票详情摘要
- 按钮: 三个选项
  1. 立即报销
  2. 次月生成报销单
  3. 对公支付（无需报销）

### 步骤 5: 等待审批回复

监听审批者的回复消息

- 期望回复: 数字 1、2 或 3
- 验证回复者身份

### 步骤 6: 推送审批结果

使用 etm-api-tool 调用审批回复接口：

- user_id: 审批者 user_id
- user_name: 审批者姓名
- application_id: 申请ID
- choice: 选择值 "1"/"2"/"3"

### 步骤 7: 通知申请人

发送审批结果通知给原申请人
```

#### 阶段 3: 企业微信交互式消息适配

由于企业微信插件是外部插件，需要在配置中添加交互式消息支持。

**配置文件**: `~/.config/openclaw/openclaw.json`

```json
{
  "channels": {
    "wecom": {
      "enabled": true,
      "invoice_approval": {
        "enabled": true,
        "applicant_group_id": "发票申请群组ID",
        "approver_user_ids": ["审批者ID1", "审批者ID2"],
        "etm_api_base": "http://localhost:8001"
      }
    }
  }
}
```

#### 阶段 4: 会话状态管理

**文件**: `src/agents/sessions/approval-state.ts` (新建)

**功能**:

- 跟踪待处理的审批请求
- 存储 application_id 与会话的映射
- 超时清理机制

**数据结构**:

```typescript
interface PendingApproval {
  application_id: number;
  applicant_id: string;
  approver_id: string;
  created_at: number;
  expires_at: number;
  invoice_details: Record<string, unknown>;
}
```

### 关键文件清单

| 文件                                      | 类型 | 说明                     |
| ----------------------------------------- | ---- | ------------------------ |
| `src/agents/tools/etm-api-tool.ts`        | 新建 | ETM Plus API 客户端工具  |
| `skills/invoice-approval/skill.json`      | 新建 | 技能配置文件             |
| `skills/invoice-approval/instructions.md` | 新建 | 技能指令文档             |
| `src/agents/sessions/approval-state.ts`   | 新建 | 审批状态管理             |
| `~/.config/openclaw/openclaw.json`        | 修改 | 添加企业微信发票审批配置 |

### API 调用格式

#### 发票上传请求

```http
POST http://localhost:8001/api/v2/invoice/upload
Content-Type: multipart/form-data

file: <PDF/图片文件>
applicant_id: "HuangZhengBo"
applicant_name: "黄正波"
payment_method: "个人"
description: "办公用品采购"
```

#### 审批回复推送

```http
POST http://localhost:8001/api/v2/wecom/approval-reply
Content-Type: application/json

{
  "user_id": "HuangZhengBo",
  "user_name": "黄正波",
  "application_id": 1,
  "choice": "1"
}
```

### 选项映射

| choice | 审批操作          | 说明               |
| ------ | ----------------- | ------------------ |
| "1"    | approve_immediate | 立即报销           |
| "2"    | approve_monthly   | 次月生成报销单     |
| "3"    | approve_corporate | 对公支付，无需报销 |

## 验证计划

### 测试场景

1. **场景 1: 发票上传和审批**
   - 用户发送发票 PDF 到企业微信
   - 网关接收并调用 ETM Plus API
   - 验证发票入库成功
   - 审批者收到审批消息
   - 选择选项 "1"
   - 验证审批结果推送成功

2. **场景 2: 错误处理**
   - 发送无效文件格式
   - 验证错误提示
   - ETM Plus API 不可用
   - 验证降级处理

3. **场景 3: 超时处理**
   - 审批超时未回复
   - 验证状态清理

### 验证命令

```bash
# 1. 检查工具注册
curl http://localhost:18789/api/tools | grep etm-api

# 2. 检查技能加载
openclaw skills list | grep invoice-approval

# 3. 测试 API 连接
curl http://localhost:8001/api/v2/health

# 4. 发送测试发票
# 通过企业微信发送测试文件

# 5. 查看日志
tail -f ~/.openclaw/logs/gateway.log | grep -E "invoice|approval|etm"
```

## 风险和依赖

### 风险

| 风险                         | 缓解措施                |
| ---------------------------- | ----------------------- |
| 企业微信插件不支持交互式消息 | 使用文本消息 + 数字选项 |
| ETM Plus API 不可用          | 添加错误处理和重试      |
| 审批状态丢失                 | 使用持久化存储          |
| 并发审批冲突                 | 添加锁机制              |

### 依赖

- `@wecom/wecom-openclaw-plugin` v1.0.13+
- ETM Plus 服务运行在 `localhost:8001`
- OpenClaw 网关正常运行

## 参考文件

### OpenClaw 内部

- `/Users/berton/Github/OpenClaw/src/agents/tools/message-tool.ts` - 消息工具
- `/Users/berton/Github/OpenClaw/src/agents/tools/web-fetch.ts` - HTTP 请求
- `/Users/berton/Github/OpenClaw/extensions/feishu/src/card-ux-approval.ts` - 审批卡片参考
- `/Users/berton/Github/OpenClaw/extensions/discord/src/monitor/exec-approvals.ts` - 审批流程参考

### ETM Plus

- `/Users/berton/Github/etm-plus/openclaw_api.py` - API 主文件
- `/Users/berton/Github/etm-plus/src/services/notification_service.py` - 企业微信处理器
- `/Users/berton/Github/etm-plus/docs/openclaw_integration_guide.md` - 集成指南
