# 企业微信发票审批技能

## 技能概述

本技能实现企业微信发票审批的自动化流程，包括：

1. **发票接收与处理**：接收用户发送的发票文件，自动调用 ETM Plus API 处理
2. **审批发起**：向审批者发送包含三个选项的审批消息
3. **审批回复处理**：接收审批者的选择，推送到 ETM Plus API
4. **结果通知**：将审批结果通知给申请人

## 触发条件

### 发票上传触发

- 企业微信用户发送发票文件（PDF/图片）
- 消息发送到指定的发票处理群组或直接发送

### 审批回复触发

- 审批者回复数字选项：`1`、`2` 或 `3`
- 回复格式：`审批 1`、`批准 2`、`回复 3` 等

## 处理流程

### 步骤 1：接收发票

当检测到企业微信消息包含发票文件时：

1. 从消息中提取文件内容
2. 识别发送者信息（`user_id`、`user_name`）
3. 检查文件类型（支持 PDF、JPG、PNG）

### 步骤 2：调用 ETM Plus API

使用 `etm_api` 工具调用发票上传接口：

```json
{
  "action": "upload_invoice",
  "file_buffer": "<base64_encoded_file>",
  "applicant_id": "<user_id>",
  "applicant_name": "<user_name>",
  "payment_method": "个人",
  "description": "备注信息（可选）"
}
```

### 步骤 3：获取审批信息

从 ETM Plus 响应中提取：

- `application_id`：申请 ID（用于审批回复匹配）
- `invoice_details`：发票详情（金额、供应商等）
- `reimbursement_status`：报销状态

### 步骤 4：发送审批消息

根据发票的支付方式，决定审批流程：

#### 对公支付（无需审批）

如果 `payment_method === "对公"`：

- 直接通知申请人：发票已接收，无需审批
- 跳过审批流程

#### 个人支付（需要审批）

如果 `payment_method === "个人"`：

- 向审批者发送交互式审批消息
- 存储待处理审批状态

### 步骤 5：发送交互式审批消息

使用 `message` 工具发送审批消息：

```json
{
  "action": "send",
  "target": "<approver_user_id>",
  "message": "📋 新的报销申请待审批\\n\\n━━━━━━━━━━━━━━━\\n申请人：{applicant_name}\\n金额：¥{amount}\\n供应商：{vendor_name}\\n发票号：{invoice_number}\\n申请时间：{submitted_at}\\n━━━━━━━━━━━━━━━\\n\\n请选择审批类型：\\n① 立即报销\\n② 次月生成报销单\\n③ 对公支付，无需报销\\n\\n━━━━━━━━━━━━━━━\\n回复数字 1/2/3 进行审批"
}
```

### 步骤 6：存储待处理审批

使用审批状态管理器存储：

```typescript
await approvalState.addPendingApproval({
  application_id: response.data.invoice_id,
  applicant_id: "<applicant_id>",
  applicant_name: "<applicant_name>",
  approver_id: "<approver_id>",
  approver_name: "<approver_name>",
  invoice_details: { ... },
  session_key: "<current_session_key>",
  expires_at: Date.now() + 24 * 60 * 60 * 1000
});
```

### 步骤 7：等待审批回复

监听审批者的回复消息：

1. 解析回复内容，提取数字选项
2. 验证回复者身份
3. 匹配到对应的申请

### 步骤 8：处理审批回复

使用 `etm_api` 工具调用审批回复接口：

```json
{
  "action": "approval_reply",
  "user_id": "<approver_user_id>",
  "user_name": "<approver_user_name>",
  "application_id": <application_id>,
  "choice": "1"
}
```

### 步骤 9：通知申请人

向原申请人发送审批结果通知：

```json
{
  "action": "send",
  "target": "<applicant_id>",
  "message": "✅ 报销申请已{status}\\n\\n申请ID：{application_id}\\n金额：¥{amount}\\n审批类型：{choice_text}\\n审批人：{approver_name}\\n审批时间：{approved_at}"
}
```

### 步骤 10：清理状态

从待处理审批中移除已完成的申请。

## 审批选项说明

| 选项 | 操作               | 说明                      |
| ---- | ------------------ | ------------------------- |
| 1    | 立即报销           | 款项将在 1 个工作日内支付 |
| 2    | 次月生成报销单     | 已纳入下月报销计划        |
| 3    | 对公支付，无需报销 | 财务部门将安排对公转账    |

## 错误处理

### 发票解析失败

- 通知用户：发票格式不支持或解析失败
- 建议用户检查发票文件

### ETM Plus API 不可用

- 通知用户：服务暂时不可用，请稍后重试
- 记录错误日志

### 审批超时

- 自动清理过期审批状态
- 通知申请人：审批已超时，请重新提交

### 无效的审批回复

- 提示审批者：请回复有效的选项（1、2 或 3）

## 配置说明

在 `~/.config/openclaw/openclaw.json` 中配置：

```json
{
  "channels": {
    "wecom": {
      "enabled": true,
      "invoice_approval": {
        "enabled": true,
        "approvers": ["HuangZhengBo"],
        "timeout_hours": 24,
        "auto_approve_corporate": true
      }
    }
  },
  "etm": {
    "api_base": "http://localhost:8001",
    "timeout_ms": 30000
  }
}
```

## 测试场景

### 场景 1：个人支付发票审批流程

1. 用户上传发票（个人支付）
2. 系统解析发票并调用 ETM Plus API
3. 审批者收到审批消息
4. 审批者回复 `1`
5. 系统推送审批结果到 ETM Plus API
6. 申请人收到审批通过通知

### 场景 2：对公支付发票（无需审批）

1. 用户上传发票（对公支付）
2. 系统解析发票并调用 ETM Plus API
3. 申请人收到确认通知（无需审批）

### 场景 3：审批超时

1. 用户上传发票
2. 审批者 24 小时内未回复
3. 系统自动清理审批状态
4. 申请人收到超时提醒

## 工具依赖

- `etm_api`：ETM Plus API 客户端工具
- `message`：消息发送工具
- `approval_state`：审批状态管理器

## 注意事项

1. **文件大小限制**：发票文件应小于 10MB
2. **支持格式**：PDF、JPG、PNG
3. **审批时效**：默认 24 小时，超时自动清理
4. **状态持久化**：审批状态保存在 `~/.openclaw/data/approvals.json`
5. **会话匹配**：使用 `application_id` 匹配审批回复
